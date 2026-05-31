import { estimateE1rm, trainingWeight } from "./rpe";
import type { Block, ExerciseEntry, LiftKey, SessionDay } from "./types";

// --- In-session autoregulation (per exercise, per session only) -------------

export interface AutoregResult {
  /** Temporary e1RM derived from the last logged set of this exercise. */
  tempE1rm: number;
  refSetNumber: number;
  /** New suggested weight per remaining (un-logged) set id. */
  suggestions: Record<string, number>;
}

/**
 * If a logged set deviated from its target RPE, derive a temporary e1RM and
 * suggest adjusted weights for the remaining sets of the SAME exercise only.
 * Returns null when nothing was logged or the last set hit its target RPE.
 */
export function autoregulate(ex: ExerciseEntry, roundingKg = 2.5): AutoregResult | null {
  const logged = ex.sets.filter(
    (s) => s.actualWeight !== null && s.actualReps !== null && s.actualRpe !== null,
  );
  if (!logged.length) return null;
  const ref = logged.reduce((a, b) => (b.setNumber > a.setNumber ? b : a));
  if (Math.abs((ref.actualRpe as number) - ref.targetRpe) < 0.5) return null; // on target

  const tempE1rm = estimateE1rm(ref.actualWeight!, ref.actualReps!, ref.actualRpe!, ex.factor);
  if (tempE1rm === null) return null;

  const suggestions: Record<string, number> = {};
  for (const s of ex.sets) {
    if (s.setNumber <= ref.setNumber || s.actualWeight !== null) continue;
    const w = trainingWeight(tempE1rm, s.targetReps, s.targetRpe, ex.factor, roundingKg);
    if (w !== null) suggestions[s.id] = w;
  }
  if (Object.keys(suggestions).length === 0) return null;
  return { tempE1rm: Math.round(tempE1rm * 10) / 10, refSetNumber: ref.setNumber, suggestions };
}

export interface WeightSuggestion {
  exerciseName: string;
  lift: LiftKey;
  targetRpe: number;
  actualRpe: number;
  deltaKg: number;
  reason: string;
}

/**
 * Suggest a load change for next week based on target vs actual RPE on the
 * top working set. Easier than planned -> add weight; harder -> back off.
 */
export function weightDelta(targetRpe: number, actualRpe: number, step = 2.5): number {
  const diff = actualRpe - targetRpe; // positive = harder than planned
  if (diff <= -2) return step * 2;
  if (diff <= -1) return step;
  if (diff >= 2) return -step * 2;
  if (diff >= 1) return -step;
  return 0;
}

/** The "top" working set of an exercise = first non-backoff set with a log. */
function topLoggedSet(ex: ExerciseEntry) {
  const working = ex.sets.filter((s) => !s.isBackoff);
  return (
    working.find((s) => s.actualRpe !== null && s.actualWeight !== null) ??
    working.find((s) => s.actualRpe !== null) ??
    null
  );
}

export function analyzeSession(day: SessionDay, step = 2.5): WeightSuggestion[] {
  const out: WeightSuggestion[] = [];
  for (const ex of day.exercises) {
    if (ex.kind === "accessory" || !ex.lift) continue;
    const top = topLoggedSet(ex);
    if (!top || top.actualRpe === null) continue;
    const delta = weightDelta(top.targetRpe, top.actualRpe, step);
    if (delta === 0) continue;
    out.push({
      exerciseName: ex.name,
      lift: ex.lift,
      targetRpe: top.targetRpe,
      actualRpe: top.actualRpe,
      deltaKg: delta,
      reason:
        delta > 0
          ? `Werkelijke RPE (${top.actualRpe}) lager dan doel (${top.targetRpe})`
          : `Werkelijke RPE (${top.actualRpe}) hoger dan doel (${top.targetRpe})`,
    });
  }
  return out;
}

/** Best estimated e1RM for a lift from all logged sets in a session. */
export function sessionE1rm(day: SessionDay, lift: LiftKey): number | null {
  let best: number | null = null;
  for (const ex of day.exercises) {
    if (ex.lift !== lift) continue;
    for (const s of ex.sets) {
      if (s.actualWeight === null || s.actualReps === null || s.actualRpe === null) continue;
      const e = estimateE1rm(s.actualWeight, s.actualReps, s.actualRpe, ex.factor);
      if (e !== null && (best === null || e > best)) best = e;
    }
  }
  return best;
}

export interface NewPrResult {
  lift: LiftKey;
  newE1rm: number;
  previous: number;
}

/** Detect whether a session produced a new block-best e1RM for either lift. */
export function detectNewE1rm(block: Block, day: SessionDay): NewPrResult[] {
  const results: NewPrResult[] = [];
  for (const lift of ["squat", "bench"] as LiftKey[]) {
    const e = sessionE1rm(day, lift);
    if (e === null) continue;
    const previous = lift === "squat" ? block.squatE1rm : block.benchE1rm;
    if (e > previous + 0.5) {
      results.push({ lift, newE1rm: Math.round(e * 10) / 10, previous });
    }
  }
  return results;
}
