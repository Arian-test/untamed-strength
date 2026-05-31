# MVP Roadmap

## ✅ Fase 1 — Werkende kern (gereed)

- [x] Project scaffold (Next.js 16, TS, Tailwind v4, dark-first)
- [x] RPE-chart + e1RM- en gewichtsberekening (exacte ankerwaarden)
- [x] 4-daagse split templates + spiergroepen
- [x] 5-weken periodisering generator
- [x] Lokaal-first opslag (IndexedDB) + JSON export/import
- [x] **Program Builder** — blok genereren uit Squat/Bench e1RM
- [x] **Trainingspagina** — bewerkbare tabel, auto gepland gewicht, loggen
- [x] **Automatische e1RM** per set + sessie-e1RM
- [x] **Adaptieve programmering** — RPE-vergelijking → gewichtsvoorstel
- [x] **"Nieuwe e1RM gevonden"** dialog → herbereken toekomstige weken
- [x] **Dashboard** — stats + huidig blok + progressiegrafieken
- [x] Progressie, Volume, Inzichten, Kalender, Instellingen
- [x] Readiness tracking (Voeding/Stress/Slaap/Vermoeidheid → score)

## ✅ Fase 2 — Volledige bewerkbaarheid + mobiel + PWA (gereed)

- [x] Volledig bewerkbare blokken: oefeningen toevoegen/verwijderen/dupliceren/hernoemen
- [x] Drag & drop herordenen (dnd-kit), volgorde auto-opgeslagen
- [x] Inline bewerken van sets/reps/RPE/gewicht/notities (geen popups)
- [x] Vrije oefeningnamen (geen verplichte bibliotheek)
- [x] Per-oefening "Auto · Squat/Bench e1RM (% e1RM)" of "Handmatig" gewicht
- [x] Draft-modus: genereren → bewerken → pas daarna opslaan
- [x] "Structuur vergrendelen" toggle (log-modus vs bewerkmodus)
- [x] Auto-recalc bij wijzigen reps/RPE/e1RM (handmatige gewichten blijven staan)
- [x] Mobile-first: bottom navigation, grote touch-targets, één-hand-invoer
- [x] PWA: manifest, app-icons, service worker, installeerbaar (iPhone/Android)

## 🔜 Fase 3 — Verdere verfijning

- [ ] Structuurwijzigingen optioneel naar alle weken kopiëren (nu per week-dag)
- [ ] Per-set opmerkingen (nu per oefening + per training)
- [ ] Warm-up generator per hoofdlift (zoals "SQUAT WARMING UP" in de sheet)
- [ ] Deadlift als optionele derde hoofdlift (sumo/conventional, meet card)
- [ ] Rolling-average e1RM-lijn naast hoogste e1RM in grafiek
- [ ] Omtrekmetingen + habit tracker (uit "Logboek"-tab)
- [ ] Optionele Supabase cloud-sync (schema staat klaar in `supabase/migrations`)

## 🌩️ Fase 4 — Optionele cloud-sync

- [ ] Supabase-project koppelen (`supabase/migrations` toepassen)
- [ ] Auth (single user) + RLS activeren
- [ ] Sync-laag: lokaal-first met achtergrond-push naar Supabase
- [ ] Meet Card / wedstrijdmodus (openers, attempts, warm-ups)

## Prioriteiten (uit de opdracht)

1. Snel trainingsdata invoeren ✅
2. Automatische gewichtsberekening ✅
3. Automatische e1RM-updates ✅
4. 5-weken blokken beheren ✅
5. Duidelijke progressieanalyse ✅
