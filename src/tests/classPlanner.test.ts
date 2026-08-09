import { describe, expect, it } from "vitest";

import { getSelectedCourses } from "../calculations/curriculum";
import { calculatePlannerProjection, defaultScenario } from "../calculations/planner";
import { programmeById } from "../data/programmes";
import type {
  ClassName,
  Course,
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
      .filter(
        (group) =>
          !group.applicablePathways ||
          group.applicablePathways.includes("research-report")
      )
      .map((group) => [group.id, [group.availableCourses[0].id]])
  )
};
const courses = getSelectedCourses(programme, selection);

const setResult = (
  records: Record<string, CourseRecord>,
  course: Course,
  result: GradeEntry
): Record<string, CourseRecord> => ({
  ...records,
  [course.id]: {
    courseId: course.id,
    result,
    attempts: []
  }
});

const scenario = (targetGpa: number, classTarget?: ClassName): PlannerScenario => ({
  id: "class-scenario",
  name: "Class scenario",
  targetGpa,
  projectedGrades: {},
  updatedAt: new Date().toISOString(),
  ...(classTarget ? { classTarget } : {})
});

const plannerOptions = (classTarget: ClassName) => ({
  programme,
  selection,
  registrationInfo: {},
  classTarget
});

describe("class-aware GPA planner", () => {
  it("generates only classification-valid First Class plans", () => {
    const completedCount = Math.max(1, Math.floor(courses.length / 2));
    const partialRecords = courses
      .slice(0, completedCount)
      .reduce<Record<string, CourseRecord>>(
        (records, course) => setResult(records, course, "A"),
        {}
      );

    const projection = calculatePlannerProjection(
      courses,
      partialRecords,
      scenario(3.7, "First Class"),
      plannerOptions("First Class")
    );

    expect(projection.targetClass).toBe("First Class");
    expect(projection.classTargetPossible).toBe(true);
    expect(projection.possiblePlans.length).toBeGreaterThan(0);
    expect(projection.highGradeThreshold).toBe("A");
    expect(projection.requiredHighGradeCredits).toBeGreaterThan(0);

    for (const plan of projection.possiblePlans) {
      expect(plan.targetClassEligible).toBe(true);
      expect(Number(plan.gpa)).toBeGreaterThanOrEqual(3.7);
      expect(plan.highGradeCredits).toBeGreaterThanOrEqual(
        plan.requiredHighGradeCredits
      );
      expect(plan.projectedClass).not.toBe("Not yet eligible");
    }
  });

  it("blocks First Class when an existing result is below C", () => {
    const completedCount = Math.max(3, Math.floor(courses.length / 2));
    let partialRecords = courses
      .slice(0, completedCount)
      .reduce<Record<string, CourseRecord>>(
        (records, course) => setResult(records, course, "A"),
        {}
      );
    partialRecords = setResult(partialRecords, courses[0], "C-");

    const projection = calculatePlannerProjection(
      courses,
      partialRecords,
      scenario(3.7, "First Class"),
      plannerOptions("First Class")
    );

    expect(projection.classTargetPossible).toBe(false);
    expect(projection.possiblePlans).toHaveLength(0);
    expect(projection.classTargetReasons.join(" ")).toContain("below C");
    expect(Object.values(projection.recommendedGrades).every((grade) => grade === "A")).toBe(true);
  });

  it("enforces the 50% A- credit rule for Second Upper plans", () => {
    const completedCount = Math.max(1, Math.floor(courses.length / 3));
    const partialRecords = courses
      .slice(0, completedCount)
      .reduce<Record<string, CourseRecord>>(
        (records, course) => setResult(records, course, "A-"),
        {}
      );

    const projection = calculatePlannerProjection(
      courses,
      partialRecords,
      scenario(3.3, "Second Class (Upper Division)"),
      plannerOptions("Second Class (Upper Division)")
    );

    expect(projection.classTargetPossible).toBe(true);
    expect(projection.highGradeThreshold).toBe("A-");
    expect(projection.possiblePlans.length).toBeGreaterThan(0);
    expect(
      projection.possiblePlans.every(
        (plan) =>
          plan.targetClassEligible === true &&
          plan.highGradeCredits >= plan.requiredHighGradeCredits &&
          Number(plan.gpa) >= 3.3
      )
    ).toBe(true);
  });

  it("defaults standard GPA presets to their matching class targets", () => {
    expect(defaultScenario(3.7).classTarget).toBe("First Class");
    expect(defaultScenario(3.3).classTarget).toBe(
      "Second Class (Upper Division)"
    );
    expect(defaultScenario(3).classTarget).toBe(
      "Second Class (Lower Division)"
    );
    expect(defaultScenario(2).classTarget).toBe("Pass");
    expect(defaultScenario(3.55).classTarget).toBeUndefined();
  });
});
