# Session-Notizen — Hundetraining App

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
Die neuen THS-Tabellen müssen einmalig im Supabase SQL Editor angelegt werden — SQL liegt in `supabase_setup.sql` unter den THS-Abschnitten. Außerdem muss `'ths'` in die Sports-Tabelle eingefügt werden (INSERT am Anfang der Datei).

### Nächster sinnvoller Schritt
**THS-Einheit live testen und danach BH-Fortschritt für Ari strukturiert befüllen**

Details:
- THS in Einstellungen aktivieren (live app) → Supabase-Migration nochmals prüfen ob alle Tabellen angelegt sind
- Erste THS-Einheit aufzeichnen: Gehorsam VK1 (Leinenführigkeit, Freifolge, Sitz, Platz) mit aktuellem Level, erste Zeiten für Hürdenlauf und Slalom eintragen
- Parallel: BH-Fortschritt für Ari aktualisieren — Übungen die bereits im Training stabil sind auf "Stabil" setzen, prüfungsreife auf "Prüfungsreif"
- Mittelfristig: THS-Tagebuch-Anzeige prüfen ob THS-Sessions korrekt angezeigt werden (Tagebuch-Screen filtert auf `sport === 'ths'`)

---

## 2026-06-02 — Session-Abschluss (Equipment HSV – Anleitungen-Bugfixes)

> Diese Session fand ausschließlich im Equipment_HSV-Projekt statt.

### Was wurde erledigt (Equipment_HSV)

**Bug: Fotos in Anleitungen wurden nicht gespeichert**
- Ursache 1: `instruction-media` Storage-Bucket hatte keine RLS-Policies → Uploads schlugen still fehl
  - Fix: `supabase_storage_policies.sql` um drei Policies für `instruction-media` (INSERT/UPDATE/DELETE) ergänzt
  - Manuell auszuführen: Supabase Dashboard → Storage → Bucket `instruction-media` als Public anlegen, dann SQL ausführen
- Ursache 2: `uploadMedia()` gab `null` bei Fehler zurück, `saveInstruction()` ignorierte das und meldete Erfolg
  - Fix: Rückgabetyp auf `{ url, error }` geändert; Upload-Fehler wird jetzt als Fehlermeldung an den User zurückgegeben (`useInstructions.ts`)

**Feature: Lösch-Bestätigung für Anleitungsschritte**
- Schritte mit Inhalt (Text oder Foto/Video) fragen nun per `ConfirmDialog` nach Bestätigung vor dem Löschen
- Leere Schritte werden weiterhin sofort gelöscht (kein Dialog)
- `InstructionForm.tsx`: Import + State `confirmDeleteIndex` + angepasster Button-Handler + Dialog-Render

### Offene TODOs
- **Equipment HSV – Supabase Storage-Bucket**: `instruction-media`-Bucket muss manuell als Public angelegt und SQL aus `supabase_storage_policies.sql` ausgeführt werden
- **Hundetraining – DB-Migration ausstehend**: `supabase/add_commands_and_video.sql` muss im Supabase SQL Editor ausgeführt werden — ohne diese Migration fehlt die `commands`-Tabelle und das Kommandos-Feature funktioniert nicht in Produktion

### Nächster sinnvoller Schritt
**Supabase-Migration für Kommandos ausführen, dann Kommandos-Feature mit Aris Trainingsdaten befüllen**

Details:
- Supabase SQL Editor → `supabase/add_commands_and_video.sql` ausführen (legt `commands`-Tabelle + Video-Felder an)
- Danach: Kommandos-Screen in der App öffnen und erste Kommandos für Ari anlegen (Sitz, Platz, Bleib, Fuß, Hier)
- BH-relevante Kommandos priorisieren: Leinenführigkeit, Freifolge, Unterordnung (Sitz/Platz/Steh aus der Bewegung)
- Lernkurven-Feature nutzen: für jede Übung Schwierigkeitsstufen dokumentieren um Fortschritt in Richtung BH-Prüfung sichtbar zu machen

---

## 2026-05-26 — Session-Abschluss (Equipment HSV – 4 UI-Features + Performance)

> Diese Session fand ausschließlich im Equipment_HSV-Projekt statt.

### Was wurde erledigt (Equipment_HSV)

**4 UI-Features:**
- **Checklisten-Modal**: Neuer Eintrag öffnet jetzt ein Dialog-Fenster (wie bei "Neue Aufgabe"), statt Inline-Input (`ChecklistTab.tsx`)
- **Blauer Startbildschirm behoben**: `useAuth.ts` rief `setLoading(false)` nie auf wenn DB-Query fehlschlug — Fix: `.finally(() => setLoading(false))`
- **Duplikat-Prüfung Mitglieder**: Admin-Bereich → Mitglieder anlegen prüft nun auf identische Namen (case-insensitive), zeigt Fehlermeldung unter dem Input (`Admin.tsx`)
- **Neues Mitglied direkt im Helfer-Pool anlegen**: Button "Neues Mitglied anlegen" in Veranstaltungen → Helfer → Verfügbare Personen, ohne in den Admin-Bereich zu wechseln (`HelferTab.tsx`, `TournamentDetail.tsx`)

**Performance-Optimierungen:**
- **`useTournamentDetail.ts`**: 9 CRUD-Funktionen verwenden jetzt Optimistic Updates (lokalen State direkt aktualisieren) statt `await load()` — spart 6 parallele DB-Queries pro Aktion
- **`EquipmentLinker.tsx`**: Equipment-Liste wird nicht mehr pro Task-Instanz geladen — `allEquipment`-Prop aus Parent (`TournamentDetail.tsx`) übergeben, einmaliger Load
- **`useTournaments.ts`**: Tasks server-seitig nach Kategorie gefiltert (statt alle Tasks laden), `is_checklist`-Flag wird beim Klonen kopiert, `task_equipment`-Links werden in neue Veranstaltung mitkopiert
- **`TreeView.tsx`**: Filter-Kette in `useMemo` gewrapped
- **`EquipmentCard.tsx`**: `loading="lazy"` auf Bilder
- **`useClubMembers.ts`**: Error-Handling für alle CRUD-Operationen ergänzt
- **Neue DB-Migration**: `supabase/migrations/20260524_performance_indexes.sql` — 6 Indexes auf häufig gejointe Foreign Keys

### Offene TODOs
- **DB-Migration ausstehend**: `supabase/migrations/20260524_performance_indexes.sql` muss noch manuell im Supabase SQL Editor ausgeführt werden — Indexes werden erst dann wirksam

### Nächster sinnvoller Schritt
**DB-Migration für Performance-Indexes in Supabase ausführen, dann die neuen Features live testen**

Details:
- Supabase SQL Editor → Inhalt von `supabase/migrations/20260524_performance_indexes.sql` einfügen → Run (idempotent, `IF NOT EXISTS`)
- Live-Test: Veranstaltung öffnen → Checkliste → "Neuer Eintrag" → Modal erscheint; Kategorie umbenennen → kein Ladeindikator
- Live-Test: Helfer-Tab → "Verfügbare Personen heute" → "Neues Mitglied anlegen" → Duplikat-Check testen
- Nächstes Feature oder weitere UX-Verbesserungen im Veranstaltungs-Modul

---

## 2026-05-18 — Session-Abschluss (Equipment HSV – Aufgaben/Checklisten-Trennung)

> Diese Session fand ausschließlich im Equipment_HSV-Projekt statt.

### Was wurde erledigt (Equipment_HSV)
- **Bug: Aufgaben und Checklisten getrennt** (`src/components/tournament/TournamentDetail.tsx`):
  - Checklisten-Kategorien (`is_checklist=true`) erschienen bisher im Aufgaben-Tab (alle Kategorien wurden ungefiltert angezeigt)
  - Fix: Abgeleitete Variablen `taskCategories`, `taskCategoryIds`, `aufgabenTasks` eingefügt
  - Aufgaben-Tab filtert jetzt auf `is_checklist=false`, DashboardTiles zählt nur Aufgaben, Drag&Drop arbeitet nur auf Aufgaben-Kategorien
  - Checklisten-Tab war bereits korrekt und bleibt unverändert

### Offene TODOs
- **DB-Migration ausstehend** (aus vorheriger Session): `supabase/migrations/003_template_restore_and_checklist.sql` muss noch manuell im Supabase SQL Editor ausgeführt werden — ohne diese Migration fehlt die `is_checklist`-Spalte in der Live-DB und der heutige Fix greift nicht in Produktion.

### Nächster sinnvoller Schritt
**DB-Migration in Supabase ausführen — dann den Aufgaben/Checklisten-Fix live testen**

Details:
- Supabase SQL Editor → `supabase/migrations/003_template_restore_and_checklist.sql` ausführen (fügt `is_checklist`-Spalte zu `tournament_categories` hinzu)
- Danach Verifikation: Veranstaltung öffnen → Checklisten-Tab → Neue Checkliste anlegen → zurück zu Aufgaben-Tab → Checklisten-Kategorie darf NICHT erscheinen
- Nach erfolgreichem Test: weitere UX-Verbesserungen oder nächstes Feature im Veranstaltungs-Modul

---

## 2026-05-18 — Session-Abschluss (Equipment HSV – Bugfixes & Schrank verschieben)

> Diese Session fand ausschließlich im Equipment_HSV-Projekt statt.

### Was wurde erledigt (Equipment_HSV)
- **Checklisten-Bug erklärt**: „Neue Checkliste anlegen" funktionierte nicht, weil die DB-Migration `003_template_restore_and_checklist.sql` noch nicht in Supabase ausgeführt wurde — Spalte `is_checklist` fehlte in der Live-DB. Lösung: Migration muss manuell im Supabase SQL Editor ausgeführt werden.
- **Schrank in anderen Raum verschieben** (`src/pages/Rooms.tsx`):
  - Neues `CabinetDialog`-Formular mit Raum-Dropdown (nur beim Bearbeiten sichtbar)
  - Hinweis bei Raumwechsel: „Alle Equipment-Einträge in diesem Schrank werden in den neuen Raum verschoben"
  - `saveCabinet()` kaskadiert den Raumwechsel: `cabinets.room_id` + alle `equipment.room_id` mit `cabinet_id = id` werden aktualisiert

### Offene TODOs
- **DB-Migration ausstehend**: `supabase/migrations/003_template_restore_and_checklist.sql` muss noch manuell im Supabase SQL Editor ausgeführt werden. Ohne diese Migration funktionieren weder Checklisten anlegen noch Vorlage-Wiederherstellung.

### Nächster sinnvoller Schritt
**DB-Migration in Supabase ausführen, dann Checklisten und Vorlage-Restore testen**

Details:
- Supabase SQL Editor öffnen → Inhalt von `supabase/migrations/003_template_restore_and_checklist.sql` einfügen → Run
- Danach: Veranstaltung öffnen → Checklisten-Tab → „Neue Checkliste" anlegen und Unterpunkte hinzufügen
- Danach: Vorlage ersetzen → „Wiederherstellen"-Button testen

---

## 2026-05-17 — Session-Abschluss (Equipment HSV – Testlauf 3)

> Diese Session fand ausschließlich im Equipment_HSV-Projekt statt. Alle Änderungen wurden commitet und auf GitHub/Vercel deployed.

### Was wurde erledigt (Equipment_HSV)
- **Datumseingabe Deutsch**: `flatpickr` installiert, `TaskForm.tsx` auf deutschen Kalender umgestellt (Format: TT.MM.JJJJ, gespeicherter Wert bleibt ISO), "× Datum entfernen"-Button ergänzt
- **PDF-Redesign**: `tournamentPdf.ts` komplett überarbeitet — blaues Banner (30,64,175), Tabellenlayout mit Checkbox-Spalte, Equipment in blau-kursiv, Seitenzahl-Footer; analog zur Inventarliste
- **PDF-Fix**: Emoji 📦 durch saubere Text-Darstellung ersetzt (jsPDF kann keine Emojis rendern), danach `[Eq]`-Präfix auf Wunsch entfernt
- **"Meine Aufgaben" Tab** in `TournamentDetail.tsx`: neuer Tab zwischen "Aufgaben" und "Notizen", filtert bereits geladene Tasks nach `responsible_user_id === currentUser.id`, farbkodiert (überfällig/dringend/normal), Klick öffnet TaskForm-Modal
- **UI-Umbenennung**: "Turnier" → "Veranstaltung" in allen sichtbaren Texten (6 Dateien), Code-Variablen und Routen unverändert
- **Rechteübersicht Admin**: Tabelle in `Admin.tsx` → Benutzer-Tab mit 10 Funktionen × 3 Rollen (Visitor/Member/Admin), ✓ grün / — hellgrau
- **Testlauf 2 (Vorarbeit aus vorheriger Session bereits deployed)**

### Offene TODOs
Keine TODO/FIXME-Kommentare im Equipment_HSV-Code gefunden.

### Nächster sinnvoller Schritt (Hundetraining App)
**Supabase-Redirect-URLs prüfen + BH-Prüfungs-Checkliste beginnen**

Details:
- Supabase Dashboard: Site URL und Redirect URLs prüfen (war noch ausstehend von letzter Session) — "Passwort vergessen?" auf Live-Version testen
- Exercises-Tabelle in Supabase prüfen (war nach fehlgeschlagenem SQL-Run evtl. leer) — `TRUNCATE TABLE exercises;` + SQL-Migration erneut ausführen
- BH-Prüfungs-Checkliste implementieren: Aris aktuellen Trainingsstand gegen BH-Anforderungen mappen (Leinenführigkeit, Freifolge, Sitz aus Bewegung, Platz mit Rückruf)

---

## 2026-05-17 — Session-Abschluss

### Was wurde erledigt
- **Auth auf Email + Passwort umgestellt** (war: Magic Link / OTP)
  - `Login.tsx` komplett neu: Email+Passwort-Formular + "Passwort vergessen?"-Modus
  - `useAuth.ts` vereinfacht: kein manuelles PKCE-Handling mehr, `isRecovery`-Flag ergänzt
  - `supabase.ts`: `flowType: 'implicit'` für Password-Reset-Link-Support
- **Passwort-Reset-Flow** vollständig implementiert:
  - `ResetPassword.tsx` (neu): Formular zum Setzen eines neuen Passworts nach Reset-Link-Klick
  - `AppShell.tsx`: `isRecovery`-Check eingefügt, zeigt ResetPassword-Screen wenn Recovery-Session aktiv
- **Einstellungen-Screen** (`Einstellungen.tsx`, neu):
  - Sportarten nachträglich auswählen/abwählen (Toggle wie im Onboarding)
  - Anzeigename ändern
  - Abmelden-Button
  - Erreichbar über ⚙️-Icon in der Top-Bar (rechts)
  - 🐕-Icon Tooltip verbessert zu "Hund wechseln / hinzufügen"
- **useBuiltinExercises-Hook** (neu): lädt Übungen aus Supabase-Tabelle statt aus statischen Daten
- **supabase/add_exercises_table.sql**: SQL-Migration für die Übungstabelle (98 Übungen)
- **Supabase Redirect-URL-Problem diagnostiziert**:
  - Live-Version (`https://ai-lilo.github.io/hunde-training/`) war nicht in Supabase-Allowlist
  - Supabase fiel auf Site URL (`http://localhost:3000/`) zurück
  - Fix: Supabase Dashboard → Authentication → URL Configuration → Site URL und Redirect URLs anpassen

### Offene TODOs
Keine TODO/FIXME-Kommentare im Code gefunden.

### Ausstehende Konfiguration (vor nächstem Auth-Test)
- Supabase Dashboard → Authentication → URL Configuration:
  - **Site URL** setzen auf: `https://ai-lilo.github.io/hunde-training/`
  - **Redirect URLs** ergänzen: `https://ai-lilo.github.io/hunde-training/**` und `http://localhost:5173/hunde-training/**`

### Nächster sinnvoller Schritt
**Supabase-Redirect-URLs konfigurieren + Passwort setzen — dann BH-Prüfungs-Checkliste**

Details:
- Zuerst: Supabase Dashboard konfigurieren (siehe oben), dann "Passwort vergessen?" auf der Live-Version erneut testen — der Reset-Link sollte jetzt auf `https://ai-lilo.github.io/hunde-training/#access_token=...` zeigen und den "Neues Passwort setzen"-Screen anzeigen
- Danach: BH-Prüfungs-Checkliste implementieren (`BHCheckliste.tsx`) — Aris Trainingsfortschritt gegen BH-Anforderungen mappen (Leinenführigkeit, Freifolge, Sitz aus Bewegung, Platz mit Rückruf)
- Exercises-Tabelle in Supabase prüfen (war leer nach fehlgeschlagenem SQL-Run) — ggf. `TRUNCATE TABLE exercises;` + SQL erneut ausführen

---

## 2026-05-14 — Session-Abschluss

### Was wurde erledigt
- **Grundlagen-Modul**: Neuer Sport-Tab "Grundlagen" mit zwei neuen Screens:
  - `GrundlagenFortschritt.tsx` — Fortschrittsübersicht pro Übungskategorie (Mindset, Physio, Fuß, Sitz, Platz, Steh)
  - `GrundlagenEinheit.tsx` — Schnell-Einheit für Basisübungen (trainieren, bewerten, speichern)
- **App.tsx / AppShell.tsx** — Grundlagen-Tab vollständig integriert, Navigation angepasst
- **Datenmodell** — `types.ts` und `exercises.ts` um Grundlagen-Kategorien erweitert
- **Security-Infrastruktur** aufgebaut:
  - CSP-Header in `index.html`
  - Auth-Error-Sanitization in `Login.tsx` / `AuthCallback.tsx`
  - `/security-scan`-Skill als wiederverwendbarer Befehl
  - Pre-Push-Hook (`security-pre-push.ps1`) via Claude Code Hooks konfiguriert
  - `SECURITY_REPORT.md` erstellt
- **Session-End-Skill** (`/session-end`) als wiederverwendbarer Command definiert
- **RO-Regelwerk PDFs** ins Repo aufgenommen (Regelwerk 2022 + Übungsschilder)
- Supabase Auth, Multi-Hund-Verwaltung, Onboarding und Cloud-Sync implementiert

### Offene TODOs
Keine TODO/FIXME-Kommentare im Code gefunden.

### Nächster sinnvoller Schritt
**BH-Prüfungs-Checkliste implementieren — den Fortschritt von Ari direkt gegen BH-Anforderungen mappen**

Details:
- Eine `BHCheckliste.tsx`-Screen erstellen, die die BH-Anforderungen (Leinenführigkeit, Freifolge, Sitz aus der Bewegung, Platz mit Rückruf, Unterordnung Gruppe) als Checkliste abbildet und mit dem Trainingsfortschritt verknüpft
- Jede BH-Anforderung sollte einen Status haben (nicht begonnen / in Arbeit / prüfungsreif) — abgeleitet aus den gespeicherten Trainingseinheiten
- Abhängigkeit: Grundlagen-Modul ist fertig, die dort erfassten Fortschritte (Sitz, Platz, Fuß) sollten direkt in die BH-Checkliste einfließen — Datenmodell prüfen ob direkte Verknüpfung möglich ist

---
