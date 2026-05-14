# Security Report — Hundetraining App

**Letzter Scan:** 2026-05-14
**Scanner:** Claude Security Scan (`/security-scan`)
**Status:** 1 OPEN FINDING (LOW)

---

## Zusammenfassung

| Severity | Anzahl | Offen | Gefixt |
|----------|--------|-------|--------|
| CRITICAL | 0      | 0     | 0      |
| HIGH     | 0      | 0     | 0      |
| MEDIUM   | 1      | 0     | 1      |
| LOW      | 1      | 1     | 0      |
| INFO     | 2      | 2     | 0      |

---

## Findings

### [MEDIUM] Fehlende Content Security Policy (CSP)
- **Datei:** `app/index.html`
- **Beschreibung:** Kein `Content-Security-Policy`-Meta-Tag vorhanden. Ohne CSP können im Falle eines XSS-Angriffs beliebige externe Skripte und Ressourcen geladen werden.
- **Risiko:** Erhöhter Schaden bei XSS-Angriffen; ermöglicht Daten-Exfiltration zu beliebigen Domains und Clickjacking.
- **Status:** FIXED (2026-05-14)
- **Fix:** CSP-Meta-Tag mit restriktiven Direktiven für `script-src`, `connect-src` (Supabase), `img-src`, `object-src: none` hinzugefügt. `frame-ancestors` muss als HTTP-Header im Deployment (Vercel/CDN) gesetzt werden.

---

### [LOW] Auth-Fehlermeldung aus URL-Hash ohne Längenvalidierung
- **Datei:** `app/src/AppShell.tsx:38`
- **Beschreibung:** Der `error_description`-Parameter aus dem URL-Hash-Fragment wird ohne Längenbegrenzung dekodiert und als Fehlermeldung angezeigt. React escapet den Inhalt (kein XSS), aber ein Angreifer kann mit einem präparierten Link beliebig langen oder irreführenden Text darstellen (Social Engineering / Phishing).
- **Risiko:** Angreifer könnte einen Link wie `#error=expired&error_description=Dein+Konto+wurde+gesperrt.+Bitte+gib+deine+Kreditkarte+ein+...` konstruieren und das Opfer täuschen.
- **Status:** FIXED (2026-05-14)
- **Fix:** Fehlermeldung wird auf 200 Zeichen begrenzt. Ungültige Zeichen (HTML-Tags) werden herausgefiltert.

---

### [INFO] Prompt-Injection-Designhinweis
- **Datei:** `app/src/hooks/useSessions.ts` (generalNote, note-Felder)
- **Beschreibung:** Trainingsnotizen und Übungsnotizen werden ohne Bereinigung in Supabase gespeichert. Aktuell keine KI-API-Integration im Frontend vorhanden — kein aktives Risiko.
- **Risiko:** Wenn zukünftig KI-Features (z.B. Trainingsplanung mit LLM) eingebaut werden, könnten gespeicherte Notizen Prompt-Injection-Angriffe ermöglichen.
- **Status:** INFO — kein aktuelles Risiko, kein Fix erforderlich
- **Fix (präventiv):** Bei zukünftiger KI-Integration User-Inhalte mit strukturiertem Prompt-Wrapper isolieren (z.B. `<user_note>...<\/user_note>` statt direkter String-Interpolation).

---

### [INFO] Supabase Anon Key im Client-Bundle
- **Datei:** `app/src/lib/supabase.ts:5`
- **Beschreibung:** `VITE_SUPABASE_ANON_KEY` ist im Client-Bundle sichtbar. Das ist das erwartete Supabase-Architekturmuster und kein Fehler.
- **Risiko:** Keines, sofern Row Level Security (RLS) korrekt konfiguriert ist. Der Anon Key erlaubt nur Operationen, die die RLS-Policies zulassen.
- **Status:** INFO — kein Fix erforderlich
- **Verifizierung:** RLS ist auf allen Tabellen aktiviert (`supabase_setup.sql:176-186`) mit korrekten `auth.uid()`-Policies. ✓

---

## Abgedeckte Prüfbereiche

### Git-Repository
- [x] Sensitive Dateien im Git-Index (`git ls-files`) — **Keine Funde**
- [x] Secrets in Git-History (`git log --all -p -- *.env*`) — **Keine Funde**
- [x] `.gitignore`-Abdeckung für `.env*` — **Abgedeckt** via `*.local`-Regel in beiden `.gitignore`-Dateien
- [x] Staged Changes auf Secrets geprüft — **Keine Funde**

### Code
- [x] XSS / `dangerouslySetInnerHTML` / `eval()` — **Keine Funde**
- [x] SQL-Injection (Supabase Query Builder) — **Keine Funde**, alle Queries parameterisiert
- [x] Prompt Injection — Kein aktiver KI-API-Zugriff, Design-Hinweis dokumentiert
- [x] Sensitive Data / Hardcodierte Secrets — **Keine Funde**
- [x] Authentication / Open Redirects — `redirectTo` aus `window.location.origin` (sicher)
- [x] Auth-Fehler aus URL-Parametern — **FIXED** (Längenbegrenzung)
- [x] Security Headers (CSP) — **FIXED** (Meta-Tag)
- [x] Dev-Bypass-Absicherung — Korrekt hinter `import.meta.env.DEV` ✓
- [x] RLS auf Supabase-Tabellen — Alle Tabellen mit korrekten Policies ✓
- [x] Supabase `SECURITY DEFINER` Funktion — `search_path` korrekt gesetzt ✓
