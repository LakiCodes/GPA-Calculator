# Requirement Verification Checklist

Status key: Done = implemented and verified; Interpreted = implemented with an audit note.

| Area | Status | Verification |
|---|---|---|
| Read `GPA_APP_SPEC.md` and use it as authoritative project specification | Done | Implemented against the provided spec and recorded plan in `IMPLEMENTATION_PLAN.md`. |
| Use Prospectus 2026 as sole curriculum/rules data source | Done | PDF stored at `reference/FMSC_Prospectus_2026.pdf`; audit in `DATA_AUDIT.md`. |
| Extract all 12 degree programmes exactly as named | Done | `scripts/validate-curriculum.ts` and `src/tests/curriculum.test.ts`. |
| Encode source pages/tables and curriculum totals | Done | `src/data/programmes.ts`; validator checks semester/year/programme credits. |
| Record contradictions, missing data, and risks | Done | `DATA_AUDIT.md` and `IMPLEMENTATION_PLAN.md`. |
| React + TypeScript + Vite + Tailwind | Done | `package.json`, `vite.config.ts`, `src/App.tsx`, `src/styles.css`. |
| Zod validation | Done | `src/domain/schemas.ts`; JSON import test. |
| Vitest tests | Done | 20 passing tests across GPA, curriculum, repeats, planner, graduation, class, storage. |
| No backend/API/analytics | Done | App uses browser `localStorage` only. |
| JSON import/export | Done | Data tab and `src/storage/localStore.ts`. |
| CSV export | Done | Data tab CSV generation. |
| Print report | Done | Data tab print action and print CSS. |
| Reset confirmation | Done | Data tab reset uses confirmation. |
| Official grade scale and mark ranges | Done | `src/data/gradeScale.ts`; grade-band tests. |
| `AB` as E/0 included in GPA denominator | Done | `src/calculations/gpa.ts`; special-code tests. |
| `MC`/`DFR`/`INC` pending excluded | Done | GPA/progress/graduation tests. |
| `P` completed and excluded from GPA | Done | GPA/completion tests. |
| `F` excluded from GPA and incomplete | Done | Completion logic and tests. |
| Missing results excluded from GPA | Done | GPA calculation logic. |
| Weighted GPA by credits | Done | GPA tests. |
| Integer hundredths and truncation, not rounding | Done | `calculateGpa` test checks 3.33 truncation. |
| Prospectus-style GPA example returns 2.80 | Done | GPA test includes a 2.80 weighted example. |
| D/E/AB mandatory repeats | Done | GPA/progress tests. |
| C-/D+ repeat permitted | Done | Completion/repeat tests and progress alerts. |
| Ordinary repeat capped at C | Done | Attempt tests. |
| Retain better eligible grade | Done | Attempt tests. |
| Privileged MC/DFR repeats not capped | Done | Attempt tests for medical/deferred privileged attempts. |
| Annual pass checks GPA >= 2.00 and no D/E/AB | Done | Graduation/progress tests. |
| Pending results handled as provisional | Done | Progress and graduation checklist. |
| Graduation check: credits, years, overall, no D/E, unresolved courses, seven-year max | Done | `src/calculations/graduation.ts`; tests. |
| University final-determination disclaimer | Done | Dashboard/progress and graduation logic. |
| Last-attempt exception checkbox separate | Done | Data tab and graduation checklist test. |
| Current class-standing eligibility rules | Done | `src/calculations/classification.ts`; class tests use entered results so far rather than incomplete future courses. |
| Count class credit thresholds by credits | Done | Classification logic and display. |
| Planner targets 2.00/3.00/3.30/3.70/custom | Done | Planner tab. |
| Planner scenarios and five per-course future grade plans | Done | Planner tab, `calculatePlannerProjection`, and planner tests verify five distinct reachable plans for possible targets. |
| Max/min possible, required average, impossible target | Done | Planner logic and tests. |
| Responsive working UI, not a landing page | Done | App opens directly to calculator dashboard. |
| Documented interpretations instead of silent simplification | Done | `DATA_AUDIT.md`. |

Latest commands:

```text
npm run validate:curriculum  -> passed
npm run test:run             -> 20 passed
npm run build                -> passed
```
