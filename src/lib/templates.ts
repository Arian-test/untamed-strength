import type { DayKey, ExerciseKind, LiftKey, MuscleGroup } from "./types";

/** One prescribed set. rpe === null means a rep-range accessory (manual weight). */
export interface SetSpec {
  reps: number;
  rpe: number | null;
  isBackoff?: boolean;
}

export interface ExerciseTemplate {
  name: string;
  kind: ExerciseKind;
  lift: LiftKey | null;
  factor: number;
  muscleGroups: MuscleGroup[];
  /** Set prescriptions for a 1-based week (1..4 for standard days). */
  build: (week: number) => SetSpec[];
}

export interface DayTemplate {
  dayKey: DayKey;
  title: string;
  location: "Thuis" | "Gym";
  exercises: ExerciseTemplate[];
}

/** Default target RPE shown for pure rep-range accessories (no auto weight). */
export const DEFAULT_ACC_RPE = 8;

const mid = (lo: number, hi: number) => Math.round((lo + hi) / 2);

/** Week-4 trims accessory volume ~20%. */
function accSets(week: number, base: number): number {
  return week >= 4 ? Math.max(2, Math.round(base * 0.8)) : base;
}

/** Rep-range accessory: fixed reps target, optional RPE (null = manual weight). */
function acc(
  name: string,
  muscleGroups: MuscleGroup[],
  sets: number,
  lo: number,
  hi: number,
  rpe: number | null = null,
): ExerciseTemplate {
  return {
    name,
    kind: "accessory",
    lift: null,
    factor: 1,
    muscleGroups,
    build: (week) => Array.from({ length: accSets(week, sets) }, () => ({ reps: mid(lo, hi), rpe })),
  };
}

// --- Main competition lifts: top set + backoffs + (later) a touch single ---
function compScheme(week: number): SetSpec[] {
  switch (week) {
    case 1:
      return [{ reps: 5, rpe: 8 }, { reps: 5, rpe: 7, isBackoff: true }, { reps: 5, rpe: 7, isBackoff: true }, { reps: 5, rpe: 7, isBackoff: true }];
    case 2:
      return [{ reps: 5, rpe: 8.5 }, { reps: 5, rpe: 7.5, isBackoff: true }, { reps: 5, rpe: 7.5, isBackoff: true }, { reps: 5, rpe: 7.5, isBackoff: true }];
    case 3:
      return [{ reps: 4, rpe: 8.5 }, { reps: 4, rpe: 7.5, isBackoff: true }, { reps: 4, rpe: 7.5, isBackoff: true }, { reps: 4, rpe: 7.5, isBackoff: true }, { reps: 1, rpe: 7.5 }];
    case 4:
    default:
      return [{ reps: 3, rpe: 8.5 }, { reps: 3, rpe: 8, isBackoff: true }, { reps: 3, rpe: 8, isBackoff: true }, { reps: 1, rpe: 8 }];
  }
}

function comp(name: string, lift: LiftKey, muscleGroups: MuscleGroup[]): ExerciseTemplate {
  return { name, kind: "main", lift, factor: 1, muscleGroups, build: compScheme };
}

// --- Strength variations (paused work): tapering toward the peak ---
function varScheme(week: number): SetSpec[] {
  switch (week) {
    case 1:
      return [{ reps: 4, rpe: 6 }, { reps: 4, rpe: 6 }];
    case 2:
      return [{ reps: 4, rpe: 6.5 }, { reps: 4, rpe: 6.5 }];
    case 3:
      return [{ reps: 3, rpe: 7 }, { reps: 3, rpe: 7 }];
    case 4:
    default:
      return [{ reps: 3, rpe: 7 }];
  }
}

function variation(name: string, lift: LiftKey, factor: number, muscleGroups: MuscleGroup[]): ExerciseTemplate {
  return { name, kind: "variation", lift, factor, muscleGroups, build: varScheme };
}

/** Hypertrophy-day compound bound to an e1RM (e.g. high-bar squat, incline). */
function hypCompound(
  name: string,
  lift: LiftKey,
  factor: number,
  muscleGroups: MuscleGroup[],
  sets: number,
  reps: number,
  rpe: number,
): ExerciseTemplate {
  return {
    name,
    kind: "accessory",
    lift,
    factor,
    muscleGroups,
    build: (week) => Array.from({ length: accSets(week, sets) }, () => ({ reps, rpe })),
  };
}

// ---------------------------------------------------------------------------
// STANDARD DAYS (weeks 1-4) — Upper/Lower powerbuilding, week starts Sunday
// ---------------------------------------------------------------------------
export const STANDARD_DAYS: DayTemplate[] = [
  {
    dayKey: "sun",
    title: "Upper Hypertrophy",
    location: "Gym",
    exercises: [
      hypCompound("Incline Bench Press", "bench", 0.8, ["chest"], 3, 9, 7),
      acc("Machine Chest Press", ["chest"], 3, 8, 12),
      acc("Lat Pulldown", ["back"], 4, 8, 12),
      acc("Chest Supported Row", ["back"], 4, 8, 12),
      acc("Pec Deck", ["chest"], 3, 12, 15),
      acc("Lateral Raise Machine", ["shoulders"], 3, 12, 20),
      acc("Tricep Pushdown", ["triceps"], 3, 10, 15),
      acc("Cable Curl", ["biceps"], 3, 10, 15),
    ],
  },
  {
    dayKey: "mon",
    title: "Lower Strength",
    location: "Thuis",
    exercises: [
      comp("Competition Squat", "squat", ["quads"]),
      variation("Pause Squat", "squat", 0.9, ["quads"]),
      acc("Leg Extension", ["quads"], 3, 10, 15),
      acc("Leg Curl", ["hamstrings"], 3, 10, 15),
      acc("Cable Crunch", ["core"], 3, 15, 20),
    ],
  },
  {
    dayKey: "wed",
    title: "Upper Strength",
    location: "Thuis",
    exercises: [
      comp("Competition Bench", "bench", ["chest"]),
      variation("Paused Bench", "bench", 0.92, ["chest"]),
      acc("Barbell Row", ["back"], 4, 6, 10),
      acc("Lateral Raise", ["shoulders"], 3, 12, 20),
      acc("Cable Curl", ["biceps"], 3, 10, 15),
    ],
  },
  {
    dayKey: "thu",
    title: "Lower Hypertrophy",
    location: "Thuis",
    exercises: [
      hypCompound("High Bar Squat", "squat", 0.95, ["quads"], 3, 7, 7),
      acc("Bulgarian Split Squat", ["quads"], 3, 8, 12),
      acc("Leg Extension", ["quads"], 3, 12, 15),
      acc("Leg Curl", ["hamstrings"], 3, 12, 15),
      acc("Standing Calf Raise", ["calves"], 4, 10, 15),
      acc("Cable Crunch", ["core"], 3, 15, 20),
    ],
  },
];

// ---------------------------------------------------------------------------
// PEAK WEEK (week 5) — singles, light backoffs, recovery, test day
// ---------------------------------------------------------------------------
const single = (reps: number, rpe: number, isBackoff = false): SetSpec => ({ reps, rpe, isBackoff });

export const PEAK_DAYS: DayTemplate[] = [
  {
    dayKey: "sun",
    title: "Peak · Test (Gym)",
    location: "Gym",
    exercises: [
      { name: "Competition Squat", kind: "main", lift: "squat", factor: 1, muscleGroups: ["quads"], build: () => [single(1, 9)] },
      { name: "Competition Bench", kind: "main", lift: "bench", factor: 1, muscleGroups: ["chest"], build: () => [single(1, 9)] },
      acc("Lat Pulldown", ["back"], 2, 10, 12, 6),
      acc("Tricep Pushdown", ["triceps"], 2, 10, 15, 6),
    ],
  },
  {
    dayKey: "mon",
    title: "Peak · Squat",
    location: "Thuis",
    exercises: [
      { name: "Competition Squat", kind: "main", lift: "squat", factor: 1, muscleGroups: ["quads"], build: () => [single(1, 8.5), single(2, 7), single(2, 7)] },
      acc("Leg Extension", ["quads"], 2, 12, 15, 6),
      acc("Leg Curl", ["hamstrings"], 2, 12, 15, 6),
    ],
  },
  {
    dayKey: "wed",
    title: "Peak · Bench",
    location: "Thuis",
    exercises: [
      { name: "Competition Bench", kind: "main", lift: "bench", factor: 1, muscleGroups: ["chest"], build: () => [single(1, 8.5), single(2, 7), single(2, 7)] },
      acc("Barbell Row", ["back"], 2, 8, 10, 7),
      acc("Cable Curl", ["biceps"], 2, 10, 15, 7),
    ],
  },
  {
    dayKey: "thu",
    title: "Peak · Herstel",
    location: "Thuis",
    exercises: [
      acc("Leg Extension", ["quads"], 2, 12, 15, 6),
      acc("Leg Curl", ["hamstrings"], 2, 12, 15, 6),
      acc("Lateral Raise", ["shoulders"], 2, 12, 20, 7),
      acc("Cable Curl", ["biceps"], 2, 10, 15, 7),
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

export const DAY_ORDER: DayKey[] = ["sun", "mon", "wed", "thu"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Maandag",
  wed: "Woensdag",
  thu: "Donderdag",
  sun: "Zondag",
};
