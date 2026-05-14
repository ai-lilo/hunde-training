---
description: Session abschließen: Projektstatus dokumentieren, nächsten Schritt vorschlagen, committen, pushen, Security-Check und Kontext bereinigen.
---

Führe die folgenden Schritte zum sauberen Abschluss der Arbeitssession durch.

## Schritt 1: Aktuellen Projektstatus erfassen

Führe diese Befehle aus, um den Ist-Stand zu verstehen:

```
git status
git diff --stat
git log --oneline -8
git stash list
```

Suche außerdem nach offenen TODOs/FIXMEs in der Codebase:
```
git grep -n "TODO\|FIXME\|HACK\|XXX" -- "app/src/**/*.ts" "app/src/**/*.tsx" 2>$null
```

## Schritt 2: SESSION_NOTES.md aktualisieren

Lies die bestehende `SESSION_NOTES.md` (falls vorhanden) und aktualisiere sie. Erstelle sie neu, falls sie nicht existiert. Die Datei liegt im Projekt-Root.

Format:

```markdown
# Session-Notizen — Hundetraining App

## [DATUM] — Session-Abschluss

### Was wurde erledigt
- [Bullet-Liste aller in dieser Session gemachten Änderungen, aus git diff/log ableiten]

### Offene TODOs
- [Alle gefundenen TODO/FIXME-Kommentare aus dem Code]

### Nächster sinnvoller Schritt
**[Konkrete Empfehlung basierend auf dem aktuellen Stand — was ist der logisch nächste Baustein?]**

Details:
- [2-3 konkrete Punkte, was beim nächsten Mal zuerst angegangen werden sollte]
- [Hinweis auf eventuelle Abhängigkeiten oder offene Fragen]

---
[Vorherige Sessions darunter belassen, nicht löschen]
```

Schreibe den neuen Eintrag **oben** in die Datei, ältere Einträge bleiben darunter erhalten.

Die Empfehlung für den nächsten Schritt soll:
- Aus dem tatsächlichen Stand der Codebase und dem CLAUDE.md-Projektziel abgeleitet sein
- Konkret und handlungsorientiert formuliert sein (nicht allgemein)
- Den BH- und Obedience-Ausbildungsfortschritt von Ari im Blick behalten

## Schritt 3: Alle Änderungen committen

Prüfe zunächst, ob `.env`-Dateien oder Secrets versehentlich gestaged sind:
```
git diff --cached --name-only
```

Falls sensitive Dateien gestaged sind: **Abbruch**, Warnung ausgeben, kein Commit.

Ansonsten alle Änderungen (inkl. `SESSION_NOTES.md`) stagen und committen:
```
git add app/src/ SESSION_NOTES.md SECURITY_REPORT.md
```

Commit-Message: Kurze deutsche Zusammenfassung der Session-Änderungen. Format: `Session [Datum]: [Was wurde hauptsächlich gemacht]`

Beispiel: `Session 2026-05-14: GrundlagenEinheit-Screen, Fortschrittsanzeige überarbeitet`

## Schritt 4: Push und Security-Check

Pushe alle Commits:
```
git push
```

Der Pre-Push-Hook (`security-pre-push.ps1`) läuft automatisch und prüft auf:
- Sensitive Dateien im Git-Index
- .env-Dateien in staged Changes  
- Secrets in staged Changes
- Alter des Security Reports

**Falls der Hook Warnungen ausgibt:**
- Bei KRITISCH-Meldungen: Push abgebrochen, Warnung an den User ausgeben, `/security-scan` empfehlen
- Bei WARNUNG (Report zu alt): Hinweis ausgeben, dass ein `/security-scan` empfohlen wird

**Hinweis für manuelle Aktivierung:** Falls der Pre-Push-Hook nicht greift (z.B. nach einer Neuinstallation), muss er einmalig manuell aktiviert werden. Der Hook ist in `.claude/settings.json` unter `hooks.PreToolUse` konfiguriert — er wird von Claude Code automatisch ausgeführt, kein Git-Hook-Skript nötig.

## Schritt 5: Abschlussmeldung ausgeben

Gib eine kurze Zusammenfassung aus:

```
✓ SESSION_NOTES.md aktualisiert
✓ Commit erstellt: [commit hash] — [message]
✓ Gepusht auf [branch]
✓ Security-Check: [OK / Warnungen: ...]

Nächster Schritt: [den empfohlenen nächsten Schritt aus SESSION_NOTES.md wiederholen]

→ Bereit für /clear
```

## Schritt 6: Kontext bereinigen

Fordere den User abschließend auf, `/clear` auszuführen, um den Konversationskontext zu leeren und die nächste Session sauber zu starten. Führe `/clear` nicht selbst aus — der User soll es bewusst bestätigen.
