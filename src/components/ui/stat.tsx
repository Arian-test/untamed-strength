import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

interface StatProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function Stat({ label, value, unit, sub, icon, className }: StatProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {value}
            {unit ? <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span> : null}
          </p>
          {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        {icon ? <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div> : null}
      </div>
    </Card>
  );
}
