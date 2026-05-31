"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseList } from "@/components/editor/exercise-list";
import { useAppStore } from "@/store/useAppStore";
import { DAY_LABELS } from "@/lib/templates";

export default function DraftEditPage() {
  const params = useParams<{ blockId: string }>();
  const router = useRouter();
  const blockId = params.blockId;

  const block = useAppStore((s) => s.blocks.find((b) => b.id === blockId) ?? null);
  const updateBlockE1rm = useAppStore((s) => s.updateBlockE1rm);
  const commitDraft = useAppStore((s) => s.commitDraft);
  const discardDraft = useAppStore((s) => s.discardDraft);

  const [weekNumber, setWeekNumber] = useState(1);
  const [dayIndex, setDayIndex] = useState(0);

  const week = useMemo(() => block?.weeks.find((w) => w.weekNumber === weekNumber) ?? block?.weeks[0], [block, weekNumber]);
  const day = week?.days[dayIndex] ?? week?.days[0];

  if (!block) {
    return (
      <div>
        <PageHeader title="Concept" />
        <EmptyState title="Concept niet gevonden" description="Dit blok bestaat niet (meer) of is al opgeslagen." />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader
        title="Concept bewerken"
        description={`${block.name} · pas alles aan en sla daarna op`}
      />

      {/* e1RM controls — recompute live */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sq">Squat e1RM (kg)</Label>
            <Input
              id="sq"
              type="number"
              inputMode="decimal"
              step="0.5"
              className="h-11 w-32"
              defaultValue={block.squatE1rm}
              onChange={(e) => updateBlockE1rm(block.id, "squat", Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bn">Bench e1RM (kg)</Label>
            <Input
              id="bn"
              type="number"
              inputMode="decimal"
              step="0.5"
              className="h-11 w-32"
              defaultValue={block.benchE1rm}
              onChange={(e) => updateBlockE1rm(block.id, "bench", Number(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Wijzig je e1RM en alle automatische gewichten worden direct herberekend.
          </p>
        </CardContent>
      </Card>

      {/* Week selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {block.weeks.map((w) => (
          <button
            key={w.weekNumber}
            onClick={() => setWeekNumber(w.weekNumber)}
            className={`rounded-lg border px-3 py-2 text-left transition-colors ${
              w.weekNumber === weekNumber ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
            }`}
          >
            <span className="block text-xs text-muted-foreground">Week {w.weekNumber}</span>
            <span className="text-sm font-medium">{w.scheme}</span>
          </button>
        ))}
      </div>

      {/* Day tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {week?.days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setDayIndex(i)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              i === dayIndex ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {DAY_LABELS[d.dayKey]}
          </button>
        ))}
      </div>

      {day ? (
        <>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-lg font-semibold">{day.title}</h2>
            <Badge variant="muted">{day.exercises.length} oefeningen</Badge>
          </div>
          <ExerciseList blockId={block.id} dayId={day.id} exercises={day.exercises} mode="edit" />
        </>
      ) : null}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:left-60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-5 py-3">
          <Button
            variant="ghost"
            className="text-danger"
            onClick={() => {
              if (confirm("Concept verwijderen?")) {
                discardDraft(block.id);
                router.push("/builder");
              }
            }}
          >
            <Trash2 className="size-4" /> Concept verwijderen
          </Button>
          <Button
            className="h-11 px-6"
            onClick={() => {
              commitDraft(block.id);
              router.push("/train");
            }}
          >
            <Check className="size-4" /> Blok opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}
