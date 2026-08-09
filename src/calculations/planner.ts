import { GRADE_POINTS_HUNDREDTHS } from "../data/gradeScale";
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

import { evaluateClassification } from "./classification";
import {
  DEGREE_CLASS_RULES,
  evaluateBestClass,
  evaluateClassTarget,
  targetGpaForClass,
  type BestClassEvaluation,
  type ClassTargetEvaluation
} from "./classPlanning";
import { calculateCourseGpa, resultPointHundredths, truncateGpa } from "./gpa";
import { effectiveResultMap } from "./records";

export interface PlannerProjection {
  currentGpa: ReturnType<typeof calculateCourseGpa>;
  projectedGpa: string | null;
  recommendedGpa: string | null;
  targetGpa: number;
  targetClass: ClassName | null;
  currentClass: ReturnType<typeof evaluateClassification>["awardedClass"];
  selectedPlanClass: ClassName | "Not yet eligible" | null;
  selectedPlanClassBasis: BestClassEvaluation["basis"] | null;
  bestPossibleClass: ClassName | "Not yet eligible";
  bestPossibleClassBasis: BestClassEvaluation["basis"];
  classTargetPossible: boolean | null;
  classTargetEvaluation: ClassTargetEvaluation | null;
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
}

export interface FutureGradePlan {
  id: string;
  name: string;
  description: string;
  grades: Record<string, LetterGrade>;
  gpa: string | null;
  projectedClass: ClassName | "Not yet eligible";
  projectedClassBasis: BestClassEvaluation["basis"];
  classTargetMet: boolean | null;
  classEvaluation: ClassTargetEvaluation | null;
}

export interface PlannerOptions {
  programme?: Programme;
  selection?: CurriculumSelection;
  registrationInfo?: RegistrationInfo;
  classTarget?: ClassName;
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

const PRESET_CLASS_BY_GPA: Array<{ gpa: number; className: ClassName }> = [
  { gpa: 3.7, className: "First Class" },
  { gpa: 3.3, className: "Second Class (Upper Division)" },
  { gpa: 3, className: "Second Class (Lower Division)" },
  { gpa: 2, className: "Pass" }
];

export const classTargetForPresetGpa = (gpa: number): ClassName | undefined =>
  PRESET_CLASS_BY_GPA.find((item) => Math.abs(item.gpa - gpa) < 1e-9)?.className;

const resolveClassTarget = (
  scenario: PlannerScenario,
  options?: PlannerOptions
): ClassName | null => {
  if (options?.classTarget) {
    return options.classTarget;
  }
  if (scenario.classTarget === null) {
    return null;
  }
  return scenario.classTarget ?? classTargetForPresetGpa(scenario.targetGpa) ?? null;
};

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

type PlanItem = {
  course: Course;
  gradeIndex: number;
};

const courseOrderValue = (course: Course): string =>
  `${course.year}${course.semester}${course.code}${course.id}`;

const emptyBestClass = (): BestClassEvaluation => ({
  className: "Not yet eligible",
  evaluation: null,
  basis: "none"
});

const basePlan = (
  id: string,
  name: string,
  description: string,
  items: PlanItem[],
  projectedWeighted: number,
  totalCredits: number
): Omit<FutureGradePlan, "projectedClass" | "projectedClassBasis" | "classTargetMet" | "classEvaluation"> => {
  const grades = Object.fromEntries(
    items.map((item) => [
      item.course.id,
      RECOMMENDATION_GRADES[item.gradeIndex].grade
    ])
  );
  const planWeighted = items.reduce(
    (sum, item) =>
      sum + item.course.credits * RECOMMENDATION_GRADES[item.gradeIndex].pointHundredths,
    0
  );

  return {
    id,
    name,
    description,
    grades,
    gpa: truncateGpa(projectedWeighted + planWeighted, totalCredits)
  };
};

const simulatePlanRecords = (
  records: Record<string, CourseRecord>,
  remainingCourses: Course[],
  grades: Record<string, LetterGrade>
): Record<string, CourseRecord> => {
  const simulated: Record<string, CourseRecord> = { ...records };
  for (const course of remainingCourses) {
    const grade = grades[course.id];
    if (!grade) {
      continue;
    }
    simulated[course.id] = {
      courseId: course.id,
      result: grade,
      attempts: []
    };
  }
  return simulated;
};

const annotatePlan = (
  plan: Omit<FutureGradePlan, "projectedClass" | "projectedClassBasis" | "classTargetMet" | "classEvaluation">,
  remainingCourses: Course[],
  records: Record<string, CourseRecord>,
  targetClass: ClassName | null,
  options?: PlannerOptions
): FutureGradePlan => {
  if (!options?.programme) {
    return {
      ...plan,
      projectedClass: "Not yet eligible",
      projectedClassBasis: "none",
      classTargetMet: targetClass ? false : null,
      classEvaluation: null
    };
  }

  const simulated = simulatePlanRecords(records, remainingCourses, plan.grades);
  const registrationInfo = options.registrationInfo ?? {};
  const bestClass = evaluateBestClass(
    options.programme,
    options.selection,
    simulated,
    registrationInfo
  );
  const classEvaluation = targetClass
    ? evaluateClassTarget(
        options.programme,
        options.selection,
        simulated,
        registrationInfo,
        targetClass
      )
    : null;

  return {
    ...plan,
    projectedClass: bestClass.className,
    projectedClassBasis: bestClass.basis,
    classTargetMet: targetClass ? classEvaluation?.onTrack === true : null,
    classEvaluation
  };
};

const planKey = (remainingCourses: Course[], plan: FutureGradePlan): string =>
  remainingCourses.map((course) => `${course.id}:${plan.grades[course.id]}`).join("|");

const buildGreedyGpaPlan = (
  id: string,
  name: string,
  description: string,
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  records: Record<string, CourseRecord>,
  options: PlannerOptions | undefined,
  orderItems: (items: PlanItem[]) => PlanItem[]
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

  return annotatePlan(
    basePlan(id, name, description, items, projectedWeighted, totalCredits),
    remainingCourses,
    records,
    null,
    options
  );
};

const buildAllAPlan = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  records: Record<string, CourseRecord>,
  targetClass: ClassName | null,
  options?: PlannerOptions
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  if (remainingCourses.length === 0 || remainingCredits === 0) {
    return null;
  }
  const items = remainingCourses.map((course) => ({
    course,
    gradeIndex: RECOMMENDATION_GRADES.length - 1
  }));
  return annotatePlan(
    basePlan(
      "stretch",
      "All A",
      "Maximum-outcome plan using A in every future GPA-bearing course.",
      items,
      projectedWeighted,
      projectedCredits + remainingCredits
    ),
    remainingCourses,
    records,
    targetClass,
    options
  );
};

const classPlanQualifies = (
  plan: FutureGradePlan,
  targetHundredths: number
): boolean =>
  plan.classTargetMet === true &&
  plan.gpa !== null &&
  Number(plan.gpa) >= targetHundredths / 100;

const buildClassConstrainedPlan = (
  id: string,
  name: string,
  description: string,
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  records: Record<string, CourseRecord>,
  targetClass: ClassName,
  options: PlannerOptions,
  orderItems: (items: PlanItem[]) => PlanItem[]
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  if (remainingCourses.length === 0 || remainingCredits === 0 || !options.programme) {
    return null;
  }
  const totalCredits = projectedCredits + remainingCredits;
  const items = remainingCourses.map((course) => ({
    course,
    gradeIndex: RECOMMENDATION_GRADES.length - 1
  }));

  const makePlan = () =>
    annotatePlan(
      basePlan(id, name, description, items, projectedWeighted, totalCredits),
      remainingCourses,
      records,
      targetClass,
      options
    );

  const maximumPlan = makePlan();
  if (!classPlanQualifies(maximumPlan, targetHundredths)) {
    return null;
  }

  for (const orderedItem of orderItems(items)) {
    const item = items.find((candidate) => candidate.course.id === orderedItem.course.id)!;
    while (item.gradeIndex > 0) {
      item.gradeIndex -= 1;
      const candidate = makePlan();
      if (!classPlanQualifies(candidate, targetHundredths)) {
        item.gradeIndex += 1;
        break;
      }
    }
  }

  return makePlan();
};

const classSummary = (
  targetClass: ClassName,
  plans: FutureGradePlan[],
  allAPlan: FutureGradePlan | null
): string => {
  const rule = DEGREE_CLASS_RULES[targetClass];
  if (plans.length > 0) {
    const plan = plans[0];
    const evaluation = plan.classEvaluation;
    const highGradeText =
      evaluation && rule.highGradeLabel
        ? ` ${evaluation.highGradeCredits}/${evaluation.requiredHighGradeCredits} credits are ${rule.highGradeLabel}.`
        : "";
    const durationText = evaluation?.unknowns.length
      ? " Four-year completion still needs to be verified."
      : "";
    return `${plans.length} exact future-grade plan${plans.length === 1 ? "" : "s"} satisfy the ${targetClass} academic requirements. Selected plan GPA: ${plan.gpa ?? "--"}.${highGradeText}${durationText}`;
  }

  const evaluation = allAPlan?.classEvaluation;
  const blockers = evaluation?.blockers ?? [];
  if (blockers.length > 0) {
    return `${targetClass} is not currently achievable by future grades alone. ${blockers.join(" ")}`;
  }
  return `${targetClass} is not currently achievable with the selected curriculum and entered results.`;
};

const buildClassGradePlans = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  records: Record<string, CourseRecord>,
  targetClass: ClassName,
  options: PlannerOptions
): {
  recommendedGrades: Record<string, LetterGrade>;
  recommendedGpa: string | null;
  recommendationSummary: string;
  possiblePlans: FutureGradePlan[];
  classTargetPossible: boolean;
  classTargetEvaluation: ClassTargetEvaluation | null;
} => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);

  if (remainingCourses.length === 0 || remainingCredits === 0) {
    if (!options.programme) {
      return {
        recommendedGrades: {},
        recommendedGpa: truncateGpa(projectedWeighted, projectedCredits),
        recommendationSummary: "No future GPA-bearing courses are available for a class plan.",
        possiblePlans: [],
        classTargetPossible: false,
        classTargetEvaluation: null
      };
    }
    const evaluation = evaluateClassTarget(
      options.programme,
      options.selection,
      records,
      options.registrationInfo ?? {},
      targetClass
    );
    return {
      recommendedGrades: {},
      recommendedGpa: truncateGpa(projectedWeighted, projectedCredits),
      recommendationSummary: evaluation.eligible
        ? `Entered results already satisfy the ${targetClass} requirements.`
        : `${targetClass} is not currently satisfied. ${[...evaluation.blockers, ...evaluation.unknowns].join(" ")}`,
      possiblePlans: [],
      classTargetPossible: evaluation.onTrack,
      classTargetEvaluation: evaluation
    };
  }

  const allAPlan = buildAllAPlan(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    targetClass,
    options
  );
  if (!allAPlan || !classPlanQualifies(allAPlan, targetHundredths)) {
    return {
      recommendedGrades: allAPlan?.grades ?? {},
      recommendedGpa: allAPlan?.gpa ?? null,
      recommendationSummary: classSummary(targetClass, [], allAPlan),
      possiblePlans: allAPlan ? [allAPlan] : [],
      classTargetPossible: false,
      classTargetEvaluation: allAPlan?.classEvaluation ?? null
    };
  }

  const totalCredits = projectedCredits + remainingCredits;
  const maxWeighted = projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;
  const bufferTarget =
    (targetHundredths + 10) * totalCredits <= maxWeighted
      ? targetHundredths + 10
      : targetHundredths;

  const strategies: Array<{
    id: string;
    name: string;
    description: string;
    target: number;
    orderItems: (items: PlanItem[]) => PlanItem[];
  }> = [
    {
      id: "class-efficient",
      name: "Class-efficient",
      description: `Lowest practical grade mix found while still satisfying ${targetClass}.`,
      target: targetHundredths,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            a.course.credits - b.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "credit-efficient",
      name: "Credit-efficient",
      description: "Keeps stronger grades on higher-credit courses to satisfy the class rules efficiently.",
      target: targetHundredths,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            b.course.credits - a.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "early-focus",
      name: "Early focus",
      description: "Keeps stronger results on earlier remaining courses while preserving the target class.",
      target: targetHundredths,
      orderItems: (items) =>
        [...items].sort((a, b) =>
          courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))
        )
    },
    {
      id: "late-focus",
      name: "Late focus",
      description: "Keeps stronger results on later remaining courses while preserving the target class.",
      target: targetHundredths,
      orderItems: (items) =>
        [...items].sort((a, b) =>
          courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "class-buffer",
      name: "Safety buffer",
      description: "Adds GPA headroom while still satisfying every controllable class requirement.",
      target: bufferTarget,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            a.course.semester - b.course.semester ||
            b.course.credits - a.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    }
  ];

  const possiblePlans: FutureGradePlan[] = [];
  const seen = new Set<string>();
  for (const strategy of strategies) {
    const plan = buildClassConstrainedPlan(
      strategy.id,
      strategy.name,
      strategy.description,
      remainingCourses,
      projectedWeighted,
      projectedCredits,
      strategy.target,
      records,
      targetClass,
      options,
      strategy.orderItems
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

  if (possiblePlans.length < 5) {
    const key = planKey(remainingCourses, allAPlan);
    if (!seen.has(key)) {
      possiblePlans.push(allAPlan);
    }
  }

  const primaryPlan = possiblePlans[0] ?? allAPlan;
  return {
    recommendedGrades: primaryPlan.grades,
    recommendedGpa: primaryPlan.gpa,
    recommendationSummary: classSummary(targetClass, possiblePlans, allAPlan),
    possiblePlans: possiblePlans.slice(0, 5),
    classTargetPossible: true,
    classTargetEvaluation: primaryPlan.classEvaluation
  };
};

const buildGpaGradePlans = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  records: Record<string, CourseRecord>,
  options?: PlannerOptions
): {
  recommendedGrades: Record<string, LetterGrade>;
  recommendedGpa: string | null;
  recommendationSummary: string;
  possiblePlans: FutureGradePlan[];
} => {
  const remainingCredits = remainingCourses.reduce((sum, course) => sum + course.credits, 0);
  const totalCredits = projectedCredits + remainingCredits;
  const targetWeighted = targetHundredths * totalCredits;

  if (remainingCourses.length === 0 || remainingCredits === 0) {
    return {
      recommendedGrades: {},
      recommendedGpa: truncateGpa(projectedWeighted, projectedCredits),
      recommendationSummary: "No future GPA-bearing courses are available for a recommendation.",
      possiblePlans: []
    };
  }

  const maxWeighted = projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;
  const allAPlan = buildAllAPlan(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    null,
    options
  );
  if (maxWeighted < targetWeighted) {
    return {
      recommendedGrades: allAPlan?.grades ?? {},
      recommendedGpa: truncateGpa(maxWeighted, totalCredits),
      recommendationSummary: "Even A grades for every future GPA-bearing course cannot reach this GPA target.",
      possiblePlans: allAPlan ? [allAPlan] : []
    };
  }

  const strategies: Array<{
    id: string;
    name: string;
    description: string;
    targetHundredths: number;
    orderItems: (items: PlanItem[]) => PlanItem[];
  }> = [
    {
      id: "balanced",
      name: "Balanced",
      description: "A minimum-mix plan that keeps higher grades on higher-credit courses.",
      targetHundredths,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            a.course.credits - b.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "low-credit-push",
      name: "Low-credit push",
      description: "Higher grades are placed on smaller-credit courses where possible.",
      targetHundredths,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            b.course.credits - a.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "early-push",
      name: "Early push",
      description: "Keeps stronger grades on earlier remaining subjects.",
      targetHundredths,
      orderItems: (items) =>
        [...items].sort((a, b) =>
          courseOrderValue(b.course).localeCompare(courseOrderValue(a.course))
        )
    },
    {
      id: "late-push",
      name: "Late push",
      description: "Keeps stronger grades on later remaining subjects.",
      targetHundredths,
      orderItems: (items) =>
        [...items].sort((a, b) =>
          courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    },
    {
      id: "buffer",
      name: "Buffer",
      description: "A safer plan that aims a little above the target GPA.",
      targetHundredths:
        (targetHundredths + 10) * totalCredits <= maxWeighted
          ? targetHundredths + 10
          : targetHundredths,
      orderItems: (items) =>
        [...items].sort(
          (a, b) =>
            a.course.semester - b.course.semester ||
            b.course.credits - a.course.credits ||
            courseOrderValue(a.course).localeCompare(courseOrderValue(b.course))
        )
    }
  ];

  const possiblePlans: FutureGradePlan[] = [];
  const seen = new Set<string>();
  for (const strategy of strategies) {
    const plan = buildGreedyGpaPlan(
      strategy.id,
      strategy.name,
      strategy.description,
      remainingCourses,
      projectedWeighted,
      projectedCredits,
      strategy.targetHundredths,
      records,
      options,
      strategy.orderItems
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

  for (const option of RECOMMENDATION_GRADES) {
    if (possiblePlans.length >= 5) {
      break;
    }
    const uniformWeighted = projectedWeighted + option.pointHundredths * remainingCredits;
    if (uniformWeighted < targetWeighted) {
      continue;
    }
    const plan = annotatePlan(
      basePlan(
        `uniform-${option.grade}`,
        `All ${option.grade}`,
        `A simple GPA plan using ${option.grade} in every future GPA-bearing course.`,
        remainingCourses.map((course) => ({
          course,
          gradeIndex: RECOMMENDATION_GRADES.findIndex((grade) => grade.grade === option.grade)
        })),
        projectedWeighted,
        totalCredits
      ),
      remainingCourses,
      records,
      null,
      options
    );
    const key = planKey(remainingCourses, plan);
    if (!seen.has(key)) {
      seen.add(key);
      possiblePlans.push(plan);
    }
  }

  if (possiblePlans.length < 5 && allAPlan) {
    const key = planKey(remainingCourses, allAPlan);
    if (!seen.has(key)) {
      possiblePlans.push(allAPlan);
    }
  }

  const primaryPlan = possiblePlans[0];
  const recommendedGrades = primaryPlan?.grades ?? {};
  const recommendedGpa = primaryPlan?.gpa ?? null;
  const distinctGrades = [...new Set(Object.values(recommendedGrades))];
  const summary =
    possiblePlans.length > 1
      ? `${possiblePlans.length} possible future grade plans can reach the GPA target.`
      : distinctGrades.length === 1
        ? `Aim for ${distinctGrades[0]} or better in each future GPA-bearing course.`
        : `Aim for the suggested mix of ${distinctGrades.join(", ")} grades across future GPA-bearing courses.`;

  return {
    recommendedGrades,
    recommendedGpa,
    recommendationSummary: `${summary} Selected plan GPA: ${recommendedGpa ?? "--"}.`,
    possiblePlans: possiblePlans.slice(0, 5)
  };
};

const bestPossibleClassForAllA = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  records: Record<string, CourseRecord>,
  options?: PlannerOptions
): BestClassEvaluation => {
  if (!options?.programme) {
    return emptyBestClass();
  }
  const allA = buildAllAPlan(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    null,
    options
  );
  const simulated = allA
    ? simulatePlanRecords(records, remainingCourses, allA.grades)
    : records;
  return evaluateBestClass(
    options.programme,
    options.selection,
    simulated,
    options.registrationInfo ?? {}
  );
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
  const targetClass = resolveClassTarget(scenario, options);
  const classMinimumGpa = targetClass ? targetGpaForClass(targetClass) : 0;
  const effectiveTargetGpa = Math.max(scenario.targetGpa, classMinimumGpa);

  const projectedWeighted = currentWeighted;
  const projectedCredits = currentCredits;
  const remainingCourseIds: string[] = [];
  const remainingCourses: Course[] = [];
  let remainingGpaCredits = 0;

  for (const course of courses) {
    const currentResult = currentResults[course.id] ?? "";
    const currentPoint = resultPointHundredths(currentResult);
    if (currentPoint !== null) {
      continue;
    }
    if (currentResult === "P") {
      continue;
    }
    remainingCourseIds.push(course.id);
    remainingCourses.push(course);
    remainingGpaCredits += course.credits;
  }

  const targetHundredths = targetToHundredths(effectiveTargetGpa);
  const requiredWeightedForTarget = targetHundredths * (projectedCredits + remainingGpaCredits);
  const requiredAverageOnRemaining =
    remainingGpaCredits === 0
      ? null
      : (requiredWeightedForTarget - projectedWeighted) / remainingGpaCredits / 100;
  const minPossibleGpa = truncateGpa(projectedWeighted, projectedCredits + remainingGpaCredits);
  const maxPossibleGpa = truncateGpa(
    projectedWeighted + remainingGpaCredits * GRADE_POINTS_HUNDREDTHS.A,
    projectedCredits + remainingGpaCredits
  );
  const projectedGpa = truncateGpa(projectedWeighted, projectedCredits);
  const maxValue = maxPossibleGpa === null ? null : Number(maxPossibleGpa);
  const gpaImpossible =
    remainingGpaCredits === 0
      ? projectedGpa === null || Number(projectedGpa) < effectiveTargetGpa
      : requiredAverageOnRemaining !== null && requiredAverageOnRemaining > 4;

  let requiredAverageLabel = "No remaining GPA-bearing credits.";
  if (requiredAverageOnRemaining !== null) {
    if (requiredAverageOnRemaining <= 0) {
      requiredAverageLabel = "The GPA threshold is already protected by current grades.";
    } else if (
      requiredAverageOnRemaining > 4 ||
      (maxValue !== null && maxValue < effectiveTargetGpa)
    ) {
      requiredAverageLabel = "The GPA threshold is impossible even with A grades in every remaining GPA-bearing course.";
    } else {
      requiredAverageLabel = `${requiredAverageOnRemaining.toFixed(2)} average, roughly ${gradeForAverage(requiredAverageOnRemaining)} or better for the GPA threshold.`;
    }
  }

  const classOptions: PlannerOptions | undefined = options
    ? { ...options, classTarget: targetClass ?? options.classTarget }
    : targetClass
      ? { classTarget: targetClass }
      : undefined;

  const recommendation =
    targetClass && classOptions?.programme
      ? buildClassGradePlans(
          remainingCourses,
          projectedWeighted,
          projectedCredits,
          targetHundredths,
          records,
          targetClass,
          classOptions
        )
      : {
          ...buildGpaGradePlans(
            remainingCourses,
            projectedWeighted,
            projectedCredits,
            targetHundredths,
            records,
            options
          ),
          classTargetPossible: null,
          classTargetEvaluation: null
        };

  const currentClass = options?.programme
    ? evaluateClassification(
        options.programme,
        options.selection,
        records,
        options.registrationInfo ?? {}
      ).awardedClass
    : "Not yet eligible";
  const primaryPlan = recommendation.possiblePlans[0];
  const bestPossible = bestPossibleClassForAllA(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    records,
    options
  );
  const impossible = targetClass
    ? gpaImpossible || recommendation.classTargetPossible === false
    : gpaImpossible;

  return {
    currentGpa,
    projectedGpa,
    recommendedGpa: recommendation.recommendedGpa,
    targetGpa: effectiveTargetGpa,
    targetClass,
    currentClass,
    selectedPlanClass: primaryPlan?.projectedClass ?? null,
    selectedPlanClassBasis: primaryPlan?.projectedClassBasis ?? null,
    bestPossibleClass: bestPossible.className,
    bestPossibleClassBasis: bestPossible.basis,
    classTargetPossible: recommendation.classTargetPossible,
    classTargetEvaluation: primaryPlan?.classEvaluation ?? recommendation.classTargetEvaluation,
    gradedCredits: currentCredits,
    projectedCredits,
    remainingGpaCredits,
    minPossibleGpa,
    maxPossibleGpa,
    requiredAverageOnRemaining,
    requiredAverageLabel,
    impossible,
    remainingCourseIds,
    recommendedGrades: recommendation.recommendedGrades,
    recommendationSummary: recommendation.recommendationSummary,
    possiblePlans: recommendation.possiblePlans
  };
};

export const defaultScenario = (targetGpa = 3.3): PlannerScenario => {
  const classTarget = classTargetForPresetGpa(targetGpa);
  return {
    id: newId(),
    name: "Primary target",
    targetGpa,
    projectedGrades: {},
    updatedAt: new Date().toISOString(),
    ...(classTarget ? { classTarget } : {})
  };
};
