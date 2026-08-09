import type {
  ClassName,
  Course,
  CourseRecord,
  CurriculumSelection,
  LetterGrade,
  Programme,
  RegistrationInfo
} from "../domain/types";

import { isLetterGrade } from "../data/gradeScale";
import { getPrescribedProgrammeCredits, getSelectedCourses } from "./curriculum";
import { elapsedAcademicYears } from "./graduation";
import {
  calculateCourseGpa,
  gradeMeets,
  isCompletedResult,
  isMandatoryRepeat
} from "./gpa";
import { effectiveResultMap } from "./records";

export type RequirementStatus = "met" | "not-met" | "unknown";

export interface DegreeClassRule {
  className: ClassName;
  shortLabel: string;
  minGpa: number;
  highGrade: LetterGrade | null;
  highGradeLabel: string | null;
  poorGradeLimit: number | null;
  requiresNoGradeBelowC: boolean;
  requiresFourYearCompletion: boolean;
}

export const DEGREE_CLASS_RULES: Record<ClassName, DegreeClassRule> = {
  "First Class": {
    className: "First Class",
    shortLabel: "First Class",
    minGpa: 3.7,
    highGrade: "A",
    highGradeLabel: "A / A+",
    poorGradeLimit: 0,
    requiresNoGradeBelowC: true,
    requiresFourYearCompletion: true
  },
  "Second Class (Upper Division)": {
    className: "Second Class (Upper Division)",
    shortLabel: "Second Upper",
    minGpa: 3.3,
    highGrade: "A-",
    highGradeLabel: "A- or better",
    poorGradeLimit: 2,
    requiresNoGradeBelowC: false,
    requiresFourYearCompletion: true
  },
  "Second Class (Lower Division)": {
    className: "Second Class (Lower Division)",
    shortLabel: "Second Lower",
    minGpa: 3,
    highGrade: "B+",
    highGradeLabel: "B+ or better",
    poorGradeLimit: 2,
    requiresNoGradeBelowC: false,
    requiresFourYearCompletion: true
  },
  Pass: {
    className: "Pass",
    shortLabel: "Pass",
    minGpa: 2,
    highGrade: null,
    highGradeLabel: null,
    poorGradeLimit: null,
    requiresNoGradeBelowC: false,
    requiresFourYearCompletion: false
  }
};

export const DEGREE_CLASS_ORDER: ClassName[] = [
  "First Class",
  "Second Class (Upper Division)",
  "Second Class (Lower Division)",
  "Pass"
];

export interface ClassRequirementResult {
  id: "gpa" | "high-grade" | "grade-floor" | "poor-grades" | "completion" | "duration";
  label: string;
  status: RequirementStatus;
  detail: string;
}

export interface ClassTargetEvaluation {
  className: ClassName;
  rule: DegreeClassRule;
  requirements: ClassRequirementResult[];
  eligible: boolean;
  onTrack: boolean;
  academicallyEligible: boolean;
  currentGpa: string | null;
  totalProgrammeCredits: number;
  completedCredits: number;
  highGradeCredits: number;
  requiredHighGradeCredits: number;
  poorGradeCourseCount: number;
  belowCCount: number;
  mandatoryRepeatCount: number;
  unresolvedCourseIds: string[];
  durationYears: number | null;
  withinFourYearsOrValidReason: boolean | null;
  blockers: string[];
  unknowns: string[];
}

export interface BestClassEvaluation {
  className: ClassName | "Not yet eligible";
  evaluation: ClassTargetEvaluation | null;
  basis: "eligible" | "on-track" | "none";
}

const halfCredits = (credits: number): number => Math.ceil(credits / 2);

const requirement = (
  id: ClassRequirementResult["id"],
  label: string,
  status: RequirementStatus,
  detail: string
): ClassRequirementResult => ({ id, label, status, detail });

const sumCredits = (courses: Course[]): number =>
  courses.reduce((sum, course) => sum + course.credits, 0);

export const targetGpaForClass = (className: ClassName): number =>
  DEGREE_CLASS_RULES[className].minGpa;

export const evaluateClassTarget = (
  programme: Programme,
  selection: CurriculumSelection | undefined,
  records: Record<string, CourseRecord>,
  registrationInfo: RegistrationInfo,
  className: ClassName
): ClassTargetEvaluation => {
  const rule = DEGREE_CLASS_RULES[className];
  const courses = getSelectedCourses(programme, selection);
  const results = effectiveResultMap(courses, records);
  const gpa = calculateCourseGpa(courses, results);
  const gpaValue = gpa.gpa === null ? null : Number(gpa.gpa);
  const totalProgrammeCredits = getPrescribedProgrammeCredits(programme, selection);
  const requiredHighGradeCredits = rule.highGrade ? halfCredits(totalProgrammeCredits) : 0;

  const completedCourses = courses.filter((course) =>
    isCompletedResult(results[course.id] ?? "")
  );
  const completedCredits = sumCredits(completedCourses);
  const unresolvedCourseIds = courses
    .filter((course) => !isCompletedResult(results[course.id] ?? ""))
    .map((course) => course.id);
  const mandatoryRepeatCourses = courses.filter((course) =>
    isMandatoryRepeat(results[course.id] ?? "")
  );
  const poorCourses = courses.filter((course) => {
    const result = results[course.id] ?? "";
    return result === "C-" || result === "D+";
  });
  const belowCCourses = courses.filter((course) => {
    const result = results[course.id] ?? "";
    return result === "AB" || (isLetterGrade(result) && !gradeMeets(result, "C"));
  });
  const highGradeCredits = rule.highGrade
    ? courses
        .filter((course) => {
          const result = results[course.id] ?? "";
          return isLetterGrade(result) && gradeMeets(result, rule.highGrade!);
        })
        .reduce((sum, course) => sum + course.credits, 0)
    : 0;

  const durationYears = elapsedAcademicYears(
    registrationInfo.firstAcademicYear,
    registrationInfo.currentOrCompletionAcademicYear
  );
  const withinFourYearsOrValidReason = !rule.requiresFourYearCompletion
    ? true
    : durationYears === null
      ? null
      : durationYears <= 4 || registrationInfo.approvedExtensionOrValidReason === true;

  const requirements: ClassRequirementResult[] = [];

  requirements.push(
    requirement(
      "gpa",
      "Overall GPA",
      gpaValue === null ? "unknown" : gpaValue >= rule.minGpa ? "met" : "not-met",
      gpaValue === null
        ? `A final GPA of at least ${rule.minGpa.toFixed(2)} is required.`
        : `${gpa.gpa} projected GPA; ${rule.minGpa.toFixed(2)} or above is required.`
    )
  );

  if (rule.highGrade && rule.highGradeLabel) {
    requirements.push(
      requirement(
        "high-grade",
        `${rule.highGradeLabel} credits`,
        highGradeCredits >= requiredHighGradeCredits ? "met" : "not-met",
        `${highGradeCredits} of ${requiredHighGradeCredits} required credits currently qualify (${totalProgrammeCredits} total programme credits).`
      )
    );
  }

  if (rule.requiresNoGradeBelowC) {
    requirements.push(
      requirement(
        "grade-floor",
        "No grade below C",
        belowCCourses.length === 0 ? "met" : "not-met",
        belowCCourses.length === 0
          ? "No projected or retained grade is below C."
          : `${belowCCourses.length} course${belowCCourses.length === 1 ? " has" : "s have"} a retained grade below C.`
      )
    );
  }

  if (rule.poorGradeLimit !== null && className !== "First Class") {
    requirements.push(
      requirement(
        "poor-grades",
        "Poor-grade limit",
        poorCourses.length <= rule.poorGradeLimit ? "met" : "not-met",
        `${poorCourses.length} C-/D+ course${poorCourses.length === 1 ? "" : "s"}; maximum allowed is ${rule.poorGradeLimit}.`
      )
    );
  }

  const completionMet =
    unresolvedCourseIds.length === 0 &&
    mandatoryRepeatCourses.length === 0 &&
    completedCredits >= totalProgrammeCredits;
  requirements.push(
    requirement(
      "completion",
      "Programme completion",
      completionMet ? "met" : "not-met",
      completionMet
        ? `${completedCredits}/${totalProgrammeCredits} prescribed credits are completed with no unresolved mandatory repeats.`
        : `${completedCredits}/${totalProgrammeCredits} prescribed credits completed; ${unresolvedCourseIds.length} course${unresolvedCourseIds.length === 1 ? " remains" : "s remain"} unresolved and ${mandatoryRepeatCourses.length} mandatory repeat${mandatoryRepeatCourses.length === 1 ? " remains" : "s remain"}.`
    )
  );

  if (rule.requiresFourYearCompletion) {
    requirements.push(
      requirement(
        "duration",
        "Four-year completion rule",
        withinFourYearsOrValidReason === null
          ? "unknown"
          : withinFourYearsOrValidReason
            ? "met"
            : "not-met",
        withinFourYearsOrValidReason === null
          ? "Enter the first and current/completion academic years to verify the four-year class rule."
          : withinFourYearsOrValidReason
            ? durationYears !== null && durationYears <= 4
              ? `Completion is within ${durationYears} academic year${durationYears === 1 ? "" : "s"}.`
              : "An approved extension or valid reason is recorded for the completion period."
            : `The entered completion period is ${durationYears} academic years with no approved valid reason recorded.`
      )
    );
  }

  const nonDurationRequirements = requirements.filter((item) => item.id !== "duration");
  const academicallyEligible = nonDurationRequirements.every((item) => item.status === "met");
  const onTrack = requirements.every((item) => item.status !== "not-met");
  const eligible = requirements.every((item) => item.status === "met");
  const blockers = requirements
    .filter((item) => item.status === "not-met")
    .map((item) => item.detail);
  const unknowns = requirements
    .filter((item) => item.status === "unknown")
    .map((item) => item.detail);

  return {
    className,
    rule,
    requirements,
    eligible,
    onTrack,
    academicallyEligible,
    currentGpa: gpa.gpa,
    totalProgrammeCredits,
    completedCredits,
    highGradeCredits,
    requiredHighGradeCredits,
    poorGradeCourseCount: poorCourses.length,
    belowCCount: belowCCourses.length,
    mandatoryRepeatCount: mandatoryRepeatCourses.length,
    unresolvedCourseIds,
    durationYears,
    withinFourYearsOrValidReason,
    blockers,
    unknowns
  };
};

export const evaluateBestClass = (
  programme: Programme,
  selection: CurriculumSelection | undefined,
  records: Record<string, CourseRecord>,
  registrationInfo: RegistrationInfo
): BestClassEvaluation => {
  const evaluations = DEGREE_CLASS_ORDER.map((className) =>
    evaluateClassTarget(programme, selection, records, registrationInfo, className)
  );
  const eligible = evaluations.find((item) => item.eligible);
  if (eligible) {
    return { className: eligible.className, evaluation: eligible, basis: "eligible" };
  }
  const onTrack = evaluations.find((item) => item.onTrack);
  if (onTrack) {
    return { className: onTrack.className, evaluation: onTrack, basis: "on-track" };
  }
  return { className: "Not yet eligible", evaluation: null, basis: "none" };
};
