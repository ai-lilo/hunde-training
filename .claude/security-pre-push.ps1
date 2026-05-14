param()
$root = 'c:\Users\neupe\hunde-training'
$exit = 0

# 1. Sensitive Dateien im Git-Index?
$tracked = git -C $root ls-files 2>$null
$sensitive = $tracked | Where-Object { $_ -match '\.(pem|key|p12|pfx|secret)$' -or $_ -match '\.env\.' }
if ($sensitive) {
    Write-Host '[SECURITY] KRITISCH: Sensitive Datei(en) im Git-Index gefunden!'
    $sensitive | ForEach-Object { Write-Host "  -> $_" }
    Write-Host '[SECURITY] Bitte /security-scan ausfuehren und Dateien aus dem Index entfernen.'
    $exit = 1
}

# 2. .env-Datei staged?
$stagedEnv = git -C $root diff --cached --name-only 2>$null | Where-Object { $_ -match '\.env' }
if ($stagedEnv) {
    Write-Host '[SECURITY] KRITISCH: .env-Datei ist staged!'
    $stagedEnv | ForEach-Object { Write-Host "  -> $_" }
    Write-Host '[SECURITY] Bitte unstagen: git restore --staged <datei>'
    $exit = 1
}

# 3. Secrets in staged Changes?
$stagedSecrets = git -C $root diff --cached -U0 2>$null | Where-Object { $_ -match '^\+' -and ($_ -match 'password\s*=' -or $_ -match 'secret\s*=' -or $_ -match 'private_key\s*=' -or $_ -match 'supabase_service') }
if ($stagedSecrets) {
    Write-Host '[SECURITY] WARNUNG: Moegliche Secrets in staged Changes!'
    $stagedSecrets | Select-Object -First 5 | ForEach-Object { Write-Host "  -> $_" }
    $exit = 1
}

# 4. Security Report Alter pruefen
if ($exit -eq 0) {
    $report = Join-Path $root 'SECURITY_REPORT.md'
    if (-not (Test-Path $report)) {
        Write-Host '[SECURITY] WARNUNG: SECURITY_REPORT.md fehlt. Bitte /security-scan ausfuehren.'
    } else {
        $age = (Get-Date) - (Get-Item $report).LastWriteTime
        if ($age.Days -gt 14) {
            Write-Host ('[SECURITY] WARNUNG: Security Report ist ' + $age.Days + ' Tage alt. /security-scan empfohlen.')
        } else {
            Write-Host ('[SECURITY] OK — Kein Secret im Index, Report ' + [int]$age.TotalHours + 'h alt.')
        }
    }
}

exit $exit
