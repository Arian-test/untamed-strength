"use client";

import Link from "next/link";
import { Activity, Dumbbell, Plus, Scale, TrendingUp } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { ChartCard, MultiLineChart, SimpleBarChart, SimpleAreaChart, CHART_COLORS } from "@/components/charts";
import { useAppStore, useActiveBlock } from "@/store/useAppStore";
import { e1rmSeries, highestE1rm, rollingAverageE1rm, weekVolume } from "@/lib/analytics";
import { kg, kgUnit } from "@/lib/format";

export default function DashboardPage() {
  const block = useActiveBlock();
  const history = useAppStore((s) => s.e1rmHistory);
  const bodyweight = useAppStore((s) => s.settings.bodyweight);

  const squatBest = highestE1rm(history, "squat") ?? block?.squatE1rm ?? null;
  const benchBest = highestE1rm(history, "bench") ?? block?.benchE1rm ?? null;
  const squatAvg = rollingAverageE1rm(history, "squat");
  const benchAvg = rollingAverageE1rm(history, "bench");

  const e1rmData = e1rmSeries(history);
  const vols = block ? weekVolume(block) : [];
  const volData = vols.map((v) => ({ week: `W${v.weekNumber}`, tonnage: v.tonnage, rpe: v.avgRpe }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Je huidige stand van zaken in één oogopslag."
        actions={
          <Button asChild>
            <Link href="/builder">
              <Plus className="size-4" /> Nieuw blok
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Lichaamsgewicht"
          value={bodyweight !== null ? kg(bodyweight) : "–"}
          unit={bodyweight !== null ? "kg" : undefined}
          icon={<Scale className="size-5" />}
          sub={<Link href="/settings" className="text-primary hover:underline">Bijwerken</Link>}
        />
        <Stat
          label="Squat e1RM"
          value={squatBest !== null ? kg(squatBest) : "–"}
          unit={squatBest !== null ? "kg" : undefined}
          icon={<Dumbbell className="size-5" />}
          sub={squatAvg ? `Rolling avg ${kgUnit(squatAvg)}` : "Nog geen sessies gelogd"}
        />
        <Stat
          label="Bench e1RM"
          value={benchBest !== null ? kg(benchBest) : "–"}
          unit={benchBest !== null ? "kg" : undefined}
          icon={<Activity className="size-5" />}
          sub={benchAvg ? `Rolling avg ${kgUnit(benchAvg)}` : "Nog geen sessies gelogd"}
        />
      </div>

      {!block ? (
        <div className="mt-6">
          <EmptyState
            title="Nog geen trainingsblok"
            description="Maak je eerste 5-wekenblok aan om te beginnen met loggen."
            action={
              <Button asChild>
                <Link href="/builder">
                  <Plus className="size-4" /> Ga naar Program Builder
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Current block */}
          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{block.name}</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/train">Open training</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {block.weeks.map((w) => {
                  const active = w.weekNumber === block.activeWeek;
                  return (
                    <div
                      key={w.weekNumber}
                      className={`rounded-lg border p-3 text-center ${
                        active ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Week {w.weekNumber}</p>
                      <p className="mt-1 text-sm font-medium">{w.scheme}</p>
                      <Badge
                        variant={w.phase === "Peak" ? "warn" : w.phase === "Intensification" ? "accent" : "muted"}
                        className="mt-2"
                      >
                        {active ? "Actief" : w.phase}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="e1RM progressie">
              {e1rmData.length ? (
                <MultiLineChart
                  data={e1rmData}
                  xKey="date"
                  series={[
                    { key: "squat", label: "Squat", color: CHART_COLORS.squat },
                    { key: "bench", label: "Bench", color: CHART_COLORS.bench },
                  ]}
                />
              ) : (
                <ChartEmpty />
              )}
            </ChartCard>

            <ChartCard title="Trainingsvolume per week (tonnage)">
              <SimpleBarChart data={volData} xKey="week" dataKey="tonnage" color={CHART_COLORS.volume} />
            </ChartCard>

            <ChartCard title="Gemiddelde RPE per week">
              <SimpleAreaChart data={volData} xKey="week" dataKey="rpe" color={CHART_COLORS.rpe} />
            </ChartCard>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-primary" /> Snelle samenvatting
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <Row
                  label="Actieve week"
                  value={`Week ${block.activeWeek} · ${block.weeks.find((w) => w.weekNumber === block.activeWeek)?.phase}`}
                />
                <Row label="Gelogde e1RM-sessies" value={String(history.length)} />
                <Row label="Squat (blok-instelling)" value={kgUnit(block.squatE1rm)} />
                <Row label="Bench (blok-instelling)" value={kgUnit(block.benchE1rm)} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Log je eerste sessie om progressie te zien.
    </div>
  );
}
