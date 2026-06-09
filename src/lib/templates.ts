import type { DayKey, ExerciseKind, LiftKey, MuscleGroup } from "./types";

/** One prescribed set. rpe === null / 0 means a rep-range set (no RPE target). */
export interface SetSpec {
  reps: number;
  repsMax?: number;
  rpe: number | null;
  isBackoff?: boolean;
}

export interface ExerciseTemplate {
  name: string;
  kind: ExerciseKind;
  lift: LiftKey | null;
  factor: number;
  muscleGroups: MuscleGroup[];
  /** Set prescriptions for a 1-based week (this hypertrophy block is equal each week). */
  build: (week: number) => SetSpec[];
}

export interface DayTemplate {
  dayKey: DayKey;
  title: string;
  location: "Thuis" | "Gym";
  exercises: ExerciseTemplate[];
}

export const DEFAULT_ACC_RPE = 0; // rep-range work has no fixed RPE target

/** Rep-range accessory (manual weight, double progression). */
function range(
  name: string,
  muscleGroups: MuscleGroup[],
  sets: number,
  lo: number,
  hi: number,
): ExerciseTemplate {
  return {
    name,
    kind: "accessory",
    lift: null,
    factor: 1,
    muscleGroups,
    build: () => Array.from({ length: sets }, () => ({ reps: lo, repsMax: hi, rpe: null })),
  };
}

/** Rep-range main lift, tagged to an e1RM for tracking (still manual weight). */
function liftRange(
  name: string,
  lift: LiftKey,
  muscleGroups: MuscleGroup[],
  sets: number,
  lo: number,
  hi: number,
): ExerciseTemplate {
  return {
    name,
    kind: "main",
    lift,
    factor: 1,
    muscleGroups,
    build: () => Array.from({ length: sets }, () => ({ reps: lo, repsMax: hi, rpe: null })),
  };
}

// ---------------------------------------------------------------------------
// PPL + Upper split — Maandag/Dinsdag/Donderdag/Zaterdag. Same every week;
// progression is driven by double progression (beat last week).
// ---------------------------------------------------------------------------
export const STANDARD_DAYS: DayTemplate[] = [
  {
    dayKey: "mon",
    title: "Push",
    location: "Thuis",
    exercises: [
      liftRange("Bench Press", "bench", ["chest"], 3, 6, 8),
      range("Incline Dumbbell Press", ["chest"], 3, 8, 12),
      range("Dumbbell Lateral Raise", ["shoulders"], 5, 12, 20),
      range("Tricep Pushdown", ["triceps"], 3, 10, 15),
      range("Overhead Tricep Extension", ["triceps"], 3, 10, 15),
    ],
  },
  {
    dayKey: "tue",
    title: "Pull",
    location: "Thuis",
    exercises: [
      range("Pull-Ups of Lat Pulldown", ["back"], 4, 6, 10),
      range("Chest Supported Row", ["back"], 4, 8, 12),
      range("Seated Cable Row", ["back"], 3, 8, 12),
      range("Rear Delt Fly", ["shoulders"], 4, 12, 20),
      range("Barbell Curl", ["biceps"], 3, 8, 12),
      range("Hammer Curl", ["biceps"], 3, 10, 15),
    ],
  },
  {
    dayKey: "thu",
    title: "Legs",
    location: "Thuis",
    exercises: [
      liftRange("Squat", "squat", ["quads"], 4, 5, 8),
      range("Romanian Deadlift", ["hamstrings"], 4, 6, 10),
      range("Leg Press", ["quads"], 3, 10, 15),
      range("Leg Curl", ["hamstrings"], 3, 10, 15),
      range("Standing Calf Raise", ["calves"], 4, 12, 20),
    ],
  },
  {
    dayKey: "sat",
    title: "Upper",
    location: "Gym",
    exercises: [
      range("Overhead Press", ["shoulders"], 3, 6, 10),
      range("Pull-Up of Lat Pulldown", ["back"], 3, 6, 10),
      range("Incline Dumbbell Press", ["chest"], 3, 8, 12),
      range("Chest Supported Row", ["back"], 3, 8, 12),
      range("Dumbbell Lateral Raise", ["shoulders"], 5, 12, 20),
      range("Rear Delt Fly", ["shoulders"], 3, 12, 20),
      range("Bicep Curl", ["biceps"], 3, 10, 15),
      range("Tricep Pushdown", ["triceps"], 3, 10, 15),
    ],
  },
];

// ---------------------------------------------------------------------------
// Labels, tracked muscles, weekly volume guidelines (effective sets/week)
// ---------------------------------------------------------------------------
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Borst",
  back: "Rug",
  shoulders: "Schouders",
  quads: "Quads",
  hamstrings: "Hamstrings",
  biceps: "Biceps",
  triceps: "Triceps",
  calves: "Kuiten",
  core: "Core",
};

export const TRACKED_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "biceps",
  "triceps",
];

export const VOLUME_GUIDELINES: Partial<Record<MuscleGroup, [number, number]>> = {
  chest: [14, 18],
  back: [12, 18],
  quads: [10, 16],
  hamstrings: [8, 14],
  shoulders: [8, 14],
  biceps: [6, 12],
  triceps: [6, 12],
};

export const DAY_ORDER: DayKey[] = ["mon", "tue", "thu", "sat"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Maandag",
  tue: "Dinsdag",
  wed: "Woensdag",
  thu: "Donderdag",
  fri: "Vrijdag",
  sat: "Zaterdag",
  sun: "Zondag",
};
