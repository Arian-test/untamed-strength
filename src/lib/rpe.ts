// RPE chart + e1RM math for the Untamed Strength app.
//
// The chart reproduces the user's exact anchors:
//   1 rep @10 = 100%   1 rep @9 = 96%   1 rep @8 = 92%
//   5 reps @8 = 81%    5 reps @7 = 77%
//
// Model: percentage of e1RM = 100 - 4*(10 - RPE) - f(reps)
//   f(reps): 1->0, 2->3, 3->6, 4->8.5, 5->11, 6->13.5, 7->16,
//            8->18, 9->20, 10->22, 11->24, 12->26
// Verified: 5@7 -> 100 - 12 - 11 = 77  ->  120kg * 0.77 = 92.4 -> 92.5kg.

export const MIN_RPE = 6;
export const MAX_RPE = 10;
export const MIN_REPS = 1;
export const MAX_REPS = 12;

const REP_DROP: Record<number, number> = {
  1: 0,
  2: 3,
  3: 6,
  4: 8.5,
  5: 11,
  6: 13.5,
  7: 16,
  8: 18,
  9: 20,
  10: 22,
  11: 24,
  12: 26,
};

/** Valid RPE steps used throughout the app. */
export const RPE_STEPS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Percentage of e1RM (0-100) for a given rep count and RPE.
 * Returns null for inputs outside the supported chart range.
 */
export function rpePercentage(reps: number, rpe: number): number | null {
  if (reps < MIN_REPS || reps > MAX_REPS) return null;
  if (rpe < MIN_RPE || rpe > MAX_RPE) return null;
  const r = Math.round(reps);
  const drop = REP_DROP[r];
  if (drop === undefined) return null;
  const pct = 100 - 4 * (10 - rpe) - drop;
  return Math.round(pct * 10) / 10;
}

/** Round a load to the nearest step (default 2.5 kg). */
export function roundToStep(weight: number, step = 2.5): number {
  if (step <= 0) return Math.round(weight * 10) / 10;
  return Math.round(weight / step) * step;
}

/**
 * Training weight for a target rep/RPE prescription given an e1RM.
 * `factor` scales the e1RM for lift variations (e.g. paused bench 0.92).
 */
export function trainingWeight(
  e1rm: number,
  reps: number,
  rpe: number,
  factor = 1,
  step = 2.5,
): number | null {
  const pct = rpePercentage(reps, rpe);
  if (pct === null || e1rm <= 0) return null;
  return roundToStep((e1rm * factor * pct) / 100, step);
}

/**
 * Estimated 1RM from a completed set (weight x reps @ actual RPE).
 * `factor` reverses any variation scaling so the result is comparable to the
 * competition lift's e1RM.
 */
export function estimateE1rm(
  weight: number,
  reps: number,
  rpe: number,
  factor = 1,
): number | null {
  const pct = rpePercentage(reps, rpe);
  if (pct === null || weight <= 0 || factor <= 0) return null;
  const e = weight / (pct / 100) / factor;
  return Math.round(e * 10) / 10;
}

/** Build a full lookup chart for display (reps x RPE -> percentage). */
export function buildChart(): { reps: number; values: Record<string, number | null> }[] {
  const rows: { reps: number; values: Record<string, number | null> }[] = [];
  for (let reps = MIN_REPS; reps <= MAX_REPS; reps++) {
    const values: Record<string, number | null> = {};
    for (const rpe of RPE_STEPS) {
      values[String(rpe)] = rpePercentage(reps, rpe);
    }
    rows.push({ reps, values });
  }
  return rows;
}

export { clamp };
