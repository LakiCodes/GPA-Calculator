import { describe, expect, it } from "vitest";

import {
  expectedMatches,
  getApplicableElectiveGroups,
  getPrescribedProgrammeCredits,
  getSelectedCourses,
  getSelectionIssues,
  isCourseApplicable,
  sumCredits
} from "../calculations/curriculum";
import { programmes, programmeById } from "../data/programmes";
import type { CurriculumSelection, ElectiveGroup, Programme } from "../domain/types";

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
] as const;

const selectGroup = (group: ElectiveGroup, pathwayId?: string): string[] => {
  const available = group.availableCourses.filter((course) =>
    isCourseApplicable(course, pathwayId)
  );
  const requiredCredits =
    group.requiredCredits ?? group.requiredSelectionCount * (available[0]?.credits ?? 0);
  const selected: string[] = [];
  let credits = 0;
  for (const course of available) {
    if (selected.length >= group.maximumSelectionCount) {
      break;
    }
    selected.push(course.id);
    credits += course.credits;
    if (selected.length >= group.minimumSelectionCount && credits === requiredCredits) {
      break;
    }
  }
  return selected;
};

const selectionFor = (programme: Programme, pathwayId?: string): CurriculumSelection => {
  const selectedPathway = pathwayId ?? programme.pathways[0]?.id;
  const base = {
    programmeId: programme.programmeId,
    ...(selectedPathway ? { pathwayId: selectedPathway } : {}),
    electiveSelections: {}
  };
  return {
    ...base,
    electiveSelections: Object.fromEntries(
      getApplicableElectiveGroups(programme, base).map((group) => [
        group.id,
        selectGroup(group, selectedPathway)
      ])
    )
  };
};

describe("Prospectus curriculum data", () => {
  it("contains the 12 degree programmes in the exact required order", () => {
    expect(programmes.map((programme) => programme.programmeName)).toEqual(
      expectedProgrammeNames
    );
  });

  it("matches stated programme credit totals for every default pathway selection", () => {
    for (const programme of programmes) {
      const selections = programme.pathways.length
        ? programme.pathways.map((pathway) => selectionFor(programme, pathway.id))
        : [selectionFor(programme)];

      for (const selection of selections) {
        expect(getSelectionIssues(programme, selection), programme.programmeName).toEqual([]);
        expect(
          expectedMatches(
            programme.expectedTotals.programmeCredits,
            getPrescribedProgrammeCredits(programme, selection)
          ),
          `${programme.programmeName} total`
        ).toBe(true);
      }
    }
  });

  it("matches stated semester and year totals for all encoded expected keys", () => {
    for (const programme of programmes) {
      const selection = selectionFor(programme, programme.pathways[0]?.id);
      const courses = getSelectedCourses(programme, selection);

      for (const [key, expected] of Object.entries(programme.expectedTotals.semesterCredits)) {
        const match = key.match(/^Y([1-4])S([12])(?::(.+))?$/);
        expect(match, key).not.toBeNull();
        if (!match || (match[3] && match[3] !== selection.pathwayId)) {
          continue;
        }
        const actual = sumCredits(
          courses.filter(
            (course) => course.year === Number(match[1]) && course.semester === Number(match[2])
          )
        );
        expect(expectedMatches(expected, actual), `${programme.programmeName} ${key}`).toBe(true);
      }

      for (const [key, expected] of Object.entries(programme.expectedTotals.yearCredits)) {
        const match = key.match(/^Y([1-4])(?::(.+))?$/);
        expect(match, key).not.toBeNull();
        if (!match || (match[2] && match[2] !== selection.pathwayId)) {
          continue;
        }
        const actual = sumCredits(
          courses.filter((course) => course.year === Number(match[1]))
        );
        expect(expectedMatches(expected, actual), `${programme.programmeName} ${key}`).toBe(true);
      }
    }
  });

  it("models the Business Information Systems elective typo as two Year III Semester I electives", () => {
    const programme = programmeById.get("business-information-systems")!;
    const group = programme.electiveGroups.find((item) => item.id === "bis-y3s1-electives")!;

    expect(group.requiredSelectionCount).toBe(2);
    expect(group.requiredCredits).toBe(6);
    expect(group.notes?.join(" ")).toContain("Select Three (02)");
  });

  it("enforces the Management and Public Policy practical-training dependency", () => {
    const programme = programmeById.get("management-public-policy")!;
    const selection = selectionFor(programme);
    const practical = programme.electiveGroups
      .find((group) => group.id === "pub-y4s1-elective")!
      .availableCourses.find((course) => course.code === "PUB 4373")!;
    const nonInternship = programme.electiveGroups
      .find((group) => group.id === "pub-y4s2-elective")!
      .availableCourses.find((course) => course.code !== "PUB 4380")!;

    const issues = getSelectionIssues(programme, {
      ...selection,
      electiveSelections: {
        ...selection.electiveSelections,
        "pub-y4s1-elective": [practical.id],
        "pub-y4s2-elective": [nonInternship.id]
      }
    });

    expect(issues.some((issue) => issue.type === "dependency")).toBe(true);
  });
});
