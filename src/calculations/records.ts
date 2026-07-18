import type { Course, CourseRecord, GradeEntry } from "../domain/types";

import { resolveAttempts } from "./attempts";

export const effectiveCourseResult = (record?: CourseRecord): GradeEntry => {
  if (!record) {
    return "";
  }
  return resolveAttempts(record.result, record.attempts).gradeUsedInGpa;
};

export const effectiveResultMap = (
  courses: Course[],
  records: Record<string, CourseRecord>
): Record<string, GradeEntry> =>
  Object.fromEntries(
    courses.map((course) => [course.id, effectiveCourseResult(records[course.id])])
  );

export const createCourseRecord = (courseId: string): CourseRecord => ({
  courseId,
  result: "",
  attempts: []
});
