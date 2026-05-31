"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11 };
const grid = "hsl(var(--border))";

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
};

interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] pt-2">{children}</CardContent>
    </Card>
  );
}

export function MultiLineChart({
  data,
  xKey,
  series,
}: {
  data: unknown[];
  xKey: string;
  series: SeriesDef[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip {...tooltipStyle} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleAreaChart({
  data,
  xKey,
  dataKey,
  color,
}: {
  data: unknown[];
  xKey: string;
  dataKey: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip {...tooltipStyle} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${dataKey})`}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  dataKey,
  color,
}: {
  data: unknown[];
  xKey: string;
  dataKey: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={{ stroke: grid }} />
        <YAxis tick={axis} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CHART_COLORS = {
  squat: "hsl(142 69% 48%)",
  bench: "hsl(199 89% 52%)",
  volume: "hsl(38 95% 56%)",
  rpe: "hsl(280 65% 65%)",
};
