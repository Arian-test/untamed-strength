"use client";

import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard, SimpleBarChart, CHART_COLORS } from "@/components/charts";
import { useActiveBlock } from "@/store/useAppStore";
import { weekVolume } from "@/lib/analytics";
import { MUSCLE_LABELS, TRACKED_MUSCLES } from "@/lib/templates";
import { kgUnit } from "@/lib/format";

export default function VolumePage() {
  const block = useActiveBlock();

  if (!block) {
    return (
      <div>
        <PageHeader title="Volume" />
        <EmptyState
          title="Geen blok"
          description="Maak een blok aan om volume per spiergroep te zien."
          action={
            <Button asChild>
              <Link href="/builder">Naar Builder</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const vols = weekVolume(block);
  const active = vols.find((v) => v.weekNumber === block.activeWeek) ?? vols[0];
  const barData = TRACKED_MUSCLES.map((m) => ({
    muscle: MUSCLE_LABELS[m],
    sets: active.byMuscle[m]?.sets ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Volume tracking"
        description={`Sets per spiergroep en gemiddelde intensiteit · ${block.name}`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={`Sets per spiergroep · Week ${active.weekNumber}`}>
          <SimpleBarChart data={barData} xKey="muscle" dataKey="sets" color={CHART_COLORS.volume} />
        </ChartCard>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Volume per week</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead className="text-right">Sets</TableHead>
                  <TableHead className="text-right">Tonnage</TableHead>
                  <TableHead className="text-right">Gem. RPE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vols.map((v) => (
                  <TableRow key={v.weekNumber}>
                    <TableCell className="font-medium">{v.weekNumber}</TableCell>
                    <TableCell>
                      <Badge variant={v.phase === "Peak" ? "warn" : v.phase === "Intensification" ? "accent" : "muted"}>
                        {v.phase}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{v.totalSets}</TableCell>
                    <TableCell className="text-right tabular-nums">{v.tonnage.toLocaleString("nl-NL")} kg</TableCell>
                    <TableCell className="text-right tabular-nums">{v.avgRpe ?? "–"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail per spiergroep · Week {active.weekNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spiergroep</TableHead>
                <TableHead className="text-right">Aantal sets</TableHead>
                <TableHead className="text-right">Gem. intensiteit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRACKED_MUSCLES.map((m) => {
                const b = active.byMuscle[m];
                return (
                  <TableRow key={m}>
                    <TableCell className="font-medium">{MUSCLE_LABELS[m]}</TableCell>
                    <TableCell className="text-right tabular-nums">{b?.sets ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {b?.avgIntensity ? kgUnit(b.avgIntensity) : "–"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
