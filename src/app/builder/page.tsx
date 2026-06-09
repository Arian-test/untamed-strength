"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, Hammer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";
import { generateBlock } from "@/lib/periodization";
import { volumeStatus } from "@/lib/analytics";
import { DAY_LABELS, STANDARD_DAYS } from "@/lib/templates";
import { todayIso } from "@/lib/format";

interface FormValues {
  name: string;
  squatE1rm: number;
  benchE1rm: number;
  startDate: string;
  roundingKg: number;
}

export default function BuilderPage() {
  const router = useRouter();
  const blocks = useAppStore((s) => s.blocks);
  const createDraftBlock = useAppStore((s) => s.createDraftBlock);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const committed = blocks.filter((b) => !b.draft);
  const defaultName = useMemo(() => `Blok ${committed.length + 1}`, [committed.length]);

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      name: defaultName,
      squatE1rm: 180,
      benchE1rm: 120,
      startDate: todayIso(),
      roundingKg: 2.5,
    },
  });

  const squat = Number(watch("squatE1rm")) || 0;
  const bench = Number(watch("benchE1rm")) || 0;
  const step = Number(watch("roundingKg")) || 2.5;

  const volumes = useMemo(
    () =>
      volumeStatus(
        generateBlock({ name: "preview", squatE1rm: squat, benchE1rm: bench, startDate: null, step }),
      ),
    [squat, bench, step],
  );

  const [created, setCreated] = useState(false);

  const onSubmit = (v: FormValues) => {
    updateSettings({ roundingKg: Number(v.roundingKg) || 2.5 });
    const id = createDraftBlock({
      name: v.name.trim() || defaultName,
      squatE1rm: Number(v.squatE1rm),
      benchE1rm: Number(v.benchE1rm),
      startDate: v.startDate || null,
      step: Number(v.roundingKg) || 2.5,
    });
    setCreated(true);
    router.push(`/builder/edit?block=${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Program Builder"
        description="Genereer een 5-weken PPL + Upper-blok. Elke week dezelfde oefeningen — je gaat progressief zwaarder (double progression)."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nieuw blok</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Bloknaam</Label>
                <Input id="name" {...register("name")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="squat">Squat e1RM (kg)</Label>
                  <Input id="squat" type="number" step="0.5" {...register("squatE1rm")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bench">Bench e1RM (kg)</Label>
                  <Input id="bench" type="number" step="0.5" {...register("benchE1rm")} />
                </div>
              </div>
              <p className="-mt-1 text-xs text-muted-foreground">
                Referentie voor je dashboard. Gewichten kies je zelf per oefening; de app stelt elke week een hoger
                gewicht voor zodra je de reps haalt.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="start">Startdatum</Label>
                  <Input id="start" type="date" {...register("startDate")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="round">Afronden (kg)</Label>
                  <Input id="round" type="number" step="0.5" {...register("roundingKg")} />
                </div>
              </div>
              <Button type="submit" className="mt-1 h-11" disabled={created}>
                <Hammer className="size-4" /> Genereer & bewerk concept
              </Button>
              <p className="text-xs text-muted-foreground">
                Het blok wordt als concept aangemaakt en is volledig bewerkbaar voordat je het opslaat.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>De split</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {STANDARD_DAYS.map((d) => (
              <div key={d.dayKey} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {DAY_LABELS[d.dayKey]} · {d.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{d.exercises.length} oefeningen</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.exercises.map((e) => e.name).join(" · ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Volume check */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Volumecheck (sets per spiergroep per week)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {volumes.map((v) => (
              <div
                key={v.muscle}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  v.state === "ok" ? "border-border" : "border-warn/50 bg-warn/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {v.state === "ok" ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <AlertTriangle className="size-4 text-warn" />
                  )}
                  {v.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <span className={v.state !== "ok" ? "font-semibold text-warn" : "font-semibold text-foreground"}>
                    {v.sets}
                  </span>{" "}
                  / {v.min}-{v.max}
                  {v.state === "low" ? " ↓" : v.state === "high" ? " ↑" : ""}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Richtlijn voor effectieve sets per week. Buiten bereik = waarschuwing; je kunt het concept aanpassen
            (oefeningen toevoegen/verwijderen) om binnen bereik te komen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
