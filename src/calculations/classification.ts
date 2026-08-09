import type {
  ClassName,
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

export interface ClassRuleDefinition {
  className: ClassName;
  gpa: number;
  highGrade: LetterGrade | null;
  highGradeShare: number;
  poorLimit: number;
  allowBelowC: boolean;
}

export const CLASS_RULES: readonly ClassRuleDefinition[] = [
  {
    className: "First Class",
    gpa: 3.7,
    highGrade: "A",
    highGradeShare: 0.5,
    poorLimit: 0,
    allowBelowC: false
  },
  {
    className: "Second Class (Upper Division)",
    gpa: 3.3,
    highGrade: "A-",
    highGradeShare: 0.5,
    poorLimit: 2,
    allowBelowC: true
  },
  {
    className: "Second Class (Lower Division)",
    gpa: 3,
    highGrade: "B+",
    highGradeShare: 0.5,
    poorLimit: 2,
    allowBelowC: true
  },
  {
    className: "Pass",
    gpa: 2,
    highGrade: null,
    highGradeShare: 0,
    poorLimit: Number.POSITIVE_INFINITY,
    allowBelowC: true
  }
] as const;

export const classRuleFor = (className: ClassName): ClassRuleDefinition =>
  CLASS_RULES.find((rule) => rule.className === className)!;

export const requiredHighGradeCreditsFor = (
  evaluatedCredits: number,
  className: ClassName
): number => {
  const rule = classRuleFor(className);
  return rule.highGrade === null
    ? 0
    : Math.ceil(evaluatedCredits * rule.highGradeShare);
};

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

  const resultsByClass = CLASS_RULES.map((rule): ClassRuleResult => {
    const reasons: string[] = [];
    const requiredHighGradeCredits = requiredHighGradeCreditsFor(
      evaluatedCredits,
      rule.className
    );
    const highGradeCredits = rule.highGrade === null
      ? 0
      : courses
          .filter((course): course is Course => {
            const result = results[course.id] ?? "";
            return isLetterGrade(result) && gradeMeets(result, rule.highGrade!);
          })
          .reduce((sum, course) => sum + course.credits, 0);

    if (currentGpaValue === null) {
      reasons.push(
        rule.className === "Pass"
          ? "Enter at least one GPA-bearing result to evaluate current pass standing."
          : "Enter at least one GPA-bearing result to evaluate current standing."
      );
    } else if (currentGpaValue < rule.gpa) {
      reasons.push(`Current GPA must be at least ${rule.gpa.toFixed(2)}.`);
    }

    if (
      rule.highGrade !== null &&
      highGradeCredits < requiredHighGradeCredits
    ) {
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

  const awardedClass =
    resultsByClass.find((result) => result.eligible)?.className ?? "Not yet eligible";

  return {
    awardedClass,
    results: resultsByClass,
    currentGpa: currentGpa.gpa,
    evaluatedCredits: gpaBearingCourses.reduce((sum, course) => sum + course.credits, 0),
    durationYears: duration,
    withinFourYearsOrValidReason,
    lastAttemptProvision: registrationInfo.lastAttemptProvision === true,
    basis: "current"
  };
};
