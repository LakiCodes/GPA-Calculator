# Implementation Plan And Risk Review

## Requirement Analysis

The project is an offline React application for the Faculty of Management Studies and Commerce Prospectus 2026. The application must provide:

- Exact Prospectus 2026 curriculum data for all 12 programmes.
- Programme, pathway, and elective selection.
- Grade entry by official grades or marks.
- Special result-code treatment for `AB`, `MC`, `DFR`, `INC`, `P`, `F`, and missing results.
- Credit-weighted GPA calculation truncated to two decimals.
- Repeat attempt handling, including ordinary-repeat caps and privileged attempts.
- Annual pass status, graduation checklist, class eligibility, and last-attempt flagging.
- GPA planning scenarios with targets, projections, ranges, and impossible-target detection.
- Local-only persistence with JSON import/export, CSV export, print report, and reset confirmation.
- Tests, data audit, and validation against the prospectus data.

## Build Plan

1. Establish React + TypeScript + Vite + Tailwind + Vitest project tooling.
2. Copy and extract the Prospectus 2026 PDF into `reference/`.
3. Encode curriculum data as typed immutable programme objects with source references.
4. Add Zod schemas for data validation and import boundaries.
5. Implement calculation modules for GPA, attempts, curriculum selections, progression, graduation, class, planner, and storage.
6. Build the application UI around six working views: Dashboard, Results, GPA Planner, Degree Progress, Rules, and Data.
7. Add `DATA_AUDIT.md`, this plan/risk note, and automated tests.
8. Run curriculum validation, tests, and production build.

## Technical Risks

- PDF table extraction can split or reorder table cells. Mitigation: rendered ambiguous table pages and recorded each interpretation in `DATA_AUDIT.md`.
- Some programmes use pathways and elective baskets with different credit shapes. Mitigation: pathway-aware course filtering and elective-group credit validation.
- Repeat-attempt rules can be misapplied if direct result and attempt history disagree. Mitigation: all academic calculations use the resolved effective attempt result.
- Class eligibility wording mixes course-count and credit-count concepts. Mitigation: high-grade thresholds are counted by credits, while C-/D+ poor passes are displayed by course count and credits.
- Graduation and class determinations are institution-controlled. Mitigation: every final readiness result is labeled advisory and includes a University determination disclaimer.

## Contradictions Or Missing Data

- Business Information Systems `Select Three (02)` was contradictory. Encoded as two electives based on the printed 19-credit semester total.
- Operations and Technology Management Option I did not visually list enough Year IV Semester II credits. Encoded to match the printed 12-credit semester total and 124-credit programme total.
- Human Resource Management `DCS 3370` appears to be a code typo. Encoded as `DSC 3370`.
- Finance programme total was validated from semester/year totals where the inspected pages did not present a clearer standalone total.

No requested functional requirement was intentionally omitted. The only simplified area is institutional approval: the app calculates advisory eligibility and does not claim to replace official University determinations.
