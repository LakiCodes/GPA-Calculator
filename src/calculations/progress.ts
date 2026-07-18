import type {
  Course,
  CourseRecord,
  GpaResult,
  GradeEntry,
  YearLevel,
  YearPassStatus
} from "../domain/types";

import {
  calculateCourseGpa,
  isCompletedResult,
  isMandatoryRepeat,
  isPendingResult,
  isPoorRepeatPermitted
} from "./gpa";

export interface YearProgress {
  year: YearLevel;
  gpa: GpaResult;
  status: YearPassStatus;
  poorGradeCourseIds: string[];
  mandatoryRepeatCourseIds: string[];
  pendingCourseIds: string[];
  completedCredits: number;
  totalCredits: number;
}

export const recordResult = (
  records: Record<string, CourseRecord>,
  courseId: string
): GradeEntry => records[courseId]?.result ?? "";

export const calculateYearProgress = (
  courses: Course[],
  records: Record<string, CourseRecord>,
  year: YearLevel
): YearProgress => {
  const yearCourses = courses.filter((course) => course.year === year);
  const resultMap = Object.fromEntries(
    yearCourses.map((course) => [course.id, recordResult(records, course.id)])
  );
  const gpa = calculateCourseGpa(yearCourses, resultMap);
  const mandatoryRepeatCourseIds = yearCourses
    .filter((course) => isMandatoryRepeat(resultMap[course.id] ?? ""))
    .map((course) => course.id);
  const pendingCourseIds = yearCourses
    .filter((course) => isPendingResult(resultMap[course.id] ?? ""))
    .map((course) => course.id);
  const poorGradeCourseIds = yearCourses
    .filter((course) => isPoorRepeatPermitted(resultMap[course.id] ?? ""))
    .map((course) => course.id);
  const hasMissing = yearCourses.some((course) => !resultMap[course.id]);
  const gpaValue = gpa.gpa === null ? null : Number(gpa.gpa);

  let status: YearPassStatus = "Not yet complete";
  if (pendingCourseIds.length > 0) {
    status = "Pending MC/DFR/INC results";
  } else if (hasMissing) {
    status = "Not yet complete";
  } else if (mandatoryRepeatCourseIds.length > 0) {
    status = "Contains mandatory repeat grades";
  } else if (gpaValue !== null && gpaValue < 2) {
    status = "GPA below requirement";
  } else if (gpaValue !== null) {
    status = "Passed";
  }

  const completedCredits = yearCourses
    .filter((course) => {
      const result = resultMap[course.id] ?? "";
      return isCompletedResult(result);
    })
    .reduce((sum, course) => sum + course.credits, 0);

  return {
    year,
    gpa,
    status,
    poorGradeCourseIds,
    mandatoryRepeatCourseIds,
    pendingCourseIds,
    completedCredits,
    totalCredits: yearCourses.reduce((sum, course) => sum + course.credits, 0)
  };
};

export const calculateAllYearProgress = (
  courses: Course[],
  records: Record<string, CourseRecord>
): YearProgress[] =>
  ([1, 2, 3, 4] as const).map((year) =>
    calculateYearProgress(courses, records, year)
  );
