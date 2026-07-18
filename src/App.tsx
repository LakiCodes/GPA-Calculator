import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  Download,
  GraduationCap,
  LineChart,
  Plus,
  Printer,
  RefreshCcw,
  Settings,
  Target,
  Trash2,
  XCircle,
  type LucideIcon
} from "lucide-react";
import clsx from "clsx";

import { evaluateClassification } from "./calculations/classification";
import {
  expectedSemesterCredits,
  expectedYearCredits,
  formatExpected,
  getApplicableElectiveGroups,
  getPrescribedProgrammeCredits,
  getSelectedCourses,
  getSelectionIssues,
  isCourseApplicable,
  sumCredits
} from "./calculations/curriculum";
import { evaluateGraduation } from "./calculations/graduation";
import { calculateCourseGpa, isCompletedResult, resultPointHundredths } from "./calculations/gpa";
import { calculatePlannerProjection, defaultScenario } from "./calculations/planner";
import { effectiveResultMap, createCourseRecord } from "./calculations/records";
import { resolveAttempts } from "./calculations/attempts";
import { GRADE_POINTS_HUNDREDTHS, MARK_BANDS, RESULT_CODES, gradeFromMark, isLetterGrade } from "./data/gradeScale";
import { programmes, programmeById } from "./data/programmes";
import type {
  AttemptRecord,
  AttemptType,
  Course,
  CourseRecord,
  CurriculumSelection,
  ElectiveGroup,
  GradeEntry,
  PlannerScenario,
  Programme,
  StudentData,
  YearLevel
} from "./domain/types";
import {
  createEmptyStudentData,
  downloadText,
  loadStudentData,
  loadStorageNoticeAccepted,
  saveStudentData,
  saveStorageNoticeAccepted
} from "./storage/localStore";
import usjpLogo from "./assets/usjp-logo.jpeg";

type TabId = "dashboard" | "results" | "planner" | "progress" | "rules" | "data";
type YearFilter = "all" | YearLevel;

interface TabDefinition {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const tabs: TabDefinition[] = [
  { id: "dashboard", label: "Dashboard", icon: Calculator },
  { id: "results", label: "Results", icon: BookOpen },
  { id: "planner", label: "GPA Planner", icon: Target },
  { id: "progress", label: "Degree Progress", icon: GraduationCap },
  { id: "rules", label: "Rules", icon: LineChart },
  { id: "data", label: "Data", icon: Settings }
];

const attemptTypes: Array<{ value: AttemptType; label: string }> = [
  { value: "first", label: "First" },
  { value: "ordinary-repeat", label: "Ordinary repeat" },
  { value: "medical-privileged", label: "Medical privileged" },
  { value: "deferred-privileged", label: "Deferred privileged" }
];

const resultOptions = RESULT_CODES as readonly GradeEntry[];

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const selectCoursesForGroup = (group: ElectiveGroup, pathwayId?: string): string[] => {
  const available = group.availableCourses.filter((course) =>
    isCourseApplicable(course, pathwayId)
  );
  const selected: string[] = [];
  let credits = 0;
  const requiredCredits =
    group.requiredCredits ?? group.requiredSelectionCount * (available[0]?.credits ?? 0);
  for (const course of available) {
    if (selected.length >= group.maximumSelectionCount) {
      break;
    }
    if (credits + course.credits > requiredCredits && selected.length >= group.minimumSelectionCount) {
      continue;
    }
    selected.push(course.id);
    credits += course.credits;
    if (selected.length >= group.minimumSelectionCount && credits === requiredCredits) {
      break;
    }
  }
  return selected;
};

const defaultSelectionForProgramme = (
  programmeId: string,
  pathwayId?: string
): CurriculumSelection => {
  const programme = programmeById.get(programmeId) ?? programmes[0];
  const selectedPathway = pathwayId ?? programme.pathways[0]?.id;
  const baseSelection: CurriculumSelection = {
    programmeId: programme.programmeId,
    ...(selectedPathway ? { pathwayId: selectedPathway } : {}),
    electiveSelections: {}
  };
  return {
    ...baseSelection,
    electiveSelections: Object.fromEntries(
      getApplicableElectiveGroups(programme, baseSelection).map((group) => [
        group.id,
        selectCoursesForGroup(group, selectedPathway)
      ])
    )
  };
};

const initialData = (): StudentData => {
  const loaded = loadStudentData();
  const activeSelection =
    loaded.activeSelection ?? defaultSelectionForProgramme(programmes[0].programmeId);
  return {
    ...loaded,
    activeSelection,
    plannerScenarios: loaded.plannerScenarios.length > 0 ? loaded.plannerScenarios : [defaultScenario(3.3)]
  };
};

const formatGpa = (value: string | null): string => value ?? "--";

const csvEscape = (value: string | number | null | undefined): string => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const courseLabel = (course?: Course): string =>
  course ? `${course.code} ${course.title}` : "Unknown course";

const courseAlertDetails = (result: GradeEntry): { label: string; detail: string } => {
  switch (result) {
    case "MC":
      return {
        label: "Pending result: MC",
        detail: "Approved medical absence. This course is excluded from GPA until a final result is entered."
      };
    case "DFR":
      return {
        label: "Pending result: DFR",
        detail: "Deferred result. This course is excluded from GPA until a final result is entered."
      };
    case "INC":
      return {
        label: "Pending result: INC",
        detail: "Incomplete result. This course is excluded from GPA until a final result is entered."
      };
    case "AB":
      return {
        label: "Mandatory repeat: AB",
        detail: "Absent is treated as 0.00 GPA points and must be repeated."
      };
    case "D":
    case "E":
      return {
        label: `Mandatory repeat: ${result}`,
        detail: "This grade is below the pass threshold for completion and must be repeated."
      };
    case "F":
      return {
        label: "Fail alert: F",
        detail: "Fail is not counted as completed and needs academic attention."
      };
    case "":
      return {
        label: "Missing result",
        detail: "No result has been entered for this selected course yet."
      };
    default:
      return {
        label: `Unresolved result: ${result}`,
        detail: "This course is not currently treated as fully resolved for graduation checks."
      };
  }
};

const uniqueCourseIds = (...groups: string[][]): string[] => [...new Set(groups.flat())];

interface ReportData {
  data: StudentData;
  programme: Programme;
  activeSelection: CurriculumSelection;
  courses: Course[];
  records: Record<string, CourseRecord>;
  effectiveResults: Record<string, GradeEntry>;
  overallGpa: ReturnType<typeof calculateCourseGpa>;
  completedCredits: number;
  prescribedCredits: number;
  graduation: ReturnType<typeof evaluateGraduation>;
  classification: ReturnType<typeof evaluateClassification>;
  selectionIssues: ReturnType<typeof getSelectionIssues>;
  scenario: PlannerScenario;
  projection: ReturnType<typeof calculatePlannerProjection>;
}

const pathwayLabel = (programme: Programme, selection: CurriculumSelection): string =>
  programme.pathways.find((pathway) => pathway.id === selection.pathwayId)?.title ??
  programme.pathways.find((pathway) => pathway.id === selection.pathwayId)?.shortTitle ??
  "None";

const resultLabel = (result: GradeEntry | undefined): string => result || "Missing";

const completionStatus = (result: GradeEntry): string =>
  isCompletedResult(result) ? "Completed" : courseAlertDetails(result).label;

const gpaPointLabel = (result: GradeEntry): string => {
  const points = resultPointHundredths(result);
  return points === null ? "" : (points / 100).toFixed(2);
};

const makeCsv = (report: ReportData): string => {
  const rows: Array<Array<string | number | null | undefined>> = [];
  const add = (...values: Array<string | number | null | undefined>) => rows.push(values);
  const blank = () => rows.push([]);
  const selectedPlan = report.projection.possiblePlans[0];
  const selectedPlanGrades = selectedPlan?.grades ?? report.projection.recommendedGrades;
  const alertIds = uniqueCourseIds(
    report.graduation.mandatoryRepeatCourseIds,
    report.graduation.pendingCourseIds,
    report.graduation.failCourseIds
  );

  add("FMSC GPA Calculator & Planner Export");
  add("Generated", new Date().toLocaleString());
  add("Saved data updated", report.data.updatedAt);
  blank();

  add("Summary");
  add("Programme", report.programme.programmeName);
  add("Pathway / option", pathwayLabel(report.programme, report.activeSelection));
  add("Current GPA", report.overallGpa.gpa);
  add("GPA detail", report.overallGpa.message);
  add("Graded credits", report.overallGpa.gradedCredits);
  add("Completed credits", report.completedCredits);
  add("Prescribed credits", report.prescribedCredits);
  add("Graduation dashboard status", report.graduation.canGraduateProvisionally ? "Ready" : "Not Ready");
  add("Current class standing", report.classification.awardedClass);
  add("Class evaluated credits", report.classification.evaluatedCredits);
  add("Academic alerts", alertIds.length);
  add("Unresolved courses", report.graduation.unresolvedCourseIds.length);
  blank();

  add("Current GPA Planner Scenario");
  add("Scenario", report.scenario.name);
  add("Target GPA", report.scenario.targetGpa.toFixed(2));
  add("Current GPA in planner", report.projection.currentGpa.gpa);
  add("Suggested final GPA", report.projection.recommendedGpa);
  add("Possible GPA range", `${formatGpa(report.projection.minPossibleGpa)} - ${formatGpa(report.projection.maxPossibleGpa)}`);
  add("Remaining GPA credits", report.projection.remainingGpaCredits);
  add("Required average", report.projection.requiredAverageLabel);
  add("Planner note", report.projection.recommendationSummary);
  blank();

  add("Future Grade Plans");
  add("Plan", "Final GPA", "Description");
  report.projection.possiblePlans.forEach((plan) => {
    add(plan.name, plan.gpa, plan.description);
  });
  blank();

  add("Suggested Future Course Grades");
  add("Year", "Semester", "Code", "Title", "Credits", "Suggested grade");
  report.courses
    .filter((course) => report.projection.remainingCourseIds.includes(course.id))
    .forEach((course) => {
      add(course.year, course.semester, course.code, course.title, course.credits, selectedPlanGrades[course.id] ?? "");
    });
  blank();

  add("All Course Results");
  add(
    "Year",
    "Semester",
    "Code",
    "Title",
    "Credits",
    "Course type",
    "Entered result",
    "Effective result",
    "GPA points",
    "Completion status",
    "Alert detail",
    "Source page",
    "Source table",
    "Course notes",
    "Student notes"
  );
  report.courses.forEach((course) => {
    const record = report.records[course.id];
    const effectiveResult = report.effectiveResults[course.id] ?? "";
    const alert = isCompletedResult(effectiveResult) ? "" : courseAlertDetails(effectiveResult).detail;
    add(
      course.year,
      course.semester,
      course.code,
      course.title,
      course.credits,
      course.status,
      resultLabel(record?.result),
      resultLabel(effectiveResult),
      gpaPointLabel(effectiveResult),
      completionStatus(effectiveResult),
      alert,
      course.sourcePage,
      course.sourceTable,
      course.notes?.join(" | ") ?? "",
      record?.notes ?? ""
    );
  });
  blank();

  add("Attempt History");
  add(
    "Year",
    "Semester",
    "Code",
    "Title",
    "Attempt number",
    "Attempt type",
    "Result",
    "Approved privileges",
    "Academic year",
    "Grade used in GPA",
    "Notes"
  );
  report.courses.forEach((course) => {
    const attempts = report.records[course.id]?.attempts ?? [];
    attempts.forEach((attempt) => {
      add(
        course.year,
        course.semester,
        course.code,
        course.title,
        attempt.attemptNumber,
        attempt.attemptType,
        resultLabel(attempt.result),
        attempt.approvedPrivileges ? "Yes" : "No",
        attempt.academicYear ?? "",
        attempt.gradeUsedInGpa ?? "",
        attempt.notes ?? ""
      );
    });
  });
  blank();

  add("Annual Progress");
  add("Year", "GPA", "Completed credits", "Total credits", "Status");
  report.graduation.yearProgress.forEach((year) => {
    add(year.year, year.gpa.gpa, year.completedCredits, year.totalCredits, year.status);
  });
  blank();

  add("Graduation Checklist");
  add("Item", "Status", "Detail");
  report.graduation.checklist.forEach((item) => {
    add(item.label, item.status, item.detail);
  });
  blank();

  add("Current Class Standing");
  add("Class", "Eligible", "High-grade credits", "Evaluated credits", "Poor pass courses", "Reasons");
  report.classification.results.forEach((result) => {
    add(
      result.className,
      result.eligible ? "Yes" : "No",
      result.highGradeCredits,
      result.evaluatedCredits,
      result.poorGradeCourseCount,
      result.reasons.join(" | ")
    );
  });
  blank();

  add("Academic Alerts");
  add("Code", "Title", "Alert", "Detail");
  alertIds.forEach((id) => {
    const course = report.courses.find((item) => item.id === id);
    const alert = courseAlertDetails(report.effectiveResults[id] ?? "");
    add(course?.code ?? id, course?.title ?? "Unknown course", alert.label, alert.detail);
  });
  blank();

  add("Selection Status");
  add("Status", report.selectionIssues.length === 0 ? "Complete" : "Needs attention");
  report.selectionIssues.forEach((issue) => add("Issue", issue.message));

  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
};

const StatusIcon = ({ status }: { status: "met" | "not-met" | "provisional" | "unknown" }) => {
  if (status === "met") {
    return <CheckCircle2 aria-hidden="true" className="status-icon ok" />;
  }
  if (status === "not-met") {
    return <XCircle aria-hidden="true" className="status-icon danger" />;
  }
  return <AlertTriangle aria-hidden="true" className="status-icon warn" />;
};

const ResultSelect = ({
  value,
  onChange,
  compact = false
}: {
  value: GradeEntry;
  onChange: (value: GradeEntry) => void;
  compact?: boolean;
}) => (
  <select
    className={clsx("control", compact && "compact-control")}
    value={value}
    onChange={(event) => onChange(event.target.value as GradeEntry)}
  >
    {resultOptions.map((option) => (
      <option key={option || "blank"} value={option}>
        {option || "Missing"}
      </option>
    ))}
  </select>
);

function App() {
  const [data, setData] = useState<StudentData>(initialData);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [query, setQuery] = useState("");
  const [storageNoticeAccepted, setStorageNoticeAccepted] = useState(
    loadStorageNoticeAccepted
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    data.plannerScenarios[0]?.id ?? ""
  );

  const activeSelection =
    data.activeSelection ?? defaultSelectionForProgramme(programmes[0].programmeId);
  const programme = programmeById.get(activeSelection.programmeId) ?? programmes[0];
  const selectedCourses = useMemo(
    () => getSelectedCourses(programme, activeSelection),
    [programme, activeSelection]
  );
  const courseMap = useMemo(
    () => new Map(selectedCourses.map((course) => [course.id, course])),
    [selectedCourses]
  );
  const effectiveResults = useMemo(
    () => effectiveResultMap(selectedCourses, data.courseRecords),
    [selectedCourses, data.courseRecords]
  );
  const overallGpa = useMemo(
    () => calculateCourseGpa(selectedCourses, effectiveResults),
    [selectedCourses, effectiveResults]
  );
  const graduation = useMemo(
    () =>
      evaluateGraduation(
        programme,
        activeSelection,
        data.courseRecords,
        data.registrationInfo
      ),
    [programme, activeSelection, data.courseRecords, data.registrationInfo]
  );
  const classification = useMemo(
    () =>
      evaluateClassification(
        programme,
        activeSelection,
        data.courseRecords,
        data.registrationInfo
      ),
    [programme, activeSelection, data.courseRecords, data.registrationInfo]
  );
  const selectionIssues = useMemo(
    () => getSelectionIssues(programme, activeSelection),
    [programme, activeSelection]
  );
  const activeScenario =
    data.plannerScenarios.find((scenario) => scenario.id === activeScenarioId) ??
    data.plannerScenarios[0] ??
    defaultScenario(3.3);
  const projection = useMemo(
    () => calculatePlannerProjection(selectedCourses, data.courseRecords, activeScenario),
    [selectedCourses, data.courseRecords, activeScenario]
  );
  const filteredCourses = selectedCourses.filter((course) => {
    const matchesYear = yearFilter === "all" || course.year === yearFilter;
    const haystack = `${course.code} ${course.title}`.toLowerCase();
    return matchesYear && haystack.includes(query.trim().toLowerCase());
  });

  const prescribedCredits = getPrescribedProgrammeCredits(programme, activeSelection);
  const completedCredits = selectedCourses
    .filter((course) => isCompletedResult(effectiveResults[course.id] ?? ""))
    .reduce((sum, course) => sum + course.credits, 0);
  const reportData: ReportData = {
    data,
    programme,
    activeSelection,
    courses: selectedCourses,
    records: data.courseRecords,
    effectiveResults,
    overallGpa,
    completedCredits,
    prescribedCredits,
    graduation,
    classification,
    selectionIssues,
    scenario: activeScenario,
    projection
  };

  useEffect(() => {
    saveStudentData(data);
    document.documentElement.dataset.theme = data.preferences.theme;
  }, [data]);

  useEffect(() => {
    if (!data.plannerScenarios.some((scenario) => scenario.id === activeScenarioId)) {
      setActiveScenarioId(data.plannerScenarios[0]?.id ?? "");
    }
  }, [activeScenarioId, data.plannerScenarios]);

  const updateData = (updater: (previous: StudentData) => StudentData): void => {
    setData((previous) => ({
      ...updater(previous),
      updatedAt: new Date().toISOString()
    }));
  };

  const updateSelection = (selection: CurriculumSelection): void => {
    updateData((previous) => ({
      ...previous,
      activeSelection: selection
    }));
  };

  const updateCourseRecord = (
    courseId: string,
    updater: (record: CourseRecord) => CourseRecord
  ): void => {
    updateData((previous) => {
      const record = previous.courseRecords[courseId] ?? createCourseRecord(courseId);
      return {
        ...previous,
        courseRecords: {
          ...previous.courseRecords,
          [courseId]: updater(record)
        }
      };
    });
  };

  const updateScenario = (
    scenarioId: string,
    updater: (scenario: PlannerScenario) => PlannerScenario
  ): void => {
    updateData((previous) => ({
      ...previous,
      plannerScenarios: previous.plannerScenarios.map((scenario) =>
        scenario.id === scenarioId
          ? { ...updater(scenario), updatedAt: new Date().toISOString() }
          : scenario
      )
    }));
  };

  const changeProgramme = (programmeId: string): void => {
    if (
      data.activeSelection &&
      data.activeSelection.programmeId !== programmeId &&
      !window.confirm("Switch programme? Existing results are preserved, but they may not align with the new curriculum.")
    ) {
      return;
    }
    updateSelection(defaultSelectionForProgramme(programmeId));
  };

  const changePathway = (pathwayId: string): void => {
    updateSelection(defaultSelectionForProgramme(programme.programmeId, pathwayId));
  };

  const toggleElective = (group: ElectiveGroup, course: Course, checked: boolean): void => {
    const current = activeSelection.electiveSelections[group.id] ?? [];
    const currentCourses = group.availableCourses.filter((option) => current.includes(option.id));
    const currentCredits = sumCredits(currentCourses);
    const requiredCredits =
      group.requiredCredits ?? group.requiredSelectionCount * (group.availableCourses[0]?.credits ?? 0);
    let next = current;
    if (checked) {
      if (group.maximumSelectionCount === 1) {
        next = [course.id];
      } else if (
        current.length < group.maximumSelectionCount &&
        currentCredits + course.credits <= requiredCredits
      ) {
        next = [...current, course.id];
      }
    } else {
      next = current.filter((courseId) => courseId !== course.id);
    }
    updateSelection({
      ...activeSelection,
      electiveSelections: {
        ...activeSelection.electiveSelections,
        [group.id]: next
      }
    });
  };

  const addScenario = (): void => {
    const scenario = {
      ...defaultScenario(3.3),
      id: newId(),
      name: `Scenario ${data.plannerScenarios.length + 1}`
    };
    updateData((previous) => ({
      ...previous,
      plannerScenarios: [...previous.plannerScenarios, scenario]
    }));
    setActiveScenarioId(scenario.id);
  };

  const resetAll = (): void => {
    if (window.confirm("Reset all locally stored data for this calculator?")) {
      setData({
        ...createEmptyStudentData(),
        activeSelection: defaultSelectionForProgramme(programmes[0].programmeId)
      });
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="logo-frame" aria-hidden="true">
            <img src={usjpLogo} alt="" />
          </div>
          <div className="brand-copy">
            <p className="eyebrow">University of Sri Jayewardenepura - Prospectus 2026</p>
            <h1>FMSC GPA Calculator &amp; Planner</h1>
            <p className="brand-subtitle">Faculty of Management Studies and Commerce</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="pill">Prospectus 2026</span>
          <button
            type="button"
            className="secondary-button danger-text topbar-reset"
            onClick={resetAll}
            title="Reset all saved calculator data"
          >
            <RefreshCcw aria-hidden="true" size={16} /> Reset Data
          </button>
        </div>
      </header>

      <section className="workspace-layout">
        <aside className="sidebar">
          <ProgrammeControls
            programme={programme}
            activeSelection={activeSelection}
            onProgrammeChange={changeProgramme}
            onPathwayChange={changePathway}
            onToggleElective={toggleElective}
            issues={selectionIssues}
          />
        </aside>

        <main className="main-area">
          <nav className="tabbar" aria-label="Application sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={clsx("tab-button", activeTab === tab.id && "active")}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {activeTab === "dashboard" && (
            <Dashboard
              programme={programme}
              selectedCourses={selectedCourses}
              overallGpa={overallGpa.gpa}
              completedCredits={completedCredits}
              prescribedCredits={prescribedCredits}
              graduation={graduation}
              classification={classification}
              selectionIssues={selectionIssues}
              courseMap={courseMap}
              effectiveResults={effectiveResults}
            />
          )}

          {activeTab === "results" && (
            <ResultsView
              courses={filteredCourses}
              allCourses={selectedCourses}
              records={data.courseRecords}
              effectiveResults={effectiveResults}
              gradeEntryMode={data.preferences.gradeEntryMode}
              yearFilter={yearFilter}
              query={query}
              onYearFilterChange={setYearFilter}
              onQueryChange={setQuery}
              onUpdateRecord={updateCourseRecord}
            />
          )}

          {activeTab === "planner" && (
            <PlannerView
              courses={selectedCourses}
              scenario={activeScenario}
              scenarios={data.plannerScenarios}
              projection={projection}
              records={data.courseRecords}
              onActiveScenarioChange={setActiveScenarioId}
              onScenarioChange={updateScenario}
              onAddScenario={addScenario}
              onDeleteScenario={(scenarioId) =>
                updateData((previous) => ({
                  ...previous,
                  plannerScenarios: previous.plannerScenarios.filter((scenario) => scenario.id !== scenarioId)
                }))
              }
            />
          )}

          {activeTab === "progress" && (
            <ProgressView
              graduation={graduation}
              classification={classification}
              courseMap={courseMap}
              effectiveResults={effectiveResults}
            />
          )}

          {activeTab === "rules" && <RulesView />}

          {activeTab === "data" && (
            <DataView
              data={data}
              courses={selectedCourses}
              records={data.courseRecords}
              onUpdateData={updateData}
              onExportCsv={() =>
                downloadText("fmsc-gpa-summary.csv", makeCsv(reportData), "text/csv;charset=utf-8")
              }
              onPrint={() => window.print()}
              onReset={resetAll}
            />
          )}
        </main>
      </section>
      <PrintReport report={reportData} />
      {!storageNoticeAccepted && (
        <div className="storage-banner" role="status">
          <div>
            <strong>Saved on this device</strong>
            <span>
              Results are stored in this browser only. They are not uploaded or shared with other students.
            </span>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              saveStorageNoticeAccepted();
              setStorageNoticeAccepted(true);
            }}
          >
            Got It
          </button>
        </div>
      )}
    </div>
  );
}

const ProgrammeControls = ({
  programme,
  activeSelection,
  issues,
  onProgrammeChange,
  onPathwayChange,
  onToggleElective
}: {
  programme: (typeof programmes)[number];
  activeSelection: CurriculumSelection;
  issues: ReturnType<typeof getSelectionIssues>;
  onProgrammeChange: (programmeId: string) => void;
  onPathwayChange: (pathwayId: string) => void;
  onToggleElective: (group: ElectiveGroup, course: Course, checked: boolean) => void;
}) => {
  const groups = getApplicableElectiveGroups(programme, activeSelection);

  return (
    <div className="control-stack">
      <div className="panel">
        <label className="field-label" htmlFor="programme">
          Degree Programme
        </label>
        <select
          id="programme"
          className="control"
          value={programme.programmeId}
          onChange={(event) => onProgrammeChange(event.target.value)}
        >
          {programmes.map((item) => (
            <option key={item.programmeId} value={item.programmeId}>
              {item.programmeName}
            </option>
          ))}
        </select>
      </div>

      {programme.pathways.length > 0 && (
        <div className="panel">
          <span className="field-label">Pathway or option</span>
          <div className="segmented vertical">
            {programme.pathways.map((pathway) => (
              <button
                key={pathway.id}
                type="button"
                className={clsx(activeSelection.pathwayId === pathway.id && "active")}
                onClick={() => onPathwayChange(pathway.id)}
              >
                {pathway.shortTitle}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.map((group) => {
        const selected = activeSelection.electiveSelections[group.id] ?? [];
        const selectedCredits = sumCredits(group.availableCourses.filter((course) => selected.includes(course.id)));
        const requiredCredits =
          group.requiredCredits ?? group.requiredSelectionCount * (group.availableCourses[0]?.credits ?? 0);
        const singleSelection = group.maximumSelectionCount === 1;
        return (
          <div className="panel" key={group.id}>
            <div className="panel-heading">
              <span>{group.title}</span>
              <span className="small">{selectedCredits}/{requiredCredits} Credits</span>
            </div>
            <div className="choice-list">
              {group.availableCourses
                .filter((course) => isCourseApplicable(course, activeSelection.pathwayId))
                .map((course) => {
                  const checked = selected.includes(course.id);
                  const disabled =
                    !singleSelection &&
                    !checked &&
                    (selected.length >= group.maximumSelectionCount ||
                      selectedCredits + course.credits > requiredCredits);
                  return (
                    <label key={course.id} className={clsx("choice-row", disabled && "disabled")}>
                      <input
                        type={singleSelection ? "radio" : "checkbox"}
                        name={singleSelection ? group.id : undefined}
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => onToggleElective(group, course, event.target.checked)}
                      />
                      <span>
                        <strong>{course.code}</strong> {course.title}
                      </span>
                      <span>{course.credits}</span>
                    </label>
                  );
                })}
            </div>
            {group.notes?.map((note) => (
              <p className="fine-print" key={note}>
                {note}
              </p>
            ))}
          </div>
        );
      })}

      {issues.length > 0 && (
        <div className="alert-list">
          {issues.map((issue) => (
            <div className="alert" key={`${issue.type}-${issue.groupId ?? issue.message}`}>
              <AlertTriangle aria-hidden="true" size={16} />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Dashboard = ({
  programme,
  selectedCourses,
  overallGpa,
  completedCredits,
  prescribedCredits,
  graduation,
  classification,
  selectionIssues,
  courseMap,
  effectiveResults
}: {
  programme: (typeof programmes)[number];
  selectedCourses: Course[];
  overallGpa: string | null;
  completedCredits: number;
  prescribedCredits: number;
  graduation: ReturnType<typeof evaluateGraduation>;
  classification: ReturnType<typeof evaluateClassification>;
  selectionIssues: ReturnType<typeof getSelectionIssues>;
  courseMap: Map<string, Course>;
  effectiveResults: Record<string, GradeEntry>;
}) => {
  const alertIds = uniqueCourseIds(
    graduation.mandatoryRepeatCourseIds,
    graduation.pendingCourseIds,
    graduation.failCourseIds
  );

  return (
    <div className="view-stack">
      <section className="metric-grid">
        <div className="metric">
          <span>Overall GPA</span>
          <strong>{formatGpa(overallGpa)}</strong>
          <small>{graduation.overallGpa.message}</small>
        </div>
        <div className="metric">
          <span>Credits</span>
          <strong>{completedCredits}/{prescribedCredits}</strong>
          <small>{selectedCourses.length} selected courses</small>
        </div>
        <div className="metric">
          <span>Graduation</span>
          <strong>{graduation.canGraduateProvisionally ? "Ready" : "Not Ready"}</strong>
          <small>{graduation.disclaimer}</small>
        </div>
        <div className="metric">
          <span>Current Standing</span>
          <strong>{classification.awardedClass}</strong>
          <small>Based on {classification.evaluatedCredits} currently graded credits</small>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <span>{programme.programmeName}</span>
          <span className="small">Prospectus total {formatExpected(programme.expectedTotals.programmeCredits)} credits</span>
        </div>
        <div className="year-grid">
          {graduation.yearProgress.map((year) => {
            const ratio = year.totalCredits === 0 ? 0 : Math.round((year.completedCredits / year.totalCredits) * 100);
            return (
              <div className="year-strip" key={year.year}>
                <div>
                  <strong>Year {year.year}</strong>
                  <span>{year.status}</span>
                </div>
                <div className="bar" aria-label={`Year ${year.year} completed credits`}>
                  <span style={{ width: `${ratio}%` }} />
                </div>
                <small>{year.completedCredits}/{year.totalCredits} credits - GPA {formatGpa(year.gpa.gpa)}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-heading">
            <span>Academic alerts</span>
            <span className="small">
              {alertIds.length} {alertIds.length === 1 ? "alert" : "alerts"}
            </span>
          </div>
          <AlertCourseList
            ids={alertIds}
            courseMap={courseMap}
            effectiveResults={effectiveResults}
          />
        </div>
        <div className="panel">
          <div className="panel-heading">
            <span>Selection status</span>
            <span className="small">{selectionIssues.length === 0 ? "complete" : "needs attention"}</span>
          </div>
          {selectionIssues.length === 0 ? (
            <p className="empty-state">Pathway and elective selections satisfy the encoded Prospectus rules.</p>
          ) : (
            <ul className="plain-list">
              {selectionIssues.map((issue) => (
                <li key={issue.message}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const AlertCourseList = ({
  ids,
  courseMap,
  effectiveResults
}: {
  ids: string[];
  courseMap: Map<string, Course>;
  effectiveResults: Record<string, GradeEntry>;
}) => {
  if (ids.length === 0) {
    return <p className="empty-state">No repeat, pending, or failed courses in the active selection.</p>;
  }
  return (
    <ul className="course-alert-list">
      {ids.slice(0, 8).map((id) => {
        const result = effectiveResults[id] ?? "";
        const alert = courseAlertDetails(result);
        return (
          <li key={id}>
            <span>{courseLabel(courseMap.get(id))}</span>
            <strong>{alert.label}</strong>
            <small>{alert.detail}</small>
          </li>
        );
      })}
      {ids.length > 8 && <li>{ids.length - 8} more courses</li>}
    </ul>
  );
};

const ResultsView = ({
  courses,
  allCourses,
  records,
  effectiveResults,
  gradeEntryMode,
  yearFilter,
  query,
  onYearFilterChange,
  onQueryChange,
  onUpdateRecord
}: {
  courses: Course[];
  allCourses: Course[];
  records: Record<string, CourseRecord>;
  effectiveResults: Record<string, GradeEntry>;
  gradeEntryMode: "grade" | "marks";
  yearFilter: YearFilter;
  query: string;
  onYearFilterChange: (year: YearFilter) => void;
  onQueryChange: (query: string) => void;
  onUpdateRecord: (courseId: string, updater: (record: CourseRecord) => CourseRecord) => void;
}) => {
  const semesterGroups = courses.reduce<
    Array<{
      key: string;
      year: YearLevel;
      semester: Course["semester"];
      courses: Course[];
    }>
  >((groups, course) => {
    const key = `Y${course.year}S${course.semester}`;
    const group = groups.find((item) => item.key === key);
    if (group) {
      group.courses.push(course);
    } else {
      groups.push({
        key,
        year: course.year,
        semester: course.semester,
        courses: [course]
      });
    }
    return groups;
  }, []);

  return (
    <div className="view-stack">
      <section className="panel toolbar">
        <div className="segmented">
          {(["all", 1, 2, 3, 4] as const).map((year) => (
            <button
              key={year}
              type="button"
              className={clsx(yearFilter === year && "active")}
              onClick={() => onYearFilterChange(year)}
            >
              {year === "all" ? "All" : `Y${year}`}
            </button>
          ))}
        </div>
        <input
          className="control"
          type="search"
          value={query}
          placeholder="Course code or title"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <span className="small">{courses.length}/{allCourses.length} visible</span>
      </section>

      <section className="results-list">
        {semesterGroups.length === 0 ? (
          <div className="panel">
            <p className="empty-state">No courses match the current filter.</p>
          </div>
        ) : (
          semesterGroups.map((group) => (
            <div className="semester-group" key={group.key}>
              <div className="semester-heading">
                <strong>Year {group.year} - Semester {group.semester}</strong>
                <span>{group.courses.length} courses - {sumCredits(group.courses)} credits</span>
              </div>
              <div className="results-list">
                {group.courses.map((course) => (
                  <CourseResultRow
                    key={course.id}
                    course={course}
                    record={records[course.id]}
                    effectiveResult={effectiveResults[course.id] ?? ""}
                    gradeEntryMode={gradeEntryMode}
                    onUpdateRecord={onUpdateRecord}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

const CourseResultRow = ({
  course,
  record,
  effectiveResult,
  gradeEntryMode,
  onUpdateRecord
}: {
  course: Course;
  record?: CourseRecord;
  effectiveResult: GradeEntry;
  gradeEntryMode: "grade" | "marks";
  onUpdateRecord: (courseId: string, updater: (record: CourseRecord) => CourseRecord) => void;
}) => {
  const resolution = resolveAttempts(record?.result ?? "", record?.attempts ?? []);
  const updateResult = (value: GradeEntry): void =>
    onUpdateRecord(course.id, (current) => ({ ...current, result: value }));
  const addAttempt = (): void =>
    onUpdateRecord(course.id, (current) => ({
      ...current,
      attempts: [
        ...current.attempts,
        {
          id: newId(),
          attemptNumber: current.attempts.length + 1,
          result: "",
          attemptType: current.attempts.length === 0 ? "first" : "ordinary-repeat",
          approvedPrivileges: false
        }
      ]
    }));

  return (
    <article className="course-row">
      <div className="course-main">
        <div>
          <strong>{course.code}</strong>
          <span>{course.title}</span>
          <small>
            Y{course.year} S{course.semester} - {course.credits} credits - Page {course.sourcePage}
            {course.deliveryType === "annual" ? " - Annual" : ""}
          </small>
        </div>
        <div className="result-controls">
          {gradeEntryMode === "marks" && (
            <input
              className="control compact-control"
              type="number"
              min={0}
              max={100}
              placeholder="Marks"
              onBlur={(event) => {
                const value = event.currentTarget.value;
                if (value.trim() === "") {
                  return;
                }
                try {
                  updateResult(gradeFromMark(Number(value)));
                } catch {
                  window.alert("Marks must be between 0 and 100.");
                }
              }}
            />
          )}
          <ResultSelect value={record?.result ?? ""} onChange={updateResult} compact />
          <span className={clsx("result-chip", effectiveResult && "filled")}>
            {effectiveResult || "Excluded"}
          </span>
          <button className="icon-button" type="button" onClick={addAttempt} title="Add attempt">
            <Plus aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      {(record?.attempts.length ?? 0) > 0 && (
        <div className="attempts-panel">
          <div className="resolution-line">
            Effective result: {resolution.gradeUsedInGpa || "none"} - {resolution.reason}
          </div>
          {record?.attempts.map((attempt) => (
            <AttemptEditor
              key={attempt.id}
              attempt={attempt}
              onChange={(next) =>
                onUpdateRecord(course.id, (current) => ({
                  ...current,
                  attempts: current.attempts.map((item) => (item.id === attempt.id ? next : item))
                }))
              }
              onRemove={() =>
                onUpdateRecord(course.id, (current) => ({
                  ...current,
                  attempts: current.attempts.filter((item) => item.id !== attempt.id)
                }))
              }
            />
          ))}
        </div>
      )}
    </article>
  );
};

const AttemptEditor = ({
  attempt,
  onChange,
  onRemove
}: {
  attempt: AttemptRecord;
  onChange: (attempt: AttemptRecord) => void;
  onRemove: () => void;
}) => (
  <div className="attempt-row">
    <span>#{attempt.attemptNumber}</span>
    <ResultSelect
      value={attempt.result}
      compact
      onChange={(result) => onChange({ ...attempt, result })}
    />
    <select
      className="control"
      value={attempt.attemptType}
      onChange={(event) => onChange({ ...attempt, attemptType: event.target.value as AttemptType })}
    >
      {attemptTypes.map((item) => (
        <option value={item.value} key={item.value}>
          {item.label}
        </option>
      ))}
    </select>
    <label className="inline-check">
      <input
        type="checkbox"
        checked={attempt.approvedPrivileges}
        onChange={(event) => onChange({ ...attempt, approvedPrivileges: event.target.checked })}
      />
      Approved
    </label>
    <input
      className="control"
      value={attempt.academicYear ?? ""}
      placeholder="Academic year"
      onChange={(event) => onChange({ ...attempt, academicYear: event.target.value })}
    />
    <button className="icon-button danger" type="button" onClick={onRemove} title="Remove attempt">
      <Trash2 aria-hidden="true" size={16} />
    </button>
  </div>
);

const PlannerView = ({
  courses,
  scenario,
  scenarios,
  projection,
  records,
  onActiveScenarioChange,
  onScenarioChange,
  onAddScenario,
  onDeleteScenario
}: {
  courses: Course[];
  scenario: PlannerScenario;
  scenarios: PlannerScenario[];
  projection: ReturnType<typeof calculatePlannerProjection>;
  records: Record<string, CourseRecord>;
  onActiveScenarioChange: (scenarioId: string) => void;
  onScenarioChange: (scenarioId: string, updater: (scenario: PlannerScenario) => PlannerScenario) => void;
  onAddScenario: () => void;
  onDeleteScenario: (scenarioId: string) => void;
}) => {
  const targetPresets = [
    { label: "Pass", value: 2 },
    { label: "Second Lower", value: 3 },
    { label: "Second Upper", value: 3.3 },
    { label: "First Class", value: 3.7 }
  ];
  const effectiveResults = effectiveResultMap(courses, records);
  const remainingCourses = courses.filter((course) => projection.remainingCourseIds.includes(course.id));
  const plans = projection.possiblePlans;
  const [activePlanId, setActivePlanId] = useState("");
  useEffect(() => {
    if (!plans.some((plan) => plan.id === activePlanId)) {
      setActivePlanId(plans[0]?.id ?? "");
    }
  }, [activePlanId, plans]);
  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[0];
  const activeGrades = activePlan?.grades ?? projection.recommendedGrades;
  const suggestedCount = Object.keys(activeGrades).length;

  return (
    <div className="view-stack">
      <section className="panel toolbar">
        <select
          className="control"
          value={scenario.id}
          onChange={(event) => onActiveScenarioChange(event.target.value)}
        >
          {scenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="button" className="secondary-button" onClick={onAddScenario}>
          <Plus aria-hidden="true" size={16} /> Scenario
        </button>
        {scenarios.length > 1 && (
          <button type="button" className="icon-button danger" onClick={() => onDeleteScenario(scenario.id)} title="Delete scenario">
            <Trash2 aria-hidden="true" size={16} />
          </button>
        )}
      </section>

      <section className="metric-grid">
        <div className="metric">
          <span>Current GPA</span>
          <strong>{formatGpa(projection.currentGpa.gpa)}</strong>
          <small>{projection.gradedCredits} graded credits</small>
        </div>
        <div className="metric">
          <span>Selected Plan GPA</span>
          <strong>{formatGpa(activePlan?.gpa ?? projection.recommendedGpa)}</strong>
          <small>{plans.length} possible plans</small>
        </div>
        <div className={clsx("metric", projection.impossible && "danger-metric")}>
          <span>Target</span>
          <strong>{projection.targetGpa.toFixed(2)}</strong>
          <small>{projection.requiredAverageLabel}</small>
        </div>
        <div className="metric">
          <span>Possible range</span>
          <strong>{formatGpa(projection.minPossibleGpa)} - {formatGpa(projection.maxPossibleGpa)}</strong>
          <small>{projection.remainingGpaCredits} remaining GPA credits</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span>Scenario Target</span>
          <input
            className="control"
            value={scenario.name}
            onChange={(event) =>
              onScenarioChange(scenario.id, (current) => ({ ...current, name: event.target.value || "Scenario" }))
            }
          />
        </div>
        <div className="segmented">
          {targetPresets.map((target) => (
            <button
              type="button"
              key={target.label}
              className={clsx(scenario.targetGpa === target.value && "active")}
              onClick={() => onScenarioChange(scenario.id, (current) => ({ ...current, targetGpa: target.value }))}
              title={`${target.value.toFixed(2)} target GPA`}
            >
              <span>{target.label}</span>
              <small>{target.value.toFixed(2)}</small>
            </button>
          ))}
          <input
            className="control compact-control"
            type="number"
            min={0}
            max={4}
            step={0.01}
            value={scenario.targetGpa}
            onChange={(event) =>
              onScenarioChange(scenario.id, (current) => ({
                ...current,
                targetGpa: Math.max(0, Math.min(4, Number(event.target.value) || 0))
              }))
            }
          />
        </div>
        <div className="planner-summary">
          <div>
            <strong>Future grade plans</strong>
            <span>{projection.recommendationSummary}</span>
          </div>
        </div>
        {plans.length > 0 && (
          <div className="planner-plan-grid" aria-label="Possible future grade plans">
            {plans.map((plan, index) => (
              <button
                type="button"
                key={plan.id}
                className={clsx("plan-card", activePlan?.id === plan.id && "active")}
                onClick={() => setActivePlanId(plan.id)}
              >
                <strong>{index + 1}. {plan.name}</strong>
                <span>Final GPA {formatGpa(plan.gpa)}</span>
                <small>{plan.description}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="results-list">
        {remainingCourses.length === 0 ? (
          <div className="panel">
            <p className="empty-state">No remaining GPA-bearing courses in this scenario.</p>
          </div>
        ) : (
          remainingCourses.map((course) => (
            <article className="course-row compact-row" key={course.id}>
              <div>
                <strong>{course.code}</strong>
                <span>{course.title}</span>
                <small>{course.credits} credits - current {effectiveResults[course.id] || "missing"}</small>
              </div>
              <div className="planner-course-actions">
                <span className={clsx("suggest-chip", projection.impossible && "muted")}>
                  Aim {activeGrades[course.id] ?? "A"}
                </span>
              </div>
            </article>
          ))
        )}
        {projection.impossible && (
          <div className="alert danger-alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>
              {projection.targetGpa.toFixed(2)} is outside the possible range for the remaining courses.
            </span>
          </div>
        )}
      </section>
    </div>
  );
};

const ProgressView = ({
  graduation,
  classification,
  courseMap,
  effectiveResults
}: {
  graduation: ReturnType<typeof evaluateGraduation>;
  classification: ReturnType<typeof evaluateClassification>;
  courseMap: Map<string, Course>;
  effectiveResults: Record<string, GradeEntry>;
}) => (
  <div className="view-stack">
    <section className="panel">
      <div className="panel-heading">
        <span>Graduation checklist</span>
        <span className="small">{graduation.canGraduateProvisionally ? "Ready" : "Not Ready"}</span>
      </div>
      <div className="check-list">
        {graduation.checklist.map((item) => (
          <div className="check-row" key={item.id}>
            <StatusIcon status={item.status} />
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="fine-print">{graduation.disclaimer}</p>
    </section>

    <section className="two-column">
      <div className="panel">
        <div className="panel-heading">
          <span>Annual pass status</span>
          <span className="small">GPA 2.00 and no D/E/AB</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>GPA</th>
                <th>Credits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {graduation.yearProgress.map((year) => (
                <tr key={year.year}>
                  <td>Y{year.year}</td>
                  <td>{formatGpa(year.gpa.gpa)}</td>
                  <td>{year.completedCredits}/{year.totalCredits}</td>
                  <td>{year.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <span>Current Class Standing</span>
          <span className="small">{classification.awardedClass}</span>
        </div>
        <div className="class-list">
          {classification.results.map((result) => (
            <div className="class-row" key={result.className}>
              <div>
                <strong>{result.className}</strong>
                <span>
                  {result.className === "Pass"
                    ? `${classification.currentGpa ?? "--"} current GPA from ${classification.evaluatedCredits} graded credits`
                    : `${result.highGradeCredits}/${result.requiredHighGradeCredits} high-grade credits from ${result.evaluatedCredits} graded credits - ${result.poorGradeCourseCount} poor pass courses`}
                </span>
              </div>
              <span className={clsx("result-chip", result.eligible && "filled")}>
                {result.eligible ? "Eligible" : "No"}
              </span>
              {result.reasons.length > 0 && (
                <ul className="plain-list compact">
                  {result.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="panel">
      <div className="panel-heading">
        <span>Unresolved courses</span>
        <span className="small">{graduation.unresolvedCourseIds.length}</span>
      </div>
      <AlertCourseList
        ids={graduation.unresolvedCourseIds}
        courseMap={courseMap}
        effectiveResults={effectiveResults}
      />
    </section>
  </div>
);

const RulesView = () => (
  <div className="view-stack">
    <section className="panel">
      <div className="panel-heading">
        <span>Official grade scale</span>
        <span className="small">GPA points</span>
      </div>
      <div className="grade-grid">
        {MARK_BANDS.map((band) => (
          <div className="grade-cell" key={`${band.min}-${band.max}`}>
            <strong>{band.grade}</strong>
            <span>{band.min}-{band.max}</span>
            <small>{(GRADE_POINTS_HUNDREDTHS[band.grade] / 100).toFixed(2)}</small>
          </div>
        ))}
      </div>
    </section>

    <section className="two-column">
      <div className="panel">
        <div className="panel-heading">
          <span>Special result codes</span>
          <span className="small">GPA treatment</span>
        </div>
        <dl className="rules-list">
          <div><dt>AB</dt><dd>Absent; treated as E with 0.00 points and included in GPA credits.</dd></div>
          <div><dt>MC / DFR / INC</dt><dd>Pending result; excluded from GPA and marked provisional.</dd></div>
          <div><dt>P</dt><dd>Completed pass; excluded from GPA denominator.</dd></div>
          <div><dt>F</dt><dd>Fail alert; excluded from GPA and not completed.</dd></div>
        </dl>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <span>Repeat and class rules</span>
          <span className="small">Prospectus rules</span>
        </div>
        <ul className="plain-list">
          <li>D, E, and AB require a repeat. C- and D+ may be repeated.</li>
          <li>Ordinary repeat grades are capped at C; privileged medical/deferred attempts are not capped.</li>
          <li>GPA is weighted by credits and truncated to two decimals.</li>
          <li>Class credit thresholds count credits, not courses.</li>
          <li>Final class and graduation determinations remain with the University.</li>
        </ul>
      </div>
    </section>
  </div>
);

const PrintReport = ({ report }: { report: ReportData }) => {
  const alertIds = uniqueCourseIds(
    report.graduation.mandatoryRepeatCourseIds,
    report.graduation.pendingCourseIds,
    report.graduation.failCourseIds
  );
  const selectedPlan = report.projection.possiblePlans[0];
  const selectedPlanGrades = selectedPlan?.grades ?? report.projection.recommendedGrades;
  const remainingCourses = report.courses.filter((course) =>
    report.projection.remainingCourseIds.includes(course.id)
  );

  return (
    <section className="print-report" aria-label="Printable GPA summary report">
      <header className="print-report-header">
        <img src={usjpLogo} alt="" />
        <div>
          <p>University of Sri Jayewardenepura - FMSC</p>
          <h1>GPA Summary Report</h1>
          <span>Generated {new Date().toLocaleString()}</span>
        </div>
      </header>

      <section className="print-section">
        <h2>Dashboard Summary</h2>
        <div className="print-metric-grid">
          <div><span>Current GPA</span><strong>{formatGpa(report.overallGpa.gpa)}</strong></div>
          <div><span>Credits</span><strong>{report.completedCredits}/{report.prescribedCredits}</strong></div>
          <div><span>Graduation</span><strong>{report.graduation.canGraduateProvisionally ? "Ready" : "Not Ready"}</strong></div>
          <div><span>Current Standing</span><strong>{report.classification.awardedClass}</strong></div>
        </div>
        <dl className="print-key-grid">
          <div><dt>Programme</dt><dd>{report.programme.programmeName}</dd></div>
          <div><dt>Pathway / option</dt><dd>{pathwayLabel(report.programme, report.activeSelection)}</dd></div>
          <div><dt>Graded credits</dt><dd>{report.overallGpa.gradedCredits}</dd></div>
          <div><dt>Academic alerts</dt><dd>{alertIds.length}</dd></div>
        </dl>
      </section>

      <section className="print-section">
        <h2>Current GPA Planner Scenario</h2>
        <dl className="print-key-grid">
          <div><dt>Scenario</dt><dd>{report.scenario.name}</dd></div>
          <div><dt>Target GPA</dt><dd>{report.scenario.targetGpa.toFixed(2)}</dd></div>
          <div><dt>Suggested final GPA</dt><dd>{formatGpa(report.projection.recommendedGpa)}</dd></div>
          <div><dt>Possible range</dt><dd>{formatGpa(report.projection.minPossibleGpa)} - {formatGpa(report.projection.maxPossibleGpa)}</dd></div>
          <div><dt>Remaining GPA credits</dt><dd>{report.projection.remainingGpaCredits}</dd></div>
          <div><dt>Required average</dt><dd>{report.projection.requiredAverageLabel}</dd></div>
        </dl>
        <p>{report.projection.recommendationSummary}</p>
        {selectedPlan && (
          <p>
            Selected report plan: {selectedPlan.name} with final GPA {formatGpa(selectedPlan.gpa)}.
          </p>
        )}
      </section>

      <section className="print-section">
        <h2>Annual Progress</h2>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>GPA</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.graduation.yearProgress.map((year) => (
              <tr key={year.year}>
                <td>Year {year.year}</td>
                <td>{formatGpa(year.gpa.gpa)}</td>
                <td>{year.completedCredits}/{year.totalCredits}</td>
                <td>{year.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2>Academic Alerts</h2>
        {alertIds.length === 0 ? (
          <p>No repeat, pending, or failed courses in the active selection.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Alert</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {alertIds.map((id) => {
                const course = report.courses.find((item) => item.id === id);
                const alert = courseAlertDetails(report.effectiveResults[id] ?? "");
                return (
                  <tr key={id}>
                    <td>{courseLabel(course)}</td>
                    <td>{alert.label}</td>
                    <td>{alert.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-section">
        <h2>Selection Status</h2>
        {report.selectionIssues.length === 0 ? (
          <p>Pathway and elective selections satisfy the encoded Prospectus rules.</p>
        ) : (
          <ul className="print-list">
            {report.selectionIssues.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="print-section">
        <h2>Current Class Standing</h2>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Status</th>
              <th>High-grade credits</th>
              <th>Evaluated credits</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {report.classification.results.map((result) => (
              <tr key={result.className}>
                <td>{result.className}</td>
                <td>{result.eligible ? "Eligible" : "No"}</td>
                <td>{result.highGradeCredits}/{result.requiredHighGradeCredits}</td>
                <td>{result.evaluatedCredits}</td>
                <td>{result.reasons.join(" | ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {remainingCourses.length > 0 && (
        <section className="print-section">
          <h2>Suggested Future Grades</h2>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Semester</th>
                <th>Course</th>
                <th>Credits</th>
                <th>Suggested grade</th>
              </tr>
            </thead>
            <tbody>
              {remainingCourses.map((course) => (
                <tr key={course.id}>
                  <td>{course.year}</td>
                  <td>{course.semester}</td>
                  <td>{courseLabel(course)}</td>
                  <td>{course.credits}</td>
                  <td>{selectedPlanGrades[course.id] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="print-section">
        <h2>Graduation Checklist</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {report.graduation.checklist.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{item.status}</td>
                <td>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2>All Course Results</h2>
        <table>
          <thead>
            <tr>
              <th>Y/S</th>
              <th>Course</th>
              <th>Credits</th>
              <th>Entered</th>
              <th>Effective</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.courses.map((course) => {
              const effectiveResult = report.effectiveResults[course.id] ?? "";
              return (
                <tr key={course.id}>
                  <td>Y{course.year} S{course.semester}</td>
                  <td>{courseLabel(course)}</td>
                  <td>{course.credits}</td>
                  <td>{resultLabel(report.records[course.id]?.result)}</td>
                  <td>{resultLabel(effectiveResult)}</td>
                  <td>{completionStatus(effectiveResult)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="print-disclaimer">{report.graduation.disclaimer}</p>
    </section>
  );
};

const DataView = ({
  data,
  courses,
  records,
  onUpdateData,
  onExportCsv,
  onPrint,
  onReset
}: {
  data: StudentData;
  courses: Course[];
  records: Record<string, CourseRecord>;
  onUpdateData: (updater: (previous: StudentData) => StudentData) => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onReset: () => void;
}) => {
  const usedRecords = courses.filter((course) => records[course.id]).length;
  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <span>Preferences</span>
          <span className="small">{usedRecords} saved result records</span>
        </div>
        <div className="form-grid">
          <label>
            <span className="field-label">Grade entry</span>
            <select
              className="control"
              value={data.preferences.gradeEntryMode}
              onChange={(event) =>
                onUpdateData((previous) => ({
                  ...previous,
                  preferences: {
                    ...previous.preferences,
                    gradeEntryMode: event.target.value as "grade" | "marks"
                  }
                }))
              }
            >
              <option value="grade">Grades</option>
              <option value="marks">Marks</option>
            </select>
          </label>
          <label>
            <span className="field-label">Theme</span>
            <select
              className="control"
              value={data.preferences.theme}
              onChange={(event) =>
                onUpdateData((previous) => ({
                  ...previous,
                  preferences: {
                    ...previous.preferences,
                    theme: event.target.value as "light" | "dark"
                  }
                }))
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span>Storage &amp; Privacy</span>
          <span className="small">Browser only</span>
        </div>
        <p className="privacy-copy">
          Results are saved in this browser's local storage, not in a shared server database.
          A different student on another device or browser will not see this data.
        </p>
      </section>

      <section className="panel action-panel">
        <button type="button" className="secondary-button" onClick={onExportCsv}>
          <Download aria-hidden="true" size={16} /> Export CSV
        </button>
        <button type="button" className="secondary-button" onClick={onPrint}>
          <Printer aria-hidden="true" size={16} /> Print report
        </button>
        <button type="button" className="secondary-button danger-text" onClick={onReset}>
          <RefreshCcw aria-hidden="true" size={16} /> Reset
        </button>
      </section>
    </div>
  );
};

export default App;
