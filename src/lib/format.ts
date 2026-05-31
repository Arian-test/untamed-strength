export function kg(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`.replace(".", ",");
}

export function kgUnit(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${kg(value)} kg`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
