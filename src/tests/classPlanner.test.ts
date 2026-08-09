import { describe, expect, it } from "vitest";

import { evaluateClassTarget } from "../calculations/classPlanning";
import { getPrescribedProgrammeCredits, getSelectedCourses } from "../calculations/curriculum";
import { calculatePlannerProjection } from "../calculations/planner";
import { programmeById } from "../data/programmes";
import { plannerScenarioSchema } from "../domain/schemas";
import type {
  ClassName,
  CourseRecord,
  CurriculumSelection,
  GradeEntry,
  PlannerScenario
} from "../domain/types";

const programme = programmeById.get("accounting")!;
const selection: CurriculumSelection = {
  programmeId: programme.programmeId,
  pathwayId: "research-report",
  electiveSelections: Object.fromEntries(
    programme.electiveGroups
      .filter((group) => !group.applicablePathways || group.applicablePathways.includes("research-report"))
      .map((group) => [group.id, [group.availableCourses[0].id]])
  )
};
const courses = getSelectedCourses(programme, selection);

const scenario = (classTarget: ClassName, targetGpa: number): PlannerScenario => ({
  id: "class-target",
  name: classTarget,
  targetGpa,
  classTarget,
  projectedGrades: {},
  updatedAt: new Date().toISOString()
});

const partialRecords = (
  count: number,
  result: GradeEntry
): Record<string, CourseRecord> =>
  Object.fromEntries(
    courses.slice(0, count).map((course) => [
      course.id,
      { courseId: course.id, result, attempts: [] }
    ])
  );

const registrationInfo = {
  firstAcademicYear: "2026/2027",
  currentOrCompletionAcademicYear: "2029/2030"
};

describe("final degree-class planning", () => {
  it("uses half of total prescribed programme credits for the high-grade threshold", () => {
    const records = partialRecords(4, "A");
    const evaluation = evaluateClassTarget(
      programme,
      selection,
      records,
      registrationInfo,
      "First Class"
    );
    const prescribedCredits = getPrescribedProgrammeCredits(programme, selection);

    expect(evaluation.requiredHighGradeCredits).toBe(Math.ceil(prescribedCredits / 2));
    expect(evaluation.totalProgrammeCredits).toBe(prescribedCredits);
    expect(evaluation.eligible).toBe(false);
  });

  it("builds First Class plans that satisfy both GPA and A/A+ credit requirements", () => {
    const records = partialRecords(5, "A-");
    const projection = calculatePlannerProjection(
      courses,
      records,
      scenario("First Class", 3.7),
      {
        programme,
        selection,
        registrationInfo,
        classTarget: "First Class"
      }
    );

    expect(projection.targetClass).toBe("First Class");
    expect(projection.classTargetPossible).toBe(true);
    expect(projection.possiblePlans.length).toBeGreaterThan(0);
    expect(
      projection.possiblePlans.every(
        (plan) =>
          plan.classTargetMet === true &&
          plan.classEvaluation?.onTrack === true &&
          Number(plan.gpa) >= 3.7 &&
          (plan.classEvaluation?.highGradeCredits ?? 0) >=
            (plan.classEvaluation?.requiredHighGradeCredits ?? Number.POSITIVE_INFINITY)
      )
    ).toBe(true);
    expect(
      projection.possiblePlans.some((plan) => Object.values(plan.grades).includes("A"))
    ).toBe(true);
  });

  it("does not claim First Class is achievable when an existing retained grade is below C", () => {
    const records: Record<string, CourseRecord> = {
      ...partialRecords(5, "A"),
      [courses[0].id]: {
        courseId: courses[0].id,
        result: "C-",
        attempts: []
      }
    };
    const projection = calculatePlannerProjection(
      courses,
      records,
      scenario("First Class", 3.7),
      {
        programme,
        selection,
        registrationInfo,
        classTarget: "First Class"
      }
    );

    expect(projection.classTargetPossible).toBe(false);
    expect(projection.impossible).toBe(true);
    expect(projection.classTargetEvaluation?.blockers.join(" ")).toContain("below C");
  });

  it("surfaces the four-year rule as a non-grade blocker", () => {
    const projection = calculatePlannerProjection(
      courses,
      partialRecords(5, "A"),
      scenario("First Class", 3.7),
      {
        programme,
        selection,
        registrationInfo: {
          firstAcademicYear: "2026/2027",
          currentOrCompletionAcademicYear: "2030/2031"
        },
        classTarget: "First Class"
      }
    );

    expect(projection.classTargetPossible).toBe(false);
    expect(projection.classTargetEvaluation?.withinFourYearsOrValidReason).toBe(false);
    expect(projection.recommendationSummary).toContain("not currently achievable");
  });

  it("preserves a saved class target through runtime validation", () => {
    const parsed = plannerScenarioSchema.parse(
      scenario("Second Class (Upper Division)", 3.3)
    );
    expect(parsed.classTarget).toBe("Second Class (Upper Division)");
  });

  it("keeps an explicit GPA-only target separate even when it equals a class threshold", () => {
    const gpaOnlyScenario: PlannerScenario = {
      ...scenario("First Class", 3.7),
      name: "GPA only",
      classTarget: null
    };
    const parsed = plannerScenarioSchema.parse(gpaOnlyScenario);
    const projection = calculatePlannerProjection(
      courses,
      partialRecords(5, "A-"),
      parsed,
      { programme, selection, registrationInfo }
    );

    expect(parsed.classTarget).toBeNull();
    expect(projection.targetClass).toBeNull();
    expect(projection.classTargetPossible).toBeNull();
  });
});
