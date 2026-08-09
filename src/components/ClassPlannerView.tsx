import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Target, Trash2 } from "lucide-react";
import clsx from "clsx";

import { calculatePlannerProjection } from "../calculations/planner";
import { effectiveResultMap } from "../calculations/records";
import type {
  ClassName,
  Course,
  CourseRecord,
  PlannerScenario
} from "../domain/types";

interface ClassTargetPreset {
  label: string;
  className: ClassName;
  gpa: number;
  highGradeText: string;
}

const classTargets: ClassTargetPreset[] = [
  {
    label: "Pass",
    className: "Pass",
    gpa: 2,
    highGradeText: "Meet the pass GPA and clear mandatory repeats"
  },
  {
    label: "Second Lower",
    className: "Second Class (Lower Division)",
    gpa: 3,
    highGradeText: "At least half of graded credits at B+ or better"
  },
  {
    label: "Second Upper",
    className: "Second Class (Upper Division)",
    gpa: 3.3,
    highGradeText: "At least half of graded credits at A- or better"
  },
  {
    label: "First Class",
    className: "First Class",
    gpa: 3.7,
    highGradeText: "At least half of graded credits at A or better"
  }
];

const shortClassName = (className: ClassName | "Not yet eligible" | null): string => {
  switch (className) {
    case "Second Class (Upper Division)":
      return "Second Upper";
    case "Second Class (Lower Division)":
      return "Second Lower";
    case null:
      return "--";
    default:
      return className;
  }
};

const formatGpa = (value: string | null): string => value ?? "--";

export const ClassPlannerView = ({
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
  onScenarioChange: (
    scenarioId: string,
    updater: (scenario: PlannerScenario) => PlannerScenario
  ) => void;
  onAddScenario: () => void;
  onDeleteScenario: (scenarioId: string) => void;
}) => {
  const effectiveResults = effectiveResultMap(courses, records);
  const remainingCourses = courses.filter((course) =>
    projection.remainingCourseIds.includes(course.id)
  );
  const plans = projection.possiblePlans;
  const [activePlanId, setActivePlanId] = useState("");

  useEffect(() => {
    if (!plans.some((plan) => plan.id === activePlanId)) {
      setActivePlanId(plans[0]?.id ?? "");
    }
  }, [activePlanId, plans]);

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[0];
  const activeGrades = activePlan?.grades ?? projection.recommendedGrades;
  const selectedPreset = classTargets.find(
    (target) => target.className === scenario.classTarget
  );
  const targetClassLabel = projection.targetClass
    ? shortClassName(projection.targetClass)
    : "GPA only";
  const projectedClassLabel = shortClassName(
    activePlan?.projectedClass ?? projection.bestPossibleClass
  );
  const selectedPlanGpa = activePlan?.gpa ?? projection.recommendedGpa;
  const classPlanIsValid = projection.targetClass
    ? activePlan?.targetClassEligible === true
    : !projection.impossible;
  const highGradeText = projection.highGradeThreshold
    ? `${projection.highGradeThreshold} or better`
    : "No high-grade share requirement";

  const chooseClassTarget = (target: ClassTargetPreset): void => {
    onScenarioChange(scenario.id, (current) => ({
      ...current,
      classTarget: target.className,
      targetGpa: Math.max(current.targetGpa, target.gpa)
    }));
  };

  const chooseGpaOnly = (): void => {
    onScenarioChange(scenario.id, (current) => ({
      ...current,
      classTarget: undefined
    }));
  };

  const updateTargetGpa = (rawValue: number): void => {
    const classMinimum = selectedPreset?.gpa ?? 0;
    const nextValue = Math.max(classMinimum, Math.min(4, Math.max(0, rawValue || 0)));
    onScenarioChange(scenario.id, (current) => ({
      ...current,
      targetGpa: nextValue
    }));
  };

  return (
    <div className="view-stack class-planner">
      <section className="panel toolbar class-planner-toolbar">
        <select
          className="control"
          value={scenario.id}
          aria-label="Planner scenario"
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
          <button
            type="button"
            className="icon-button danger"
            onClick={() => onDeleteScenario(scenario.id)}
            title="Delete scenario"
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        )}
      </section>

      <section className="class-planner-metrics">
        <div className="metric class-primary-metric">
          <span>Current standing</span>
          <strong>{shortClassName(projection.currentClass)}</strong>
          <small>
            Current GPA {formatGpa(projection.currentGpa.gpa)} from {projection.gradedCredits} graded credits
          </small>
        </div>
        <div className="metric class-target-metric">
          <span>Target class</span>
          <strong>{targetClassLabel}</strong>
          <small>GPA floor {projection.targetGpa.toFixed(2)}</small>
        </div>
        <div className={clsx("metric", "class-plan-metric", !classPlanIsValid && projection.targetClass && "danger-metric")}>
          <span>Selected plan projects</span>
          <strong>{projectedClassLabel}</strong>
          <small>Final GPA {formatGpa(selectedPlanGpa)}</small>
        </div>
        <div className={clsx("metric", projection.impossible && "danger-metric")}>
          <span>Target feasibility</span>
          <strong>
            {projection.targetClass
              ? projection.classTargetPossible === true
                ? "Achievable"
                : "Blocked"
              : projection.impossible
                ? "Blocked"
                : "Achievable"}
          </strong>
          <small>
            Best case {shortClassName(projection.bestPossibleClass)} · GPA {formatGpa(projection.maxPossibleGpa)}
          </small>
        </div>
      </section>

      <section className="panel class-target-panel">
        <div className="panel-heading class-target-heading">
          <div>
            <span>Choose the outcome you want</span>
            <small className="small">Class rules are the primary constraint. GPA is planned alongside them.</small>
          </div>
          <input
            className="control scenario-name-control"
            value={scenario.name}
            aria-label="Scenario name"
            onChange={(event) =>
              onScenarioChange(scenario.id, (current) => ({
                ...current,
                name: event.target.value || "Scenario"
              }))
            }
          />
        </div>

        <div className="class-target-grid" aria-label="Class targets">
          {classTargets.map((target) => (
            <button
              type="button"
              key={target.className}
              className={clsx(
                "class-target-card",
                scenario.classTarget === target.className && "active"
              )}
              onClick={() => chooseClassTarget(target)}
            >
              <span>{target.label}</span>
              <strong>{target.gpa.toFixed(2)}</strong>
              <small>{target.highGradeText}</small>
            </button>
          ))}
          <button
            type="button"
            className={clsx("class-target-card", !scenario.classTarget && "active")}
            onClick={chooseGpaOnly}
          >
            <span>GPA only</span>
            <strong>{scenario.targetGpa.toFixed(2)}</strong>
            <small>Ignore class-distribution rules and plan only for a numeric GPA.</small>
          </button>
        </div>

        <div className="planner-gpa-row">
          <label>
            <span className="field-label">
              {scenario.classTarget ? "Additional GPA target" : "Target GPA"}
            </span>
            <input
              className="control"
              type="number"
              min={selectedPreset?.gpa ?? 0}
              max={4}
              step={0.01}
              value={scenario.targetGpa}
              onChange={(event) => updateTargetGpa(Number(event.target.value))}
            />
          </label>
          <div className="planner-gpa-facts">
            <div>
              <span>Current GPA</span>
              <strong>{formatGpa(projection.currentGpa.gpa)}</strong>
            </div>
            <div>
              <span>Plan GPA</span>
              <strong>{formatGpa(selectedPlanGpa)}</strong>
            </div>
            <div>
              <span>Possible GPA range</span>
              <strong>{formatGpa(projection.minPossibleGpa)} – {formatGpa(projection.maxPossibleGpa)}</strong>
            </div>
            <div>
              <span>Remaining credits</span>
              <strong>{projection.remainingGpaCredits}</strong>
            </div>
          </div>
        </div>
      </section>

      {projection.targetClass && (
        <section className="panel class-requirements-panel">
          <div className="panel-heading">
            <span>{shortClassName(projection.targetClass)} requirements</span>
            <span className={clsx("result-chip", projection.classTargetPossible === true && "filled")}>
              {projection.classTargetPossible === true ? "Plan found" : "Needs attention"}
            </span>
          </div>

          <div className="class-requirement-grid">
            <div className="requirement-card">
              <span>GPA floor</span>
              <strong>{projection.targetGpa.toFixed(2)}</strong>
              <small>{projection.requiredAverageLabel}</small>
            </div>
            <div className="requirement-card">
              <span>{highGradeText} credits</span>
              {projection.highGradeThreshold ? (
                <>
                  <strong>{projection.currentHighGradeCredits} / {projection.requiredHighGradeCredits}</strong>
                  <small>
                    {projection.additionalHighGradeCreditsNeeded > 0
                      ? `Need at least ${projection.additionalHighGradeCreditsNeeded} more qualifying credits in the final result set.`
                      : "The high-grade credit share is already protected if remaining grades do not reduce it."}
                  </small>
                </>
              ) : (
                <>
                  <strong>Not required</strong>
                  <small>Pass has no 50% high-grade-credit requirement.</small>
                </>
              )}
            </div>
            <div className="requirement-card">
              <span>Grade constraints</span>
              <strong>{projection.targetClass === "First Class" ? "No grade below C" : "Repeat rules apply"}</strong>
              <small>
                {projection.targetClass === "First Class"
                  ? "The projected result must also contain no unresolved D, E or AB result."
                  : projection.targetClass === "Pass"
                    ? "Any unresolved D, E or AB result blocks the projected pass standing."
                    : "No unresolved D, E or AB result; no more than two entered C-/D+ grades under the encoded class rules."}
              </small>
            </div>
            <div className="requirement-card">
              <span>Best possible outcome</span>
              <strong>{shortClassName(projection.bestPossibleClass)}</strong>
              <small>Assuming A in every remaining GPA-bearing course.</small>
            </div>
          </div>

          {projection.classTargetReasons.length > 0 && (
            <div className="class-blockers">
              <AlertTriangle aria-hidden="true" size={18} />
              <div>
                <strong>What currently blocks this class</strong>
                <ul>
                  {projection.classTargetReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="panel class-plan-panel">
        <div className="planner-summary">
          <div>
            <strong>{projection.targetClass ? "Class-valid future grade plans" : "Future GPA plans"}</strong>
            <span>{projection.recommendationSummary}</span>
          </div>
          {projection.classTargetPossible === true && (
            <span className="class-valid-badge">
              <CheckCircle2 aria-hidden="true" size={16} /> Class rules checked
            </span>
          )}
        </div>

        {plans.length > 0 ? (
          <div className="planner-plan-grid" aria-label="Possible future grade plans">
            {plans.map((plan, index) => (
              <button
                type="button"
                key={plan.id}
                className={clsx("plan-card", activePlan?.id === plan.id && "active")}
                onClick={() => setActivePlanId(plan.id)}
              >
                <strong>{index + 1}. {plan.name}</strong>
                <span className="plan-class">{shortClassName(plan.projectedClass)}</span>
                <div className="plan-meta">
                  <span>GPA {formatGpa(plan.gpa)}</span>
                  {projection.highGradeThreshold && (
                    <span>{plan.highGradeCredits}/{plan.requiredHighGradeCredits} {projection.highGradeThreshold}+ cr.</span>
                  )}
                </div>
                <small>{plan.description}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="planner-empty-state">
            <AlertTriangle aria-hidden="true" size={20} />
            <div>
              <strong>No class-valid plan is available from the current records.</strong>
              <span>Resolve the blockers above or choose a lower class/GPA target to generate a valid plan.</span>
            </div>
          </div>
        )}
      </section>

      <section className="results-list" aria-label="Future course grade plan">
        <div className="planner-course-heading">
          <div>
            <Target aria-hidden="true" size={19} />
            <div>
              <strong>{plans.length > 0 ? "Exact future grade targets" : "Best-case future grades"}</strong>
              <span>
                {activePlan
                  ? `${shortClassName(activePlan.projectedClass)} · final GPA ${formatGpa(activePlan.gpa)}`
                  : "These grades show the maximum available path while the selected class remains blocked."}
              </span>
            </div>
          </div>
          <span className="pill subtle">{remainingCourses.length} remaining courses</span>
        </div>

        {remainingCourses.length === 0 ? (
          <div className="panel">
            <p className="empty-state">No remaining GPA-bearing courses in this scenario.</p>
          </div>
        ) : (
          remainingCourses.map((course) => (
            <article className="course-row compact-row planner-grade-row" key={course.id}>
              <div>
                <strong>{course.code}</strong>
                <span>{course.title}</span>
                <small>
                  Year {course.year} · Semester {course.semester} · {course.credits} credits · current {effectiveResults[course.id] || "missing"}
                </small>
              </div>
              <div className="planner-course-actions">
                <span
                  className={clsx(
                    "suggest-chip",
                    plans.length === 0 && projection.impossible && "muted"
                  )}
                >
                  Aim {activeGrades[course.id] ?? "A"}
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
