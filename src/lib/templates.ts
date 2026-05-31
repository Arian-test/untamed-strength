import type { DayKey, ExerciseKind, LiftKey, MuscleGroup } from "./types";

export interface AccessoryScheme {
  sets: number;
  /** Display rep target, e.g. "10-12". The first number is used for weight math. */
  repsLabel: string;
  reps: number;
  rpe: number;
}

export interface ExerciseTemplate {
  name: string;
  kind: ExerciseKind;
  lift: LiftKey | null;
  factor: number;
  muscleGroups: MuscleGroup[];
  /** Only for accessories (kind === "accessory"). */
  accessory?: AccessoryScheme;
}

export interface DayTemplate {
  dayKey: DayKey;
  title: string;
  location: "Thuis" | "Gym";
  exercises: ExerciseTemplate[];
}

const acc = (
  name: string,
  muscleGroups: MuscleGroup[],
  sets: number,
  repsLabel: string,
  reps: number,
  rpe: number,
): ExerciseTemplate => ({
  name,
  kind: "accessory",
  lift: null,
  factor: 1,
  muscleGroups,
  accessory: { sets, repsLabel, reps, rpe },
});

// Week starts on Sunday. Upper/Lower split, 2x each (Squat & Bench both 2x/week).
// Sunday (gym) is the chest-led upper day, so the week begins with chest.
export const DAY_TEMPLATES: DayTemplate[] = [
  {
    dayKey: "sun",
    title: "Upper (Bench)",
    location: "Gym",
    exercises: [
      { name: "Heavy Bench", kind: "main", lift: "bench", factor: 1, muscleGroups: ["chest", "triceps"] },
      acc("Incline Bench", ["chest", "shoulders"], 4, "6-10", 8, 8),
      acc("Pec Deck", ["chest"], 3, "12-15", 13, 9),
      acc("Lat Pulldown", ["back"], 3, "10-12", 11, 8),
      acc("Chest Supported Row", ["back"], 3, "10-12", 11, 8),
      acc("Lateral Raise", ["shoulders"], 3, "12-15", 13, 8),
      acc("Tricep Pushdown", ["triceps"], 3, "12-15", 13, 8),
      acc("Bicep Curl", ["biceps"], 3, "10-15", 12, 8),
    ],
  },
  {
    dayKey: "mon",
    title: "Lower (Squat)",
    location: "Thuis",
    exercises: [
      { name: "Low Bar Squat", kind: "main", lift: "squat", factor: 1, muscleGroups: ["quads", "hamstrings"] },
      { name: "Pause Squat", kind: "variation", lift: "squat", factor: 0.9, muscleGroups: ["quads"] },
      acc("Leg Extension", ["quads"], 3, "12-15", 13, 8),
      acc("Leg Curl", ["hamstrings"], 3, "10-12", 11, 8),
      acc("Cable Crunch", ["core"], 3, "12-15", 13, 8),
    ],
  },
  {
    dayKey: "wed",
    title: "Upper (Bench)",
    location: "Thuis",
    exercises: [
      { name: "Competition Bench", kind: "main", lift: "bench", factor: 1, muscleGroups: ["chest", "triceps"] },
      { name: "Paused Bench", kind: "variation", lift: "bench", factor: 0.92, muscleGroups: ["chest", "triceps"] },
      acc("DB Incline Bench", ["chest", "shoulders"], 3, "8-12", 10, 8),
      acc("Cable Fly", ["chest"], 3, "12-15", 13, 9),
      acc("Barbell Row", ["back"], 4, "6-8", 7, 8),
      acc("Lateral Raise", ["shoulders"], 3, "12-15", 13, 8),
      acc("Cable Curl", ["biceps"], 3, "10-12", 11, 8),
    ],
  },
  {
    dayKey: "thu",
    title: "Lower (Squat)",
    location: "Thuis",
    exercises: [
      { name: "High Bar Squat", kind: "main", lift: "squat", factor: 1, muscleGroups: ["quads", "hamstrings"] },
      acc("Romanian Deadlift", ["hamstrings"], 3, "8-10", 9, 8),
      acc("Leg Extension", ["quads"], 3, "12-15", 13, 8),
      acc("Leg Curl", ["hamstrings"], 3, "10-12", 11, 8),
      acc("Cable Crunch", ["core"], 3, "12-15", 13, 8),
    ],
  },
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Borst",
  back: "Rug",
  shoulders: "Schouders",
  quads: "Quads",
  hamstrings: "Hamstrings",
  biceps: "Biceps",
  triceps: "Triceps",
  core: "Core",
};

/** The seven muscle groups shown in volume tracking (spec order). */
export const TRACKED_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "quads",
  "hamstrings",
  "biceps",
  "triceps",
];

export const DAY_ORDER: DayKey[] = ["sun", "mon", "wed", "thu"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Maandag",
  wed: "Woensdag",
  thu: "Donderdag",
  sun: "Zondag",
};
