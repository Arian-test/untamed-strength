"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import { todayIso } from "@/lib/format";
import type { AppData, AutoregMode } from "@/lib/types";

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const blocks = useAppStore((s) => s.blocks);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const logBodyweight = useAppStore((s) => s.logBodyweight);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const deleteBlock = useAppStore((s) => s.deleteBlock);
  const resetAll = useAppStore((s) => s.resetAll);

  const [bw, setBw] = useState(settings.bodyweight !== null ? String(settings.bodyweight) : "");
  const [bwDate, setBwDate] = useState(todayIso());
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `untamed-strength-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as AppData;
      importData(data);
      setMsg("Data geïmporteerd.");
    } catch {
      setMsg("Kon bestand niet lezen — ongeldige JSON.");
    }
  };

  return (
    <div>
      <PageHeader title="Instellingen" description="Lichaamsgewicht, afronding en je data." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lichaamsgewicht</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bw">Gewicht (kg)</Label>
                <Input id="bw" type="number" step="0.1" value={bw} onChange={(e) => setBw(e.target.value)} className="w-32" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bwd">Datum</Label>
                <Input id="bwd" type="date" value={bwDate} onChange={(e) => setBwDate(e.target.value)} className="w-44" />
              </div>
              <Button
                onClick={() => {
                  const w = Number(bw);
                  if (w > 0) {
                    logBodyweight({ date: bwDate, weight: w });
                    setMsg("Lichaamsgewicht opgeslagen.");
                  }
                }}
              >
                Opslaan
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="round">Afronden trainingsgewicht (kg)</Label>
              <Input
                id="round"
                type="number"
                step="0.5"
                value={settings.roundingKg}
                onChange={(e) => updateSettings({ roundingKg: Number(e.target.value) || 2.5 })}
                className="w-32"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="autoreg">Autoregulatie tijdens training</Label>
              <Select
                id="autoreg"
                containerClassName="w-full sm:w-72"
                value={settings.autoregulation ?? "suggest"}
                onChange={(e) => updateSettings({ autoregulation: e.target.value as AutoregMode })}
              >
                <option value="off">Uit</option>
                <option value="suggest">Alleen voorstel tonen</option>
                <option value="auto">Automatisch toepassen</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Past het gewicht van de resterende sets van een oefening aan op basis van je werkelijke RPE — alleen
                binnen die oefening en die training.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data (lokaal opgeslagen)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Al je data staat in deze browser (IndexedDB). Maak regelmatig een back-up via export.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="size-4" /> Exporteer JSON
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Importeer JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = "";
                }}
              />
            </div>
            {msg ? <p className="text-sm text-primary">{msg}</p> : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Blokken</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen blokken.</p>
            ) : (
              blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.name}</span>
                    <Badge variant="muted">Week {b.activeWeek}/5</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteBlock(b.id)}>
                    <Trash2 className="size-4" /> Verwijderen
                  </Button>
                </div>
              ))
            )}
            <div className="mt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm("Alle data wissen? Dit kan niet ongedaan worden gemaakt.")) resetAll();
                }}
              >
                <Trash2 className="size-4" /> Alles resetten
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
