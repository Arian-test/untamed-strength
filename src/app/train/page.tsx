"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleDashed, Dumbbell, Plus } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useAppStore, useActiveBlock } from "@/store/useAppStore";
import { DAY_LABELS } from "@/lib/templates";
import { sessionCompletion } from "@/lib/analytics";
import { kgUnit } from "@/lib/format";

export default function TrainPage() {
  const blocks = useAppStore((s) => s.blocks).filter((b) => !b.draft);
  const block = useActiveBlock();
  const setActiveBlock = useAppStore((s) => s.setActiveBlock);
  const setActiveWeek = useAppStore((s) => s.setActiveWeek);

  if (!block) {
    return (
      <div>
        <PageHeader title="Training" />
        <EmptyState
          title="Nog geen blok"
          description="Maak eerst een 5-wekenblok aan in de Program Builder."
          action={
            <Button asChild>
              <Link href="/builder">
                <Plus className="size-4" /> Nieuw blok
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const week = block.weeks.find((w) => w.weekNumber === block.activeWeek) ?? block.weeks[0];

  return (
    <div>
      <PageHeader
        title={block.name}
        description={`Squat e1RM ${kgUnit(block.squatE1rm)} · Bench e1RM ${kgUnit(block.benchE1rm)}`}
        actions={
          <div className="flex items-center gap-2">
            {blocks.length > 1 ? (
              <Select
                value={block.id}
                onChange={(e) => setActiveBlock(e.target.value)}
                containerClassName="w-44"
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/builder">
                <Plus className="size-4" /> Nieuw blok
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {block.weeks.map((w) => {
          const active = w.weekNumber === block.activeWeek;
          return (
            <button
              key={w.weekNumber}
              onClick={() => setActiveWeek(block.id, w.weekNumber)}
              className={`flex flex-col rounded-lg border px-4 py-2 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-xs text-muted-foreground">Week {w.weekNumber}</span>
              <span className="text-sm font-medium">{w.scheme}</span>
              <Badge
                variant={w.phase === "Peak" ? "warn" : w.phase === "Intensification" ? "accent" : "muted"}
                className="mt-1 w-fit"
              >
                {w.phase}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {week.days.map((day) => {
          const { logged, total } = sessionCompletion(day);
          const done = !!day.completedAt;
          const started = logged > 0;
          return (
            <Link key={day.id} href={`/session/${day.id}`}>
              <Card className="transition-colors hover:border-primary/60">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-md ${
                        done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="size-5" /> : started ? <Dumbbell className="size-5" /> : <CircleDashed className="size-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{DAY_LABELS[day.dayKey]}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.title} · {day.exercises.length} oefeningen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {done ? "Voltooid" : started ? `${logged}/${total} sets` : "Gepland"}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
