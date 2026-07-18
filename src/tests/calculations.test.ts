import { describe, expect, it } from "vitest";

import { resolveAttempts } from "../calculations/attempts";
import { evaluateClassification } from "../calculations/classification";
import { getSelectedCourses } from "../calculations/curriculum";
import { evaluateGraduation } from "../calculations/graduation";
import { calculateGpa, isCompletedResult, isMandatoryRepeat, resultPointHundredths } from "../calculations/gpa";
import { calculatePlannerProjection } from "../calculations/planner";
import { gradeFromMark } from "../data/gradeScale";
import { programmeById } from "../data/programmes";
import type {
  AttemptRecord,
  Course,
  CourseRecord,
  CurriculumSelection,
  GradeEntry,
  PlannerScenario
} from "../domain/types";
import { parseImportedStudentData, toExportJson } from "../storage/localStore";

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

const recordsWith = (result: GradeEntry): Record<string, CourseRecord> =>
  Object.fromEntries(
    courses.map((course) => [
      course.id,
      {
        courseId: course.id,
        result,
        attempts: []
      }
    ])
  );

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

const scenario = (
  targetGpa: number,
  projectedGrades: Record<string, GradeEntry> = {}
): PlannerScenario => ({
  id: "scenario",
  name: "Scenario",
  targetGpa,
  projectedGrades,
  updatedAt: new Date().toISOString()
});

describe("GPA and result-code rules", () => {
  it("maps marks to the official grade bands", () => {
    expect(gradeFromMark(85)).toBe("A+");
    expect(gradeFromMark(70)).toBe("A");
    expect(gradeFromMark(65)).toBe("A-");
    expect(gradeFromMark(60)).toBe("B+");
    expect(gradeFromMark(55)).toBe("B");
    expect(gradeFromMark(50)).toBe("B-");
    expect(gradeFromMark(45)).toBe("C+");
    expect(gradeFromMark(40)).toBe("C");
    expect(gradeFromMark(35)).toBe("C-");
    expect(gradeFromMark(30)).toBe("D+");
    expect(gradeFromMark(25)).toBe("D");
    expect(gradeFromMark(24)).toBe("E");
  });

  it("truncates GPA to two decimals and reproduces a 2.80 weighted example", () => {
    expect(
      calculateGpa([
        { credits: 10, result: "A-" },
        { credits: 10, result: "B" },
        { credits: 10, result: "C-" }
      ]).gpa
    ).toBe("2.80");
    expect(
      calculateGpa([
        { credits: 1, result: "A" },
        { credits: 2, result: "B" }
      ]).gpa
    ).toBe("3.33");
  });

  it("applies special result-code inclusion and exclusion rules", () => {
    expect(resultPointHundredths("AB")).toBe(0);
    expect(resultPointHundredths("MC")).toBeNull();
    expect(resultPointHundredths("DFR")).toBeNull();
    expect(resultPointHundredths("INC")).toBeNull();
    expect(resultPointHundredths("P")).toBeNull();
    expect(resultPointHundredths("F")).toBeNull();
    expect(
      calculateGpa([
        { credits: 3, result: "A" },
        { credits: 3, result: "AB" },
        { credits: 3, result: "P" },
        { credits: 3, result: "F" },
        { credits: 3, result: "" }
      ]).gpa
    ).toBe("2.00");
  });

  it("separates mandatory repeats, permissible repeats, completion, and fail-only codes", () => {
    expect(isMandatoryRepeat("D")).toBe(true);
    expect(isMandatoryRepeat("E")).toBe(true);
    expect(isMandatoryRepeat("AB")).toBe(true);
    expect(isMandatoryRepeat("D+")).toBe(false);
    expect(isCompletedResult("C-")).toBe(true);
    expect(isCompletedResult("D+")).toBe(true);
    expect(isCompletedResult("D")).toBe(false);
    expect(isCompletedResult("P")).toBe(true);
    expect(isCompletedResult("F")).toBe(false);
  });
});

describe("repeat attempt rules", () => {
  const attempt = (
    attemptNumber: number,
    result: GradeEntry,
    attemptType: AttemptRecord["attemptType"] = "ordinary-repeat"
  ): AttemptRecord => ({
    id: String(attemptNumber),
    attemptNumber,
    result,
    attemptType,
    approvedPrivileges: attemptType !== "ordinary-repeat"
  });

  it("caps ordinary repeats at C", () => {
    const resolution = resolveAttempts("", [attempt(1, "D", "first"), attempt(2, "A")]);
    expect(resolution.gradeUsedInGpa).toBe("C");
    expect(resolution.capApplied).toBe(true);
  });

  it("does not cap privileged medical or deferred attempts", () => {
    expect(resolveAttempts("", [attempt(1, "D", "first"), attempt(2, "A", "medical-privileged")]).gradeUsedInGpa).toBe("A");
    expect(resolveAttempts("", [attempt(1, "E", "first"), attempt(2, "A-", "deferred-privileged")]).gradeUsedInGpa).toBe("A-");
  });

  it("retains the better eligible grade and ignores pending attempts", () => {
    expect(resolveAttempts("B", [attempt(1, "B", "first"), attempt(2, "MC")]).gradeUsedInGpa).toBe("B");
    expect(resolveAttempts("", [attempt(1, "C", "first"), attempt(2, "D+")]).gradeUsedInGpa).toBe("C");
  });
});

describe("progress, graduation, class, planner, and storage", () => {
  it("marks annual pass as provisional for pending results and failed for D/E/AB", () => {
    const pendingRecords = setResult(recordsWith("B"), courses[0], "MC");
    const pendingGraduation = evaluateGraduation(programme, selection, pendingRecords, {});
    expect(pendingGraduation.yearProgress[0].status).toBe("Pending MC/DFR/INC results");

    const repeatRecords = setResult(recordsWith("B"), courses[0], "D");
    const repeatGraduation = evaluateGraduation(programme, selection, repeatRecords, {});
    expect(repeatGraduation.yearProgress[0].status).toBe("Contains mandatory repeat grades");
  });

  it("requires completed credits, overall GPA, annual passes, no unresolved courses, and seven-year compliance for graduation", () => {
    const graduation = evaluateGraduation(
      programme,
      selection,
      recordsWith("A"),
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2029/2030"
      }
    );
    expect(graduation.canGraduateProvisionally).toBe(true);

    const tooLate = evaluateGraduation(
      programme,
      selection,
      recordsWith("A"),
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2034/2035"
      }
    );
    expect(tooLate.sevenYearStatus).toBe("not-met");
    expect(tooLate.canGraduateProvisionally).toBe(false);
  });

  it("keeps last-attempt provision separate from graduation approval", () => {
    const graduation = evaluateGraduation(
      programme,
      selection,
      recordsWith("A"),
      {
        lastAttemptProvision: true
      }
    );
    expect(graduation.checklist.find((item) => item.id === "last-attempt")?.status).toBe("provisional");
    expect(graduation.disclaimer).toContain("University");
  });

  it("awards First Class only when GPA, A-credit, no-below-C, duration, and completion rules are met", () => {
    const classification = evaluateClassification(
      programme,
      selection,
      recordsWith("A"),
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2029/2030"
      }
    );
    expect(classification.awardedClass).toBe("First Class");
  });

  it("blocks First Class when a grade is below C and checks upper/lower poor-pass limits", () => {
    const withPoor = [courses[0], courses[1], courses[2]].reduce(
      (records, course) => setResult(records, course, "C-"),
      recordsWith("A-")
    );
    const classification = evaluateClassification(
      programme,
      selection,
      withPoor,
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2029/2030"
      }
    );
    expect(classification.results.find((item) => item.className === "First Class")?.eligible).toBe(false);
    expect(classification.results.find((item) => item.className === "Second Class (Upper Division)")?.eligible).toBe(false);
  });

  it("does not use completion duration to block current class standing", () => {
    const withoutReason = evaluateClassification(
      programme,
      selection,
      recordsWith("A"),
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2030/2031"
      }
    );
    expect(withoutReason.awardedClass).toBe("First Class");

    const withReason = evaluateClassification(
      programme,
      selection,
      recordsWith("A"),
      {
        firstAcademicYear: "2026/2027",
        currentOrCompletionAcademicYear: "2030/2031",
        approvedExtensionOrValidReason: true
      }
    );
    expect(withReason.awardedClass).toBe("First Class");
  });

  it("evaluates current class standing from completed results so far instead of all four years", () => {
    const firstTwoYears = courses.filter((course) => course.year <= 2);
    const highGradeCredits = firstTwoYears.reduce((sum, course) => sum + course.credits, 0);
    const partialRecords = firstTwoYears.reduce<Record<string, CourseRecord>>(
      (records, course) => ({
        ...records,
        [course.id]: { courseId: course.id, result: "A", attempts: [] }
      }),
      {}
    );

    const classification = evaluateClassification(programme, selection, partialRecords, {});

    expect(classification.awardedClass).toBe("First Class");
    expect(classification.evaluatedCredits).toBe(highGradeCredits);
    expect(
      classification.results.find((result) => result.className === "First Class")?.requiredHighGradeCredits
    ).toBe(Math.ceil(highGradeCredits / 2));
  });

  it("calculates planner possible range and impossible targets", () => {
    const partialRecords = courses.slice(0, 2).reduce<Record<string, CourseRecord>>(
      (records, course) => ({
        ...records,
        [course.id]: { courseId: course.id, result: "C", attempts: [] }
      }),
      {}
    );
    const projection = calculatePlannerProjection(courses, partialRecords, scenario(3.7));
    expect(Number(projection.maxPossibleGpa)).toBeGreaterThanOrEqual(3.7);
    expect(projection.remainingGpaCredits).toBeGreaterThan(0);
    expect(Object.keys(projection.recommendedGrades).length).toBeGreaterThan(0);
    expect(Number(projection.recommendedGpa)).toBeGreaterThanOrEqual(3.7);
    expect(projection.possiblePlans).toHaveLength(5);
    expect(
      new Set(
        projection.possiblePlans.map((plan) => JSON.stringify(plan.grades))
      ).size
    ).toBe(5);
    expect(
      projection.possiblePlans.every((plan) => Number(plan.gpa) >= 3.7)
    ).toBe(true);

    const impossible = calculatePlannerProjection(courses, recordsWith("C"), scenario(3.7));
    expect(impossible.impossible).toBe(true);
    expect(Object.values(impossible.recommendedGrades).every((grade) => grade === "A")).toBe(true);
  });

  it("does not treat completed P results as future planner subjects", () => {
    const passOnly = calculatePlannerProjection(
      [courses[0]],
      setResult({}, courses[0], "P"),
      scenario(2)
    );

    expect(passOnly.remainingCourseIds).toEqual([]);
    expect(passOnly.recommendedGrades).toEqual({});
  });

  it("ignores saved projected grades so future subjects stay visible in the planner", () => {
    const futureCourse = courses[2];
    const projection = calculatePlannerProjection(
      courses.slice(0, 3),
      {
        [courses[0].id]: { courseId: courses[0].id, result: "A", attempts: [] },
        [courses[1].id]: { courseId: courses[1].id, result: "A", attempts: [] }
      },
      scenario(3.8, { [futureCourse.id]: "A" })
    );

    expect(projection.remainingCourseIds).toContain(futureCourse.id);
    expect(projection.recommendedGrades[futureCourse.id]).toBeDefined();
  });

  it("round-trips exported data through the Zod import schema", () => {
    const exported = toExportJson({
      prospectusVersion: "2026",
      schemaVersion: 1,
      activeSelection: selection,
      courseRecords: recordsWith("B+"),
      orphanedRecords: {},
      plannerScenarios: [scenario(3.3)],
      registrationInfo: {},
      preferences: {
        theme: "light",
        gradeEntryMode: "grade"
      },
      updatedAt: new Date().toISOString()
    });

    expect(parseImportedStudentData(exported).prospectusVersion).toBe("2026");
  });
});
