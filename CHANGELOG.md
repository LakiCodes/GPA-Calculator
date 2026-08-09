# Changelog

All notable student-facing changes to the FMSC GPA Calculator & Planner are documented here.

The project follows semantic versioning where practical:

- **Major** — breaking or fundamental redesigns
- **Minor** — new features and substantial improvements
- **Patch** — fixes and small refinements

---

## [1.1.0] — 2026-08-09

### Class-first Planner Update

Version 1.1.0 upgrades the GPA Planner into a **degree-class-first planning system** while keeping GPA visible as an important supporting metric.

### Added

- Degree-class targets for:
  - First Class
  - Second Class (Upper Division)
  - Second Class (Lower Division)
  - Pass
- Exact future-grade plans for remaining GPA-bearing courses
- Projected degree class for each generated plan
- Projected final GPA for each generated plan
- Best still possible degree class based on current results and remaining courses
- Requirement-by-requirement class checks in the planner
- High-grade credit tracking against total programme credits
- Class-aware planner regression tests
- Separate custom **GPA-only** planning mode

### Changed

- The planner is now **class-first and GPA-aware** instead of primarily GPA-first.
- Selecting **First Class** no longer means only “reach GPA 3.70”. Plans must also satisfy the encoded First Class requirements.
- First Class planning now checks:
  - GPA ≥ 3.70
  - A / A+ across at least 50% of total programme credits
  - No retained grade below C
  - Programme completion requirements
  - Four-year completion rule
- Second Upper planning now checks:
  - GPA ≥ 3.30
  - A- or better across at least 50% of total programme credits
  - No more than two C-/D+ grades
  - Four-year completion rule
- Second Lower planning now checks:
  - GPA ≥ 3.00
  - B+ or better across at least 50% of total programme credits
  - No more than two C-/D+ grades
  - Four-year completion rule
- Planner summary cards now emphasize:
  - Current standing
  - Target class
  - Selected plan outcome
  - Best still possible class
- Export/report data now includes class-focused planner information.

### Four-year completion assumption

The app no longer asks students to enter a degree start year or completion year.

For planning purposes, the application now assumes:

> **The student completes the degree within four academic years.**

This assumption is stated wherever the four-year class rule is relevant.

Because four years is within the Prospectus seven-year maximum, the graduation time-limit condition is also treated as satisfied under this planning assumption.

### Removed

- Degree start-year input
- Degree current/completion-year input
- Approved extension / valid-reason input associated with the class-duration check
- Saved-data fields for those degree-duration inputs
- “Duration pending” class-planner messaging

The academic-year field attached to an individual repeat **attempt** remains available because it belongs to attempt history, not degree-duration planning.

### Fixed

- Restored production after `src/App.tsx` was accidentally committed as raw patch/diff text.
- Fixed misleading class planning where a GPA-only plan could appear suitable even when it did not satisfy the selected class rules.
- Prevented First Class plans from being presented as achievable when an existing retained grade below C blocks the class.
- Improved consistency between class planning, classification, graduation, exports, and saved-data validation.
- Synced the duplicate JavaScript schema artifact with the TypeScript schema.

### Reliability

- Added regression coverage for First Class planning and high-grade credit thresholds.
- Added coverage for class targets blocked by retained grades.
- Added coverage for explicit GPA-only mode.
- Added coverage for the four-year completion assumption.
- Production Vercel builds were validated after the planner and duration-rule changes.

### Student-facing summary

The planner now answers:

> **“What grades should I aim for in my remaining courses to achieve this degree class?”**

instead of only:

> “What GPA average do I need?”

### Important note

Degree-class and graduation results shown by the calculator are **unofficial planning guidance**. Final GPA, class, graduation eligibility, exceptions, and official results are determined by the University of Sri Jayewardenepura.

---

## [1.0.0] — Initial Release

### Added

- Support for all 12 FMSC honours degree programmes from Prospectus 2026
- Programme, pathway, option, and elective selection
- Credit-weighted GPA calculation
- GPA truncation to two decimal places
- Grade and marks entry
- Special result-code handling
- Repeat-attempt tracking
- Ordinary-repeat grade cap handling
- Privileged medical/deferred attempt handling
- Annual progress calculations
- Graduation checklist
- Provisional class standing
- Original GPA-target planner
- JSON import/export
- CSV export
- Printable reports
- Browser local-storage persistence
- Curriculum validation tooling
- Automated calculation tests

---

## Version links

- Repository: https://github.com/LakiCodes/GPA-Calculator
- Live app: https://gpa-calculator-fmsc.vercel.app
