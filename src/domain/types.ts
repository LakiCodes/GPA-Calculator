export type ProspectusVersion = "2026";
export type SchemaVersion = 1;

export type YearLevel = 1 | 2 | 3 | 4;
export type Semester = 1 | 2;
export type CourseStatus = "core" | "elective";
export type DeliveryType = "semester" | "annual";
export type AttemptType =
  | "first"
  | "ordinary-repeat"
  | "medical-privileged"
  | "deferred-privileged";

export type LetterGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "E";

export type SpecialResultCode = "AB" | "MC" | "DFR" | "INC" | "P" | "F";
export type ResultCode = LetterGrade | SpecialResultCode;
export type GradeEntry = ResultCode | "";

export interface SourceRef {
  page: string;
  table: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  notionalHours: number;
  status: CourseStatus;
  year: YearLevel;
  semester: Semester;
  deliveryType: DeliveryType;
  sourcePage: string;
  sourceTable: string;
  pathwayIds?: string[];
  electiveGroupId?: string;
  notes?: string[];
  assessedAnnually?: boolean;
}

export interface ElectiveGroup {
  id: string;
  title: string;
  requiredSelectionCount: number;
  minimumSelectionCount: number;
  maximumSelectionCount: number;
  year: YearLevel;
  semester: Semester;
  applicablePathways?: string[];
  availableCourses: Course[];
  requiredCredits?: number;
  notes?: string[];
}

export interface Pathway {
  id: string;
  title: string;
  shortTitle: string;
  description?: string;
  sourcePage?: string;
}

export interface CreditRange {
  min: number;
  max: number;
}

export type ExpectedCreditValue = number | CreditRange;

export interface ExpectedTotals {
  semesterCredits: Record<string, ExpectedCreditValue>;
  yearCredits: Record<string, ExpectedCreditValue>;
  programmeCredits: ExpectedCreditValue;
  notes?: string[];
}

export interface Programme {
  prospectusVersion: ProspectusVersion;
  programmeId: string;
  programmeName: string;
  shortName: string;
  department: string;
  programmeSourcePages: string[];
  pathways: Pathway[];
  courses: Course[];
  electiveGroups: ElectiveGroup[];
  expectedTotals: ExpectedTotals;
  notes?: string[];
}

export interface CurriculumSelection {
  programmeId: string;
  pathwayId?: string;
  electiveSelections: Record<string, string[]>;
}

export interface AttemptRecord {
  id: string;
  attemptNumber: number;
  result: GradeEntry;
  attemptType: AttemptType;
  academicYear?: string;
  approvedPrivileges: boolean;
  gradeUsedInGpa?: LetterGrade | "AB" | "P" | "F" | "";
  notes?: string;
}

export interface CourseRecord {
  courseId: string;
  result: GradeEntry;
  attempts: AttemptRecord[];
  notes?: string;
}

export interface PlannerScenario {
  id: string;
  name: string;
  targetGpa: number;
  projectedGrades: Record<string, GradeEntry>;
  updatedAt: string;
}

export interface RegistrationInfo {
  firstAcademicYear?: string;
  currentOrCompletionAcademicYear?: string;
  approvedExtensionOrValidReason?: boolean;
  lastAttemptProvision?: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark";
  gradeEntryMode: "grade" | "marks";
}

export interface StudentData {
  prospectusVersion: ProspectusVersion;
  schemaVersion: SchemaVersion;
  activeSelection?: CurriculumSelection;
  courseRecords: Record<string, CourseRecord>;
  orphanedRecords: Record<string, CourseRecord>;
  plannerScenarios: PlannerScenario[];
  registrationInfo: RegistrationInfo;
  preferences: UserPreferences;
  updatedAt: string;
}

export type YearPassStatus =
  | "Passed"
  | "Not yet complete"
  | "GPA below requirement"
  | "Contains mandatory repeat grades"
  | "Pending MC/DFR/INC results";

export interface GpaResult {
  gpa: string | null;
  totalWeightedPointHundredths: number;
  gradedCredits: number;
  message: string;
}
