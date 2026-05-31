import { MUSCLE_LABELS, TRACKED_MUSCLES, VOLUME_GUIDELINES } from "./templates";
import type { Block, E1rmRecord, LiftKey, MuscleGroup, SessionDay } from "./types";

export interface VolumeStatus {
  muscle: MuscleGroup;
  label: string;
  sets: number;
  min: number;
  max: number;
  state: "low" | "ok" | "high";
}

/** Effective sets per muscle group vs the weekly guidelines (default week 1). */
export function volumeStatus(block: Block, weekNumber = 1): VolumeStatus[] {
  const vols = weekVolume(block);
  const wv = vols.find((v) => v.weekNumber === weekNumber) ?? vols[0];
  const out: VolumeStatus[] = [];
  for (const m of Object.keys(VOLUME_GUIDELINES) as MuscleGroup[]) {
    const range = VOLUME_GUIDELINES[m];
    if (!range) continue;
    const [min, max] = range;
    const sets = wv?.byMuscle[m]?.sets ?? 0;
    out.push({
      muscle: m,
      label: MUSCLE_LABELS[m],
      sets,
      min,
      max,
      state: sets < min ? "low" : sets > max ? "high" : "ok",
    });
  }
  return out;
}

/** Tonnage (kg) of a single set using actual values, falling back to planned. */
function setTonnage(weight: number | null, plannedWeight: number | null, reps: number | null, targetReps: number): number {
  const w = weight ?? plannedWeight ?? 0;
  const r = reps ?? targetReps ?? 0;
  return w * r;
}

export interface WeekVolume {
  weekNumber: number;
  phase: string;
  tonnage: number;
  totalSets: number;
  avgRpe: number | null;
  byMuscle: Record<MuscleGroup, { sets: number; avgIntensity: number | null }>;
}

function emptyByMuscle(): Record<MuscleGroup, { sets: number; intensitySum: number; intensityCount: number }> {
  const obj = {} as Record<MuscleGroup, { sets: number; intensitySum: number; intensityCount: number }>;
  for (const m of [...TRACKED_MUSCLES, "core" as MuscleGroup]) {
    obj[m] = { sets: 0, intensitySum: 0, intensityCount: 0 };
  }
  return obj;
}

export function weekVolume(block: Block): WeekVolume[] {
  return block.weeks.map((week) => {
    let tonnage = 0;
    let totalSets = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    const muscle = emptyByMuscle();

    for (const day of week.days) {
      for (const ex of day.exercises) {
        for (const s of ex.sets) {
          totalSets += 1;
          tonnage += setTonnage(s.actualWeight, s.plannedWeight, s.actualReps, s.targetReps);
          const rpe = s.actualRpe ?? s.targetRpe;
          if (rpe) {
            rpeSum += rpe;
            rpeCount += 1;
          }
          const intensity = s.actualWeight ?? s.plannedWeight;
          for (const m of ex.muscleGroups) {
            const bucket = muscle[m];
            if (!bucket) continue;
            bucket.sets += 1;
            if (intensity) {
              bucket.intensitySum += intensity;
              bucket.intensityCount += 1;
            }
          }
        }
      }
    }

    const byMuscle = {} as Record<MuscleGroup, { sets: number; avgIntensity: number | null }>;
    for (const key of Object.keys(muscle) as MuscleGroup[]) {
      const b = muscle[key];
      byMuscle[key] = {
        sets: b.sets,
        avgIntensity: b.intensityCount ? Math.round((b.intensitySum / b.intensityCount) * 10) / 10 : null,
      };
    }

    return {
      weekNumber: week.weekNumber,
      phase: week.phase,
      tonnage: Math.round(tonnage),
      totalSets,
      avgRpe: rpeCount ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
      byMuscle,
    };
  });
}

export interface ReadinessPoint {
  label: string;
  score: number | null;
  weekNumber: number;
}

/** Readiness 0-100: nutrition + sleep are positive, stress + fatigue inverse. */
export function readinessScore(r: { voeding: number; stress: number; slaap: number; fatigue: number }): number {
  const positive = r.voeding + r.slaap; // 2..10
  const inverse = 6 - r.stress + (6 - r.fatigue); // 2..10
  const total = positive + inverse; // 4..20
  return Math.round(((total - 4) / 16) * 100);
}

export function readinessSeries(block: Block): ReadinessPoint[] {
  const points: ReadinessPoint[] = [];
  for (const week of block.weeks) {
    for (const day of week.days) {
      points.push({
        label: `W${week.weekNumber} ${day.title.split(" ")[0]}`,
        weekNumber: week.weekNumber,
        score: day.readiness ? readinessScore(day.readiness) : null,
      });
    }
  }
  return points;
}

export interface E1rmPoint {
  date: string;
  squat: number | null;
  bench: number | null;
}

export function e1rmSeries(history: E1rmRecord[]): E1rmPoint[] {
  const byDate = new Map<string, { squat: number | null; bench: number | null }>();
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (const rec of sorted) {
    const day = rec.date.slice(0, 10);
    const entry = byDate.get(day) ?? { squat: null, bench: null };
    const cur = entry[rec.lift];
    if (cur === null || rec.e1rm > cur) entry[rec.lift] = rec.e1rm;
    byDate.set(day, entry);
  }
  return [...byDate.entries()].map(([date, v]) => ({ date, ...v }));
}

export function rollingAverageE1rm(history: E1rmRecord[], lift: LiftKey, window = 5): number | null {
  const vals = history
    .filter((r) => r.lift === lift)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-window)
    .map((r) => r.e1rm);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function highestE1rm(history: E1rmRecord[], lift: LiftKey): number | null {
  const vals = history.filter((r) => r.lift === lift).map((r) => r.e1rm);
  return vals.length ? Math.max(...vals) : null;
}

/** Count days that have been logged / completed. */
export function sessionCompletion(day: SessionDay): { logged: number; total: number } {
  let logged = 0;
  let total = 0;
  for (const ex of day.exercises) {
    for (const s of ex.sets) {
      total += 1;
      if (s.actualWeight !== null || s.actualReps !== null) logged += 1;
    }
  }
  return { logged, total };
}
