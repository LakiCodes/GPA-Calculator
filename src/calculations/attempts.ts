import { GRADE_POINTS_HUNDREDTHS, isLetterGrade } from "../data/gradeScale";
import type { AttemptRecord, GradeEntry, LetterGrade } from "../domain/types";

import { isPendingResult } from "./gpa";

export interface AttemptResolution {
  retainedResult: GradeEntry;
  gradeUsedInGpa: GradeEntry;
  capApplied: boolean;
  reason: string;
}

const capOrdinaryRepeat = (grade: LetterGrade): LetterGrade => {
  if (GRADE_POINTS_HUNDREDTHS[grade] > GRADE_POINTS_HUNDREDTHS.C) {
    return "C";
  }
  return grade;
};

const betterGrade = (a: GradeEntry, b: GradeEntry): GradeEntry => {
  const aPoint = isLetterGrade(a) ? GRADE_POINTS_HUNDREDTHS[a] : a === "AB" ? 0 : -1;
  const bPoint = isLetterGrade(b) ? GRADE_POINTS_HUNDREDTHS[b] : b === "AB" ? 0 : -1;
  return bPoint > aPoint ? b : a;
};

export const resolveAttempts = (
  directResult: GradeEntry,
  attempts: AttemptRecord[]
): AttemptResolution => {
  if (attempts.length === 0) {
    return {
      retainedResult: directResult,
      gradeUsedInGpa: directResult,
      capApplied: false,
      reason: directResult ? "Current entered result is used." : "No result entered."
    };
  }

  const ordered = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  let retained: GradeEntry = "";
  let capApplied = false;
  let reason = "Best eligible attempt retained.";

  for (const attempt of ordered) {
    if (!attempt.result || isPendingResult(attempt.result)) {
      continue;
    }
    let effective = attempt.result;
    if (
      attempt.attemptType === "ordinary-repeat" &&
      isLetterGrade(attempt.result)
    ) {
      const capped = capOrdinaryRepeat(attempt.result);
      capApplied ||= capped !== attempt.result;
      effective = capped;
      if (capped !== attempt.result) {
        reason = "Ordinary repeat grade capped at C; better eligible grade retained.";
      }
    }
    retained = betterGrade(retained, effective);
  }

  if (!retained) {
    return {
      retainedResult: directResult,
      gradeUsedInGpa: directResult,
      capApplied,
      reason: "Attempt history contains no final grade yet."
    };
  }

  return {
    retainedResult: retained,
    gradeUsedInGpa: retained,
    capApplied,
    reason
  };
};
