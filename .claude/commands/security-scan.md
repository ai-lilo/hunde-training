---
description: Scannt den gesamten app/src/ Code auf Sicherheitsrisiken (XSS, SQL-Injection, Prompt-Injection, Auth, CSP) und aktualisiert SECURITY_REPORT.md. Kritische Findings werden sofort gefixt.
---

Führe einen vollständigen Security-Scan des Projekts durch. Gehe systematisch vor:

## 1. Scan-Bereiche

Prüfe alle Dateien in `app/src/**/*.{ts,tsx}`, `app/index.html`, `supabase_setup.sql` und alle `.env*`-Dateien auf folgende Risikokategorien:

### XSS (Cross-Site Scripting)
- Suche nach `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `eval(`, `new Function(`
- Prüfe ob User-Input direkt in DOM-Operationen fließt
- Prüfe ob Fehlermeldungen aus externen Quellen (URL-Params, API-Responses) unvalidiert angezeigt werden
- Suche nach URL-Hash- oder Query-Parameter-Werten, die in JSX gerendert werden

### SQL-Injection
- Da Supabase verwendet wird: Prüfe auf `.rpc()` mit String-Konkatenation
- Prüfe auf `.query()` oder direktes SQL mit User-Input
- Verifiziere, dass alle Datenbankoperationen den Supabase Query Builder verwenden (parameterisiert)

### Prompt Injection
- Suche nach Stellen, wo User-generierte Inhalte (Trainingsnotizen, `generalNote`, `note`-Felder) in KI-Prompts oder LLM-Anfragen einfließen könnten
- Prüfe ob API-Calls zu KI-Diensten User-Input unbereinigt übertragen

### Sensitive Data / Secrets
- Prüfe auf hardcodierte API-Keys, Passwörter, Tokens in Source-Dateien
- Verifiziere dass `.env.local` in `.gitignore` steht
- Prüfe ob `VITE_`-Variablen nur nicht-sensitive öffentliche Schlüssel (Supabase Anon Key) enthalten

### Authentication & Authorization
- Prüfe Auth-Flows auf Open Redirects: Redirect-URLs aus URL-Parametern ohne Validierung
- Prüfe ob Session-Tokens in URLs oder Logs erscheinen
- Prüfe Dev-Bypass-Mechanismen auf korrekte Absicherung durch `import.meta.env.DEV`

### Security Headers
- Prüfe `app/index.html` auf Content-Security-Policy (CSP) Meta-Tag
- Identifiziere fehlende Direktiven (frame-ancestors, object-src, connect-src für Supabase)
- Prüfe auf `X-Frame-Options`-Äquivalent

## 2. Bewertung

Klassifiziere jeden Fund:
- **CRITICAL**: Sofort ausnutzbar, direkter Datenverlust oder Account-Übernahme möglich
- **HIGH**: Schwerwiegend, aber erfordert bestimmte Umstände
- **MEDIUM**: Mittleres Risiko, Defense-in-Depth-Verletzung
- **LOW**: Geringes Risiko, Best-Practice-Abweichung
- **INFO**: Keine direkte Gefahr, aber Designhinweis

## 3. SECURITY_REPORT.md aktualisieren

Schreibe das Ergebnis in `SECURITY_REPORT.md` im Projekt-Root. Format:

```markdown
# Security Report — Hundetraining App

**Letzter Scan:** <Datum>
**Scanner:** Claude Security Scan (/security-scan)
**Status:** CLEAN / X OPEN FINDINGS

---

## Zusammenfassung

| Severity | Anzahl |
|----------|--------|
| CRITICAL | 0 |
| HIGH     | 0 |
| MEDIUM   | X |
| LOW      | X |
| INFO     | X |

---

## Findings

### [SEVERITY] Titel
- **Datei:** `path/to/file.tsx:zeilennummer`
- **Beschreibung:** Was ist das Problem?
- **Risiko:** Was kann ein Angreifer damit tun?
- **Status:** OPEN / FIXED (seit <Datum>)
- **Fix:** Was wurde/wird geändert?

---

## Abgedeckte Prüfbereiche
- [x] XSS / dangerouslySetInnerHTML
- [x] SQL-Injection (Supabase Query Builder)
- [x] Prompt Injection
- [x] Sensitive Data / Hardcoded Secrets
- [x] Authentication / Open Redirects
- [x] Security Headers (CSP)
- [x] Dev-Bypässe
```

## 4. Findings fixen

Fixe alle CRITICAL und HIGH Findings sofort. Bei MEDIUM: Fix wenn möglich, sonst dokumentieren. LOW/INFO: Im Report dokumentieren, Fix optional.

Nach dem Fix: Status im Report auf FIXED setzen und Datum eintragen.

## 5. Abschlussmeldung

Gib eine kurze Zusammenfassung aus:
- Anzahl gefundener Findings pro Severity
- Was wurde gefixt
- Was bleibt offen und warum
