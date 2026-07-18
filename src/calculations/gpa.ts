import {
  GRADE_POINTS_HUNDREDTHS,
  formatPoint,
  isLetterGrade
} from "../data/gradeScale";
import type { Course, GpaResult, GradeEntry, LetterGrade } from "../domain/types";

export const truncateGpa = (
  totalWeightedPointHundredths: number,
  totalCredits: number
): string | null => {
  if (totalCredits <= 0) {
    return null;
  }
  const truncatedHundredths = Math.trunc(totalWeightedPointHundredths / totalCredits);
  return formatPoint(truncatedHundredths);
};

export const resultPointHundredths = (result: GradeEntry): number | null => {
  if (isLetterGrade(result)) {
    return GRADE_POINTS_HUNDREDTHS[result];
  }
  if (result === "AB") {
    return 0;
  }
  return null;
};

export const calculateGpa = (
  entries: Array<{ credits: number; result: GradeEntry }>
): GpaResult => {
  let totalWeightedPointHundredths = 0;
  let gradedCredits = 0;

  for (const entry of entries) {
    const points = resultPointHundredths(entry.result);
    if (points === null) {
      continue;
    }
    totalWeightedPointHundredths += entry.credits * points;
    gradedCredits += entry.credits;
  }

  const gpa = truncateGpa(totalWeightedPointHundredths, gradedCredits);
  return {
    gpa,
    totalWeightedPointHundredths,
    gradedCredits,
    message:
      gpa === null
        ? "No graded credit courses have been entered yet."
        : `Provisional GPA based on ${gradedCredits} graded credits`
  };
};

export const calculateCourseGpa = (
  courses: Course[],
  results: Record<string, GradeEntry>
): GpaResult =>
  calculateGpa(
    courses.map((course) => ({
      credits: course.credits,
      result: results[course.id] ?? ""
    }))
  );

export const compareLetterGrades = (a: LetterGrade, b: LetterGrade): number =>
  GRADE_POINTS_HUNDREDTHS[a] - GRADE_POINTS_HUNDREDTHS[b];

export const gradeMeets = (grade: LetterGrade, threshold: LetterGrade): boolean =>
  GRADE_POINTS_HUNDREDTHS[grade] >= GRADE_POINTS_HUNDREDTHS[threshold];

export const isFailGrade = (result: GradeEntry): boolean =>
  result === "D" || result === "E" || result === "AB" || result === "F";

export const isMandatoryRepeat = (result: GradeEntry): boolean =>
  result === "D" || result === "E" || result === "AB";

export const isPoorRepeatPermitted = (result: GradeEntry): boolean =>
  result === "C-" || result === "D+";

export const isPendingResult = (result: GradeEntry): boolean =>
  result === "MC" || result === "DFR" || result === "INC";

export const isCompletedResult = (result: GradeEntry): boolean =>
  (isLetterGrade(result) && !isMandatoryRepeat(result)) || result === "P";
