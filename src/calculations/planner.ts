import { GRADE_POINTS_HUNDREDTHS } from "../data/gradeScale";
import { newId } from "../utils/id";
import type {
  Course,
  CourseRecord,
  LetterGrade,
  PlannerScenario
} from "../domain/types";

import { calculateCourseGpa, resultPointHundredths, truncateGpa } from "./gpa";
import { effectiveResultMap } from "./records";

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
}

export interface FutureGradePlan {
  id: string;
  name: string;
  description: string;
  grades: Record<string, LetterGrade>;
  gpa: string | null;
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

const toPlan = (
  id: string,
  name: string,
  description: string,
  items: PlanItem[],
  projectedWeighted: number,
  totalCredits: number
): FutureGradePlan => {
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

const planKey = (remainingCourses: Course[], plan: FutureGradePlan): string =>
  remainingCourses.map((course) => `${course.id}:${plan.grades[course.id]}`).join("|");

const buildGreedyPlan = (
  id: string,
  name: string,
  description: string,
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number,
  orderItems: (items: PlanItem[]) => PlanItem[]
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  const totalCredits = projectedCredits + remainingCredits;
  const targetWeighted = targetHundredths * totalCredits;
  const maxWeighted =
    projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;

  if (remainingCourses.length === 0 || remainingCredits === 0 || maxWeighted < targetWeighted) {
    return null;
  }

  const baselineIndex = RECOMMENDATION_GRADES.findIndex(
    (option) =>
      projectedWeighted + option.pointHundredths * remainingCredits >=
      targetWeighted
  );
  const startingIndex =
    baselineIndex === -1 ? RECOMMENDATION_GRADES.length - 1 : baselineIndex;
  const items = remainingCourses.map((course) => ({
    course,
    gradeIndex: startingIndex
  }));
  let planWeighted =
    RECOMMENDATION_GRADES[startingIndex].pointHundredths * remainingCredits;

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

  return toPlan(id, name, description, items, projectedWeighted, totalCredits);
};

const buildAllAPlan = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number
): FutureGradePlan | null => {
  const remainingCredits = remainingCourses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  if (remainingCourses.length === 0 || remainingCredits === 0) {
    return null;
  }

  return toPlan(
    "stretch",
    "Stretch",
    "A maximum-outcome plan using A in every future GPA-bearing course.",
    remainingCourses.map((course) => ({
      course,
      gradeIndex: RECOMMENDATION_GRADES.length - 1
    })),
    projectedWeighted,
    projectedCredits + remainingCredits
  );
};

const buildFutureGradePlans = (
  remainingCourses: Course[],
  projectedWeighted: number,
  projectedCredits: number,
  targetHundredths: number
): {
  recommendedGrades: Record<string, LetterGrade>;
  recommendedGpa: string | null;
  recommendationSummary: string;
  possiblePlans: FutureGradePlan[];
} => {
  const remainingCredits = remainingCourses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
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

  const maxWeighted =
    projectedWeighted + remainingCredits * GRADE_POINTS_HUNDREDTHS.A;
  const allAPlan = buildAllAPlan(remainingCourses, projectedWeighted, projectedCredits);
  if (maxWeighted < targetWeighted) {
    return {
      recommendedGrades: allAPlan?.grades ?? {},
      recommendedGpa: truncateGpa(maxWeighted, totalCredits),
      recommendationSummary:
        "Even A grades for every future GPA-bearing course cannot reach this target.",
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
    const plan = buildGreedyPlan(
      strategy.id,
      strategy.name,
      strategy.description,
      remainingCourses,
      projectedWeighted,
      projectedCredits,
      strategy.targetHundredths,
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
    const uniformWeighted =
      projectedWeighted + option.pointHundredths * remainingCredits;
    if (uniformWeighted < targetWeighted) {
      continue;
    }
    const plan = toPlan(
      `uniform-${option.grade}`,
      `All ${option.grade}`,
      `A simple plan using ${option.grade} in every future GPA-bearing course.`,
      remainingCourses.map((course) => ({
        course,
        gradeIndex: RECOMMENDATION_GRADES.findIndex((grade) => grade.grade === option.grade)
      })),
      projectedWeighted,
      totalCredits
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
      ? `${possiblePlans.length} possible future grade plans can reach the target.`
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

export const calculatePlannerProjection = (
  courses: Course[],
  records: Record<string, CourseRecord>,
  scenario: PlannerScenario
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

  const targetHundredths = targetToHundredths(scenario.targetGpa);
  const requiredWeightedForTarget =
    targetHundredths * (projectedCredits + remainingGpaCredits);
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
  const impossible =
    remainingGpaCredits === 0
      ? projectedGpa === null || Number(projectedGpa) < scenario.targetGpa
      : requiredAverageOnRemaining !== null && requiredAverageOnRemaining > 4;

  let requiredAverageLabel = "No remaining GPA-bearing credits.";
  if (requiredAverageOnRemaining !== null) {
    if (requiredAverageOnRemaining <= 0) {
      requiredAverageLabel = "Target is already protected by current grades.";
    } else if (requiredAverageOnRemaining > 4 || (maxValue !== null && maxValue < scenario.targetGpa)) {
      requiredAverageLabel = "Target is impossible with A grades in every remaining GPA-bearing course.";
    } else {
      requiredAverageLabel = `${requiredAverageOnRemaining.toFixed(2)} average, roughly ${gradeForAverage(requiredAverageOnRemaining)} or better.`;
    }
  }
  const recommendation = buildFutureGradePlans(
    remainingCourses,
    projectedWeighted,
    projectedCredits,
    targetHundredths
  );

  return {
    currentGpa,
    projectedGpa,
    recommendedGpa: recommendation.recommendedGpa,
    targetGpa: scenario.targetGpa,
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

export const defaultScenario = (targetGpa = 3.3): PlannerScenario => ({
  id: newId(),
  name: "Primary target",
  targetGpa,
  projectedGrades: {},
  updatedAt: new Date().toISOString()
});
