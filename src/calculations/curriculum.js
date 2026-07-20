import { courseKey } from "../data/curriculumFactory";
export const isCourseApplicable = (course, pathwayId) => !course.pathwayIds?.length || Boolean(pathwayId && course.pathwayIds.includes(pathwayId));
export const isGroupApplicable = (group, pathwayId) => !group.applicablePathways?.length ||
    Boolean(pathwayId && group.applicablePathways.includes(pathwayId));
export const getApplicableElectiveGroups = (programme, selection) => programme.electiveGroups.filter((group) => isGroupApplicable(group, selection?.pathwayId));
export const getActiveCoreCourses = (programme, selection) => programme.courses.filter((course) => isCourseApplicable(course, selection?.pathwayId));
export const getSelectedElectiveCourses = (programme, selection) => {
    if (!selection) {
        return [];
    }
    return getApplicableElectiveGroups(programme, selection).flatMap((group) => {
        const selectedIds = new Set(selection.electiveSelections[group.id] ?? []);
        return group.availableCourses.filter((course) => selectedIds.has(course.id) &&
            isCourseApplicable(course, selection.pathwayId));
    });
};
export const getSelectedCourses = (programme, selection) => [
    ...getActiveCoreCourses(programme, selection),
    ...getSelectedElectiveCourses(programme, selection)
];
export const groupRequiredCredits = (group) => {
    if (group.requiredCredits) {
        return group.requiredCredits;
    }
    const firstCreditValue = group.availableCourses[0]?.credits ?? 0;
    return group.requiredSelectionCount * firstCreditValue;
};
export const getPrescribedProgrammeCredits = (programme, selection) => {
    const coreCredits = getActiveCoreCourses(programme, selection).reduce((sum, course) => sum + course.credits, 0);
    const electiveCredits = getApplicableElectiveGroups(programme, selection).reduce((sum, group) => sum + groupRequiredCredits(group), 0);
    return coreCredits + electiveCredits;
};
export const sumCredits = (courses) => courses.reduce((sum, course) => sum + course.credits, 0);
export const getCoursesByYearSemester = (courses, year, semester) => courses.filter((course) => course.year === year && (!semester || course.semester === semester));
export const expectedMatches = (expected, actual) => {
    if (expected === undefined) {
        return false;
    }
    if (typeof expected === "number") {
        return expected === actual;
    }
    return actual >= expected.min && actual <= expected.max;
};
export const formatExpected = (expected) => {
    if (expected === undefined) {
        return "not stated";
    }
    return typeof expected === "number" ? String(expected) : `${expected.min}-${expected.max}`;
};
export const expectedSemesterCredits = (programme, year, semester, pathwayId) => programme.expectedTotals.semesterCredits[courseKey(year, semester, pathwayId)] ??
    programme.expectedTotals.semesterCredits[courseKey(year, semester)];
export const expectedYearCredits = (programme, year, pathwayId) => programme.expectedTotals.yearCredits[courseKey(year, undefined, pathwayId)] ??
    programme.expectedTotals.yearCredits[courseKey(year)];
export const getSelectionIssues = (programme, selection) => {
    const issues = [];
    if (programme.pathways.length > 0 && !selection?.pathwayId) {
        issues.push({
            type: "pathway",
            message: "Select the programme pathway or option before entering results."
        });
    }
    for (const group of getApplicableElectiveGroups(programme, selection)) {
        const selected = selection?.electiveSelections[group.id] ?? [];
        const applicableCourses = group.availableCourses.filter((course) => isCourseApplicable(course, selection?.pathwayId));
        const applicableIds = new Set(applicableCourses.map((course) => course.id));
        const selectedCourses = applicableCourses.filter((course) => selected.includes(course.id));
        const selectedCredits = sumCredits(selectedCourses);
        if (selected.length < group.minimumSelectionCount ||
            selected.length > group.maximumSelectionCount ||
            selected.some((courseId) => !applicableIds.has(courseId)) ||
            selectedCredits !== groupRequiredCredits(group)) {
            issues.push({
                type: "elective",
                groupId: group.id,
                message: `${group.title}: select ${group.minimumSelectionCount === group.maximumSelectionCount ? group.minimumSelectionCount : `${group.minimumSelectionCount}-${group.maximumSelectionCount}`} course(s) worth ${groupRequiredCredits(group)} credit(s).`
            });
        }
    }
    if (programme.programmeId === "management-public-policy" && selection) {
        const practicalGroup = programme.electiveGroups.find((group) => group.id === "pub-y4s1-elective");
        const internshipGroup = programme.electiveGroups.find((group) => group.id === "pub-y4s2-elective");
        const practicalSelected = practicalGroup?.availableCourses.some((course) => course.code === "PUB 4373" &&
            selection.electiveSelections[practicalGroup.id]?.includes(course.id));
        const internshipSelected = internshipGroup?.availableCourses.some((course) => course.code === "PUB 4380" &&
            selection.electiveSelections[internshipGroup.id]?.includes(course.id));
        if (practicalSelected && !internshipSelected) {
            issues.push({
                type: "dependency",
                message: "PUB 4373 Practical Training requires PUB 4380 Internship according to Table 2.12.1 note."
            });
        }
    }
    return issues;
};
