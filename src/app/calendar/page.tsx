"use client";

import Link from "next/link";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveBlock } from "@/store/useAppStore";
import { DAY_LABELS } from "@/lib/templates";
import { formatDate } from "@/lib/format";
import type { DayKey } from "@/lib/types";

// Week starts on Sunday: Sun=0, Mon=+1, Wed=+3, Thu=+4.
const DAY_OFFSET: Record<DayKey, number> = { sun: 0, mon: 1, wed: 3, thu: 4 };

function plannedDate(startDate: string | null, weekNumber: number, dayKey: DayKey): Date | null {
  if (!startDate) return null;
  const base = new Date(startDate);
  if (Number.isNaN(base.getTime())) return null;
  const d = new Date(base);
  d.setDate(base.getDate() + (weekNumber - 1) * 7 + DAY_OFFSET[dayKey]);
  return d;
}

type Status = "done" | "missed" | "planned";

export default function CalendarPage() {
  const block = useActiveBlock();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!block) {
    return (
      <div>
        <PageHeader title="Kalender" />
        <EmptyState
          title="Geen blok"
          description="Maak een blok aan met een startdatum om de kalender te vullen."
          action={
            <Button asChild>
              <Link href="/builder">Naar Builder</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Kalender"
        description={
          block.startDate
            ? `Geplande, voltooide en gemiste trainingen · start ${formatDate(block.startDate)}`
            : "Stel een startdatum in (Program Builder) voor exacte datums."
        }
      />

      <div className="flex flex-col gap-4">
        {block.weeks.map((week) => (
          <Card key={week.weekNumber}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                Week {week.weekNumber} · {week.scheme}
              </CardTitle>
              <Badge variant={week.phase === "Peak" ? "warn" : week.phase === "Intensification" ? "accent" : "muted"}>
                {week.phase}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {week.days.map((day) => {
                const date = plannedDate(block.startDate, week.weekNumber, day.dayKey);
                let status: Status = "planned";
                if (day.completedAt) status = "done";
                else if (date && date < today) status = "missed";

                return (
                  <Link key={day.id} href={`/session/${day.id}`}>
                    <div
                      className={`flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/40 ${
                        status === "done"
                          ? "border-primary/40"
                          : status === "missed"
                            ? "border-danger/40"
                            : "border-border"
                      }`}
                    >
                      {status === "done" ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : status === "missed" ? (
                        <XCircle className="size-4 text-danger" />
                      ) : (
                        <CircleDashed className="size-4 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{DAY_LABELS[day.dayKey]}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {date ? formatDate(date.toISOString()) : day.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
