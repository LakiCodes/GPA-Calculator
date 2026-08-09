# FMSC GPA Calculator & Planner

> A privacy-first academic planning web app for University of Sri Jayewardenepura FMSC students to calculate GPA, track degree progress, and plan toward a target degree class.

![Version](https://img.shields.io/badge/version-1.1.0-0f766e?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

**Current release: v1.1.0 — Class-first Planner Update**  
See the full [CHANGELOG.md](./CHANGELOG.md).

**Live app:** https://gpa-calculator-fmsc.vercel.app

---

## Overview

The FMSC GPA Calculator & Planner is built for students following the **University of Sri Jayewardenepura, Faculty of Management Studies and Commerce (FMSC), Prospectus 2026**.

It supports all 12 honours degree programmes and combines GPA calculation, curriculum selection, repeat-course handling, degree-progress checks, and future-grade planning in one browser-based application.

### Main capabilities

- Select from all 12 FMSC honours degree programmes
- Configure pathways, options, and elective groups
- Enter grades or marks and track repeat attempts
- Calculate credit-weighted GPA using truncation rather than rounding
- Show provisional degree-class standing
- Plan toward **First Class, Second Upper, Second Lower, Pass, or a custom GPA**
- Generate exact future-grade plans for remaining courses
- Show projected class, projected GPA, and best still possible class
- Check encoded class requirements such as high-grade credit thresholds and grade-floor rules
- Export data to JSON or CSV and print academic reports
- Store academic records locally in the browser

---

## What's New in v1.1.0

Version **1.1.0** changes the planner from primarily GPA-focused to **degree-class-focused and GPA-aware**.

### Class-first planning

Selecting a class now means the planner tries to produce a future-grade plan that satisfies the encoded requirements for that class, rather than only reaching the class's minimum GPA.

For example, a **First Class** plan considers:

- Final GPA of at least **3.70**
- At least half of total programme credits at **A / A+**
- No retained grade below **C**
- Programme completion requirements
- The four-year completion rule

Second Upper and Second Lower similarly use their own GPA, high-grade-credit, and poor-grade restrictions.

### Exact future-grade plans

The planner now generates course-by-course target grades and shows:

- Projected degree class
- Projected final GPA
- Exact grade target for each remaining GPA-bearing course
- High-grade-credit progress
- Whether the selected plan meets the chosen class target
- Best class still mathematically possible

### Four-year planning assumption

The app no longer asks students to enter degree start and completion years.

For class and graduation planning, the app explicitly assumes:

> **The degree is completed within four academic years.**

Where the four-year rule applies, the interface clearly labels it as an assumption. Because four years is within the Prospectus seven-year maximum, the graduation time-limit check is treated as satisfied under the same planning assumption.

### Production and reliability improvements

- Restored the production app after an accidental `App.tsx` patch-text corruption
- Added class-planner regression tests
- Improved consistency between the planner, classification logic, graduation logic, exports, and saved-data schema

Full release notes are available in [CHANGELOG.md](./CHANGELOG.md).

---

## Supported Degree Programmes

All 12 FMSC honours programmes encoded from Prospectus 2026:

1. BSc Honours in Accounting
2. BSc Honours in Business Administration
3. BSc Honours in Business Economics
4. BCom Honours
5. BSc Honours in Operations and Technology Management
6. BSc Honours in Entrepreneurship
7. BSc Honours in Real Estate Management and Valuation
8. BSc Honours in Finance
9. BSc Honours in Human Resource Management
10. BSc Honours in Business Information Systems
11. BSc Honours in Marketing Management
12. BSc Honours in Management and Public Policy

Programme data includes core courses, credits, year/semester placement, pathways, options, elective groups, and applicable curriculum rules.

---

## GPA Calculation

The GPA engine uses the encoded Prospectus grading scale and credit weighting.

```text
GPA = Σ(credit × grade points) / Σ GPA-bearing credits
```

### Important calculation behavior

- GPA is **truncated to two decimal places**, not rounded
- Example: `3.679` becomes `3.67`
- A+ and A carry 4.00 grade points
- A- carries 3.70
- Special result codes are handled separately according to their encoded GPA/completion behavior

### Supported result codes

- Letter grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, E
- AB — absent / mandatory-repeat handling
- MC — medical / pending
- DFR — deferred / pending
- INC — incomplete / pending
- P — pass result excluded from GPA denominator
- F — fail alert / unresolved completion

---

## Repeat Course Handling

The app tracks attempt histories and resolves the effective grade used in GPA calculations.

- D, E, and AB are treated as mandatory-repeat outcomes
- C- and D+ may be repeated under the encoded rules
- Ordinary repeats are capped at C
- Approved medical/deferred privileged attempts are not subject to the ordinary-repeat cap
- The best eligible result is retained for calculation

---

## Degree Class Planning

The planner supports two modes.

### 1. Degree-class mode

Choose one of:

- **First Class**
- **Second Class (Upper Division)**
- **Second Class (Lower Division)**
- **Pass**

The planner then generates grade plans against the encoded class requirements, not GPA alone.

### 2. Custom GPA mode

Enter any GPA target from 0.00 to 4.00. Class constraints are disabled for the target calculation, while generated plans can still show their projected degree class.

### Encoded class targets

| Target | Minimum GPA | High-grade requirement | Other encoded constraints |
|---|---:|---|---|
| First Class | 3.70 | A / A+ across at least 50% of total programme credits | No retained grade below C; four-year completion assumed |
| Second Upper | 3.30 | A- or better across at least 50% of total programme credits | No more than two C-/D+ grades; four-year completion assumed |
| Second Lower | 3.00 | B+ or better across at least 50% of total programme credits | No more than two C-/D+ grades; four-year completion assumed |
| Pass | 2.00 | None | Completion / mandatory-repeat conditions still apply |

> Degree classifications shown by this application are planning guidance only. Final classification is determined by the University.

---

## Graduation & Degree Progress

The Degree Progress view evaluates encoded academic conditions such as:

- Prescribed credits completed
- Annual GPA/pass status
- Overall GPA
- Unresolved or repeat-required courses
- Programme completion
- Prospectus time-limit condition

### Time assumption

The app currently assumes four-year degree completion for planning. Therefore the seven-year maximum is shown as satisfied by assumption rather than calculated from user-entered dates.

---

## How to Use

### 1. Select your degree programme

Choose your programme from the sidebar. If applicable, select the relevant pathway or option.

### 2. Configure electives

Choose courses in each elective group. The app checks encoded selection and credit requirements.

### 3. Enter results

Open the **Results** tab and enter either grades or marks.

You can also add attempt histories for repeated or privileged attempts.

### 4. Review your standing

Use:

- **Dashboard** for GPA, completed credits, and current provisional standing
- **Degree Progress** for annual progress and completion checks
- **Rules** for the encoded grade and classification rules

### 5. Plan future grades

Open the **GPA Planner**, choose a degree-class target or custom GPA, then select one of the generated future-grade plans.

The planner shows the exact grade to aim for in each remaining GPA-bearing course.

### 6. Export or back up

Use the **Data** tab to:

- Export CSV
- Back up JSON
- Import a previous JSON backup
- Print the report
- Reset locally saved data

---

## Privacy & Data Handling

Academic records entered into the calculator are stored in the browser's local storage.

- No student account is required
- No application backend stores your grades or course records
- Academic records are not shared between browsers or devices unless you export/import them yourself
- JSON and CSV exports are generated locally

The hosted deployment includes **Vercel Analytics** for aggregate website usage metrics. The calculator does not use an academic-record backend to upload student course results.

See [PRIVACY.md](./PRIVACY.md) for the repository's privacy documentation.

---

## Quick Start for Developers

### Requirements

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/LakiCodes/GPA-Calculator.git
cd GPA-Calculator
npm install
```

### Run locally

```bash
npm run dev
```

### Validate and test

```bash
npm run validate:curriculum
npm run test:run
npm run build
```

### Production preview

```bash
npm run preview
```

---

## Commands

```bash
npm run dev                  # Start development server
npm run build                # Type-check and build production bundle
npm run preview              # Preview the production build
npm run test                 # Run Vitest in watch mode
npm run test:run             # Run tests once
npm run validate:curriculum  # Validate encoded programme data
```

---

## Project Structure

```text
src/
├── App.tsx
├── components/
│   └── ClassPlannerView.tsx
├── calculations/
│   ├── attempts.ts
│   ├── classification.ts
│   ├── classPlanning.ts
│   ├── curriculum.ts
│   ├── gpa.ts
│   ├── graduation.ts
│   ├── planner.ts
│   ├── progress.ts
│   └── records.ts
├── data/
│   ├── gradeScale.ts
│   └── programmes/
├── domain/
│   ├── types.ts
│   └── schemas.ts
├── storage/
│   └── localStore.ts
└── tests/
```

---

## Testing

Tests cover important calculation and planning behavior, including:

- Mark-to-grade conversion
- GPA truncation
- Result-code inclusion/exclusion rules
- Repeat-attempt caps and privileged attempts
- Annual progress and graduation checks
- Degree-class requirements
- First Class high-grade-credit thresholds
- Class-aware future-grade planning
- Blocking class targets when retained grades violate requirements
- Four-year completion assumption
- GPA-only planning mode
- Import/export schema round trips

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 7 |
| UI | React 19 |
| Build tool | Vite 8 |
| Styling | TailwindCSS 4 + custom CSS |
| Validation | Zod 4 |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |

---

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — Version history and patch notes
- [GPA_APP_SPEC.md](./GPA_APP_SPEC.md) — Application specification
- [DATA_AUDIT.md](./DATA_AUDIT.md) — Curriculum/source audit notes
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Development plan and risks
- [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) — Deployment notes
- [PRIVACY.md](./PRIVACY.md) — Privacy documentation
- [REQUIREMENT_CHECKLIST.md](./REQUIREMENT_CHECKLIST.md) — Requirement tracking

---

## Important Disclaimer

This is an **unofficial academic-planning tool** based on the FMSC Prospectus 2026.

- Official examination results are determined by the University of Sri Jayewardenepura
- Official GPA and degree classification are determined by the University
- Graduation eligibility and exceptions are determined by the University
- Planner results are estimates based on the rules currently encoded in this repository
- Students should refer to official University regulations for authoritative decisions

---

## Contributing

If you find an incorrect course, credit value, GPA rule, class rule, or planner result:

1. Check the relevant Prospectus source
2. Open a GitHub issue with the programme, course/rule, expected behavior, and source reference
3. If submitting code, run:

```bash
npm run validate:curriculum
npm run test:run
npm run build
```

before opening a pull request.

---

## License

Licensed under the MIT License. See [LICENSE](./LICENSE).

---

## Links

- **Live app:** https://gpa-calculator-fmsc.vercel.app
- **Repository:** https://github.com/LakiCodes/GPA-Calculator
- **Issues:** https://github.com/LakiCodes/GPA-Calculator/issues
- **Patch notes:** [CHANGELOG.md](./CHANGELOG.md)

---

Built for FMSC students at the University of Sri Jayewardenepura.
