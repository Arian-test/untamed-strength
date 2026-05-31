# Untamed Strength 🏋️

Persoonlijke webapp voor het plannen, tracken en analyseren van kracht- &
hypertrofietrainingen. Vervangt de Excel-sheet volledig. RTS-stijl RPE-systeem,
automatische gewichtsberekening, e1RM-tracking en adaptieve programmering.

**Lokaal-first**: al je data staat in je browser (IndexedDB). Geen account, geen
internet nodig. Maak back-ups via **Instellingen → Exporteer JSON**.

## Snel starten

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # productie-build
```

> **Let op (deze machine):** Node staat niet op de globale PATH. Gebruik de
> volledige paden of voeg Node toe aan PATH in je shell:
> ```powershell
> $env:Path = "$env:ProgramFiles\nodejs;" + $env:Path
> npm run dev
> ```
> De dev-server is ook geconfigureerd in `.claude/launch.json`.

## Wat zit erin

- **Dashboard** — lichaamsgewicht, Squat/Bench e1RM, huidig blok, grafieken.
- **Program Builder** — genereer een 5-wekenblok uit je Squat- en Bench-e1RM.
- **Training** — bewerkbare tabel: gepland gewicht wordt automatisch berekend,
  log werkelijk gewicht + RPE, live sessie-e1RM, readiness en notities.
- **Adaptief** — vergelijkt doel- vs werkelijke RPE en stelt gewichten voor;
  bij een nieuwe e1RM kun je alle resterende weken laten herberekenen.
- **Progressie / Volume / Inzichten / Kalender** — analyse en planning.

## Blokken bewerken (spreadsheet-gevoel)

- **Concept-modus**: na *Genereer & bewerk concept* land je in een volledig
  bewerkbaar voorbeeld. Pas alles aan en klik daarna pas **Blok opslaan**.
- **Inline alles**: oefeningnamen (vrij typen), sets, reps, RPE en gewicht
  direct in de tabel. Oefeningen toevoegen, dupliceren, verwijderen en
  **slepen** (drag & drop). Alles wordt automatisch opgeslagen.
- **Auto vs handmatig**: per oefening kies je *Auto · Squat/Bench e1RM (%)* —
  gewichten herberekenen dan automatisch bij wijziging van reps/RPE/e1RM — of
  *Handmatig* om zelf gewichten te typen.
- **Structuur vergrendelen**: in een opgeslagen blok schakelt de toggle tussen
  *log-modus* (oefeningen vast, alleen loggen) en *bewerkmodus* (alles vrij).

## Installeren als app (PWA)

Open de app in je browser en kies *Toevoegen aan beginscherm* (iPhone, Safari)
of *App installeren* (Android, Chrome). De app draait dan fullscreen met eigen
icoon en werkt offline (data staat lokaal).

## Periodisering

| Week | Fase | Schema |
|------|------|--------|
| 1 | Volume | 5×5 @7 |
| 2 | Volume | 5×5 @7.5 |
| 3 | Intensification | 4×4 @8 |
| 4 | Intensification | 3×3 @8.5 |
| 5 | Peak | Top single + backoffs |

## RPE-chart

`% van e1RM = 100 − 4·(10 − RPE) − f(reps)` — reproduceert o.a.
`1@10 = 100%`, `1@8 = 92%`, `5@8 = 81%`, `5@7 = 77%`
(→ Bench 120 kg, 5 reps @7 = **92,5 kg**).

## Documentatie

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — datamodel (ERD), pagina's,
  componenten, API-ontwerp, formules.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — MVP-roadmap.
- [`supabase/migrations/`](supabase/migrations/) — PostgreSQL-schema + RPE-seed
  voor een optionele latere Supabase-cloud-deployment.

## Tech

Next.js 16 · TypeScript · Tailwind CSS v4 · Recharts · Zustand · React Hook Form
· IndexedDB (idb-keyval). Donkere modus standaard, desktop-first.
