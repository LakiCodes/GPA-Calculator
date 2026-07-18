# Data Audit - FMSC GPA Calculator & Planner

Authoritative source: `reference/FMSC_Prospectus_2026.pdf`

PDF SHA-256: `859948B62D5AAA003D1BD385782A3A494F2C07FEAC50CDC4EC80FB61EDBFD8CA`

Extraction method:

- Copied the prospectus PDF into `reference/` and treated it as the sole curriculum/rules source.
- Extracted searchable text with Apache PDFBox into `reference/extracted/prospectus-plain.txt` and `reference/extracted/prospectus-layout.txt`.
- Rendered table pages as PNGs where text extraction was ambiguous, especially Table 1.2 and the programme tables for Business Economics, Finance, Business Information Systems, Marketing Management, and Operations and Technology Management.
- Encoded every course with code, title, credits, notional hours, year, semester, source page, source table, delivery type, and elective/pathway constraints.
- Validated schema, elective defaults, semester totals, year totals, and programme totals with `npm run validate:curriculum`.

## Programme Coverage

The application encodes all 12 degree programmes in the required order:

| # | Programme | Encoded credits | Main source pages |
|---|---|---:|---|
| 1 | BSc Honours in Accounting | 126 | 16-20 |
| 2 | BSc Honours in Business Administration | 121 | 35-41 |
| 3 | BSc Honours in Business Economics | 121 | 54-59 |
| 4 | BCom Honours | 122 | 69-75 |
| 5 | BSc Honours in Operations and Technology Management | 124 | 81-87 |
| 6 | BSc Honours in Entrepreneurship | 121 | 102-106 |
| 7 | BSc Honours in Real Estate Management and Valuation | 125 | 119-124 |
| 8 | BSc Honours in Finance | 125 | 128-131 |
| 9 | BSc Honours in Human Resource Management | 122 | 148-151 |
| 10 | BSc Honours in Business Information Systems | 127 | 164-168 |
| 11 | BSc Honours in Marketing Management | 123 | 183-189 |
| 12 | BSc Honours in Management and Public Policy | 120 | 203-207 |

## First-Year Variants

Table 1.2 is the base first-year curriculum. Programme-specific first-year differences were encoded where the programme tables override or extend Table 1.2:

- BCom Honours adds `COM 1170` in Year I Semester I and uses `COM 1371` / `COM 1372` in Semester II, giving 32 Year I credits.
- Business Information Systems adds `ITC 1171`, giving 32 Year I credits.
- Real Estate Management and Valuation adds `EMV 1170`, giving 32 Year I credits.
- Management and Public Policy uses `PUB 1370` instead of `PUB 1270` and `LAW 1270`, giving 30 Year I credits.

## Recorded Ambiguities And Resolutions

- Business Information Systems Year III Semester I prints `Select Three (02)`. The semester total is 19 credits, which confirms two 3-credit electives. The app encodes two electives and records this note on the group.
- Operations and Technology Management Year IV Semester II Option I visually lists only `DSC 4677 Research Study`, but the printed semester/year/programme totals require 12 credits. The app models Option I as research study plus internship and records the ambiguity in programme notes.
- Human Resource Management Elective List I prints `DCS 3370 Operations Research`. The app encodes `DSC 3370 Operations Research`, consistent with the faculty course-code pattern, and records the ambiguity.
- Finance programme total is validated from the printed semester/year totals because the standalone final programme-total line is less explicit in the inspected table pages.
- Some annual or internship courses show notional hours spread across semesters but credits awarded in one semester. The app records these as annual delivery where the table implies annual assessment.

## Rule Encoding

- Grade points and marks bands follow the official scale in `GPA_APP_SPEC.md` and the prospectus.
- `AB` is GPA-bearing at 0.00 and included in the denominator.
- `MC`, `DFR`, and `INC` are pending and excluded from GPA.
- `P` is completed and excluded from GPA.
- `F` is excluded from GPA and is not completed.
- Missing results are excluded from GPA.
- GPA is weighted by credits and truncated to two decimals.
- D, E, and AB are mandatory repeats. C- and D+ are repeat-permitted poor passes.
- Ordinary repeats are capped at C; medical/deferred privileged attempts are not capped.
- Graduation and class outputs are advisory and include the University final-determination disclaimer.

## Validation

Current validation command:

```powershell
npm run validate:curriculum
```

Latest result:

```text
Validated 12 Prospectus 2026 programmes and default elective selections.
```
