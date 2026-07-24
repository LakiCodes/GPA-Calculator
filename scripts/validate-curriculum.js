import { programmeSchema } from "../src/domain/schemas";
import { programmes } from "../src/data/programmes";
import { expectedMatches, expectedSemesterCredits, expectedYearCredits, getApplicableElectiveGroups, getPrescribedProgrammeCredits, getSelectedCourses, getSelectionIssues, sumCredits } from "../src/calculations/curriculum";
const expectedProgrammeNames = [
    "BSc Honours in Accounting",
    "BSc Honours in Business Administration",
    "BSc Honours in Business Economics",
    "BCom Honours",
    "BSc Honours in Operations and Technology Management",
    "BSc Honours in Entrepreneurship",
    "BSc Honours in Real Estate Management and Valuation",
    "BSc Honours in Finance",
    "BSc Honours in Human Resource Management",
    "BSc Honours in Business Information Systems",
    "BSc Honours in Marketing Management",
    "BSc Honours in Management and Public Policy"
];
const errors = [];
const warnings = [];
const assert = (condition, message) => {
    if (!condition) {
        errors.push(message);
    }
};
const parseKey = (key) => {
    const [period, pathwayId] = key.split(":");
    const match = period.match(/^Y([1-4])(?:S([12]))?$/);
    if (!match) {
        throw new Error(`Invalid expected-total key ${key}`);
    }
    return {
        year: Number(match[1]),
        ...(match[2] ? { semester: Number(match[2]) } : {}),
        ...(pathwayId ? { pathwayId } : {})
    };
};
const selectCoursesForGroup = (group, pathwayId) => {
    const available = group.availableCourses.filter((course) => !course.pathwayIds?.length || Boolean(pathwayId && course.pathwayIds.includes(pathwayId)));
    const selected = [];
    let credits = 0;
    for (const course of available) {
        if (selected.length >= group.maximumSelectionCount) {
            break;
        }
        selected.push(course.id);
        credits += course.credits;
        if (selected.length >= group.minimumSelectionCount &&
            credits === (group.requiredCredits ?? group.requiredSelectionCount * course.credits)) {
            break;
        }
    }
    return selected;
};
const defaultSelection = (programme, pathwayId) => ({
    programmeId: programme.programmeId,
    ...(pathwayId ? { pathwayId } : {}),
    electiveSelections: Object.fromEntries(getApplicableElectiveGroups(programme, {
        programmeId: programme.programmeId,
        ...(pathwayId ? { pathwayId } : {}),
        electiveSelections: {}
    }).map((group) => [group.id, selectCoursesForGroup(group, pathwayId)]))
});
assert(programmes.length === expectedProgrammeNames.length, `Expected ${expectedProgrammeNames.length} programmes; found ${programmes.length}.`);
expectedProgrammeNames.forEach((name, index) => {
    assert(programmes[index]?.programmeName === name, `Programme ${index + 1} must be "${name}"; found "${programmes[index]?.programmeName ?? "missing"}".`);
});
for (const programme of programmes) {
    const parsed = programmeSchema.safeParse(programme);
    assert(parsed.success, `${programme.programmeName}: schema validation failed.`);
    const courseIds = [
        ...programme.courses.map((course) => course.id),
        ...programme.electiveGroups.flatMap((group) => group.availableCourses.map((course) => course.id))
    ];
    assert(new Set(courseIds).size === courseIds.length, `${programme.programmeName}: duplicate course IDs detected.`);
    for (const group of programme.electiveGroups) {
        const credits = group.availableCourses.map((course) => course.credits);
        assert(credits.every((credit) => credit > 0), `${programme.programmeName}: ${group.title} has non-positive elective credits.`);
        assert(group.minimumSelectionCount <= group.maximumSelectionCount, `${programme.programmeName}: ${group.title} has invalid elective min/max counts.`);
        assert(group.requiredSelectionCount >= group.minimumSelectionCount &&
            group.requiredSelectionCount <= group.maximumSelectionCount, `${programme.programmeName}: ${group.title} required count is outside allowed min/max.`);
    }
    const selections = programme.pathways.length
        ? programme.pathways.map((pathway) => defaultSelection(programme, pathway.id))
        : [defaultSelection(programme)];
    for (const selection of selections) {
        const label = selection.pathwayId ? `${programme.programmeName} (${selection.pathwayId})` : programme.programmeName;
        const issues = getSelectionIssues(programme, selection);
        assert(issues.length === 0, `${label}: default elective/pathway selection has issues: ${issues.map((issue) => issue.message).join(" | ")}`);
        const selectedCourses = getSelectedCourses(programme, selection);
        assert(selectedCourses.length > 0, `${label}: no courses selected.`);
        assert(selectedCourses.every((course) => course.credits > 0 && course.notionalHours >= 0), `${label}: invalid course credit or notional-hour value.`);
        for (const key of Object.keys(programme.expectedTotals.semesterCredits)) {
            const expected = programme.expectedTotals.semesterCredits[key];
            const parsedKey = parseKey(key);
            if (parsedKey.pathwayId && parsedKey.pathwayId !== selection.pathwayId) {
                continue;
            }
            const actual = sumCredits(selectedCourses.filter((course) => course.year === parsedKey.year && course.semester === parsedKey.semester));
            assert(expectedMatches(expected, actual), `${label}: ${key} expected ${JSON.stringify(expected)} credits, calculated ${actual}.`);
        }
        for (const key of Object.keys(programme.expectedTotals.yearCredits)) {
            const expected = programme.expectedTotals.yearCredits[key];
            const parsedKey = parseKey(key);
            if (parsedKey.pathwayId && parsedKey.pathwayId !== selection.pathwayId) {
                continue;
            }
            const actual = sumCredits(selectedCourses.filter((course) => course.year === parsedKey.year));
            assert(expectedMatches(expected, actual), `${label}: ${key} expected ${JSON.stringify(expected)} credits, calculated ${actual}.`);
        }
        const programmeCredits = getPrescribedProgrammeCredits(programme, selection);
        assert(expectedMatches(programme.expectedTotals.programmeCredits, programmeCredits), `${label}: programme total expected ${JSON.stringify(programme.expectedTotals.programmeCredits)}, calculated ${programmeCredits}.`);
        for (const year of [1, 2, 3, 4]) {
            for (const semester of [1, 2]) {
                const expected = expectedSemesterCredits(programme, year, semester, selection.pathwayId);
                const actual = sumCredits(selectedCourses.filter((course) => course.year === year && course.semester === semester));
                if (expected === undefined) {
                    warnings.push(`${label}: Y${year}S${semester} has no stated expected total; calculated ${actual}.`);
                }
                else {
                    assert(expectedMatches(expected, actual), `${label}: Y${year}S${semester} expected ${JSON.stringify(expected)}, calculated ${actual}.`);
                }
            }
            const expected = expectedYearCredits(programme, year, selection.pathwayId);
            const actual = sumCredits(selectedCourses.filter((course) => course.year === year));
            if (expected !== undefined) {
                assert(expectedMatches(expected, actual), `${label}: Y${year} expected ${JSON.stringify(expected)}, calculated ${actual}.`);
            }
        }
    }
}
if (warnings.length > 0) {
    console.warn(warnings.map((warning) => `WARN ${warning}`).join("\n"));
}
if (errors.length > 0) {
    console.error(errors.map((error) => `ERROR ${error}`).join("\n"));
    process.exit(1);
}
console.log(`Validated ${programmes.length} Prospectus 2026 programmes and default elective selections.`);
