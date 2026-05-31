"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "./idb-storage";
import { sessionE1rm } from "@/lib/adaptive";
import {
  generateBlock,
  newExercise,
  newSet,
  recalcSetPlanned,
  recomputeFutureWeights,
  type NewBlockInput,
} from "@/lib/periodization";
import type {
  AppData,
  Block,
  BodyweightEntry,
  E1rmRecord,
  ExerciseEntry,
  LiftKey,
  Readiness,
  Settings,
  SetEntry,
} from "@/lib/types";
import { uid } from "@/lib/utils";

const DATA_VERSION = 3;

interface AppState extends AppData {
  _hydrated: boolean;
  setHydrated: (v: boolean) => void;

  createBlock: (input: NewBlockInput) => string;
  createDraftBlock: (input: NewBlockInput) => string;
  commitDraft: (blockId: string) => void;
  discardDraft: (blockId: string) => void;
  toggleStructureLock: (blockId: string, locked?: boolean) => void;
  updateBlockE1rm: (blockId: string, lift: LiftKey, value: number) => void;
  deleteBlock: (blockId: string) => void;
  setActiveBlock: (blockId: string | null) => void;
  setActiveWeek: (blockId: string, week: number) => void;

  updateSet: (blockId: string, dayId: string, exId: string, setId: string, patch: Partial<SetEntry>) => void;
  updateSetTarget: (
    blockId: string,
    dayId: string,
    exId: string,
    setId: string,
    patch: Partial<Pick<SetEntry, "targetReps" | "targetRpe" | "plannedWeight" | "isBackoff">>,
  ) => void;
  addSet: (blockId: string, dayId: string, exId: string) => void;
  removeSet: (blockId: string, dayId: string, exId: string, setId: string) => void;

  addExercise: (blockId: string, dayId: string, name?: string) => void;
  removeExercise: (blockId: string, dayId: string, exId: string) => void;
  duplicateExercise: (blockId: string, dayId: string, exId: string) => void;
  reorderExercises: (blockId: string, dayId: string, orderedIds: string[]) => void;
  setExerciseName: (blockId: string, dayId: string, exId: string, name: string) => void;
  setExerciseLift: (blockId: string, dayId: string, exId: string, lift: LiftKey | null, factor?: number) => void;
  setExerciseNote: (blockId: string, dayId: string, exId: string, note: string) => void;
  setDayNote: (blockId: string, dayId: string, note: string) => void;
  setReadiness: (blockId: string, dayId: string, readiness: Readiness) => void;
  completeSession: (blockId: string, dayId: string) => void;
  reopenSession: (blockId: string, dayId: string) => void;

  applyNewE1rm: (blockId: string, lift: LiftKey, value: number) => void;

  logBodyweight: (entry: BodyweightEntry) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  exportData: () => AppData;
  importData: (data: AppData) => void;
  resetAll: () => void;
}

const initialData: AppData = {
  version: DATA_VERSION,
  blocks: [],
  activeBlockId: null,
  e1rmHistory: [],
  bodyweightLog: [],
  settings: { roundingKg: 2.5, bodyweight: null, autoregulation: "suggest" },
};

function mapBlock(blocks: Block[], blockId: string, fn: (b: Block) => Block): Block[] {
  return blocks.map((b) => (b.id === blockId ? fn(b) : b));
}

function patchDay(block: Block, dayId: string, fn: (d: Block["weeks"][number]["days"][number]) => Block["weeks"][number]["days"][number]): Block {
  return {
    ...block,
    weeks: block.weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => (d.id === dayId ? fn(d) : d)),
    })),
  };
}

function patchExercise(
  block: Block,
  dayId: string,
  exId: string,
  fn: (ex: ExerciseEntry) => ExerciseEntry,
): Block {
  return patchDay(block, dayId, (d) => ({
    ...d,
    exercises: d.exercises.map((ex) => (ex.id === exId ? fn(ex) : ex)),
  }));
}

function renumber(sets: SetEntry[]): SetEntry[] {
  return sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
}

export const useAppStore = create<AppState>()(
  persist(
    (setState, getState) => ({
      ...initialData,
      _hydrated: false,
      setHydrated: (v) => setState({ _hydrated: v }),

      createBlock: (input) => {
        const block = generateBlock(input);
        setState((s) => ({
          blocks: [...s.blocks, block],
          activeBlockId: block.id,
        }));
        return block.id;
      },

      createDraftBlock: (input) => {
        // Draft: editable in the builder, unlocked, NOT active until committed.
        const block = { ...generateBlock(input), draft: true, structureLocked: false };
        setState((s) => ({ blocks: [...s.blocks, block] }));
        return block.id;
      },

      commitDraft: (blockId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => ({ ...b, draft: false, structureLocked: true })),
          activeBlockId: blockId,
        })),

      discardDraft: (blockId) =>
        setState((s) => ({ blocks: s.blocks.filter((b) => b.id !== blockId) })),

      toggleStructureLock: (blockId, locked) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => ({
            ...b,
            structureLocked: locked ?? !b.structureLocked,
          })),
        })),

      updateBlockE1rm: (blockId, lift, value) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => {
            const squat = lift === "squat" ? value : b.squatE1rm;
            const bench = lift === "bench" ? value : b.benchE1rm;
            return recomputeFutureWeights(b, squat, bench, s.settings.roundingKg);
          }),
        })),

      deleteBlock: (blockId) =>
        setState((s) => {
          const blocks = s.blocks.filter((b) => b.id !== blockId);
          return {
            blocks,
            activeBlockId: s.activeBlockId === blockId ? (blocks[0]?.id ?? null) : s.activeBlockId,
          };
        }),

      setActiveBlock: (blockId) => setState({ activeBlockId: blockId }),

      setActiveWeek: (blockId, week) =>
        setState((s) => ({ blocks: mapBlock(s.blocks, blockId, (b) => ({ ...b, activeWeek: week })) })),

      updateSet: (blockId, dayId, exId, setId, patch) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => ({
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id === exId
                  ? { ...ex, sets: ex.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) }
                  : ex,
              ),
            })),
          ),
        })),

      updateSetTarget: (blockId, dayId, exId, setId, patch) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchExercise(b, dayId, exId, (ex) => ({
              ...ex,
              sets: ex.sets.map((set) => {
                if (set.id !== setId) return set;
                if (patch.plannedWeight !== undefined) {
                  // Manual weight entry: store as typed, stop auto-recalc.
                  return { ...set, ...patch, plannedManual: patch.plannedWeight !== null };
                }
                const next = { ...set, ...patch };
                next.plannedWeight = recalcSetPlanned(ex, next, b.squatE1rm, b.benchE1rm, s.settings.roundingKg);
                return next;
              }),
            })),
          ),
        })),

      addSet: (blockId, dayId, exId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchExercise(b, dayId, exId, (ex) => {
              const last = ex.sets[ex.sets.length - 1];
              const ns = newSet(ex.sets.length + 1, last);
              ns.actualWeight = null;
              ns.actualReps = null;
              ns.actualRpe = null;
              ns.plannedWeight = recalcSetPlanned(ex, ns, b.squatE1rm, b.benchE1rm, s.settings.roundingKg);
              return { ...ex, sets: [...ex.sets, ns] };
            }),
          ),
        })),

      removeSet: (blockId, dayId, exId, setId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchExercise(b, dayId, exId, (ex) => ({
              ...ex,
              sets: renumber(ex.sets.filter((set) => set.id !== setId)),
            })),
          ),
        })),

      addExercise: (blockId, dayId, name) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => ({ ...d, exercises: [...d.exercises, newExercise(name)] })),
          ),
        })),

      removeExercise: (blockId, dayId, exId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => ({ ...d, exercises: d.exercises.filter((ex) => ex.id !== exId) })),
          ),
        })),

      duplicateExercise: (blockId, dayId, exId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => {
              const idx = d.exercises.findIndex((ex) => ex.id === exId);
              if (idx === -1) return d;
              const src = d.exercises[idx];
              const copy: ExerciseEntry = {
                ...src,
                id: uid("ex_"),
                name: `${src.name} (kopie)`,
                sets: src.sets.map((set) => ({
                  ...set,
                  id: uid("set_"),
                  actualWeight: null,
                  actualReps: null,
                  actualRpe: null,
                })),
              };
              const exercises = [...d.exercises];
              exercises.splice(idx + 1, 0, copy);
              return { ...d, exercises };
            }),
          ),
        })),

      reorderExercises: (blockId, dayId, orderedIds) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => {
              const byId = new Map(d.exercises.map((ex) => [ex.id, ex]));
              const reordered = orderedIds.map((id) => byId.get(id)).filter((x): x is ExerciseEntry => !!x);
              // Append any not present in orderedIds (safety).
              for (const ex of d.exercises) if (!orderedIds.includes(ex.id)) reordered.push(ex);
              return { ...d, exercises: reordered };
            }),
          ),
        })),

      setExerciseName: (blockId, dayId, exId, name) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => patchExercise(b, dayId, exId, (ex) => ({ ...ex, name }))),
        })),

      setExerciseLift: (blockId, dayId, exId, lift, factor) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchExercise(b, dayId, exId, (ex) => {
              const nextKind: ExerciseEntry["kind"] =
                lift === null ? "accessory" : ex.kind === "accessory" ? "main" : ex.kind;
              const nextEx: ExerciseEntry = {
                ...ex,
                lift,
                factor: factor ?? (lift === null ? 1 : ex.factor),
                kind: nextKind,
              };
              return {
                ...nextEx,
                sets: nextEx.sets.map((set) => ({
                  ...set,
                  plannedWeight: recalcSetPlanned(nextEx, set, b.squatE1rm, b.benchE1rm, s.settings.roundingKg),
                })),
              };
            }),
          ),
        })),

      setExerciseNote: (blockId, dayId, exId, note) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => ({
              ...d,
              exercises: d.exercises.map((ex) => (ex.id === exId ? { ...ex, note } : ex)),
            })),
          ),
        })),

      setDayNote: (blockId, dayId, note) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => patchDay(b, dayId, (d) => ({ ...d, note }))),
        })),

      setReadiness: (blockId, dayId, readiness) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => patchDay(b, dayId, (d) => ({ ...d, readiness }))),
        })),

      completeSession: (blockId, dayId) => {
        const state = getState();
        const block = state.blocks.find((b) => b.id === blockId);
        const day = block?.weeks.flatMap((w) => w.days).find((d) => d.id === dayId);
        if (!block || !day) return;

        const now = new Date().toISOString();
        const newRecords: E1rmRecord[] = [];
        for (const lift of ["squat", "bench"] as LiftKey[]) {
          const e = sessionE1rm(day, lift);
          if (e !== null) {
            newRecords.push({ id: uid("e1_"), date: now, lift, e1rm: e, sessionId: dayId, blockId });
          }
        }

        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) =>
            patchDay(b, dayId, (d) => ({ ...d, completedAt: now })),
          ),
          e1rmHistory: [...s.e1rmHistory.filter((r) => r.sessionId !== dayId), ...newRecords],
        }));
      },

      reopenSession: (blockId, dayId) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => patchDay(b, dayId, (d) => ({ ...d, completedAt: null }))),
          e1rmHistory: s.e1rmHistory.filter((r) => r.sessionId !== dayId),
        })),

      applyNewE1rm: (blockId, lift, value) =>
        setState((s) => ({
          blocks: mapBlock(s.blocks, blockId, (b) => {
            const squat = lift === "squat" ? value : b.squatE1rm;
            const bench = lift === "bench" ? value : b.benchE1rm;
            return recomputeFutureWeights(b, squat, bench, s.settings.roundingKg);
          }),
        })),

      logBodyweight: (entry) =>
        setState((s) => ({
          bodyweightLog: [...s.bodyweightLog.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
          settings: { ...s.settings, bodyweight: entry.weight },
        })),

      updateSettings: (patch) => setState((s) => ({ settings: { ...s.settings, ...patch } })),

      exportData: () => {
        const s = getState();
        return {
          version: s.version,
          blocks: s.blocks,
          activeBlockId: s.activeBlockId,
          e1rmHistory: s.e1rmHistory,
          bodyweightLog: s.bodyweightLog,
          settings: s.settings,
        };
      },

      importData: (data) =>
        setState({
          version: data.version ?? DATA_VERSION,
          blocks: data.blocks ?? [],
          activeBlockId: data.activeBlockId ?? null,
          e1rmHistory: data.e1rmHistory ?? [],
          bodyweightLog: data.bodyweightLog ?? [],
          settings: { ...initialData.settings, ...(data.settings ?? {}) },
        }),

      resetAll: () => setState({ ...initialData }),
    }),
    {
      name: "untamed-strength",
      version: DATA_VERSION,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppData> & Record<string, unknown>;
        if (version < 2 && Array.isArray(state.blocks)) {
          state.blocks = (state.blocks as Block[]).map((b) => ({
            ...b,
            draft: b.draft ?? false,
            structureLocked: b.structureLocked ?? true,
            weeks: (b.weeks ?? []).map((w) => ({
              ...w,
              days: (w.days ?? []).map((d) => ({
                ...d,
                exercises: (d.exercises ?? []).map((ex) => ({
                  ...ex,
                  sets: (ex.sets ?? []).map((st) => ({ ...st, plannedManual: st.plannedManual ?? false })),
                })),
              })),
            })),
          }));
        }
        if (version < 3) {
          state.settings = {
            roundingKg: 2.5,
            bodyweight: null,
            autoregulation: "suggest",
            ...(state.settings ?? {}),
          };
        }
        return state as AppData;
      },
      partialize: (s) => ({
        version: s.version,
        blocks: s.blocks,
        activeBlockId: s.activeBlockId,
        e1rmHistory: s.e1rmHistory,
        bodyweightLog: s.bodyweightLog,
        settings: s.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

// Convenience selectors --------------------------------------------------

export function useActiveBlock(): Block | null {
  return useAppStore((s) => {
    const found = s.blocks.find((b) => b.id === s.activeBlockId && !b.draft);
    if (found) return found;
    return s.blocks.find((b) => !b.draft) ?? null;
  });
}
