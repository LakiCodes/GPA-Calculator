import type {
  Course,
  CourseRecord,
  CurriculumSelection,
  LetterGrade,
  Programme,
  RegistrationInfo
} from "../domain/types";

import {
  calculateCourseGpa,
  gradeMeets,
  isMandatoryRepeat,
  resultPointHundredths
} from "./gpa";
import { getSelectedCourses } from "./curriculum";
import { elapsedAcademicYears } from "./graduation";
import { effectiveResultMap } from "./records";
import { isLetterGrade } from "../data/gradeScale";

export type ClassName =
  | "First Class"
  | "Second Class (Upper Division)"
  | "Second Class (Lower Division)"
  | "Pass";

export interface ClassRuleResult {
  className: ClassName;
  eligible: boolean;
  reasons: string[];
  highGradeCredits: number;
  requiredHighGradeCredits: number;
  evaluatedCredits: number;
  poorGradeCredits: number;
  poorGradeCourseCount: number;
}

export interface ClassificationEvaluation {
  awardedClass: ClassName | "Not yet eligible";
  results: ClassRuleResult[];
  currentGpa: string | null;
  evaluatedCredits: number;
  durationYears: number | null;
  withinFourYearsOrValidReason: boolean | null;
  lastAttemptProvision: boolean;
  basis: "current";
}

const classRules: Array<{
  className: Exclude<ClassName, "Pass">;
  gpa: number;
  highGrade: LetterGrade;
  poorLimit: number;
  allowBelowC: boolean;
}> = [
  {
    className: "First Class",
    gpa: 3.7,
    highGrade: "A",
    poorLimit: 0,
    allowBelowC: false
  },
  {
    className: "Second Class (Upper Division)",
    gpa: 3.3,
    highGrade: "A-",
    poorLimit: 2,
    allowBelowC: true
  },
  {
    className: "Second Class (Lower Division)",
    gpa: 3,
    highGrade: "B+",
    poorLimit: 2,
    allowBelowC: true
  }
];

const halfCredits = (credits: number): number => Math.ceil(credits / 2);

export const evaluateClassification = (
  programme: Programme,
  selection: CurriculumSelection | undefined,
  records: Record<string, CourseRecord>,
  registrationInfo: RegistrationInfo
): ClassificationEvaluation => {
  const courses = getSelectedCourses(programme, selection);
  const results = effectiveResultMap(courses, records);
  const currentGpa = calculateCourseGpa(courses, results);
  const currentGpaValue = currentGpa.gpa === null ? null : Number(currentGpa.gpa);
  const evaluatedCredits = currentGpa.gradedCredits;
  const requiredHighGradeCredits = halfCredits(evaluatedCredits);
  const duration = elapsedAcademicYears(
    registrationInfo.firstAcademicYear,
    registrationInfo.currentOrCompletionAcademicYear
  );
  const withinFourYearsOrValidReason =
    duration === null
      ? null
      : duration <= 4 || registrationInfo.approvedExtensionOrValidReason === true;

  const gpaBearingCourses = courses.filter(
    (course) => resultPointHundredths(results[course.id] ?? "") !== null
  );
  const belowCCourses = courses.filter((course) => {
    const result = results[course.id] ?? "";
    return result === "AB" || (isLetterGrade(result) && !gradeMeets(result, "C"));
  });
  const poorCourses = courses.filter((course) => {
    const result = results[course.id] ?? "";
    return result === "C-" || result === "D+";
  });
  const mandatoryRepeatCourses = courses.filter((course) =>
    isMandatoryRepeat(results[course.id] ?? "")
  );
  const poorGradeCredits = poorCourses.reduce((sum, course) => sum + course.credits, 0);

  const resultsByClass = classRules.map((rule): ClassRuleResult => {
    const reasons: string[] = [];
    const highGradeCredits = courses
      .filter((course): course is Course => {
        const result = results[course.id] ?? "";
        return isLetterGrade(result) && gradeMeets(result, rule.highGrade);
      })
      .reduce((sum, course) => sum + course.credits, 0);

    if (currentGpaValue === null) {
      reasons.push("Enter at least one GPA-bearing result to evaluate current standing.");
    } else if (currentGpaValue < rule.gpa) {
      reasons.push(`Current GPA must be at least ${rule.gpa.toFixed(2)}.`);
    }
    if (highGradeCredits < requiredHighGradeCredits) {
      reasons.push(
        `${requiredHighGradeCredits} of the currently graded credits must be ${rule.highGrade} or better; current count is ${highGradeCredits}.`
      );
    }
    if (!rule.allowBelowC && belowCCourses.length > 0) {
      reasons.push("First Class current standing requires no entered grade below C.");
    }
    if (rule.allowBelowC && poorCourses.length > rule.poorLimit) {
      reasons.push(`No more than ${rule.poorLimit} entered C-/D+ grades are allowed.`);
    }
    if (mandatoryRepeatCourses.length > 0) {
      reasons.push("Current results include D/E/AB mandatory repeat grades.");
    }

    return {
      className: rule.className,
      eligible: reasons.length === 0,
      reasons,
      highGradeCredits,
      requiredHighGradeCredits,
      evaluatedCredits,
      poorGradeCredits,
      poorGradeCourseCount: poorCourses.length
    };
  });

  const passReasons: string[] = [];
  if (currentGpaValue === null) {
    passReasons.push("Enter at least one GPA-bearing result to evaluate current pass standing.");
  } else if (currentGpaValue < 2) {
    passReasons.push("Current GPA must be at least 2.00.");
  }
  if (mandatoryRepeatCourses.length > 0) {
    passReasons.push("Current results include D/E/AB mandatory repeat grades.");
  }

  const awardedClass = resultsByClass.find((result) => result.eligible)?.className ??
    (passReasons.length === 0 ? "Pass" : "Not yet eligible");

  return {
    awardedClass,
    results: [
      ...resultsByClass,
      {
        className: "Pass",
        eligible: passReasons.length === 0,
        reasons: passReasons,
        highGradeCredits: 0,
        requiredHighGradeCredits,
        evaluatedCredits,
        poorGradeCredits,
        poorGradeCourseCount: poorCourses.length
      }
    ],
    currentGpa: currentGpa.gpa,
    evaluatedCredits: gpaBearingCourses.reduce((sum, course) => sum + course.credits, 0),
    durationYears: duration,
    withinFourYearsOrValidReason,
    lastAttemptProvision: registrationInfo.lastAttemptProvision === true,
    basis: "current"
  };
};
