"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard, SimpleAreaChart, MultiLineChart, CHART_COLORS } from "@/components/charts";
import { useAppStore, useActiveBlock } from "@/store/useAppStore";
import { e1rmSeries, highestE1rm, rollingAverageE1rm, readinessSeries } from "@/lib/analytics";
import { buildChart, RPE_STEPS } from "@/lib/rpe";
import { kg } from "@/lib/format";

export default function ProgressPage() {
  const history = useAppStore((s) => s.e1rmHistory);
  const bwLog = useAppStore((s) => s.bodyweightLog);
  const block = useActiveBlock();

  const e1rmData = e1rmSeries(history);
  const bwData = bwLog.map((b) => ({ date: b.date, weight: b.weight }));
  const readiness = block ? readinessSeries(block).filter((p) => p.score !== null) : [];
  const chart = buildChart();

  return (
    <div>
      <PageHeader title="Progressie" description="e1RM, lichaamsgewicht, readiness en de RPE-chart." />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Squat hoogste e1RM" value={kg(highestE1rm(history, "squat") ?? 0) || "–"} unit="kg" />
        <Stat label="Squat rolling avg" value={kg(rollingAverageE1rm(history, "squat") ?? 0) || "–"} unit="kg" />
        <Stat label="Bench hoogste e1RM" value={kg(highestE1rm(history, "bench") ?? 0) || "–"} unit="kg" />
        <Stat label="Bench rolling avg" value={kg(rollingAverageE1rm(history, "bench") ?? 0) || "–"} unit="kg" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="e1RM Squat & Bench">
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
            <Empty />
          )}
        </ChartCard>
        <ChartCard title="Lichaamsgewicht">
          {bwData.length ? (
            <SimpleAreaChart data={bwData} xKey="date" dataKey="weight" color={CHART_COLORS.bench} />
          ) : (
            <Empty />
          )}
        </ChartCard>
        <ChartCard title="Readiness trend">
          {readiness.length ? (
            <SimpleAreaChart data={readiness} xKey="label" dataKey="score" color={CHART_COLORS.rpe} />
          ) : (
            <Empty />
          )}
        </ChartCard>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">RPE-chart (% van e1RM)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reps</TableHead>
                  {RPE_STEPS.map((r) => (
                    <TableHead key={r} className="text-right">
                      @{r}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {chart.map((row) => (
                  <TableRow key={row.reps}>
                    <TableCell className="font-medium">{row.reps}</TableCell>
                    {RPE_STEPS.map((r) => (
                      <TableCell key={r} className="text-right tabular-nums text-muted-foreground">
                        {row.values[String(r)] ?? "–"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Nog geen data.</div>;
}
