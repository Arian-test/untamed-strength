import { rpePercentage, trainingWeight } from "./rpe";
import { DAY_TEMPLATES, type ExerciseTemplate } from "./templates";
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

interface SetPrescription {
  reps: number;
  rpe: number;
  isBackoff: boolean;
}

export interface WeekSpec {
  weekNumber: number;
  phase: Phase;
  scheme: string;
  /** Prescription for progressive (main/variation) lifts this week. */
  main: SetPrescription[];
}

// The 5-week wave (Volume -> Intensification -> Peak).
export const WEEK_SPECS: WeekSpec[] = [
  {
    weekNumber: 1,
    phase: "Volume",
    scheme: "5x5 @7",
    main: Array.from({ length: 5 }, () => ({ reps: 5, rpe: 7, isBackoff: false })),
  },
  {
    weekNumber: 2,
    phase: "Volume",
    scheme: "5x5 @7.5",
    main: Array.from({ length: 5 }, () => ({ reps: 5, rpe: 7.5, isBackoff: false })),
  },
  {
    weekNumber: 3,
    phase: "Intensification",
    scheme: "4x4 @8",
    main: Array.from({ length: 4 }, () => ({ reps: 4, rpe: 8, isBackoff: false })),
  },
  {
    weekNumber: 4,
    phase: "Intensification",
    scheme: "3x3 @8.5",
    main: Array.from({ length: 3 }, () => ({ reps: 3, rpe: 8.5, isBackoff: false })),
  },
  {
    weekNumber: 5,
    phase: "Peak",
    scheme: "Top single + backoffs",
    main: [
      { reps: 1, rpe: 9, isBackoff: false },
      { reps: 3, rpe: 8, isBackoff: true },
      { reps: 3, rpe: 8, isBackoff: true },
      { reps: 3, rpe: 8, isBackoff: true },
    ],
  },
];

function e1rmFor(lift: LiftKey | null, squatE1rm: number, benchE1rm: number): number {
  if (lift === "squat") return squatE1rm;
  if (lift === "bench") return benchE1rm;
  return 0;
}

/** Build the set list for one exercise in one week. */
export function buildSets(
  template: ExerciseTemplate,
  weekSpec: WeekSpec,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): SetEntry[] {
  const base = (n: number): Omit<SetEntry, "id"> => ({
    setNumber: n,
    targetReps: 0,
    targetRpe: 0,
    plannedWeight: null,
    plannedManual: false,
    isBackoff: false,
    actualWeight: null,
    actualReps: null,
    actualRpe: null,
  });

  if (template.kind === "accessory" && template.accessory) {
    const { sets, reps, rpe } = template.accessory;
    return Array.from({ length: sets }, (_, i) => ({
      ...base(i + 1),
      id: uid("set_"),
      targetReps: reps,
      targetRpe: rpe,
    }));
  }

  // Progressive main / variation lift.
  const e1rm = e1rmFor(template.lift, squatE1rm, benchE1rm);
  // Variations train one RPE step easier than the comp lift.
  const rpeAdjust = template.kind === "variation" ? -0.5 : 0;
  return weekSpec.main.map((p, i) => {
    const rpe = Math.max(6, p.rpe + rpeAdjust);
    return {
      ...base(i + 1),
      id: uid("set_"),
      targetReps: p.reps,
      targetRpe: rpe,
      isBackoff: p.isBackoff,
      plannedWeight: trainingWeight(e1rm, p.reps, rpe, template.factor, step),
    };
  });
}

function buildExercise(
  template: ExerciseTemplate,
  weekSpec: WeekSpec,
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
    sets: buildSets(template, weekSpec, squatE1rm, benchE1rm, step),
    note: "",
  };
}

function buildDay(
  weekSpec: WeekSpec,
  dayTemplateIndex: number,
  squatE1rm: number,
  benchE1rm: number,
  step: number,
): SessionDay {
  const dt = DAY_TEMPLATES[dayTemplateIndex];
  return {
    id: uid("day_"),
    dayKey: dt.dayKey,
    title: dt.title,
    weekNumber: weekSpec.weekNumber,
    exercises: dt.exercises.map((t) => buildExercise(t, weekSpec, squatE1rm, benchE1rm, step)),
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
  const weeks: BlockWeek[] = WEEK_SPECS.map((ws) => ({
    weekNumber: ws.weekNumber,
    phase: ws.phase,
    scheme: ws.scheme,
    days: DAY_TEMPLATES.map((_, i) => buildDay(ws, i, squatE1rm, benchE1rm, step)),
  }));

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
