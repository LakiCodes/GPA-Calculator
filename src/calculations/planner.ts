import { GRADE_POINTS_HUNDREDTHS, isLetterGrade } from "../data/gradeScale";
import { newId } from "../utils/id";
import type {
  ClassName,
  Course,
  CourseRecord,
  CurriculumSelection,
  LetterGrade,
  PlannerScenario,
  Programme,
  RegistrationInfo
} from "../domain/types";

import {
  calculateCourseGpa,
  gradeMeets,
  resultPointHundredths,
  truncateGpa
} from "./gpa";
import { effectiveResultMap } from "./records";
import {
  classRuleFor,
  evaluateClassification,
  requiredHighGradeCreditsFor
} from "./classification";

export interface PlannerProjection {
  currentGpa: ReturnType<typeof calculateCourseGpa>;
  projectedGpa: string | null;
  recommendedGpa: string | null;
  targetGpa: number;
  gradedCredits: number;
  projectedCredits: number;
  remainingGpaCredits: number;
  minPossibleGpa: string | null;
  maxPossibleGpa: string | null;
  requiredAverageOnRemaining: number | null;
  requiredAverageLabel: string;
  impossible: boolean;
  remainingCourseIds: string[];
  recommendedGrades: Record<string, LetterGrade>;
  recommendationSummary: string;
  possiblePlans: FutureGradePlan[];
  currentClass: ClassName | "Not yet eligible" | null;
  targetClass: ClassName | null;
  bestPossibleClass: ClassName | "Not yet eligible" | null;
  classTargetPossible: boolean | null;
  classTargetReasons: string[];
  highGradeThreshold: LetterGrade | null;
  currentHighGradeCredits: number;
  requiredHighGradeCredits: number;
  additionalHighGradeCreditsNeeded: number;
}

export interface FutureGradePlan {
  id: string;
  name: string;
  description: string;
  grades: Record<string, LetterGrade>;
  gpa: string | null;
  projectedClass: ClassName | "Not yet eligible" | null;
  targetClassEligible: boolean | null;
  highGradeCredits: number;
  requiredHighGradeCredits: number;
}

const RECOMMENDATION_GRADES: Array<{
  grade: LetterGrade;
  pointHundredths: number;
}> = [
  { grade: "C", pointHundredths: GRADE_POINTS_HUNDREDTHS.C },
  { grade: "C+", pointHundredths: GRADE_POINTS_HUNDREDTHS["C+"] },
  { grade: "B-", pointHundredths: GRADE_POINTS_HUNDREDTHS["B-"] },
  { grade: "B", pointHundredths: GRADE_POINTS_HUNDREDTHS.B },
  { grade: "B+", pointHundredths: GRADE_POINTS_HUNDREDTHS["B+"] },
  { grade: "A-", pointHundredths: GRADE_POINTS_HUNDREDTHS["A-"] },
  { grade: "A", pointHundredths: GRADE_POINTS_HUNDREDTHS.A }
];

const CLASS_ORDER: ClassName[] = [
  "First Class",
  "Second Class (Upper Division)",
  "Second Class (Lower Division)",
  "Pass"
];

const gradeForAverage = (required: number): string => {
  if (required <= 0) {
    return "E";
  }
  const ordered = [
    ["E", 0],
    ["D", 1],
    ["D+", 1.3],
    ["C-", 1.7],
    ["C", 2],
    ["C+", 2.3],
    ["B-", 2.7],
    ["B", 3],
    ["B+", 3.3],
    ["A-", 3.7],
    ["A", 4]
  ] as const;
  return ordered.find(([, point]) => point >= required)?.[0] ?? "above A";
};

const targetToHundredths = (targetGpa: number): number =>
  Math.ceil(targetGpa * 100 - 1e-9);

const classTargetForDefaultGpa = (targetGpa: number): ClassName | undefined => {
  if (Math.abs(targetGpa - 3.7) < 0.001) {
    return "First Class";
  }
  if (Math.abs(targetGpa - 3.3) < 0.001) {
    return "Second Class (Upper Division)";
  }
  if (Math.abs(targetGpa - 3) < 0.001) {
    return "Second Class (Lower Division)";
  }
  if (Math.abs(targetGpa - 2) < 0.001) {
    return "Pass";
  }
  return undefined;
};

type PlanItem = {
  course: Course;
  gradeIndex: number;
};

type PlannerOptions = {
  programme?: Programme;
  selection?: CurriculumSelection;
  registrationInfo?: RegistrationInfo;
  classTarget?: ClassName;
};

type PlanStrategy = {
  id: string;
  name: string;
  description: string;
  highGradeOrder: (items: PlanItem[]) => PlanItem[];
  upgradeOrder: (items: PlanItem[]) => PlanItem[];
  relaxOrder: (items: PlanItem[]) => PlanItem[];
  bufferHundredths?: number;
};

const courseOrderValue = (course: Course): string =>
  `${course.year}${course.semester}${course.code}${course.id}`;

const currentHighGradeCreditsFor = (
  courses: Course[],
  results: Record<string, string>,
  threshold: LetterGrade | null
): number => {
  if (threshold === null) {
    return 0;
  }
  return courses
    .filter((course) => {
      const result = results[course.id] ?? "";
      return isLetterGrade(result) && gradeMeets(result, threshold);
    })
    .reduce((sum, course) => sum + course.credits, 0);
};

const highGradeCreditsInItems = (
  items: PlanItem[],
  threshold: LetterGrade | null
): number => {
  if (threshold === null) {
    return 0;
  }
  return items
    .filter((item) =>
      gradeMeets(RECOMMENDATION_GRADES[item.gradeIndex].grade, threshold)
    )
    .reduce((sum, item) => sum + item.course.credits, 0);
};

const weightedPointsForItems = (items: PlanItem[]): number =>
  items.reduce(
    (sum, item) =>
      sum + item.course.credits * RECOMMENDATION_GRADES[item.gradeIndex].pointHundredths,
    0
  );

const gradesFromItems = (items: PlanItem[]): Record<string, LetterGrade> =>
  Object.fromEntries(
    items.map((item) => [item.course.id, RECOMMENDATION_GRADES[item.gradeIndex].grade])
  );

const simulateRecords = (
  records: Record<string, CourseRecord>,
  remainingCourses: Course[],
  grades: Record<string, LetterGrade>
): Record<string, CourseRecord> => {
  const simulated: Record<string, CourseRecord> = { ...records };
  for (const course of remainingCourses) {
    simulated[course.id] = {
      courseId: course.id,
      result: grades[course.id],
      attempts: []
    };
  }
  return simulated;
};

const evaluatePlan = (
  plan: Omit<FutureGradePlan, "projectedClass" | "targetClassEligible" | "highGradeCredits" | "requiredHighGradeCredits">,
  records: Record<string, CourseRecord>,
  remainingCourses: Course[],
  options: PlannerOptions | undefined,
  targetClass: ClassName | null
): FutureGradePlan => {
  if (!options?.programme) {
    return {
      ...plan,
      projectedClass: null,
      targetClassEligible: null,
      highGradeCredits: 0,
      requiredHighGradeCredits: 0
    };
  }

  const evaluation = evaluateClassification(
    options.programme,
    options.selection,
    simulateRecords(records, remainingCourses, plan.grades),
    options.registrationInfo ?? {}
  );
  const targetRule = targetClass
    ? evaluation.results.find((result) => result.className === targetClass)
    : null;

  return {
    ...plan,
    projectedClass: evaluation.awardedClass,
    targetClassEligible: targetRule?.eligible ?? null,
    highGradeCredits: targetRule?.highGradeCredits ?? 0,
    requiredHighGradeCredits: targetRule?.requiredHighGradeCredits ?? 0
  };
};

const planKey = (remainingCourses: Course[], plan: FutureGradePlan): string =>
  remainingCourses.map((course) => `${course.id}:${plan.grades[course.id]}`).join("|");

const buildGpaGreedyPlan = (
  id: string,
  name: string,
  description: string,
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  orderItems: (items: PlanItem[]) => PlanItem[],
  records: Record<string, CourseRecord>,
  options?: PlannerOptions
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  const totalCredits = projectedCredits + remainingCredits;
  const targetWeighted = targetHundredths * totalCredits;
  const maxWeighted = projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;

  if (remainingCourses.length === 0 || remainingCredits === 0 || maxWeighted < targetWeighted) {
    return null;
  }

  const baselineIndex = RECOMMENDATION_GRADES.findIndex(
    (option) => projectedWeighted + option.pointHundredths * remainingCredits >= targetWeighted
  );
  const startingIndex = baselineIndex === -1 ? RECOMMENDATION_GRADES.length - 1 : baselineIndex;
  const items = remainingCourses.map((course) => ({ course, gradeIndex: startingIndex }));
  let planWeighted = RECOMMENDATION_GRADES[startingIndex].pointHundredths * remainingCredits;

  for (const item of orderItems(items)) {
    while (item.gradeIndex > 0) {
      const current = RECOMMENDATION_GRADES[item.gradeIndex];
      const next = RECOMMENDATION_GRADES[item.gradeIndex - 1];
      const drop = (current.pointHundredths - next.pointHundredths) * item.course.credits;
      if (projectedWeighted + planWeighted - drop < targetWeighted) {
        break;
      }
      item.gradeIndex -= 1;
      planWeighted -= drop;
    }
  }

  const grades = gradesFromItems(items);
  return evaluatePlan(
    {
      id,
      name,
      description,
      grades,
      gpa: truncateGpa(projectedWeighted + planWeighted, totalCredits)
    },
    records,
    remainingCourses,
    options,
    null
  );
};

const buildAllAPlan = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  records: Record<string, CourseRecord>,
  options?: PlannerOptions,
  targetClass: ClassName | null = null
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  if (remainingCourses.length === 0 || remainingCredits === 0) {
    return null;
  }
  const items = remainingCourses.map((course) => ({
    course,
    gradeIndex: RECOMMENDATION_GRADES.length - 1
  }));
  const totalCredits = projectedCredits + remainingCredits;
  const grades = gradesFromItems(items);
  return evaluatePlan(
    {
      id: "stretch",
      name: "All A maximum",
      description: "Best-case plan using A in every remaining GPA-bearing course.",
      grades,
      gpa: truncateGpa(
        projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A,
        totalCredits
      )
    },
    records,
    remainingCourses,
    options,
    targetClass
  );
};

const buildClassPlan = (
  strategy: PlanStrategy,
  allCourses: Course[],
  currentResults: Record<string, string>,
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetGpaHundredths: number,
  targetClass: ClassName,
  records: Record<string, CourseRecord>,
  options: PlannerOptions
): FutureGradePlan | null => {
  const rule = classRuleFor(targetClass);
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  if (remainingCourses.length === 0 || remainingCredits === 0) {
    return null;
  }

  const totalCredits = projectedCredits + remainingCredits;
  const classGpaHundredths = targetToHundredths(rule.gpa);
  const baseTargetHundredths = Math.max(targetGpaHundredths, classGpaHundredths);
  const requestedTargetHundredths = Math.min(
    400,
    baseTargetHundredths + (strategy.bufferHundredths ?? 0)
  );
  const targetWeighted = requestedTargetHundredths * totalCredits;
  const maxWeighted = projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;
  if (maxWeighted < targetWeighted) {
    return null;
  }

  const requiredHighGradeCredits = requiredHighGradeCreditsFor(totalCredits, targetClass);
  const currentHighGradeCredits = currentHighGradeCreditsFor(
    allCourses,
    currentResults,
    rule.highGrade
  );
  const futureHighGradeCreditsNeeded = Math.max(
    0,
    requiredHighGradeCredits - currentHighGradeCredits
  );

  if (futureHighGradeCreditsNeeded > remainingCredits) {
    return null;
  }

  const items = remainingCourses.map((course) => ({ course, gradeIndex: 0 }));
  const highGradeIndex = rule.highGrade === null
    ? 0
    : RECOMMENDATION_GRADES.findIndex((option) => option.grade === rule.highGrade);

  if (rule.highGrade !== null) {
    let allocatedHighGradeCredits = 0;
    for (const item of strategy.highGradeOrder(items)) {
      if (allocatedHighGradeCredits >= futureHighGradeCreditsNeeded) {
        break;
      }
      item.gradeIndex = Math.max(item.gradeIndex, highGradeIndex);
      allocatedHighGradeCredits += item.course.credits;
    }
  }

  let planWeighted = weightedPointsForItems(items);
  const upgradeOrder = strategy.upgradeOrder(items);
  while (projectedWeighted + planWeighted < targetWeighted) {
    let changed = false;
    for (const item of upgradeOrder) {
      if (item.gradeIndex >= RECOMMENDATION_GRADES.length - 1) {
        continue;
      }
      const before = RECOMMENDATION_GRADES[item.gradeIndex].pointHundredths;
      item.gradeIndex += 1;
      const after = RECOMMENDATION_GRADES[item.gradeIndex].pointHundredths;
      planWeighted += (after - before) * item.course.credits;
      changed = true;
      if (projectedWeighted + planWeighted >= targetWeighted) {
        break;
      }
    }
    if (!changed) {
      return null;
    }
  }

  for (const item of strategy.relaxOrder(items)) {
    while (item.gradeIndex > 0) {
      const currentOption = RECOMMENDATION_GRADES[item.gradeIndex];
      const nextOption = RECOMMENDATION_GRADES[item.gradeIndex - 1];
      const drop = (currentOption.pointHundredths - nextOption.pointHundredths) * item.course.credits;
      if (projectedWeighted + planWeighted - drop < targetWeighted) {
        break;
      }

      item.gradeIndex -= 1;
      const highGradeCredits =
        currentHighGradeCredits + highGradeCreditsInItems(items, rule.highGrade);
      if (highGradeCredits < requiredHighGradeCredits) {
        item.gradeIndex += 1;
        break;
      }
      planWeighted -= drop;
    }
  }

  const grades = gradesFromItems(items);
  const evaluated = evaluatePlan(
    {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      grades,
      gpa: truncateGpa(projectedWeighted + planWeighted, totalCredits)
    },
    records,
    remainingCourses,
    options,
    targetClass
  );

  return evaluated.targetClassEligible === true ? evaluated : null;
};

const classStrategies = (targetClass: ClassName): PlanStrategy[] => {
  const highGradeLabel = classRuleFor(targetClass).highGrade;
  const thresholdText = highGradeLabel ? `${highGradeLabel} or better` : "the class minimum";
  return [
    {
      id: "class-balanced",
      name: "Balanced class plan",
      description: `Meets the class rules with a balanced mix while keeping ${thresholdText} on higher-credit courses.`,
      highGradeOrder: (items) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      upgradeOrder: (items) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      relaxOrder: (items) => [...items].sort(
        (a, b) => a.course.credits - b.course.credits || courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))
      )
    },
    {
      id: "class-low-credit",
      name: "Low-credit high-grade plan",
      description: `Places more ${thresholdText} results on lower-credit courses, then raises other grades only as needed for GPA.`,
      highGradeOrder: (items) => [...items].sort(
        (a, b) => a.course.credits - b.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      upgradeOrder: (items) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      relaxOrder: (items) => [...items].sort(
        (a, b) => a.course.credits - b.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      )
    },
    {
      id: "class-early",
      name: "Early high-grade plan",
      description: `Front-loads the ${thresholdText} credits into earlier remaining courses.`,
      highGradeOrder: (items) => [...items].sort((a, b) => courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))),
      upgradeOrder: (items) => [...items].sort((a, b) => courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))),
      relaxOrder: (items) => [...items].sort((a, b) => courseOrderValue(b.course).localeCompare(courseOrderValue(a.course)))
    },
    {
      id: "class-late",
      name: "Late high-grade plan",
      description: `Concentrates the ${thresholdText} credits in later remaining courses.`,
      highGradeOrder: (items) => [...items].sort((a, b) => courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))),
      upgradeOrder: (items) => [...items].sort((a, b) => courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))),
      relaxOrder: (items) => [...items].sort((a, b) => courseOrderValue(a.course).localeCompare(courseOrderValue(b.course)))
    },
    {
      id: "class-buffer",
      name: "Class safety buffer",
      description: "Adds a small GPA buffer above the minimum while still satisfying the class-grade distribution rules.",
      bufferHundredths: 10,
      highGradeOrder: (items) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      upgradeOrder: (items) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      ),
      relaxOrder: (items) => [...items].sort(
        (a, b) => a.course.credits - b.course.credits || courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))
      )
    }
  ];
};

const buildGpaOnlyPlans = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  records: Record<string, CourseRecord>,
  options?: PlannerOptions
): FutureGradePlan[] => {
  const strategies = [
    {
      id: "balanced",
      name: "Balanced GPA plan",
      description: "A minimum-mix plan that keeps higher grades on higher-credit courses.",
      orderItems: (items: PlanItem[]) => [...items].sort(
        (a, b) => a.course.credits - b.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      )
    },
    {
      id: "low-credit-push",
      name: "Low-credit push",
      description: "Higher grades are placed on smaller-credit courses where possible.",
      orderItems: (items: PlanItem[]) => [...items].sort(
        (a, b) => b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      )
    },
    {
      id: "early-push",
      name: "Early push",
      description: "Keeps stronger grades on earlier remaining subjects.",
      orderItems: (items: PlanItem[]) => [...items].sort((a, b) => courseOrderValue(b.course).localeCompare(courseOrderValue(a.course)))
    },
    {
      id: "late-push",
      name: "Late push",
      description: "Keeps stronger grades on later remaining subjects.",
      orderItems: (items: PlanItem[]) => [...items].sort((a, b) => courseOrderValue(a.course).localeCompare(courseOrderValue(b.course)))
    },
    {
      id: "buffer",
      name: "GPA safety buffer",
      description: "A safer plan that aims 0.10 above the requested GPA when possible.",
      targetHundredths: targetHundredths + 10,
      orderItems: (items: PlanItem[]) => [...items].sort(
        (a, b) => a.course.semester - b.course.semester || b.course.credits - a.course.credits || courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
      )
    }
  ];

  const possiblePlans: FutureGradePlan[] = [];
  const seen = new Set<string>();
  for (const strategy of strategies) {
    const plan = buildGpaGreedyPlan(
      strategy.id,
      strategy.name,
      strategy.description,
      remainingCourses,
      projectedWeighted,
      projectedCredits,
      Math.min(400, strategy.targetHundredths ?? targetHundredths),
      strategy.orderItems,
      records,
      options
    );
    if (!plan) {
      continue;
    }
    const key = planKey(remainingCourses, plan);
    if (!seen.has(key)) {
      seen.add(key);
      possiblePlans.push(plan);
    }
  }

  const allAPlan = buildAllAPlan(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    options
  );
  if (possiblePlans.length < 5 && allAPlan) {
    const key = planKey(remainingCourses, allAPlan);
    if (!seen.has(key)) {
      possiblePlans.push(allAPlan);
    }
  }
  return possiblePlans.slice(0, 5);
};

export const calculatePlannerProjection = (
  courses: Course[],
  records: Record<string, CourseRecord>,
  scenario: PlannerScenario,
  options?: PlannerOptions
): PlannerProjection => {
  const currentResults = effectiveResultMap(courses, records);
  const currentGpa = calculateCourseGpa(courses, currentResults);
  const currentWeighted = currentGpa.totalWeightedPointHundredths;
  const currentCredits = currentGpa.gradedCredits;

  const projectedWeighted = currentWeighted;
  const projectedCredits = currentCredits;
  const remainingCourseIds: string[] = [];
  const remainingCourses: Course[] = [];
  let remainingGpaCredits = 0;

  for (const course of courses) {
    const currentResult = currentResults[course.id] ?? "";
    const currentPoint = resultPointHundredths(currentResult);
    if (currentPoint !== null || currentResult === "P") {
      continue;
    }
    remainingCourseIds.push(course.id);
    remainingCourses.push(course);
    remainingGpaCredits += course.credits;
  }

  const targetClass = options?.classTarget ?? scenario.classTarget ?? null;
  const classMinimumGpa = targetClass ? classRuleFor(targetClass).gpa : 0;
  const effectiveTargetGpa = Math.max(scenario.targetGpa, classMinimumGpa);
  const targetHundredths = targetToHundredths(effectiveTargetGpa);
  const totalFinalCredits = projectedCredits + remainingGpaCredits;
  const requiredWeightedForTarget = targetHundredths * totalFinalCredits;
  const requiredAverageOnRemaining = remainingGpaCredits === 0
    ? null
    : (requiredWeightedForTarget - projectedWeighted) / remainingGpaCredits / 100;
  const minPossibleGpa = truncateGpa(projectedWeighted, totalFinalCredits);
  const maxPossibleGpa = truncateGpa(
    projectedWeighted + remainingGpaCredits * GRADE_POINTS_HUNDREDTHS.A,
    totalFinalCredits
  );
  const projectedGpa = truncateGpa(projectedWeighted, projectedCredits);
  const maxValue = maxPossibleGpa === null ? null : Number(maxPossibleGpa);
  const gpaImpossible = remainingGpaCredits === 0
    ? projectedGpa === null || Number(projectedGpa) < effectiveTargetGpa
    : requiredAverageOnRemaining !== null && requiredAverageOnRemaining > 4;

  let requiredAverageLabel = "No remaining GPA-bearing credits.";
  if (requiredAverageOnRemaining !== null) {
    if (requiredAverageOnRemaining <= 0) {
      requiredAverageLabel = "The GPA requirement is already protected by current grades.";
    } else if (
      requiredAverageOnRemaining > 4 ||
      (maxValue !== null && maxValue < effectiveTargetGpa)
    ) {
      requiredAverageLabel = "The GPA requirement is impossible even with A grades in every remaining GPA-bearing course.";
    } else {
      requiredAverageLabel = `${requiredAverageOnRemaining.toFixed(2)} average, roughly ${gradeForAverage(requiredAverageOnRemaining)} or better for the GPA requirement.`;
    }
  }

  const currentClassification = options?.programme
    ? evaluateClassification(
        options.programme,
        options.selection,
        records,
        options.registrationInfo ?? {}
      )
    : null;
  const allAPlan = buildAllAPlan(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    options,
    targetClass
  );
  const bestPossibleClass = allAPlan?.projectedClass ?? currentClassification?.awardedClass ?? null;

  let possiblePlans: FutureGradePlan[] = [];
  let classTargetPossible: boolean | null = null;
  let classTargetReasons: string[] = [];
  let highGradeThreshold: LetterGrade | null = null;
  let currentHighGradeCredits = 0;
  let requiredHighGradeCredits = 0;
  let additionalHighGradeCreditsNeeded = 0;

  if (targetClass && options?.programme) {
    const rule = classRuleFor(targetClass);
    highGradeThreshold = rule.highGrade;
    requiredHighGradeCredits = requiredHighGradeCreditsFor(totalFinalCredits, targetClass);
    currentHighGradeCredits = currentHighGradeCreditsFor(
      courses,
      currentResults,
      rule.highGrade
    );
    additionalHighGradeCreditsNeeded = Math.max(
      0,
      requiredHighGradeCredits - currentHighGradeCredits
    );

    const seen = new Set<string>();
    for (const strategy of classStrategies(targetClass)) {
      const plan = buildClassPlan(
        strategy,
        courses,
        currentResults,
        remainingCourses,
        projectedWeighted,
        projectedCredits,
        targetHundredths,
        targetClass,
        records,
        options
      );
      if (!plan) {
        continue;
      }
      const key = planKey(remainingCourses, plan);
      if (!seen.has(key)) {
        seen.add(key);
        possiblePlans.push(plan);
      }
    }

    classTargetPossible = possiblePlans.length > 0;
    if (!classTargetPossible) {
      if (gpaImpossible) {
        classTargetReasons.push(
          `A final GPA of at least ${effectiveTargetGpa.toFixed(2)} cannot be reached with the remaining credits.`
        );
      }
      if (allAPlan && allAPlan.targetClassEligible === false) {
        const allARecords = simulateRecords(records, remainingCourses, allAPlan.grades);
        const evaluation = evaluateClassification(
          options.programme,
          options.selection,
          allARecords,
          options.registrationInfo ?? {}
        );
        const targetEvaluation = evaluation.results.find(
          (result) => result.className === targetClass
        );
        classTargetReasons.push(...(targetEvaluation?.reasons ?? []));
      }
      classTargetReasons = [...new Set(classTargetReasons)];
    }
  } else {
    possiblePlans = buildGpaOnlyPlans(
      remainingCourses,
      projectedWeighted,
      projectedCredits,
      targetHundredths,
      records,
      options
    );
  }

  const primaryPlan = possiblePlans[0] ?? null;
  const recommendedGrades = primaryPlan?.grades ?? (
    targetClass && !classTargetPossible ? allAPlan?.grades ?? {} : {}
  );
  const recommendedGpa = primaryPlan?.gpa ?? (
    targetClass && !classTargetPossible ? allAPlan?.gpa ?? null : null
  );

  let recommendationSummary: string;
  if (targetClass) {
    if (classTargetPossible) {
      recommendationSummary = `${possiblePlans.length} class-valid future grade plan${possiblePlans.length === 1 ? "" : "s"} can achieve ${targetClass} with a final GPA of at least ${effectiveTargetGpa.toFixed(2)}.`;
    } else {
      recommendationSummary = `No future-grade plan can currently satisfy every ${targetClass} requirement. The best-case grades are shown for comparison.`;
    }
  } else if (possiblePlans.length > 0) {
    recommendationSummary = `${possiblePlans.length} GPA-focused future grade plan${possiblePlans.length === 1 ? "" : "s"} can reach ${effectiveTargetGpa.toFixed(2)}.`;
  } else {
    recommendationSummary = "No future GPA-bearing courses are available for a recommendation.";
  }

  const impossible = gpaImpossible || (targetClass !== null && classTargetPossible === false);

  return {
    currentGpa,
    projectedGpa,
    recommendedGpa,
    targetGpa: effectiveTargetGpa,
    gradedCredits: currentCredits,
    projectedCredits,
    remainingGpaCredits,
    minPossibleGpa,
    maxPossibleGpa,
    requiredAverageOnRemaining,
    requiredAverageLabel,
    impossible,
    remainingCourseIds,
    recommendedGrades,
    recommendationSummary,
    possiblePlans: possiblePlans.slice(0, 5),
    currentClass: currentClassification?.awardedClass ?? null,
    targetClass,
    bestPossibleClass,
    classTargetPossible,
    classTargetReasons,
    highGradeThreshold,
    currentHighGradeCredits,
    requiredHighGradeCredits,
    additionalHighGradeCreditsNeeded
  };
};

export const defaultScenario = (targetGpa = 3.3): PlannerScenario => ({
  id: newId(),
  name: "Primary target",
  targetGpa,
  projectedGrades: {},
  updatedAt: new Date().toISOString(),
  classTarget: classTargetForDefaultGpa(targetGpa)
});
