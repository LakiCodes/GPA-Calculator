import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Target, Trash2, XCircle } from "lucide-react";
import clsx from "clsx";

import { DEGREE_CLASS_RULES } from "../calculations/classPlanning";
import { calculatePlannerProjection } from "../calculations/planner";
import { effectiveResultMap } from "../calculations/records";
import type {
  ClassName,
  Course,
  CourseRecord,
  PlannerScenario
} from "../domain/types";
import "../planner.css";

const formatGpa = (value: string | null): string => value ?? "--";

const classTargets: ClassName[] = [
  "Pass",
  "Second Class (Lower Division)",
  "Second Class (Upper Division)",
  "First Class"
];

const shortClass = (className: ClassName | "Not yet eligible" | null): string => {
  if (!className) {
    return "--";
  }
  if (className === "Second Class (Upper Division)") {
    return "Second Upper";
  }
  if (className === "Second Class (Lower Division)") {
    return "Second Lower";
  }
  return className;
};

const RequirementIcon = ({ status }: { status: "met" | "not-met" | "unknown" }) => {
  if (status === "met") {
    return <CheckCircle2 aria-hidden="true" className="planner-rule-icon ok" />;
  }
  if (status === "not-met") {
    return <XCircle aria-hidden="true" className="planner-rule-icon danger" />;
  }
  return <AlertTriangle aria-hidden="true" className="planner-rule-icon warn" />;
};

export interface ClassPlannerViewProps {
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
}

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
}: ClassPlannerViewProps) => {
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
  const targetClass = projection.targetClass;
  const targetRule = targetClass ? DEGREE_CLASS_RULES[targetClass] : null;
  const activeEvaluation = activePlan?.classEvaluation ?? projection.classTargetEvaluation;
  const selectedClass = activePlan?.projectedClass ?? projection.selectedPlanClass;
  const classTargetMet = activePlan?.classTargetMet ?? projection.classTargetPossible;

  const highGradeDetail = activeEvaluation && targetRule?.highGradeLabel
    ? `${activeEvaluation.highGradeCredits}/${activeEvaluation.requiredHighGradeCredits} credits ${targetRule.highGradeLabel}`
    : null;

  return (
    <div className="view-stack class-planner">
      <section className="panel toolbar planner-toolbar">
        <select
          className="control"
          value={scenario.id}
          onChange={(event) => onActiveScenarioChange(event.target.value)}
          aria-label="Planner scenario"
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

      <section className="planner-hero-grid" aria-label="Class planning summary">
        <article className="planner-hero-card">
          <span className="planner-hero-label">Current standing</span>
          <strong>{shortClass(projection.currentClass)}</strong>
          <small>
            Provisional • GPA {formatGpa(projection.currentGpa.gpa)} from {projection.gradedCredits} graded credits
          </small>
        </article>

        <article className={clsx("planner-hero-card", "primary", projection.impossible && "danger") }>
          <span className="planner-hero-label">Target</span>
          <strong>{targetClass ? shortClass(targetClass) : `GPA ${projection.targetGpa.toFixed(2)}`}</strong>
          <small>
            {targetRule
              ? `GPA ≥ ${targetRule.minGpa.toFixed(2)}${targetRule.highGradeLabel ? ` • 50% credits ${targetRule.highGradeLabel}` : ""}${targetRule.requiresFourYearCompletion ? " • assumes completion within 4 years" : ""}`
              : projection.requiredAverageLabel}
          </small>
        </article>

        <article className={clsx("planner-hero-card", classTargetMet === false && "danger") }>
          <span className="planner-hero-label">Selected plan outcome</span>
          <strong>{shortClass(selectedClass)}</strong>
          <small>GPA {formatGpa(activePlan?.gpa ?? projection.recommendedGpa)}</small>
        </article>

        <article className="planner-hero-card">
          <span className="planner-hero-label">Best still possible</span>
          <strong>{shortClass(projection.bestPossibleClass)}</strong>
          <small>All-A ceiling GPA {formatGpa(projection.maxPossibleGpa)}</small>
        </article>
      </section>

      <section className="panel planner-target-panel">
        <div className="panel-heading planner-target-heading">
          <div>
            <span>Choose a degree-class target</span>
            <small>Class mode plans against every encoded academic class rule. Four-year completion is assumed.</small>
          </div>
          <input
            className="control"
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

        <div className="class-target-grid">
          {classTargets.map((className) => {
            const rule = DEGREE_CLASS_RULES[className];
            const active = targetClass === className;
            return (
              <button
                type="button"
                key={className}
                className={clsx("class-target-card", active && "active")}
                onClick={() =>
                  onScenarioChange(scenario.id, (current) => ({
                    ...current,
                    classTarget: className,
                    targetGpa: rule.minGpa
                  }))
                }
              >
                <span>{rule.shortLabel}</span>
                <strong>{rule.minGpa.toFixed(2)}</strong>
                <small>
                  {rule.highGradeLabel
                    ? `50% credits ${rule.highGradeLabel}`
                    : "Standard pass target"}
                </small>
              </button>
            );
          })}
        </div>

        <div className="planner-gpa-only-row">
          <div>
            <strong>Or plan for GPA only</strong>
            <span>
              Entering a custom GPA switches off class constraints, while each plan still shows its projected class.
            </span>
          </div>
          <label>
            <span>Custom GPA</span>
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
                  classTarget: null,
                  targetGpa: Math.max(0, Math.min(4, Number(event.target.value) || 0))
                }))
              }
            />
          </label>
        </div>
      </section>

      {targetClass && activeEvaluation && (
        <section className="panel class-requirements-panel">
          <div className="panel-heading">
            <div>
              <span>{shortClass(targetClass)} requirement check</span>
              <small>
                The selected grade plan is tested against the final programme-credit rules; four-year completion is treated as an explicit planning assumption.
              </small>
            </div>
            <span
              className={clsx(
                "planner-status-pill",
                classTargetMet === true ? "ok" : "danger"
              )}
            >
              {classTargetMet === true ? "Plan meets target" : "Target blocked"}
            </span>
          </div>
          <div className="class-requirement-grid">
            {activeEvaluation.requirements.map((item) => (
              <article
                className={clsx("class-requirement", item.status)}
                key={item.id}
              >
                <RequirementIcon status={item.status} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="fine-print planner-disclaimer">
            Planning assumption: the degree is completed within four academic years. Class projections are guidance based on the encoded Prospectus rules; final class determination remains with the University.
          </p>
        </section>
      )}

      <section className="panel planner-plans-panel">
        <div className="panel-heading">
          <div>
            <span>{targetClass ? `${shortClass(targetClass)} future grade plans` : "GPA future grade plans"}</span>
            <small>{projection.recommendationSummary}</small>
          </div>
          {highGradeDetail && <span className="planner-status-pill subtle">{highGradeDetail}</span>}
        </div>

        {plans.length > 0 ? (
          <div className="planner-plan-grid class-plan-grid" aria-label="Possible future grade plans">
            {plans.map((plan, index) => {
              const evaluation = plan.classEvaluation;
              return (
                <button
                  type="button"
                  key={plan.id}
                  className={clsx("plan-card class-plan-card", activePlan?.id === plan.id && "active")}
                  onClick={() => setActivePlanId(plan.id)}
                >
                  <span className="plan-rank">Plan {index + 1}</span>
                  <strong>{plan.name}</strong>
                  <span className="plan-class-outcome">{shortClass(plan.projectedClass)}</span>
                  <small>Projected GPA {formatGpa(plan.gpa)}</small>
                  {evaluation?.rule.highGradeLabel && (
                    <small>
                      {evaluation.highGradeCredits}/{evaluation.requiredHighGradeCredits} credits {evaluation.rule.highGradeLabel}
                    </small>
                  )}
                  <small>{plan.description}</small>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">No future grade plan is available for this scenario.</p>
        )}
      </section>

      <section className="results-list planner-course-plan">
        <div className="planner-course-plan-heading">
          <div>
            <Target aria-hidden="true" size={18} />
            <div>
              <strong>Exact grades for the selected plan</strong>
              <span>{remainingCourses.length} remaining GPA-bearing courses</span>
            </div>
          </div>
          <strong>Projected GPA {formatGpa(activePlan?.gpa ?? projection.recommendedGpa)}</strong>
        </div>

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
                <small>
                  {course.credits} credits • current {effectiveResults[course.id] || "not entered"}
                </small>
              </div>
              <div className="planner-course-actions">
                <span className={clsx("suggest-chip", projection.impossible && "muted")}>
                  Target {activeGrades[course.id] ?? "A"}
                </span>
              </div>
            </article>
          ))
        )}

        {projection.impossible && (
          <div className="alert danger-alert planner-blocker-alert">
            <AlertTriangle aria-hidden="true" size={18} />
            <span>{projection.recommendationSummary}</span>
          </div>
        )}
      </section>
    </div>
  );
};
