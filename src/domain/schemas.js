import { z } from "zod";
export const prospectusVersionSchema = z.literal("2026");
export const schemaVersionSchema = z.literal(1);
export const letterGradeSchema = z.enum([
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
]);
export const specialResultCodeSchema = z.enum([
    "AB",
    "MC",
    "DFR",
    "INC",
    "P",
    "F"
]);
export const gradeEntrySchema = z.union([
    letterGradeSchema,
    specialResultCodeSchema,
    z.literal("")
]);
export const courseSchema = z.object({
    id: z.string().min(1),
    code: z.string().min(2),
    title: z.string().min(1),
    credits: z.number().int().positive(),
    notionalHours: z.number().int().nonnegative(),
    status: z.enum(["core", "elective"]),
    year: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    semester: z.union([z.literal(1), z.literal(2)]),
    deliveryType: z.enum(["semester", "annual"]),
    sourcePage: z.string().min(1),
    sourceTable: z.string().min(1),
    pathwayIds: z.array(z.string()).optional(),
    electiveGroupId: z.string().optional(),
    notes: z.array(z.string()).optional(),
    assessedAnnually: z.boolean().optional()
});
export const electiveGroupSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    requiredSelectionCount: z.number().int().nonnegative(),
    minimumSelectionCount: z.number().int().nonnegative(),
    maximumSelectionCount: z.number().int().nonnegative(),
    year: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    semester: z.union([z.literal(1), z.literal(2)]),
    applicablePathways: z.array(z.string()).optional(),
    availableCourses: z.array(courseSchema),
    requiredCredits: z.number().int().positive().optional(),
    notes: z.array(z.string()).optional()
});
const expectedValueSchema = z.union([
    z.number().int().nonnegative(),
    z.object({
        min: z.number().int().nonnegative(),
        max: z.number().int().nonnegative()
    })
]);
export const programmeSchema = z.object({
    prospectusVersion: prospectusVersionSchema,
    programmeId: z.string().min(1),
    programmeName: z.string().min(1),
    shortName: z.string().min(1),
    department: z.string().min(1),
    programmeSourcePages: z.array(z.string().min(1)),
    pathways: z.array(z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        shortTitle: z.string().min(1),
        description: z.string().optional(),
        sourcePage: z.string().optional()
    })),
    courses: z.array(courseSchema),
    electiveGroups: z.array(electiveGroupSchema),
    expectedTotals: z.object({
        semesterCredits: z.record(z.string(), expectedValueSchema),
        yearCredits: z.record(z.string(), expectedValueSchema),
        programmeCredits: expectedValueSchema,
        notes: z.array(z.string()).optional()
    }),
    notes: z.array(z.string()).optional()
});
export const curriculumSelectionSchema = z.object({
    programmeId: z.string().min(1),
    pathwayId: z.string().optional(),
    electiveSelections: z.record(z.string(), z.array(z.string()))
});
export const attemptRecordSchema = z.object({
    id: z.string().min(1),
    attemptNumber: z.number().int().positive(),
    result: gradeEntrySchema,
    attemptType: z.enum([
        "first",
        "ordinary-repeat",
        "medical-privileged",
        "deferred-privileged"
    ]),
    academicYear: z.string().optional(),
    approvedPrivileges: z.boolean(),
    gradeUsedInGpa: z
        .union([letterGradeSchema, z.enum(["AB", "P", "F"]), z.literal("")])
        .optional(),
    notes: z.string().optional()
});
export const courseRecordSchema = z.object({
    courseId: z.string().min(1),
    result: gradeEntrySchema,
    attempts: z.array(attemptRecordSchema),
    notes: z.string().optional()
});
export const plannerScenarioSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    targetGpa: z.number().min(0).max(4),
    projectedGrades: z.record(z.string(), gradeEntrySchema),
    updatedAt: z.string().min(1)
});
export const studentDataSchema = z.object({
    prospectusVersion: prospectusVersionSchema,
    schemaVersion: schemaVersionSchema,
    activeSelection: curriculumSelectionSchema.optional(),
    courseRecords: z.record(z.string(), courseRecordSchema),
    orphanedRecords: z.record(z.string(), courseRecordSchema),
    plannerScenarios: z.array(plannerScenarioSchema),
    registrationInfo: z.object({
        firstAcademicYear: z.string().optional(),
        currentOrCompletionAcademicYear: z.string().optional(),
        approvedExtensionOrValidReason: z.boolean().optional(),
        lastAttemptProvision: z.boolean().optional()
    }),
    preferences: z.object({
        theme: z.enum(["light", "dark"]),
        gradeEntryMode: z.enum(["grade", "marks"])
    }),
    updatedAt: z.string().min(1)
});
