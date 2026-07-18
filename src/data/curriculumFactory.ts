import type {
  Course,
  CourseStatus,
  DeliveryType,
  ElectiveGroup,
  ExpectedTotals,
  Programme,
  Semester,
  YearLevel
} from "../domain/types";

interface CourseSeed {
  code: string;
  title: string;
  credits: number;
  notionalHours: number;
  year: YearLevel;
  semester: Semester;
  sourcePage: string;
  sourceTable: string;
  status?: CourseStatus;
  deliveryType?: DeliveryType;
  pathwayIds?: string[];
  electiveGroupId?: string;
  notes?: string[];
  assessedAnnually?: boolean;
}

interface ProgrammeSeed {
  programmeId: string;
  programmeName: string;
  shortName: string;
  department: string;
  programmeSourcePages: string[];
  pathways?: Programme["pathways"];
  courses: Course[];
  electiveGroups?: ElectiveGroup[];
  expectedTotals: ExpectedTotals;
  notes?: string[];
}

export const normalizeId = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const courseKey = (
  year: YearLevel,
  semester?: Semester,
  pathwayId?: string
): string => {
  const base = semester ? `Y${year}S${semester}` : `Y${year}`;
  return pathwayId ? `${base}:${pathwayId}` : base;
};

export const makeCourse = (programmeId: string, seed: CourseSeed): Course => {
  const discriminator = [
    programmeId,
    seed.year,
    seed.semester,
    seed.electiveGroupId ?? "core",
    seed.pathwayIds?.join("-") ?? "all",
    seed.code,
    seed.title
  ].join("-");

  return {
    id: normalizeId(discriminator),
    code: seed.code,
    title: seed.title,
    credits: seed.credits,
    notionalHours: seed.notionalHours,
    status: seed.status ?? "core",
    year: seed.year,
    semester: seed.semester,
    deliveryType: seed.deliveryType ?? "semester",
    sourcePage: seed.sourcePage,
    sourceTable: seed.sourceTable,
    ...(seed.pathwayIds ? { pathwayIds: seed.pathwayIds } : {}),
    ...(seed.electiveGroupId ? { electiveGroupId: seed.electiveGroupId } : {}),
    ...(seed.notes ? { notes: seed.notes } : {}),
    ...(seed.assessedAnnually ? { assessedAnnually: true } : {})
  };
};

export const makeElectiveGroup = (
  programmeId: string,
  seed: Omit<ElectiveGroup, "availableCourses"> & {
    courses: Array<Omit<CourseSeed, "status" | "electiveGroupId" | "year" | "semester">>;
  }
): ElectiveGroup => {
  const availableCourses = seed.courses.map((course) =>
    makeCourse(programmeId, {
      ...course,
      year: seed.year,
      semester: seed.semester,
      status: "elective",
      electiveGroupId: seed.id,
      pathwayIds: course.pathwayIds ?? seed.applicablePathways
    })
  );

  return {
    id: seed.id,
    title: seed.title,
    requiredSelectionCount: seed.requiredSelectionCount,
    minimumSelectionCount: seed.minimumSelectionCount,
    maximumSelectionCount: seed.maximumSelectionCount,
    year: seed.year,
    semester: seed.semester,
    ...(seed.applicablePathways ? { applicablePathways: seed.applicablePathways } : {}),
    availableCourses,
    ...(seed.requiredCredits ? { requiredCredits: seed.requiredCredits } : {}),
    ...(seed.notes ? { notes: seed.notes } : {})
  };
};

const common = (
  programmeId: string,
  variant: "standard" | "bcom" | "emv" | "bis" | "mpp" = "standard"
): Course[] => {
  const sourceTable = variant === "standard" ? "Table 1.2" : "Table 1.2 / programme table";
  const sourcePage = variant === "mpp" ? "205" : variant === "bis" ? "167" : "08";
  const sem1 =
    variant === "mpp"
      ? [
          ["BUS 1370", "Principles of Management", 3, 150],
          ["DSC 1370", "Business Mathematics", 3, 150],
          ["ITC 1370", "Information Technology for Business", 3, 150],
          ["PUB 1370", "Political Science", 3, 150],
          ["BCC 1370", "Business Communication I", 3, 150]
        ]
      : [
          ["BUS 1370", "Principles of Management", 3, 150],
          ["DSC 1370", "Business Mathematics", 3, 150],
          ["ITC 1370", "Information Technology for Business", 3, 150],
          ["PUB 1270", "Socio-Political Environment", 2, 100],
          ["LAW 1270", "Legal Environment", 2, 100],
          ["BCC 1370", "Business Communication I", 3, 150],
          ...(variant === "bcom"
            ? [["COM 1170", "Managerial Skills Development I", 1, 50]]
            : [])
        ];

  const sem2 =
    variant === "bcom"
      ? [
          ["HRM 1370", "Human Resource Management", 3, 150],
          ["DSC 1371", "Business Statistics", 3, 150],
          ["COM 1371", "Microeconomics", 3, 150],
          ["COM 1372", "Financial Accounting", 3, 150],
          ["BCC 1371", "Business Communication II", 3, 150]
        ]
      : [
          ["HRM 1370", "Human Resource Management", 3, 150],
          ["DSC 1371", "Business Statistics", 3, 150],
          ["BEC 1370", "Microeconomics", 3, 150],
          ["ACC 1370", "Financial Accounting and Reporting", 3, 150],
          ["BCC 1371", "Business Communication II", 3, 150],
          ...(variant === "emv"
            ? [["EMV 1170", "Introduction to Real Estate", 1, 50]]
            : []),
          ...(variant === "bis"
            ? [["ITC 1171", "Computational Thinking for Problem Solving", 1, 50]]
            : [])
        ];

  return [...sem1, ...sem2].map(([code, title, credits, notionalHours]) =>
    makeCourse(programmeId, {
      code: String(code),
      title: String(title),
      credits: Number(credits),
      notionalHours: Number(notionalHours),
      year: 1,
      semester: sem1.some((row) => row[0] === code) ? 1 : 2,
      sourcePage,
      sourceTable,
      notes:
        variant === "mpp" && code === "PUB 1370"
          ? ["Offered instead of PUB 1270 and LAW 1270."]
          : undefined
    })
  );
};

export const commonFirstYear = common;

export const makeProgramme = (seed: ProgrammeSeed): Programme => ({
  prospectusVersion: "2026",
  programmeId: seed.programmeId,
  programmeName: seed.programmeName,
  shortName: seed.shortName,
  department: seed.department,
  programmeSourcePages: seed.programmeSourcePages,
  pathways: seed.pathways ?? [],
  courses: seed.courses,
  electiveGroups: seed.electiveGroups ?? [],
  expectedTotals: seed.expectedTotals,
  ...(seed.notes ? { notes: seed.notes } : {})
});
