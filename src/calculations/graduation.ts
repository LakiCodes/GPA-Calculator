import type {
  Course,
  CourseRecord,
  CurriculumSelection,
  ExpectedCreditValue,
  Programme,
  RegistrationInfo
} from "../domain/types";

import {
  expectedMatches,
  formatExpected,
  getPrescribedProgrammeCredits,
  getSelectedCourses,
  sumCredits
} from "./curriculum";
import { calculateCourseGpa, isCompletedResult, isFailGrade, isMandatoryRepeat, isPendingResult } from "./gpa";
import { calculateAllYearProgress, type YearProgress } from "./progress";
import { effectiveCourseResult, effectiveResultMap } from "./records";

export interface GraduationCheckItem {
  id: string;
  label: string;
  status: "met" | "not-met" | "provisional" | "unknown";
  detail: string;
}

export interface GraduationEvaluation {
  overallGpa: ReturnType<typeof calculateCourseGpa>;
  yearProgress: YearProgress[];
  completedCredits: number;
  prescribedCredits: number;
  unresolvedCourseIds: string[];
  pendingCourseIds: string[];
  mandatoryRepeatCourseIds: string[];
  failCourseIds: string[];
  sevenYearStatus: "met" | "not-met" | "unknown";
  elapsedAcademicYears: number | null;
  checklist: GraduationCheckItem[];
  canGraduateProvisionally: boolean;
  disclaimer: string;
}

export const parseAcademicYearStart = (value?: string): number | null => {
  if (!value) {
    return null;
  }
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
};

export const elapsedAcademicYears = (
  firstAcademicYear?: string,
  completionAcademicYear?: string
): number | null => {
  const start = parseAcademicYearStart(firstAcademicYear);
  const end = parseAcademicYearStart(completionAcademicYear);
  if (start === null || end === null || end < start) {
    return null;
  }
  return end - start + 1;
};

const expectedCreditTarget = (
  programme: Programme,
  selection?: CurriculumSelection
): ExpectedCreditValue => programme.expectedTotals.programmeCredits ?? getPrescribedProgrammeCredits(programme, selection);

const creditRequirementMet = (
  expected: ExpectedCreditValue,
  actual: number
): boolean => expectedMatches(expected, actual);

export const evaluateGraduation = (
  programme: Programme,
  selection: CurriculumSelection | undefined,
  records: Record<string, CourseRecord>,
  registrationInfo: RegistrationInfo
): GraduationEvaluation => {
  const courses = getSelectedCourses(programme, selection);
  const effectiveResults = effectiveResultMap(courses, records);
  const overallGpa = calculateCourseGpa(courses, effectiveResults);
  const yearProgress = calculateAllYearProgress(courses, Object.fromEntries(
    courses.map((course) => [
      course.id,
      {
        ...(records[course.id] ?? { courseId: course.id, attempts: [] }),
        result: effectiveCourseResult(records[course.id])
      } satisfies CourseRecord
    ])
  ));
  const expectedCredits = expectedCreditTarget(programme, selection);
  const prescribedCredits = getPrescribedProgrammeCredits(programme, selection);

  const pendingCourseIds = courses
    .filter((course) => isPendingResult(effectiveResults[course.id] ?? ""))
    .map((course) => course.id);
  const mandatoryRepeatCourseIds = courses
    .filter((course) => isMandatoryRepeat(effectiveResults[course.id] ?? ""))
    .map((course) => course.id);
  const failCourseIds = courses
    .filter((course) => isFailGrade(effectiveResults[course.id] ?? ""))
    .map((course) => course.id);
  const unresolvedCourseIds = courses
    .filter((course) => !isCompletedResult(effectiveResults[course.id] ?? ""))
    .map((course) => course.id);
  const completedCredits = courses
    .filter((course) => isCompletedResult(effectiveResults[course.id] ?? ""))
    .reduce((sum, course) => sum + course.credits, 0);

  const elapsed = elapsedAcademicYears(
    registrationInfo.firstAcademicYear,
    registrationInfo.currentOrCompletionAcademicYear
  );
  const sevenYearStatus =
    elapsed === null ? "unknown" : elapsed <= 7 ? "met" : "not-met";
  const overallValue = overallGpa.gpa === null ? null : Number(overallGpa.gpa);
  const allYearsPassed = yearProgress.every((year) => year.status === "Passed");
  const creditsMet = creditRequirementMet(expectedCredits, completedCredits);

  const checklist: GraduationCheckItem[] = [
    {
      id: "credits",
      label: "Prescribed credits",
      status: creditsMet ? "met" : "not-met",
      detail: `${completedCredits}/${formatExpected(expectedCredits)} completed credits`
    },
    {
      id: "year-gpa",
      label: "Annual GPA and pass grades",
      status: allYearsPassed ? "met" : yearProgress.some((year) => year.status.includes("Pending")) ? "provisional" : "not-met",
      detail: allYearsPassed
        ? "Each academic year is at GPA 2.00 or above with no D/E/AB."
        : yearProgress.map((year) => `Y${year.year}: ${year.status}`).join("; ")
    },
    {
      id: "overall-gpa",
      label: "Overall GPA",
      status: overallValue === null ? "unknown" : overallValue >= 2 ? "met" : "not-met",
      detail: overallGpa.gpa ? `${overallGpa.gpa} overall GPA` : "No GPA-bearing results yet"
    },
    {
      id: "unresolved",
      label: "Unresolved courses",
      status: unresolvedCourseIds.length === 0 ? "met" : pendingCourseIds.length > 0 ? "provisional" : "not-met",
      detail:
        unresolvedCourseIds.length === 0
          ? "All selected courses have completed results."
          : `${unresolvedCourseIds.length} course(s) still missing, pending, failed, or repeat-required`
    },
    {
      id: "seven-years",
      label: "Seven-year maximum",
      status: sevenYearStatus === "unknown" ? "unknown" : sevenYearStatus === "met" ? "met" : "not-met",
      detail:
        elapsed === null
          ? "Enter first and completion academic years to evaluate."
          : `${elapsed} academic year(s) from first registration to completion`
    },
    {
      id: "last-attempt",
      label: "Last-attempt provision",
      status: registrationInfo.lastAttemptProvision ? "provisional" : "unknown",
      detail: registrationInfo.lastAttemptProvision
        ? "Exception flagged separately; final approval is not inferred."
        : "No last-attempt exception flag set."
    }
  ];

  return {
    overallGpa,
    yearProgress,
    completedCredits,
    prescribedCredits,
    unresolvedCourseIds,
    pendingCourseIds,
    mandatoryRepeatCourseIds,
    failCourseIds,
    sevenYearStatus,
    elapsedAcademicYears: elapsed,
    checklist,
    canGraduateProvisionally:
      creditsMet &&
      allYearsPassed &&
      (overallValue ?? 0) >= 2 &&
      unresolvedCourseIds.length === 0 &&
      sevenYearStatus !== "not-met",
    disclaimer:
      "This is an unofficial planning result; final graduation determination belongs to the University."
  };
};
