"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, LockOpen, RotateCcw, TrendingUp } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseList } from "@/components/editor/exercise-list";
import { useAppStore } from "@/store/useAppStore";
import { DAY_LABELS } from "@/lib/templates";
import { analyzeSession, detectNewE1rm, type NewPrResult } from "@/lib/adaptive";
import { readinessScore } from "@/lib/analytics";
import { kg, kgUnit } from "@/lib/format";
import type { Readiness } from "@/lib/types";

const READINESS_FIELDS: { key: keyof Readiness; label: string }[] = [
  { key: "voeding", label: "Voeding" },
  { key: "slaap", label: "Slaap" },
  { key: "stress", label: "Stress" },
  { key: "fatigue", label: "Vermoeidheid" },
];

function SessionInner() {
  const dayId = useSearchParams().get("day") ?? "";
  const blocks = useAppStore((s) => s.blocks);
  const setDayNote = useAppStore((s) => s.setDayNote);
  const setReadiness = useAppStore((s) => s.setReadiness);
  const completeSession = useAppStore((s) => s.completeSession);
  const reopenSession = useAppStore((s) => s.reopenSession);
  const applyNewE1rm = useAppStore((s) => s.applyNewE1rm);
  const toggleStructureLock = useAppStore((s) => s.toggleStructureLock);
  const roundingKg = useAppStore((s) => s.settings.roundingKg);

  const found = useMemo(() => {
    for (const b of blocks) {
      for (const w of b.weeks) {
        const d = w.days.find((x) => x.id === dayId);
        if (d) return { block: b, week: w, day: d };
      }
    }
    return null;
  }, [blocks, dayId]);

  const [prDialog, setPrDialog] = useState<NewPrResult[]>([]);

  if (!found) {
    return (
      <div>
        <PageHeader title="Sessie" />
        <EmptyState title="Sessie niet gevonden" description="Deze training bestaat niet (meer)." />
      </div>
    );
  }

  const { block, week, day } = found;
  const editing = !block.structureLocked;
  const suggestions = analyzeSession(day, roundingKg);
  const readiness = day.readiness;

  const handleComplete = () => {
    const prs = detectNewE1rm(block, day);
    completeSession(block.id, day.id);
    if (prs.length) setPrDialog(prs);
  };

  const applyPr = (pr: NewPrResult) => {
    applyNewE1rm(block.id, pr.lift, pr.newE1rm);
    setPrDialog((cur) => cur.filter((p) => p.lift !== pr.lift));
  };

  return (
    <div className="pb-4">
      <PageHeader
        title={`${DAY_LABELS[day.dayKey]} · ${day.title}`}
        description={`${block.name} · Week ${week.weekNumber} · ${week.scheme}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/train">
                <ArrowLeft className="size-4" /> Terug
              </Link>
            </Button>
            {day.completedAt ? (
              <Button variant="outline" size="sm" onClick={() => reopenSession(block.id, day.id)}>
                <RotateCcw className="size-4" /> Heropenen
              </Button>
            ) : (
              <Button size="sm" onClick={handleComplete}>
                <CheckCircle2 className="size-4" /> Voltooien
              </Button>
            )}
          </div>
        }
      />

      {/* Structure lock toggle */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-2">
          {editing ? <LockOpen className="size-4 text-accent" /> : <Lock className="size-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">{editing ? "Bewerkmodus" : "Structuur vergrendeld"}</p>
            <p className="text-xs text-muted-foreground">
              {editing
                ? "Oefeningen, sets, reps & gewichten zijn bewerkbaar."
                : "Oefeningen staan vast — alleen loggen, gewichten updaten automatisch."}
            </p>
          </div>
        </div>
        <Switch checked={editing} onCheckedChange={(v) => toggleStructureLock(block.id, !v)} aria-label="Structuur vergrendelen" />
      </div>

      {day.completedAt ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="size-4" /> Sessie voltooid · e1RM&apos;s opgeslagen.
        </div>
      ) : null}

      {/* Readiness */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pre-session readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            {READINESS_FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">{f.label} (1-5)</label>
                <Select
                  className="h-11"
                  containerClassName="sm:w-24"
                  value={readiness?.[f.key] ?? ""}
                  onChange={(e) => {
                    const base: Readiness = readiness ?? { voeding: 3, slaap: 3, stress: 3, fatigue: 3 };
                    setReadiness(block.id, day.id, { ...base, [f.key]: Number(e.target.value) });
                  }}
                >
                  <option value="">–</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
            <div className="col-span-2 text-right sm:ml-auto">
              <p className="text-xs text-muted-foreground">Readiness Score</p>
              <p className="text-2xl font-semibold tabular-nums">
                {readiness ? readinessScore(readiness) : "–"}
                <span className="ml-0.5 text-sm font-normal text-muted-foreground">/100</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptive suggestions */}
      {suggestions.length > 0 && !day.completedAt && !editing ? (
        <Card className="mb-4 border-accent/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4 text-accent" /> Voorstellen voor volgende week
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {suggestions.map((s) => (
              <div key={s.exerciseName} className="flex items-center justify-between text-sm">
                <span>{s.exerciseName}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="hidden sm:inline">{s.reason}</span>
                  <Badge variant={s.deltaKg > 0 ? "default" : "danger"}>
                    {s.deltaKg > 0 ? "+" : ""}
                    {kg(s.deltaKg)} kg
                  </Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Exercises */}
      <ExerciseList blockId={block.id} dayId={day.id} exercises={day.exercises} mode={editing ? "edit" : "log"} />

      {/* Day note */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Notities</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Bijv. knieën beter naar buiten drukken, meer spanning in setup…"
            value={day.note}
            onChange={(e) => setDayNote(block.id, day.id, e.target.value)}
          />
        </CardContent>
      </Card>

      {/* New e1RM dialog */}
      <Dialog open={prDialog.length > 0} onOpenChange={(o) => !o && setPrDialog([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe e1RM gevonden</DialogTitle>
            <DialogDescription>Toepassen op de resterende weken van dit blok?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {prDialog.map((pr) => (
              <div key={pr.lift} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium capitalize">{pr.lift === "squat" ? "Squat" : "Bench"}</p>
                  <p className="text-xs text-muted-foreground">
                    {kgUnit(pr.previous)} → {kgUnit(pr.newE1rm)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setPrDialog((c) => c.filter((p) => p.lift !== pr.lift))}>
                    Nee
                  </Button>
                  <Button size="sm" onClick={() => applyPr(pr)}>
                    Ja, toepassen
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrDialog([])}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="px-1 py-10 text-sm text-muted-foreground">Laden…</div>}>
      <SessionInner />
    </Suspense>
  );
}
