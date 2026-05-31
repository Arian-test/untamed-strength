"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { RPE_STEPS, estimateE1rm } from "@/lib/rpe";
import { kg, kgUnit } from "@/lib/format";
import type { ExerciseEntry, LiftKey } from "@/lib/types";

function bestE1rm(ex: ExerciseEntry): number | null {
  let best: number | null = null;
  for (const s of ex.sets) {
    if (s.actualWeight === null || s.actualReps === null || s.actualRpe === null) continue;
    const e = estimateE1rm(s.actualWeight, s.actualReps, s.actualRpe, ex.factor);
    if (e !== null && (best === null || e > best)) best = e;
  }
  return best;
}

function kindBadge(ex: ExerciseEntry) {
  if (ex.lift === "squat") return <Badge variant="default">Auto · Squat</Badge>;
  if (ex.lift === "bench") return <Badge variant="accent">Auto · Bench</Badge>;
  return <Badge variant="muted">Handmatig</Badge>;
}

/* ------------------------------------------------------------------ */
/* LOG MODE — training: read-only targets + big actual inputs          */
/* ------------------------------------------------------------------ */
export function LogExerciseCard({
  blockId,
  dayId,
  exercise,
}: {
  blockId: string;
  dayId: string;
  exercise: ExerciseEntry;
}) {
  const updateSet = useAppStore((s) => s.updateSet);
  const setExerciseNote = useAppStore((s) => s.setExerciseNote);
  const live = bestE1rm(exercise);

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{exercise.name}</span>
            {kindBadge(exercise)}
          </div>
          {live ? (
            <span className="text-xs text-muted-foreground">
              e1RM: <span className="font-semibold text-foreground">{kgUnit(live)}</span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          {exercise.sets.map((s) => (
            <div key={s.id} className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Set {s.setNumber}
                  {s.isBackoff ? <span className="ml-1 text-[10px]">BO</span> : null}
                </span>
                <span>
                  doel {s.targetReps} reps @ RPE {s.targetRpe}
                </span>
              </div>
              {s.plannedWeight !== null ? (
                <button
                  type="button"
                  onClick={() =>
                    updateSet(blockId, dayId, exercise.id, s.id, {
                      actualWeight: s.plannedWeight,
                      actualReps: s.actualReps ?? s.targetReps,
                    })
                  }
                  className="mb-2 flex w-full items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-3 py-2 transition-colors active:bg-primary/20"
                  aria-label="Voorstel overnemen"
                >
                  <span className="text-xs text-muted-foreground">
                    Voorstel
                    <span className="ml-1.5 text-base font-semibold text-foreground">{kgUnit(s.plannedWeight)}</span>
                  </span>
                  <span className="text-xs font-semibold text-primary">Overnemen ↓</span>
                </button>
              ) : null}
              <div className="grid grid-cols-3 gap-2">
                <FieldInput
                  label="Gewicht"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder={s.plannedWeight !== null ? kg(s.plannedWeight) : "kg"}
                  value={s.actualWeight ?? ""}
                  onChange={(v) => updateSet(blockId, dayId, exercise.id, s.id, { actualWeight: v === "" ? null : Number(v) })}
                />
                <FieldInput
                  label="Reps"
                  type="number"
                  inputMode="numeric"
                  placeholder={String(s.targetReps)}
                  value={s.actualReps ?? ""}
                  onChange={(v) => updateSet(blockId, dayId, exercise.id, s.id, { actualReps: v === "" ? null : Number(v) })}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">RPE</span>
                  <Select
                    className="h-11 text-base"
                    value={s.actualRpe ?? ""}
                    onChange={(e) =>
                      updateSet(blockId, dayId, exercise.id, s.id, {
                        actualRpe: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  >
                    <option value="">–</option>
                    {RPE_STEPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Input
          className="mt-3 h-11"
          placeholder="Opmerking…"
          value={exercise.note}
          onChange={(e) => setExerciseNote(blockId, dayId, exercise.id, e.target.value)}
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* EDIT MODE — spreadsheet-like, drag handle, free names, inline edit  */
/* ------------------------------------------------------------------ */
export function EditExerciseCard({
  blockId,
  dayId,
  exercise,
  dragId,
}: {
  blockId: string;
  dayId: string;
  exercise: ExerciseEntry;
  dragId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dragId });
  const setExerciseName = useAppStore((s) => s.setExerciseName);
  const setExerciseLift = useAppStore((s) => s.setExerciseLift);
  const setExerciseNote = useAppStore((s) => s.setExerciseNote);
  const removeExercise = useAppStore((s) => s.removeExercise);
  const duplicateExercise = useAppStore((s) => s.duplicateExercise);
  const updateSetTarget = useAppStore((s) => s.updateSetTarget);
  const addSet = useAppStore((s) => s.addSet);
  const removeSet = useAppStore((s) => s.removeSet);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
            aria-label="Versleep oefening"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          <Input
            className="h-11 flex-1 text-base font-semibold"
            value={exercise.name}
            placeholder="Oefeningnaam…"
            onChange={(e) => setExerciseName(blockId, dayId, exercise.id, e.target.value)}
          />
          <Button variant="ghost" size="icon" className="size-9" aria-label="Dupliceer" onClick={() => duplicateExercise(blockId, dayId, exercise.id)}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-9 text-danger" aria-label="Verwijder" onClick={() => removeExercise(blockId, dayId, exercise.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">Gewicht</span>
          <Select
            containerClassName="w-40"
            className="h-9"
            value={exercise.lift ?? "manual"}
            onChange={(e) => {
              const v = e.target.value;
              setExerciseLift(blockId, dayId, exercise.id, v === "manual" ? null : (v as LiftKey));
            }}
          >
            <option value="manual">Handmatig</option>
            <option value="squat">Auto · Squat e1RM</option>
            <option value="bench">Auto · Bench e1RM</option>
          </Select>
          {exercise.lift !== null ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                inputMode="numeric"
                className="h-9 w-20"
                value={Math.round(exercise.factor * 100)}
                onChange={(e) => {
                  const pct = Number(e.target.value) || 100;
                  setExerciseLift(blockId, dayId, exercise.id, exercise.lift, pct / 100);
                }}
              />
              <span className="text-xs text-muted-foreground">% e1RM</span>
            </div>
          ) : null}
        </div>

        {/* Column headers (desktop) */}
        <div className="hidden grid-cols-[2rem_1fr_1fr_1fr_2.25rem] gap-2 px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Set</span>
          <span>Reps</span>
          <span>RPE</span>
          <span>Gewicht</span>
          <span />
        </div>

        <div className="flex flex-col gap-2">
          {exercise.sets.map((s) => (
            <div key={s.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_2.25rem] items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{s.setNumber}</span>
              <Input
                type="number"
                inputMode="numeric"
                className="h-11"
                aria-label="Reps"
                value={s.targetReps}
                onChange={(e) => updateSetTarget(blockId, dayId, exercise.id, s.id, { targetReps: Number(e.target.value) || 0 })}
              />
              <Select
                className="h-11"
                aria-label="RPE"
                value={s.targetRpe}
                onChange={(e) => updateSetTarget(blockId, dayId, exercise.id, s.id, { targetRpe: Number(e.target.value) })}
              >
                {RPE_STEPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                className="h-11"
                aria-label="Gewicht"
                placeholder={exercise.lift ? "auto" : "kg"}
                value={s.plannedWeight ?? ""}
                onChange={(e) =>
                  updateSetTarget(blockId, dayId, exercise.id, s.id, {
                    plannedWeight: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground"
                aria-label="Verwijder set"
                onClick={() => removeSet(blockId, dayId, exercise.id, s.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => addSet(blockId, dayId, exercise.id)}>
            <Plus className="size-4" /> Set
          </Button>
        </div>

        <Input
          className="mt-3 h-11"
          placeholder="Opmerking…"
          value={exercise.note}
          onChange={(e) => setExerciseNote(blockId, dayId, exercise.id, e.target.value)}
        />
      </CardContent>
      </Card>
    </div>
  );
}

/* Small labelled input used in log mode. */
function FieldInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Input className="h-11 text-base" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
