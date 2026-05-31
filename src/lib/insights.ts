import { weekVolume, readinessScore } from "./analytics";
import { MUSCLE_LABELS, TRACKED_MUSCLES } from "./templates";
import type { Block, MuscleGroup } from "./types";

export type InsightTone = "warn" | "good" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
}

// Weekly set-count guidelines per muscle group (hypertrophy minimums).
const MIN_WEEKLY_SETS: Partial<Record<MuscleGroup, number>> = {
  chest: 10,
  back: 10,
  shoulders: 8,
  quads: 8,
  hamstrings: 6,
  biceps: 6,
  triceps: 6,
};

export function generateInsights(block: Block | null): Insight[] {
  if (!block) return [];
  const out: Insight[] = [];
  const vols = weekVolume(block);
  const active = vols.find((v) => v.weekNumber === block.activeWeek) ?? vols[0];
  if (!active) return out;

  // Volume per muscle group vs minimums.
  for (const m of TRACKED_MUSCLES) {
    const min = MIN_WEEKLY_SETS[m];
    const sets = active.byMuscle[m]?.sets ?? 0;
    if (min && sets < min) {
      out.push({
        id: `vol_${m}`,
        tone: "warn",
        title: `${MUSCLE_LABELS[m]} volume te laag`,
        detail: `Week ${active.weekNumber}: ${sets} sets gepland, richtlijn is minimaal ${min}.`,
      });
    }
  }

  // Fatigue trend across logged sessions.
  const readinessByWeek = new Map<number, number[]>();
  for (const week of block.weeks) {
    for (const day of week.days) {
      if (!day.readiness) continue;
      const arr = readinessByWeek.get(week.weekNumber) ?? [];
      arr.push(readinessScore(day.readiness));
      readinessByWeek.set(week.weekNumber, arr);
    }
  }
  const weekAvgs = [...readinessByWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([w, arr]) => ({ w, avg: arr.reduce((a, b) => a + b, 0) / arr.length }));
  if (weekAvgs.length >= 2) {
    const first = weekAvgs[0].avg;
    const last = weekAvgs[weekAvgs.length - 1].avg;
    if (last < first - 12) {
      out.push({
        id: "fatigue_up",
        tone: "warn",
        title: "Vermoeidheid stijgt",
        detail: `Readiness daalde van ${Math.round(first)} naar ${Math.round(last)}. Overweeg een deload.`,
      });
    } else if (last >= 70) {
      out.push({
        id: "readiness_good",
        tone: "good",
        title: "Trainingsbelasting optimaal",
        detail: `Readiness gemiddeld ${Math.round(last)} — herstel ziet er goed uit.`,
      });
    }
  }

  // Deload signal in peak week.
  if (block.activeWeek >= 5) {
    out.push({
      id: "deload",
      tone: "info",
      title: "Tijd voor deload / nieuw blok",
      detail: "Je zit in de peak-week. Na deze week kun je een nieuw blok starten met je nieuwe e1RM's.",
    });
  }

  // e1RM progress vs plan.
  for (const lift of ["squat", "bench"] as const) {
    const planned = lift === "squat" ? block.squatE1rm : block.benchE1rm;
    let best = 0;
    for (const week of block.weeks) {
      for (const day of week.days) {
        for (const ex of day.exercises) {
          if (ex.lift !== lift) continue;
          for (const s of ex.sets) {
            if (s.actualWeight && s.actualReps && s.actualRpe) {
              // rough e1rm
              const est = s.actualWeight / Math.max(0.5, 1 - (s.actualReps - 1) * 0.0333);
              if (est > best) best = est;
            }
          }
        }
      }
    }
    if (best > planned * 1.04) {
      out.push({
        id: `e1rm_${lift}`,
        tone: "good",
        title: `${lift === "squat" ? "Squat" : "Bench"} e1RM stijgt sneller dan gepland`,
        detail: `Geschatte e1RM ligt boven de blok-instelling (${planned} kg). Pas de resterende weken aan.`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      id: "all_good",
      tone: "good",
      title: "Trainingsbelasting optimaal",
      detail: "Geen aandachtspunten gevonden. Blijf consistent loggen.",
    });
  }
  return out;
}
