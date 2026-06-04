# Session-Notizen — Hundetraining App

## 2026-06-04 — Session-Abschluss (UI-Anpassungen + Standards vereinheitlicht)

### Was wurde erledigt

**Bugfix: Übungsname in GrundlagenEinheit (`GrundlagenEinheit.tsx`)**
- Name wird jetzt im aufgeklappten Bereich wiederholt → bleibt sichtbar, wenn Tastatur / Scroll den Toggle-Button aus dem Viewport bewegt
- Titel: "Schnell-Einheit" → "Einheit eintragen"

**BH Übersicht (`Dashboard.tsx`)**
- Header-Block mit Hundename, Rasse und Titel "Begleithundeprüfung" entfernt
- Übersicht startet direkt mit BH-Fortschrittsbalken
- `dog`-Prop vollständig entfernt (Props-Interface, Funktion, AppShell-Aufrufe)

**Hunde-Emoji (`DogSelector.tsx` + `App.tsx`)**
- 10 wählbare Emojis in Meine Hunde: 🐕 🐩 🐕‍🦺 🦮 🐶 🐺 🦊 🦁 🐻 🐯
- Speicherung per localStorage (`dog-emoji-${dogId}`)
- Hund-Wechseln-Taste oben links in der Nav-Bar zeigt jetzt das gewählte Emoji
- Emoji in der Hundekarte, ✏️-Button für Änderung; bei neuem Hund im Formular wählbar
- Hilfsfunktion `getDogEmoji(dogId)` aus `DogSelector.tsx` exportiert

**Level-nach-Einheit Standard (`LogSession.tsx`)**
- BH Einheit: Checkbox-Stil für Level-Up durch Zwei-Button-Muster ersetzt (Aktuell beibehalten / Level up 🎉)
- `levelUpIds: string[]` → `levelChoices: Record<string, Level>`
- Übungsname im aufgeklappten Bereich wiederholt (konsistent mit anderen Einheit-Screens)

**Wake Lock (`THSEinheit.tsx`, `ROEinheit.tsx`)**
- `useWakeLock(true)` in beide Einheit-Screens ergänzt
- Alle 4 Einheit-Screens halten jetzt den Bildschirm wach: GrundlagenEinheit ✓ LogSession ✓ THSEinheit ✓ ROEinheit ✓

**Kommandos (`Kommandos.tsx`)**
- Kategorien von BH/RO/Alle auf "Sport" + "Alltag" (Multi-Select) umgestellt
- Encoding: `'sport'`, `'alltag'`, `'sport,alltag'` — kein DB-Schema-Change nötig
- Legacy-Werte `'bh'`, `'ro'`, `'ths'` werden automatisch als `'sport'` angezeigt
- Zwei getrennte Abschnitte in der Liste; Kommandos in beiden Kategorien erscheinen in beiden Abschnitten
- Neues Formular mit CategoryToggle-Buttons statt Dropdown

**Einstellungen (`Einstellungen.tsx`)**
- Sportarten-Auswahl von einspaltiger Liste auf zweispaltiges Grid (`grid-cols-2`) umgestellt

### Offene TODOs
Keine TODO/FIXME-Kommentare im Code.

### Nächster sinnvoller Schritt
**App live testen + Aris aktuellen Trainingsstand einpflegen (Levels setzen)**

Details:
- Alle 8 Änderungen dieser Session auf iPhone verifizieren: Emoji wählen → erscheint in Nav; BH-Einheit zeigt Zwei-Button-Level; Kommandos in 2 Kategorien
- Aris BH-Fortschritt befüllen: Welche Übungen sind bereits "Stabil" oder "Prüfungsreif"? → In der App via Einheit eintragen (Einheit-Screen → Übung wählen → Level up)
- Grundlagen-Übungen für Ari: Kategorie-Struktur (Mindset, Physio, Fuß, Sitz, Platz, Steh) mit aktuellem Stand befüllen
- Optional: THS um Geländelauf + CSC erweitern (Zeitdisziplin + neues Hindernisset) — Klasseninfos (VK1/VK2/VK3) und CSC-Hindernisliste noch erfragen

---

## 2026-06-03 — Session-Abschluss (Hundetraining – Tab-Vereinheitlichung + Bugfixes)

### Was wurde erledigt

**Bugfixes Grundlagen (`GrundlagenFortschritt.tsx`)**
- Bug: Weißer Bildschirm beim Bearbeiten → null-safe Zugriff auf `ex.criteria` in `handleEditStart` (`criteria ?? {}`)
- Bug: Übungstitel verschwindet beim Notiz-Tippen → Titel wird jetzt am Anfang des aufgeklappten Inhalts wiederholt
- Bug: Kein Prüfungsreif-Kriterium anlegbar → `pruefungsreif`-Feld zu `AddFormState`, `EditFormState`, `EMPTY_FORM` und Render-Array ergänzt; beide Formulare (Add + Edit) zeigen jetzt alle 4 Level-Kriterien
- "Nächste Stufe erreicht"- und "Stufe zurücksetzen"-Buttons entfernt (Level-Änderungen nur noch über Einheit); zugehörige States und Funktionen bereinigt

**Tab-Vereinheitlichung (`App.tsx`) — alle Sportarten: 📋 Übersicht · ▶️ Einheit · 📔 Tagebuch**
- BH: `Fortschritt`-Tab entfernt, `Einheit`-Tab hinzugefügt (LogSession wird direkt im Tab-Container gerendert, nicht mehr als Fullscreen-Overlay); `BHScreen`-Type bereinigt
- Grundlagen: `Tagebuch`-Tab neu (rendert Einheiten mit `sport === 'grundlagen'`); Labels/Icons vereinheitlicht; `GLScreen`-Type um `gl-tagebuch` erweitert; `Suspense`-Wrapper ergänzt
- THS: Label `Fortschritt` → `Übersicht`, Icon 📈 → 📋
- RO: Label `Schilder` → `Übersicht`, Icon angepasst
- Aufräumen: `Progress`-Import, `handleUpdateExercise`, `handleDeleteExercise`, `useUpdateExerciseOverride`-Mutation, `useHideExercise`-Mutation aus App.tsx entfernt

**BH Dashboard (`Dashboard.tsx`)**
- Übungen in der Kategorieübersicht nicht mehr klickbar (kein `onClick` → `navigate('fortschritt')`)
- `BHAuswertung`-Komponente in Übersicht verschoben (war in Progress-Screen)
- "Neue Trainingseinheit"-Button entfernt (Einheit läuft jetzt über eigenen Tab)

**Bug: Dog-Selection Race Condition (`AppShell.tsx`)**
- Problem: `setDogId(dogs[0].id)` wurde direkt im Render aufgerufen (Anti-Pattern in React 18) → führte zu kurzem DogSelector-Flash ohne selektierbaren Hund
- Fix: Auto-Auswahl des einzigen Hundes jetzt in `useEffect`; solange der Effect noch nicht ausgelöst hat, zeigt die App einen Spinner statt DogSelector

**SQL-Migrationen (`supabase/migrations_manual.sql` — bereits ausgeführt)**
- Migration 1: `hidden_exercises` — "Bleib (Dauer & Distanz)" (ID `bleib`) inkl. Sub-Übungen für alle User versteckt
- Migration 2: `custom_exercises` — alle 5 Sitz-Übungen aus `gl_sitz` als unabhängige Kopien nach `gl_platz` und `gl_steh` dupliziert

### Offene TODOs
Keine TODO/FIXME-Kommentare im Code.

### Nächster sinnvoller Schritt
**App live testen: neue Tab-Struktur und Grundlagen-Bugs verifizieren, dann THS um Geländelauf + CSC erweitern**

Details:
- App auf iPhone/Tablet öffnen: alle 4 Sportarten auf 3-Tab-Struktur prüfen (📋 Übersicht · ▶️ Einheit · 📔 Tagebuch); Grundlagen-Tagebuch prüfen ob GL-Einheiten dort auftauchen
- Grundlagen-Bugs verifizieren: Übung bearbeiten → kein weißer Bildschirm; Prüfungsreif-Kriterium eingeben; Titel beim Notiz-Tippen sichtbar
- THS erweitern: Geländelauf (Zeitdisziplin wie Hürdenlauf/Slalom) und CSC (Hindernislauf-artig mit eigenem Parcours) als neue Disziplinen ergänzen — Klasseninfos (VK1/VK2/VK3) und CSC-Hindernisliste noch erfragen
- BH-Fortschritt für Ari mit aktuellem Stand befüllen: Übungen die bereits stabil sind auf "Stabil" setzen

---

## 2026-06-02 — Session-Abschluss (Hundetraining – THS Vierkampf + UX-Fixes)

### Was wurde erledigt

**UX & Layout-Fixes (Folge-Fixes aus vorheriger Session)**
- Safe-Area-Padding oben für iPhone-Statusleiste (`env(safe-area-inset-top)`) in `App.tsx`
- Übermäßiger Abstand unten entfernt (`pb-28` → `pb-6`) in Dashboard + GrundlagenFortschritt
- Sport-Tab "Rally OB" → "RO" (kompakter)
- Grundlagen-Balken: 5 → 4 Balken (kein Balken bei "nicht begonnen")
- "Als nächstes üben"-Sektion im BH-Dashboard entfernt (war Duplikat von Wochenplan)

**Neue Sportart: Turnierhundesport (THS) – Vierkampf**
- `app/src/data/ths-data.ts` — Konstanten: 7 Gehorsam-Übungen (VK1–VK3), 8 Hindernisse (inkl. Oxer), Zeitdisziplin-Infos, `computeTHSKlasse()`-Funktion
- `app/src/hooks/useTHSObstacleProgress.ts` — Query + Mutation für Hindernisfortschritt (Supabase: `ths_obstacle_progress`)
- `app/src/hooks/useTHSTimes.ts` — Zeiterfassung (Query, AddTime, DeleteTime, `formatTime`, `parseTimeInput`)
- `app/src/hooks/useSessions.ts` — `useAddTHSSession()` ergänzt
- `app/src/screens/THSFortschritt.tsx` — 4 Disziplin-Tabs (Gehorsam, Hürdenlauf, Slalom, Hindernislauf); Zeiterfassung mit Bestzeit; Level-Status (5 Stufen) für Zeitdisziplinen; 8 Hindernisse einzeln mit Level-Picker
- `app/src/screens/THSEinheit.tsx` — Trainingserfassung: Disziplinen wählen, Gehorsam-Level setzen, Zeiten eingeben, Gut/Üben-Feedback pro Hindernis
- `app/src/App.tsx` — THS-Tab, THSScreen-State, lazy-load, Bottom-Nav, Hooks; `useEffect` für automatische Sport-Tab-Korrektur (Rules of Hooks Fix)
- `supabase_setup.sql` — `ths_obstacle_progress`- und `ths_times`-Tabellen + RLS, THS in Sports-Tabelle eingefügt

**Automatische Klassen-Progression VK1 → VK2 → VK3**
- `computeTHSKlasse()` berechnet aus Fortschrittsdaten automatisch die aktuelle Klasse
- Startet immer bei VK1; wechselt zu VK2 wenn alle Disziplinen der Klasse prüfungsreif sind, dann zu VK3
- Klassen-Selector entfernt — stattdessen Fortschrittsanzeige ✓ VK1 → VK2 → VK3

**Sport-Auswahl Fix in Einstellungen**
- Sportarten werden jetzt sofort beim Antippen gespeichert (kein separater "Speichern"-Klick mehr nötig)
- `qc.refetchQueries` in `handleSave` stellt sicher dass Tabs nach Einstellungen sofort aktuell sind

### Offene TODOs
Keine TODO/FIXME-Kommentare im Code gefunden.

### Ausstehende DB-Migration (Supabase manuell ausführen)

```sql
-- ths_obstacle_progress Tabelle
create table if not exists ths_obstacle_progress (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  obstacle_id text not null,
  level text not null default 'nicht_begonnen',
  last_practiced_at timestamptz,
  updated_at timestamptz default now(),
  unique(dog_id, obstacle_id)
);

-- ths_times Tabelle
create table if not exists ths_times (
  id uuid default gen_random_uuid() primary key,
  dog_id uuid references dogs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  discipline text not null,
  klasse text not null,
  time_seconds numeric not null,
  note text,
  recorded_at timestamptz default now()
);

-- RLS aktivieren
alter table ths_obstacle_progress enable row level security;
alter table ths_times enable row level security;

-- RLS Policies
create policy "Users can manage own dog obstacle progress"
  on ths_obstacle_progress for all using (user_id = auth.uid());

create policy "Users can manage own dog times"
  on ths_times for all using (user_id = auth.uid());
```

### Nächster sinnvoller Schritt
**DB-Migrationen ausführen, dann THS live testen**

Details:
- SQL oben in Supabase SQL-Editor ausführen (falls noch nicht geschehen)
- THS-Screen testen: VK1-Übungen anlegen, Zeiten eintragen, Hindernisse bewerten
- GrundlagenFortschritt testen: Alle 3 Bugs (Whitespace, Kriterien, Titel) verifiziert?

---
