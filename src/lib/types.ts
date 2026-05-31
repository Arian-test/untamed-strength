// Domain model for the Untamed Strength training app.

export type LiftKey = "squat" | "bench";

export type DayKey = "mon" | "wed" | "thu" | "sun";

export type Phase = "Volume" | "Intensification" | "Peak";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "quads"
  | "hamstrings"
  | "biceps"
  | "triceps"
  | "core";

export type ExerciseKind = "main" | "variation" | "accessory";

export interface SetEntry {
  id: string;
  setNumber: number;
  targetReps: number;
  targetRpe: number;
  /** Auto-calculated planned weight for main/variation lifts; null for accessories. */
  plannedWeight: number | null;
  /** True when the user typed the planned weight by hand (skips auto-recalc). */
  plannedManual: boolean;
  isBackoff: boolean;
  // Logged by the user:
  actualWeight: number | null;
  actualReps: number | null;
  actualRpe: number | null;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  kind: ExerciseKind;
  /** Which main lift's e1RM drives this exercise (main + variation only). */
  lift: LiftKey | null;
  /** Multiplier applied to e1RM for variations (e.g. paused bench 0.92). */
  factor: number;
  muscleGroups: MuscleGroup[];
  sets: SetEntry[];
  note: string;
}

export interface Readiness {
  voeding: number; // 1-5
  stress: number; // 1-5 (higher = more stress)
  slaap: number; // 1-5
  fatigue: number; // 1-5 (higher = more fatigue)
}

export interface SessionDay {
  id: string;
  dayKey: DayKey;
  title: string;
  weekNumber: number;
  exercises: ExerciseEntry[];
  readiness: Readiness | null;
  note: string;
  plannedDate: string | null; // ISO date
  completedAt: string | null; // ISO datetime
}

export interface BlockWeek {
  weekNumber: number;
  phase: Phase;
  scheme: string; // human label e.g. "5x5 @7"
  days: SessionDay[];
}

export interface Block {
  id: string;
  name: string;
  createdAt: string;
  startDate: string | null;
  squatE1rm: number;
  benchE1rm: number;
  activeWeek: number;
  /** Draft blocks are editable in the builder and excluded from dashboards until committed. */
  draft: boolean;
  /** When locked, structure is fixed and only weights auto-update; unlocked = fully editable. */
  structureLocked: boolean;
  weeks: BlockWeek[];
}

export interface E1rmRecord {
  id: string;
  date: string; // ISO datetime
  lift: LiftKey;
  e1rm: number;
  sessionId: string;
  blockId: string;
}

export interface BodyweightEntry {
  date: string; // ISO date
  weight: number;
}

export interface Settings {
  roundingKg: number;
  bodyweight: number | null;
}

export interface AppData {
  version: number;
  blocks: Block[];
  activeBlockId: string | null;
  e1rmHistory: E1rmRecord[];
  bodyweightLog: BodyweightEntry[];
  settings: Settings;
}
