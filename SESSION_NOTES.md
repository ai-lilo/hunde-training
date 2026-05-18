# Session-Notizen — Hundetraining App

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
