You are a senior full-stack software engineer, data modeller, QA engineer and UI/UX designer. Build a complete, production-quality GPA calculator and academic-planning web application for students of the Faculty of Management Studies and Commerce, University of Sri Jayewardenepura.

APP NAME
FMSC GPA Calculator & Planner

SUBTITLE
University of Sri Jayewardenepura — Prospectus 2026

PRIMARY OBJECTIVE
Create a highly accurate, user-friendly, responsive web application that allows a student to:

1. Select their degree programme.
2. Select a specialisation, pathway or elective combination where applicable.
3. View every relevant course divided accurately by:
   - Year I, II, III and IV
   - Semester I and Semester II
   - Annual courses, internships, practical training and research components where applicable
4. Enter the grades already received.
5. Calculate:
   - Informational semester GPA
   - Officially relevant annual GPA
   - Overall cumulative GPA
   - Attempted and graded credits
   - Programme completion progress
   - Academic-year pass status
   - Repeat-course requirements
   - Provisional degree-class progress
6. Plan future grades and determine what grades are required to reach a target GPA or class.
7. Save data locally, export it and import it later.

AUTHORITATIVE SOURCE

The attached FMSC Prospectus 2026 PDF is the sole authoritative source for:

- Degree programme names
- Course codes
- Course titles
- Course status
- Credit hours
- Notional hours
- Course placement by year and semester
- Annual-course treatment
- Specialisations and pathways
- Elective groups and the number of electives to select
- Semester and annual credit totals
- GPA formula
- Grading scale
- Repeat-course rules
- Passing requirements
- Graduation requirements
- Degree-class requirements

Locate the attached PDF in the project workspace. It may have a generated filename. Do not rely on internet summaries, previous prospectuses, remembered curricula or invented course data.

Important sections include:

- Common Programme and Table 1.2
- Degree programme sections 2.1 to 2.12
- Selection and Examination Policies, especially Section 4.2
- Tables 4.2.2, 4.2.3 and 4.2.4

NON-NEGOTIABLE DATA-ACCURACY REQUIREMENTS

Do not manually guess, infer or autocomplete missing curriculum data.

Before building the interface:

1. Inspect the PDF using layout-preserving text extraction.
2. Render and visually inspect pages containing complex tables.
3. Extract all course structures into structured, version-controlled data.
4. Validate every semester, year, pathway and programme total against the totals printed in the prospectus.
5. Record the source page and source table for every course or elective group.
6. Create an audit report listing:
   - Programme
   - Pathway or specialisation
   - Prospectus-stated semester total
   - Computed semester total
   - Prospectus-stated year total
   - Computed year total
   - Any ambiguity or discrepancy
7. Do not silently resolve an ambiguous table. Document the ambiguity and use the clearest interpretation supported by the PDF.
8. No placeholder courses, mock curricula, “Course 1” labels or incomplete programme data are permitted.

Use tools such as:

- pdfinfo
- pdftotext -layout
- PDF page rendering
- Targeted visual inspection of tables

Do not use unrestricted OCR as the first method. Use it only for individual pages where normal extraction fails.

SUPPORTED DEGREE PROGRAMMES

Include all 12 programmes exactly as named in the prospectus:

1. BSc Honours in Accounting
2. BSc Honours in Business Administration
3. BSc Honours in Business Administration in Business Economics
4. BCom Honours
5. BSc Honours in Operations and Technology Management
6. BSc Honours in Entrepreneurship
7. BSc Honours in Real Estate Management and Valuation
8. BSc Honours in Finance
9. BSc Honours in Human Resource Management
10. BSc Honours in Business Information Systems
11. BSc Honours in Marketing Management
12. BSc Honours in Management and Public Policy

COMMON FIRST-YEAR PROGRAMME

Extract the common first-year curriculum from Table 1.2.

Do not apply one identical Year I structure to every programme without accounting for the prospectus notes. Correctly implement programme-specific substitutions and additions, including:

- Management and Public Policy:
  PUB 1370 Political Science is offered instead of PUB 1270 Socio-Political Environment and LAW 1270 Legal Environment.

- BCom Honours:
  COM 1170 Managerial Skills Development I is additional.
  COM 1371 Microeconomics and COM 1372 Financial Accounting replace the corresponding BEC and ACC course codes stated in the prospectus.

- Real Estate Management and Valuation:
  EMV 1170 Introduction to Real Estate is additional.

- Business Information Systems:
  ITC 1171 Computational Thinking for Problem Solving is additional.

Where a programme-specific table provides a complete Year I structure, compare it against Table 1.2 and use the programme-specific structure when it is clearly intended to override the common table.

PROGRAMME PATHWAYS AND ELECTIVES

The app must correctly model programme variations rather than displaying every possible course as compulsory.

Support:

- Specialisations
- Study areas
- Streams
- Elective groups
- “Select one” rules
- “Select two” rules
- Alternative research/internship choices
- Path-specific core courses
- Semester credit ranges caused by different pathways
- Annual courses
- Courses that continue across semesters
- Courses assessed annually but credited once

For example, the Business Economics programme contains multiple study areas and path-specific core and elective subjects. The application must ask the student to select the relevant study area and then display only the courses applicable to that path.

Do not include unselected elective subjects in:

- GPA calculations
- Programme-credit totals
- Remaining-credit calculations
- Class-threshold credit calculations
- Graduation calculations

Provide an “Elective and pathway setup” screen where the student selects all required options before entering results.

DATA MODEL

Create a clean, strongly typed curriculum data model.

A suitable structure should support fields such as:

- prospectusVersion
- programmeId
- programmeName
- shortName
- department
- programmeSourcePages
- pathways
- years
- semesters
- annualCourses
- courses
- electiveGroups
- alternatives
- expectedTotals
- notes

Each course should support:

- id
- code
- title
- credits
- notionalHours
- status: core or elective
- year
- semester
- deliveryType: semester or annual
- pathwayIds
- electiveGroupId
- sourcePage
- sourceTable
- notes

Each elective group should support:

- id
- title
- requiredSelectionCount
- minimumSelectionCount
- maximumSelectionCount
- applicablePathways
- availableCourses

Use a runtime schema validator such as Zod, or an equivalent type-safe validation system, for curriculum data and imported student data.

TECHNOLOGY

Build the app as a client-side, static-deployable application using:

- React
- TypeScript
- Vite
- A maintainable styling solution such as Tailwind CSS
- A lightweight, accessible component system
- Vitest for unit tests
- React Testing Library for interface tests
- Zod or equivalent for data validation

Use the latest stable mutually compatible packages available in the environment. Do not unnecessarily over-engineer the project.

The finished app must:

- Work without a backend
- Be deployable to Vercel, Netlify or GitHub Pages
- Work on mobile phones, tablets and desktop computers
- Continue functioning after refreshing the page
- Store student information only in the browser
- Make no external API calls
- Use no analytics or tracking
- Require no university login credentials

OFFICIAL GRADING SCALE

Implement this exact grade-point mapping:

A+ = 4.00
A  = 4.00
A- = 3.70
B+ = 3.30
B  = 3.00
B- = 2.70
C+ = 2.30
C  = 2.00
C- = 1.70
D+ = 1.30
D  = 1.00
E  = 0.00

The corresponding marks ranges are:

85–100 = A+
70–84 = A
65–69 = A-
60–64 = B+
55–59 = B
50–54 = B-
45–49 = C+
40–44 = C
35–39 = C-
30–34 = D+
25–29 = D
0–24 = E

A and A+ both have a grade-point value of 4.00.

GRADE ENTRY

The default result-entry method must be a grade dropdown.

Each course should allow:

- Not entered
- A+
- A
- A-
- B+
- B
- B-
- C+
- C
- C-
- D+
- D
- E
- AB
- MC
- DFR
- INC
- P
- F

An optional numeric-mark entry mode may also be provided. When a mark from 0 to 100 is entered, automatically map it to the official grade.

Do not allow invalid marks, malformed grade codes or negative credits.

SPECIAL RESULT CODES

Implement these result codes carefully:

AB — Absent without an approved valid reason

- The prospectus states that AB is equivalent to a failing grade of E.
- Treat AB as grade point 0.00.
- Include the course credits in the GPA denominator in the same manner as an E grade.
- Display a mandatory attention warning.

MC — Approved medical absence

- Treat as pending.
- Exclude from the GPA numerator and denominator until replaced with a final result.
- Do not treat it as an ordinary repeat attempt.
- Show that the course must be completed later with privileges.

DFR — Approved deferred examination

- Treat as pending.
- Exclude from the GPA numerator and denominator until replaced.
- Show that the next approved attempt carries privileges.

INC — Incomplete

- Treat as pending.
- Exclude from GPA until replaced by a final result.

P — Pass

- Exclude from GPA because the GPA formula is based on courses receiving letter grades.
- Count the credits as completed where the curriculum legitimately uses pass/fail assessment.

F — Fail

- Exclude from letter-grade GPA unless the prospectus explicitly assigns a grade-point treatment to that course.
- Do not count the course as completed.
- Display a failure alert.

Document this interpretation clearly in the Rules and Assumptions screen.

MISSING RESULTS

Never treat a missing result as zero.

A course with “Not entered” must be excluded from current GPA calculations.

Every calculated GPA must be labelled clearly, for example:

“Provisional GPA based on 48 graded credits”

This prevents a partial GPA from appearing to represent the complete degree.

GPA CALCULATION

Use the official weighted formula:

GPA =
Sum of (course credit hours × grade point)
divided by
Sum of credit hours for courses receiving a letter grade

Calculate:

1. Informational semester GPA
2. Annual GPA for each academic year
3. Overall cumulative GPA
4. Scenario or projected GPA

The prospectus states that decimals beyond two places are truncated, not rounded.

Examples:

3.679 must display as 3.67.
3.999 must display as 3.99.
2.806 must display as 2.80.

Do not use normal rounding functions.

Avoid floating-point errors. Internally store grade points as integer hundredths:

A+ = 400
A = 400
A- = 370
B+ = 330
and so on.

Calculate weighted grade-point hundredths and truncate using integer arithmetic.

Create a reusable function such as:

truncateGpa(totalWeightedPointHundredths, totalCredits)

The prospectus example containing:

- A+ for 3 credits
- A- for 3 credits
- B+ for 3 credits
- C for 3 credits
- D for 3 credits

must produce a GPA of exactly 2.80.

COURSE-PASS AND POOR-GRADE NUANCE

Implement the regulations exactly rather than oversimplifying them.

The prospectus states that:

- An overall mark of 40% or above is a course pass.
- D and E must be repeated.
- C- and D+ may be repeated.
- Academic-year and graduation rules identify D and E as fail-grade blockers.
- C- and D+ are treated as poor grades in class-award rules.

Therefore:

- Display C- and D+ as “Poor grade — repeat permitted”.
- Display D and E as “Fail grade — repeat required”.
- Do not automatically treat C- or D+ as identical to D or E in year-pass and graduation checks.
- Follow the exact annual-GPA and class-award rules below.
- Explain the distinction in an information tooltip.

REPEAT-COURSE MANAGEMENT

Each course must support an attempt-history feature.

An attempt record should include:

- Attempt number
- Result or grade
- Attempt type
- Academic year
- Whether the attempt had approved privileges
- Grade used in GPA
- Notes

Attempt types should include:

- First attempt
- Ordinary repeat
- Medical attempt with privileges
- Deferred attempt with privileges

Apply these rules:

1. D and E courses must be repeated.
2. C- and D+ courses may be repeated.
3. For an ordinary repeated course, the maximum final grade is C, regardless of the actual repeat-examination mark.
4. If a repeat grade is lower than a previously earned grade, retain the better grade.
5. A medical or deferred attempt accepted under the valid-reason provisions is completed with privileges and is not subject to the ordinary C-grade cap.
6. AB is treated as an unsuccessful used attempt unless approved circumstances change its status.
7. Never double-count the same course credits in GPA or completed-credit totals.

Show users:

- Original result
- Repeat result
- Applied repeat cap
- Retained final grade
- Reason the retained grade was selected

ACADEMIC-YEAR PASS STATUS

For each academic year, display one of:

- Passed
- Not yet complete
- GPA below requirement
- Contains mandatory repeat grades
- Pending MC/DFR/INC results

A year is passed when:

- Annual GPA is at least 2.00, and
- There are no D or E grades

AB should be treated as equivalent to E.

Where annual GPA is below 2.00, identify C- and D+ courses that may be repeated to improve the GPA.

Do not declare a year “failed” merely because some future results have not been entered. Use “Not yet complete” or “Provisional”.

GRADUATION ELIGIBILITY

Create a graduation checklist that evaluates:

- Completion of the prescribed credits for the selected programme and pathway
- Minimum GPA of 2.00 for each academic year
- Minimum overall GPA of 2.00
- No D or E grades
- No unresolved compulsory courses
- Completion within a maximum of seven academic years, except where an approved valid reason applies

Ask the student to enter:

- First academic year of registration
- Current or completion academic year
- Whether an approved extension or valid reason exists

Do not claim official graduation eligibility when results are incomplete.

Use labels such as:

- “Provisionally satisfies entered-result criteria”
- “Cannot yet be fully assessed”
- “Currently blocked by…”
- “Final determination is made by the University”

LAST-ATTEMPT EXCEPTION

The prospectus contains a special provision relating to a student’s last attempt and not more than one AB result.

Do not apply this provision automatically.

Create an Advanced Regulations section with a checkbox:

“I am being assessed under the final/last-attempt provision.”

Only after it is enabled should the application show the separate last-attempt evaluation. Clearly identify it as a special regulation and keep it separate from the standard graduation check.

DEGREE-CLASS REQUIREMENTS

Implement a final class-eligibility engine and a separate provisional “on-track” view.

FIRST CLASS

- Overall GPA of 3.70 or above
- A or better in courses covering at least half of the total programme credit hours
- No grade below C
- Requirements completed within four academic years, except an approved valid reason

SECOND CLASS — UPPER DIVISION

- Overall GPA of 3.30 or above
- A- or better in courses covering at least half of total programme credit hours
- No more than two poor grades, defined as C- or D+
- Requirements completed within four academic years, except an approved valid reason

SECOND CLASS — LOWER DIVISION

- Overall GPA of 3.00 or above
- B+ or better in courses covering at least half of total programme credit hours
- No more than two poor grades, defined as C- or D+
- Requirements completed within four academic years, except an approved valid reason

CLASS-CALCULATION DETAILS

Count qualifying credits, not the number of courses.

For example:

qualifyingAOrBetterCredits / totalRequiredProgrammeCredits

Use the total required credits for the student’s actual selected pathway and electives.

Do not count:

- Unselected electives
- Duplicate attempts
- Pending results
- Courses outside the selected curriculum

A or better means A and A+.

A- or better means A-, A and A+.

B+ or better means B+, A-, A and A+.

The provisional class panel must show each requirement separately:

- GPA requirement
- High-grade credit requirement
- Poor-grade limit
- Grade-floor requirement
- Four-year completion requirement

Do not show only a single class label.

For incomplete programmes, use language such as:

- “Currently on track”
- “Not currently on track”
- “Final class cannot yet be determined”
- “You currently have 42 of the 63 credits required at A- or better”

Do not promise a final degree class before all required results are completed.

TARGET GPA PLANNER

Create a separate planning mode that does not overwrite actual grades.

Allow the student to:

- Select a target GPA
- Use quick targets: 2.00, 3.00, 3.30 and 3.70
- Enter a custom target between 0.00 and 4.00
- Assign hypothetical grades to uncompleted courses
- Save multiple named scenarios
- Compare scenarios
- Reset projected grades without deleting actual results

Calculate:

- Current weighted grade points
- Remaining selected curriculum credits
- Required average grade point over remaining credits
- Whether the target is mathematically achievable
- Projected final GPA
- Projected qualifying credits for each degree class
- Maximum possible final GPA
- Minimum possible final GPA based on entered scenario grades

Use the actual remaining courses, not a manually typed generic credit value.

When the required average is:

- Greater than 4.00: show “Target is no longer mathematically achievable under the entered results.”
- Less than or equal to 0.00: show that the target has already been reached mathematically, while still noting graduation requirements.

Do not convert the required average into one misleading single letter grade. Show the numeric average and provide an approximate grade-band explanation.

USER INTERFACE

Create a clean, modern and professional interface inspired by an academic dashboard.

Suggested visual direction:

- Deep navy primary colour
- Teal or turquoise secondary colour
- Subtle gold accent
- Neutral light background
- High contrast text
- Rounded but professional cards
- Minimal, restrained shadows
- Clear typography
- No excessive gradients
- No childish illustrations
- No cluttered animations

Do not use an official university logo unless a legally usable logo asset is explicitly supplied.

HEADER

Include:

- App name
- Prospectus version
- Degree programme selector
- Theme toggle
- Privacy indicator: “Saved only on this device”
- Settings menu

MAIN NAVIGATION

Use clear tabs or navigation items:

1. Dashboard
2. Results
3. GPA Planner
4. Degree Progress
5. Rules
6. Data and Settings

ONBOARDING

On first launch, show a short setup flow:

Step 1 — Select degree programme  
Step 2 — Select pathway or specialisation where applicable  
Step 3 — Select known electives  
Step 4 — Enter registration/completion information, optional  
Step 5 — Begin entering results

Allow these selections to be edited later.

When changing a degree, pathway or elective after results have been entered:

- Show a confirmation dialog
- Explain which results may no longer belong to the active curriculum
- Never silently delete results
- Provide an export option first
- Preserve orphaned records until the user confirms deletion

RESULTS SCREEN

Group courses in expandable sections:

- Year I
  - Semester I
  - Semester II
  - Annual courses
- Year II
- Year III
- Year IV

Each course row should show:

- Course code
- Course title
- Credits
- Core or elective status
- Grade/status dropdown
- Grade-point value
- Weighted grade points
- Repeat indicator
- Course-status badge
- Notes or source tooltip

Desktop:

- Use a clear table layout
- Keep the course code and grade controls easy to scan
- Use a sticky summary area where appropriate

Mobile:

- Convert rows into compact cards
- Avoid horizontal scrolling where possible
- Make dropdown controls touch-friendly

Include:

- Search by course code or title
- Filter by year
- Filter by semester
- Filter by completed, pending, repeat-required and not-entered
- “Expand all” and “Collapse all”
- Completion counts for each section
- Automatic saving after each change
- Undo for recent grade changes

DASHBOARD

Display summary cards for:

- Current overall GPA
- Total graded credits
- Curriculum credits selected
- Remaining credits
- Number of courses completed
- Mandatory repeat courses
- Provisional class progress

Include:

- GPA by academic year
- Credit-completion progress
- Qualifying-credit progress toward each class
- Grade distribution
- Important warnings
- Pending MC, DFR or INC results
- Next recommended actions

Charts must remain understandable without colour alone.

DEGREE-PROGRESS SCREEN

Show:

- Required courses completed
- Required courses remaining
- Elective requirements fulfilled
- Unselected elective groups
- Programme-credit progress
- Year-by-year pass checks
- Graduation checklist
- Class-eligibility checklist

RULES SCREEN

Provide a plain-language explanation of:

- Grade scale
- GPA formula
- Truncation instead of rounding
- Treatment of AB, MC, DFR, INC, P and F
- Ordinary repeat cap
- Better-grade retention
- Annual GPA pass rule
- Graduation rules
- Degree-class rules
- Difference between provisional app calculations and official University decisions

Include a permanent disclaimer:

“This is an unofficial academic-planning tool based on the FMSC Prospectus 2026. Official examination results, GPA, graduation eligibility and degree classification are determined only by the University of Sri Jayewardenepura.”

PERSISTENCE AND PRIVACY

Use localStorage or IndexedDB.

Store:

- Active programme
- Pathway
- Elective selections
- Actual grades
- Attempt histories
- Planner scenarios
- User preferences
- Prospectus/data schema version

Requirements:

- No account required
- No cloud storage
- No personal data transmission
- No third-party analytics
- No external database
- Data remains on the user’s device

Include:

- Export to JSON
- Import from JSON
- Export results to CSV
- Printable academic-progress report
- Reset current programme
- Reset all data
- Confirmation before destructive actions

Imported files must be schema-validated. Reject corrupted or incompatible data with a clear error message.

VERSIONING

Store a data version such as:

prospectusVersion: "2026"
schemaVersion: 1

When imported data uses a different version:

- Warn the user
- Do not silently reinterpret grades or curricula
- Provide a controlled migration function where possible

ACCESSIBILITY

Meet WCAG AA expectations.

Include:

- Semantic HTML
- Proper labels for every control
- Keyboard navigation
- Visible focus indicators
- Accessible dialogs
- Sufficient colour contrast
- Screen-reader status announcements
- No reliance on colour alone
- Reduced-motion support
- Touch targets appropriate for mobile devices

Dark mode must retain readable contrast.

ERROR HANDLING

Handle:

- No programme selected
- No grade entered
- Division by zero
- Incomplete elective selection
- Invalid imported data
- Duplicate course records
- Duplicate attempt records
- Conflicting pathway selections
- Missing curriculum totals
- GPA calculation with no graded credits
- Target GPA outside 0.00–4.00
- Unsupported prospectus version

Never display NaN, Infinity, undefined or an empty broken chart.

When no GPA can be calculated, display:

“No graded credit courses have been entered yet.”

TESTING REQUIREMENTS

Create comprehensive automated tests.

At minimum, test:

1. Every grade-to-point mapping.
2. A and A+ both equal 4.00.
3. GPA weighting by credit hours.
4. Prospectus example produces 2.80.
5. GPA truncates rather than rounds.
6. 3.679 becomes 3.67.
7. Missing grades are excluded.
8. AB is treated as E/0.00 and included in the denominator.
9. MC is excluded while pending.
10. DFR is excluded while pending.
11. INC is excluded while pending.
12. P does not affect GPA and can count as completed.
13. Ordinary repeat grade is capped at C.
14. Better previous grade is retained when a repeat is lower.
15. Privileged MC/DFR attempt is not capped at C.
16. Duplicate attempts do not double-count credits.
17. Year pass requires GPA of at least 2.00 and no D/E.
18. C-/D+ repeat recommendations are shown correctly.
19. First Class checks all four conditions.
20. Second Upper checks all four conditions.
21. Second Lower checks all four conditions.
22. Class thresholds count credits rather than course count.
23. Unselected electives are excluded.
24. Path-specific courses are correctly activated.
25. Target-GPA calculations work at boundary values.
26. Impossible target GPA is detected.
27. Export/import round trip preserves all data.
28. Invalid imports are rejected.
29. Programme switching does not silently delete records.
30. Every programme’s computed credit totals match the prospectus audit data.

CURRICULUM VALIDATION SCRIPT

Create a script such as:

npm run validate:curriculum

It must:

- Validate all curriculum JSON/TypeScript files
- Check unique programme IDs
- Check unique course-instance IDs
- Check valid credit values
- Check elective-group selection rules
- Check pathway references
- Sum each semester
- Sum each year
- Sum each complete programme/pathway
- Compare computed totals to prospectus-stated totals
- Fail with a non-zero exit code when a mismatch is found
- Produce a readable validation summary

Create:

DATA_AUDIT.md

The audit file must include every programme and pathway. It must identify the prospectus page/table used for each curriculum section.

CODE QUALITY

Use:

- Strict TypeScript
- Small reusable calculation functions
- Separation between curriculum data, student records and calculations
- No GPA logic embedded directly in presentation components
- Pure functions for calculations
- Meaningful component names
- No `any` types unless strongly justified
- No dead code
- No console errors
- No duplicated grade-scale constants
- No hardcoded programme logic scattered across components

Suggested architecture:

src/
  components/
  features/
    onboarding/
    results/
    dashboard/
    planner/
    progress/
    settings/
  data/
    programmes/
    gradeScale.ts
  domain/
    types.ts
    schemas.ts
  calculations/
    gpa.ts
    attempts.ts
    classification.ts
    graduation.ts
    planner.ts
    curriculum.ts
  storage/
  tests/
  utils/

Keep all academic rules in a central, auditable domain layer.

DELIVERABLES

Produce a complete runnable repository containing:

- Full source code
- All 12 verified degree curricula
- All pathway and elective rules
- Responsive UI
- Calculation engine
- Automated tests
- Curriculum validation script
- DATA_AUDIT.md
- README.md
- Deployment instructions
- Example screenshots if practical
- Sample data that is clearly marked as demonstration data and is disabled by default

README REQUIREMENTS

Explain:

- Purpose of the app
- Technology used
- How to install
- How to run locally
- How to run tests
- How to run curriculum validation
- How to build
- How to deploy
- How data is stored
- How calculations work
- Prospectus version
- Known interpretations or ambiguities
- Unofficial-tool disclaimer

IMPLEMENTATION PROCESS

Complete the work in this order:

Phase 1 — Prospectus inspection
- Identify the PDF.
- Extract the relevant tables.
- Inspect ambiguous tables visually.

Phase 2 — Curriculum modelling
- Build the typed data schema.
- Enter all programme, pathway, semester, course and elective data.
- Add source-page references.

Phase 3 — Data verification
- Create and run the curriculum validation script.
- Produce DATA_AUDIT.md.
- Resolve all mismatches supported by the PDF.

Phase 4 — Calculation engine
- Implement grade mapping, GPA truncation, repeat handling, year pass, graduation, classification and planner calculations.
- Write unit tests before connecting calculations to the interface.

Phase 5 — Interface
- Build onboarding, results entry, dashboard, planner, progress, rules and settings.
- Implement responsive and accessible behaviour.

Phase 6 — Persistence and export
- Implement local storage, import/export, reset and schema versioning.

Phase 7 — Final QA
- Run all tests.
- Run curriculum validation.
- Run the production build.
- Check mobile and desktop layouts.
- Check keyboard navigation.
- Remove warnings and placeholder content.

Do not stop after producing a plan or code snippets. Implement the complete application.

Do not ask routine design questions. Make strong professional decisions consistent with this specification.

Only pause and request clarification when:

- The prospectus PDF cannot be accessed, or
- A curriculum table contains a genuine unresolved contradiction that cannot be resolved through page rendering and nearby notes.

FINAL RESPONSE

After implementation, report:

1. What was built.
2. Project structure.
3. Commands to install and run.
4. Test results.
5. Curriculum-validation results.
6. Any prospectus ambiguities found.
7. Exact files where curriculum data and GPA rules are stored.
8. Deployment instructions.

Before declaring completion, verify that:

- All 12 programmes are available in the dropdown.
- Every applicable course appears under the correct year and semester.
- Electives and specialisations do not cause double-counting.
- GPA is truncated, never rounded.
- The prospectus example returns 2.80.
- The project builds without errors.
- All tests pass.
- The curriculum audit reports no unexplained credit mismatch.