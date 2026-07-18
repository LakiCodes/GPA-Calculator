# FMSC GPA Calculator & Planner

Offline React + TypeScript app for the University of Sri Jayewardenepura FMSC Prospectus 2026.

## Commands

```powershell
npm run validate:curriculum
npm run test:run
npm run build
npm run dev
```

In this workspace a portable Node install exists under `.tools/node-v24.18.0-win-x64`. If `node` is not on PATH, run commands like:

```powershell
$nodeDir = Resolve-Path '.tools\node-v24.18.0-win-x64'
$env:PATH = "$nodeDir;$env:PATH"
npm run dev
```

## What It Includes

- All 12 Prospectus 2026 degree programmes.
- Pathway and elective handling with source references.
- Official grade scale, special result codes, GPA truncation, repeat caps, and privileged attempts.
- Annual pass, graduation checklist, class eligibility, and last-attempt flag.
- GPA planner scenarios with possible range and required average.
- LocalStorage persistence only.
- JSON import/export, CSV export, print report, and reset confirmation.

See `DATA_AUDIT.md` for source extraction notes and `IMPLEMENTATION_PLAN.md` for requirement/risk analysis.

## Hosting

Run:

```powershell
npm run validate:curriculum
npm run test:run
npm run build
```

Upload only `dist/` to your static host. See `HOSTING_GUIDE.md` and `PRIVACY.md`.

Student data is saved in each user's browser local storage. It is not shared between users and is not uploaded by the app.
