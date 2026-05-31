import { rpePercentage, trainingWeight } from "./rpe";
import {
  DEFAULT_ACC_RPE,
  PEAK_DAYS,
  STANDARD_DAYS,
  type DayTemplate,
  type ExerciseTemplate,
} from "./templates";
import type {
  Block,
  BlockWeek,
  ExerciseEntry,
  LiftKey,
  Phase,
  SetEntry,
  SessionDay,
} from "./types";
import { uid } from "./utils";

export interface WeekMeta {
  weekNumber: number;
  phase: Phase;
  scheme: string;
}

// 5-week powerbuilding wave: volume -> intensification -> heavy -> peak.
export const WEEK_META: WeekMeta[] = [
  { weekNumber: 1, phase: "Volume", scheme: "Top 5 @8 · backoff 3x5 @7" },
  { weekNumber: 2, phase: "Volume", scheme: "Top 5 @8.5 · backoff 3x5 @7.5" },
  { weekNumber: 3, phase: "Intensification", scheme: "Top 4 @8.5 · backoff @7.5 · single @7.5" },
  { weekNumber: 4, phase: "Intensification", scheme: "Zwaar · Top 3 @8.5 · single @8" },
  { weekNumber: 5, phase: "Peak", scheme: "Piekweek · singles" },
];

function e1rmFor(lift: LiftKey | null, squatE1rm: number, benchE1rm: number): number {
  if (lift === "squat") return squatE1rm;
  if (lift === "bench") return benchE1rm;
  return 0;
}

/** Build the set list for one exercise template in a given week. */
export function buildSets(
  template: ExerciseTemplate,
  week: number,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): SetEntry[] {
  const e1rm = e1rmFor(template.lift, squatE1rm, benchE1rm);
  return template.build(week).map((spec, i) => {
    const targetRpe = spec.rpe ?? DEFAULT_ACC_RPE;
    // Auto weight only when the lift is e1RM-bound and the set has a real RPE.
    const plannedWeight =
      template.lift !== null && spec.rpe !== null
        ? trainingWeight(e1rm, spec.reps, spec.rpe, template.factor, step)
        : null;
    return {
      id: uid("set_"),
      setNumber: i + 1,
      targetReps: spec.reps,
      targetRpe,
      plannedWeight,
      plannedManual: false,
      isBackoff: !!spec.isBackoff,
      actualWeight: null,
      actualReps: null,
      actualRpe: null,
    };
  });
}

function buildExercise(
  template: ExerciseTemplate,
  week: number,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): ExerciseEntry {
  return {
    id: uid("ex_"),
    name: template.name,
    kind: template.kind,
    lift: template.lift,
    factor: template.factor,
    muscleGroups: template.muscleGroups,
    sets: buildSets(template, week, squatE1rm, benchE1rm, step),
    note: "",
  };
}

function buildDay(
  dt: DayTemplate,
  week: number,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): SessionDay {
  return {
    id: uid("day_"),
    dayKey: dt.dayKey,
    title: dt.title,
    weekNumber: week,
    exercises: dt.exercises.map((t) => buildExercise(t, week, squatE1rm, benchE1rm, step)),
    readiness: null,
    note: "",
    plannedDate: null,
    completedAt: null,
  };
}

export interface NewBlockInput {
  name: string;
  squatE1rm: number;
  benchE1rm: number;
  startDate: string | null;
  step: number;
}

export function generateBlock(input: NewBlockInput): Block {
  const { name, squatE1rm, benchE1rm, startDate, step } = input;
  const weeks: BlockWeek[] = WEEK_META.map((meta) => {
    const days = meta.weekNumber < 5 ? STANDARD_DAYS : PEAK_DAYS;
    return {
      weekNumber: meta.weekNumber,
      phase: meta.phase,
      scheme: meta.scheme,
      days: days.map((dt) => buildDay(dt, meta.weekNumber, squatE1rm, benchE1rm, step)),
    };
  });

  return {
    id: uid("block_"),
    name,
    createdAt: new Date().toISOString(),
    startDate,
    squatE1rm,
    benchE1rm,
    activeWeek: 1,
    draft: false,
    structureLocked: true,
    weeks,
  };
}

/**
 * Recompute planned weights for progressive lifts in weeks that are not yet
 * completed, using updated e1RMs. Logged (actual) values are preserved.
 * A day counts as "locked" once it has a completedAt timestamp.
 */
export function recomputeFutureWeights(
  block: Block,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): Block {
  const weeks = block.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => {
      if (day.completedAt) return day; // lock finished sessions
      return {
        ...day,
        exercises: day.exercises.map((ex) => {
          // Auto-calc is driven by the lift binding, not the kind, so a renamed
          // exercise bound to squat/bench still recalculates.
          if (ex.lift === null) return ex;
          const e1rm = e1rmFor(ex.lift, squatE1rm, benchE1rm);
          return {
            ...ex,
            // set.targetRpe already includes any variation adjustment.
            sets: ex.sets.map((s) => ({
              ...s,
              plannedWeight:
                s.actualWeight !== null || s.plannedManual
                  ? s.plannedWeight
                  : trainingWeight(e1rm, s.targetReps, s.targetRpe, ex.factor, step),
            })),
          };
        }),
      };
    }),
  }));
  return { ...block, squatE1rm, benchE1rm, weeks };
}

// --- Editing helpers --------------------------------------------------------

function e1rmForExercise(ex: ExerciseEntry, squatE1rm: number, benchE1rm: number): number {
  return e1rmFor(ex.lift, squatE1rm, benchE1rm);
}

/** Recompute the planned weight of one set (lift-bound + not manual). */
export function recalcSetPlanned(
  ex: ExerciseEntry,
  set: SetEntry,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): number | null {
  if (ex.lift === null || set.plannedManual) return set.plannedWeight;
  const e1rm = e1rmForExercise(ex, squatE1rm, benchE1rm);
  return trainingWeight(e1rm, set.targetReps, set.targetRpe, ex.factor, step);
}

/** A fresh blank set, copying targets from a reference set when provided. */
export function newSet(setNumber: number, ref?: Partial<SetEntry>): SetEntry {
  return {
    id: uid("set_"),
    setNumber,
    targetReps: ref?.targetReps ?? 8,
    targetRpe: ref?.targetRpe ?? 8,
    plannedWeight: ref?.plannedWeight ?? null,
    plannedManual: ref?.plannedManual ?? false,
    isBackoff: ref?.isBackoff ?? false,
    actualWeight: null,
    actualReps: null,
    actualRpe: null,
  };
}

/** A fresh blank accessory exercise with a free-text name and 3 sets. */
export function newExercise(name = "Nieuwe oefening"): ExerciseEntry {
  return {
    id: uid("ex_"),
    name,
    kind: "accessory",
    lift: null,
    factor: 1,
    muscleGroups: [],
    sets: [newSet(1), newSet(2), newSet(3)],
    note: "",
  };
}

export { rpePercentage };
