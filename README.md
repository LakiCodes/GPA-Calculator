# FMSC GPA Calculator & Planner

> An offline, privacy-first web application for University of Sri Jayewardenepura students to calculate their GPA, track academic progress, and plan future grades.

![TypeScript](https://img.shields.io/badge/TypeScript-65.9%25-3178C6?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## 🎯 Overview

FMSC GPA Calculator & Planner is a comprehensive academic planning tool designed specifically for the University of Sri Jayewardenepura Faculty of Management Studies and Commerce (FMSC) Prospectus[...]

- ✅ Select from all 12 FMSC honours degree programmes
- ✅ Navigate complex pathways, specialisations, and elective groups
- ✅ Enter grades and track attempt histories with repeat-course rules
- ✅ Calculate accurate GPAs with official truncation (not rounding)
- ✅ Check graduation eligibility and provisional class standing
- ✅ Plan future grades and discover what's needed to reach a target GPA
- ✅ Export results to JSON/CSV and print academic reports
- ✅ All data saved locally—no login, no server, no tracking

Built with **React 19**, **TypeScript**, and **Vite**. Deployable anywhere. Works offline.

**[Live Demo →](https://gpa-calculator-laki2.vercel.app)**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Lakshitha641/GPA-Calculator.git
cd GPA-Calculator

# Install dependencies
npm install

# Validate curriculum data (optional but recommended)
npm run validate:curriculum

# Start development server
npm run dev
```

The app will open at **http://127.0.0.1:5173** (or similar).

### Build for Production

```bash
# Run type checking and build
npm run build

# Preview production build locally
npm run preview

# Test the build
npm run test:run
```

Upload only the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static host.

---

## 📋 Supported Degree Programmes

All 12 FMSC honours programmes from Prospectus 2026:

1. **BSc Honours in Accounting**
2. **BSc Honours in Business Administration**
3. **BSc Honours in Business Economics**
4. **BCom Honours**
5. **BSc Honours in Operations and Technology Management**
6. **BSc Honours in Entrepreneurship**
7. **BSc Honours in Real Estate Management and Valuation**
8. **BSc Honours in Finance**
9. **BSc Honours in Human Resource Management**
10. **BSc Honours in Business Information Systems**
11. **BSc Honours in Marketing Management**
12. **BSc Honours in Management and Public Policy**

Each programme includes:
- Core courses by year and semester
- Pathway and specialisation options
- Elective group selections with credit requirements
- Annual courses and special delivery types

---

## 🎓 Key Features

### GPA Calculation
- **Official grading scale**: A+ / A (4.00), A- (3.70), down to E (0.00)
- **Precise truncation**: 3.679 → 3.67 (not rounded)
- **Weighted by credits**: GPA = Σ(credit × grade points) ÷ Σ credit hours
- **Special result codes**: AB (absent/0.00), MC/DFR/INC (pending), P (pass/excluded), F (fail alert)
- **Attempt history tracking**: First, ordinary-repeat, medical-privileged, deferred-privileged

### Repeat Course Management
- D and E must be repeated
- C- and D+ may be repeated
- **Ordinary repeat cap**: Maximum grade C (unless privileged)
- **Better-grade retention**: Higher attempt always used
- **Privileged attempts**: Medical/deferred not subject to C cap
- Visual tracking of repeat status and GPA impact

### Graduation & Class Standing
- **Annual pass status**: GPA ≥ 2.00 + no D/E grades required
- **Graduation checklist**:
  - Prescribed credits completed
  - Minimum annual GPA of 2.00
  - Minimum overall GPA of 2.00
  - No unresolved mandatory repeats
  - Completion within 7 years (or approved extension)

- **Degree classification**:
  - **First Class**: GPA ≥ 3.70, A+ or better in ≥50% of credits, no grade below C, within 4 years
  - **Second Class Upper**: GPA ≥ 3.30, A- or better in ≥50% of credits, ≤2 poor grades (C-/D+)
  - **Second Class Lower**: GPA ≥ 3.00, B+ or better in ≥50% of credits, ≤2 poor grades
  - **Pass**: GPA ≥ 2.00 and no D/E/AB

### GPA Planner
- Set target GPA: 2.00 (pass), 3.00, 3.30, 3.70, or custom
- Save multiple named scenarios
- See required average over remaining courses
- Identify achievable vs. impossible targets
- Project final GPA and class eligibility
- No impact on actual grades

### Data & Privacy
- **LocalStorage only**: All data saved in browser
- **No login required**: Anonymous, instant access
- **No tracking**: No analytics, no external API calls
- **Export options**:
  - JSON (import/export anytime)
  - CSV (spreadsheet-ready)
  - PDF report (printable)
- **Reset options**: Per programme or full wipe with confirmation

---

## 🏗️ Project Structure

```
src/
├── App.tsx                         # Main component & navigation
├── main.tsx                        # Entry point
├── styles.css                      # TailwindCSS + custom styles
│
├── calculations/
│   ├── classification.ts           # First/Second Class eligibility
│   ├── curriculum.ts               # Course selection & pathway logic
│   ├── gpa.ts                      # GPA calculation with truncation
│   ├── graduation.ts               # Graduation checklist & credit validation
│   ├── planner.ts                  # Scenario-based GPA forecasting
│   ├── records.ts                  # Grade deduplication & attempt resolution
│   └── attempts.ts                 # Repeat attempt rules
│
├── data/
│   ├── gradeScale.ts               # Official grades, marks → grade mapping
│   └── programmes/                 # All 12 FMSC degree curricula
│       ├── accounting.ts
│       ├── business-admin.ts
│       └── ... (10 more)
│
├── domain/
│   ├── types.ts                    # Core types (Course, Programme, StudentData)
│   └── schemas.ts                  # Zod validators for data integrity
│
├── storage/
│   ├── localStore.ts               # localStorage persistence & migrations
│   └── ...
│
└── assets/
    └── usjp-logo.jpeg              # University logo

scripts/
├── validate-curriculum.ts          # CI script for curriculum validation
└── ...

docs/
├── DATA_AUDIT.md                   # Source pages and audit trail
├── GPA_APP_SPEC.md                 # Full 1000+ line specification
├── IMPLEMENTATION_PLAN.md          # Risk analysis & roadmap
├── HOSTING_GUIDE.md                # Deployment instructions
├── PRIVACY.md                      # Privacy assurance
└── REQUIREMENT_CHECKLIST.md        # Feature completeness tracker
```

---

## 🧪 Testing

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Validate curriculum JSON against Prospectus 2026
npm run validate:curriculum
```

**Test coverage includes:**
- Grade-to-point mappings (A+ / A = 4.00, etc.)
- GPA truncation vs. rounding
- Repeat-course caps and better-grade retention
- Annual pass and graduation rules
- Class eligibility thresholds
- Pathway and elective selection logic
- Import/export round-trip integrity

---

## 📊 Data Accuracy

This app is built directly from the **FMSC Prospectus 2026** PDF:
- ✅ All course codes, titles, and credits extracted and verified
- ✅ Official grade scale and GPA formula implemented exactly
- ✅ Repeat, graduation, and class rules from the prospectus
- ✅ Every programme's computed totals validated against prospectus tables
- ✅ Source page and table recorded for every curriculum element

See **[DATA_AUDIT.md](./DATA_AUDIT.md)** for detailed extraction notes.

Run `npm run validate:curriculum` to verify all 12 programmes before deployment.

---

## 🔒 Privacy & Security

- **Zero external calls**: The app works entirely offline
- **No personal data**: No login, no user accounts
- **No analytics**: No tracking pixels, no event logging
- **LocalStorage only**: Data never leaves your browser
- **Portable data**: Export/import anytime; data is yours
- **Transparent code**: Open source; audit it yourself

See **[PRIVACY.md](./PRIVACY.md)** for full details.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Build locally first
npm run build

# Deploy via Vercel CLI or connect GitHub repo directly
vercel deploy
```

### Netlify

```bash
npm run build
# Drag `dist/` folder to Netlify or use Netlify CLI
```

### GitHub Pages

```bash
npm run build
# Push `dist/` to gh-pages branch or use GitHub Actions
```

See **[HOSTING_GUIDE.md](./HOSTING_GUIDE.md)** for detailed hosting instructions.

---

## 📚 How to Use

### 1. Select Your Programme
On launch, choose your degree programme from the sidebar dropdown. If your programme has pathways or specialisations, select them next.

### 2. Configure Electives
For each elective group, choose the required number of courses. The app validates your selections automatically and shows any issues.

### 3. Enter Your Grades
Go to the **Results** tab and enter grades for each course as you receive them. Supported entry modes:
- **Grades** (default): A+, A, A-, …, E, AB, MC, DFR, INC, P, F
- **Marks** (optional): Convert 0–100 to a grade automatically

### 4. Track Your Progress
- **Dashboard**: Current GPA, credits, class standing at a glance
- **Degree Progress**: Graduation checklist and annual pass status
- **Rules**: Reference the official grading scale and regulations

### 5. Plan Your Future
Use the **GPA Planner** to simulate different target GPAs and see what grades you need in remaining courses.

### 6. Export & Backup
Export your data as JSON for safekeeping or CSV for spreadsheet analysis. Print a full academic report anytime.

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Language** | TypeScript | 7.0.2 |
| **Framework** | React | 19.2.7 |
| **Build Tool** | Vite | 8.1.5 |
| **Styling** | TailwindCSS | 4.3.3 |
| **Icons** | Lucide React | 1.25.0 |
| **Validation** | Zod | 4.4.3 |
| **Testing** | Vitest | 4.1.10 |
| **Testing (UI)** | React Testing Library | 16.3.2 |

---

## 📖 Documentation

- **[GPA_APP_SPEC.md](./GPA_APP_SPEC.md)** — Complete feature specification (1000+ lines)
- **[DATA_AUDIT.md](./DATA_AUDIT.md)** — Curriculum extraction and validation audit trail
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — Development roadmap and risk analysis
- **[HOSTING_GUIDE.md](./HOSTING_GUIDE.md)** — Deployment and configuration
- **[PRIVACY.md](./PRIVACY.md)** — Privacy and data handling policy
- **[REQUIREMENT_CHECKLIST.md](./REQUIREMENT_CHECKLIST.md)** — Feature completion status

---

## ⚠️ Important Disclaimer

**This is an unofficial academic-planning tool** based on the FMSC Prospectus 2026. While every effort has been made to ensure accuracy:

- Official examination results, GPA, graduation eligibility, and degree classification are determined solely by the University of Sri Jayewardenepura
- This app is a planning aid only and does not represent official University decisions
- Always refer to the official Prospectus 2026 and University regulations for authoritative information
- Final degree classifications and graduation determinations remain with the University

---

## 🤝 Contributing

Found a bug? Think the GPA calculation is wrong? Have a feature idea?

1. Check **[DATA_AUDIT.md](./DATA_AUDIT.md)** and **[GPA_APP_SPEC.md](./GPA_APP_SPEC.md)** for context
2. Run `npm run validate:curriculum` to confirm curriculum integrity
3. Open an issue with details and, if applicable, source page references from the Prospectus 2026
4. Submit a pull request with fixes

---

## 📋 Commands Reference

```bash
npm run dev                 # Start dev server (localhost:5173)
npm run build              # Build for production
npm run preview            # Preview production build
npm run test               # Run tests in watch mode
npm run test:run           # Run tests once
npm run validate:curriculum # Validate all 12 programmes vs. Prospectus 2026
```

---

## 📄 License

Licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 📞 Support

- **Questions about the app?** Check the **Rules** and **Data** tabs in the app itself
- **Prospectus questions?** Refer to the [official Prospectus 2026](https://www.sjp.ac.lk)
- **Found an issue?** Open a GitHub issue with details

---

## 🎓 Made for FMSC Students

Built with care for the University of Sri Jayewardenepura Faculty of Management Studies and Commerce. 

Good luck with your studies! 🚀

---

<div align="center">

**[🔗 Visit the App](https://gpa-calculator-laki2.vercel.app)** • **[📖 Read the Spec](./GPA_APP_SPEC.md)** • **[🐛 Report Issues](https://github.com/Lakshitha641/GPA-Calculator/issues)[...]

</div>
