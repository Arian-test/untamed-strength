"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveBlock } from "@/store/useAppStore";
import { generateInsights, type InsightTone } from "@/lib/insights";

const TONE_STYLE: Record<InsightTone, { border: string; icon: React.ReactNode }> = {
  warn: { border: "border-warn/40", icon: <AlertTriangle className="size-5 text-warn" /> },
  good: { border: "border-primary/40", icon: <CheckCircle2 className="size-5 text-primary" /> },
  info: { border: "border-accent/40", icon: <Info className="size-5 text-accent" /> },
};

export default function InsightsPage() {
  const block = useActiveBlock();
  const insights = generateInsights(block);

  return (
    <div>
      <PageHeader
        title="Inzichten"
        description="Automatische feedback op basis van je volume, readiness en e1RM-trends."
      />

      {!block ? (
        <EmptyState
          title="Geen blok"
          description="Maak een blok aan en log sessies om inzichten te krijgen."
          action={
            <Button asChild>
              <Link href="/builder">Naar Builder</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((i) => {
            const style = TONE_STYLE[i.tone];
            return (
              <Card key={i.id} className={style.border}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5">{style.icon}</div>
                  <div>
                    <p className="font-medium">{i.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{i.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
