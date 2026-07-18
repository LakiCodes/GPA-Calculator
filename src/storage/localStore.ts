import { studentDataSchema } from "../domain/schemas";
import type { StudentData } from "../domain/types";
import { defaultScenario } from "../calculations/planner";

export const STORAGE_KEY = "fmsc-gpa-calculator-planner:v1";
export const STORAGE_NOTICE_KEY = "fmsc-gpa-storage-notice:v1";

export const createEmptyStudentData = (): StudentData => ({
  prospectusVersion: "2026",
  schemaVersion: 1,
  courseRecords: {},
  orphanedRecords: {},
  plannerScenarios: [defaultScenario(3.3)],
  registrationInfo: {},
  preferences: {
    theme: "light",
    gradeEntryMode: "grade"
  },
  updatedAt: new Date().toISOString()
});

export const loadStudentData = (): StudentData => {
  if (typeof localStorage === "undefined") {
    return createEmptyStudentData();
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyStudentData();
  }
  try {
    const parsed = JSON.parse(raw);
    const result = studentDataSchema.safeParse(parsed);
    return result.success ? result.data : createEmptyStudentData();
  } catch {
    return createEmptyStudentData();
  }
};

export const saveStudentData = (data: StudentData): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  const stamped = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
};

export const loadStorageNoticeAccepted = (): boolean => {
  if (typeof localStorage === "undefined") {
    return true;
  }
  return localStorage.getItem(STORAGE_NOTICE_KEY) === "accepted";
};

export const saveStorageNoticeAccepted = (): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_NOTICE_KEY, "accepted");
};

export const parseImportedStudentData = (text: string): StudentData => {
  const parsed = JSON.parse(text);
  return studentDataSchema.parse(parsed);
};

export const toExportJson = (data: StudentData): string =>
  JSON.stringify(
    {
      ...data,
      updatedAt: new Date().toISOString()
    },
    null,
    2
  );

export const downloadText = (
  filename: string,
  text: string,
  type = "application/json"
): void => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
