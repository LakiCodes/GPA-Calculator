import type { LetterGrade, ResultCode } from "../domain/types";

export const LETTER_GRADES = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "E"
] as const satisfies readonly LetterGrade[];

export const RESULT_CODES = [
  "",
  ...LETTER_GRADES,
  "AB",
  "MC",
  "DFR",
  "INC",
  "P",
  "F"
] as const;

export const GRADE_POINTS_HUNDREDTHS: Record<LetterGrade, number> = {
  "A+": 400,
  A: 400,
  "A-": 370,
  "B+": 330,
  B: 300,
  "B-": 270,
  "C+": 230,
  C: 200,
  "C-": 170,
  "D+": 130,
  D: 100,
  E: 0
};

export const MARK_BANDS: Array<{
  min: number;
  max: number;
  grade: LetterGrade;
}> = [
  { min: 85, max: 100, grade: "A+" },
  { min: 70, max: 84, grade: "A" },
  { min: 65, max: 69, grade: "A-" },
  { min: 60, max: 64, grade: "B+" },
  { min: 55, max: 59, grade: "B" },
  { min: 50, max: 54, grade: "B-" },
  { min: 45, max: 49, grade: "C+" },
  { min: 40, max: 44, grade: "C" },
  { min: 35, max: 39, grade: "C-" },
  { min: 30, max: 34, grade: "D+" },
  { min: 25, max: 29, grade: "D" },
  { min: 0, max: 24, grade: "E" }
];

export const isLetterGrade = (value: string): value is LetterGrade =>
  LETTER_GRADES.includes(value as LetterGrade);

export const isResultCode = (value: string): value is ResultCode =>
  RESULT_CODES.includes(value as (typeof RESULT_CODES)[number]) && value !== "";

export const gradeFromMark = (mark: number): LetterGrade => {
  if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
    throw new RangeError("Marks must be between 0 and 100.");
  }

  const band = MARK_BANDS.find((entry) => mark >= entry.min && mark <= entry.max);
  if (!band) {
    throw new RangeError("Marks must be between 0 and 100.");
  }

  return band.grade;
};

export const formatPoint = (hundredths: number): string =>
  (hundredths / 100).toFixed(2);
