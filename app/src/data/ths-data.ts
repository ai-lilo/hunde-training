export type THSKlasse = 'k1' | 'k2' | 'k3'
export type THSDisziplin = 'gehorsam' | 'huerdenlauf' | 'slalom' | 'hindernislauf'

export interface THSGehorsamUebung {
  id: string
  name: string
  beschreibung: string
  classes: THSKlasse[]
}

export interface THSHindernis {
  id: string
  position: number
  name: string
  massangabe?: string
}

export const THS_GEHORSAM: THSGehorsamUebung[] = [
  {
    id: 'ths-g-leine',
    name: 'Leinenführigkeit',
    beschreibung: 'Hund geht ruhig an der Leine, kein Zug, gleichmäßiges Tempo',
    classes: ['k1', 'k2', 'k3'],
  },
  {
    id: 'ths-g-frei',
    name: 'Freifolge',
    beschreibung: 'Hund folgt ohne Leine aufmerksam bei Fuß, korrekte Grundstellung',
    classes: ['k1', 'k2', 'k3'],
  },
  {
    id: 'ths-g-sitz',
    name: 'Sitz mit Herankommen',
    beschreibung: 'Hund setzt sich auf Signal aus der Bewegung, kommt auf Ruf zum HF',
    classes: ['k1', 'k2', 'k3'],
  },
  {
    id: 'ths-g-platz',
    name: 'Platz mit Herankommen',
    beschreibung: 'Hund legt sich auf Signal aus der Bewegung ab, kommt auf Ruf zum HF',
    classes: ['k1', 'k2', 'k3'],
  },
  {
    id: 'ths-g-steh',
    name: 'Steh aus der Bewegung',
    beschreibung: 'Hund bleibt auf Signal aus der Bewegung stehen, HF geht weiter',
    classes: ['k2', 'k3'],
  },
  {
    id: 'ths-g-platz-ls',
    name: 'Platz aus dem Laufschritt',
    beschreibung: 'Hund legt sich auf Signal aus dem Laufschritt sofort ab',
    classes: ['k3'],
  },
  {
    id: 'ths-g-steh-ls',
    name: 'Steh aus dem Laufschritt',
    beschreibung: 'Hund bleibt auf Signal aus dem Laufschritt sofort stehen',
    classes: ['k3'],
  },
]

export const THS_HINDERNISSE: THSHindernis[] = [
  { id: 'ths-h-01', position: 1, name: 'Hürde',          massangabe: '50 cm' },
  { id: 'ths-h-02', position: 2, name: 'Oxer',            massangabe: '0,80 m hoch · 1,50 m lang · 1,00 m breit' },
  { id: 'ths-h-03', position: 3, name: 'Tunnel',          massangabe: '3,50 m' },
  { id: 'ths-h-04', position: 4, name: 'Laufdiele',       massangabe: '4,50 m' },
  { id: 'ths-h-05', position: 5, name: 'Tonne',           massangabe: 'Ø 0,80 m' },
  { id: 'ths-h-06', position: 6, name: 'Reifen',          massangabe: undefined },
  { id: 'ths-h-07', position: 7, name: 'Hoch-Weitsprung', massangabe: '1 m weit · 30 cm Höhe' },
  { id: 'ths-h-08', position: 8, name: 'Hürde',           massangabe: '50 cm' },
]

export const THS_DISZIPLIN_INFO: Record<'huerdenlauf' | 'slalom' | 'hindernislauf', Record<THSKlasse, string>> = {
  huerdenlauf:   { k1: '4 Hürden · 60 m', k2: '4 Hürden · 60 m', k3: '6 Hürden · 80 m' },
  slalom:        { k1: '7 Tore · 55 m · Leine optional', k2: '7 Tore · 65 m', k3: '7 Tore · 75 m' },
  hindernislauf: { k1: '8 Hindernisse · 75 m', k2: '8 Hindernisse · 75 m', k3: '8 Hindernisse · 75 m' },
}

export const KLASSE_LABEL: Record<THSKlasse, string> = {
  k1: 'VK1',
  k2: 'VK2',
  k3: 'VK3',
}

// Exercise-IDs für den Level-Status der Zeitdisziplinen (in exercise_progress gespeichert)
export const THS_DISZIPLIN_EXERCISE_ID: Record<'huerdenlauf' | 'slalom' | 'hindernislauf', string> = {
  huerdenlauf:   'ths-d-huerdenlauf',
  slalom:        'ths-d-slalom',
  hindernislauf: 'ths-d-hindernislauf',
}

// Alle 5 Stufen für THS-Zeitdisziplinen
export const THS_DISZIPLIN_LEVELS = ['nicht_begonnen', 'aufbau', 'basis', 'stabil', 'pruefungsreif'] as const

// Berechnet die aktuelle Trainingsklasse automatisch aus dem Fortschritt.
// Startet immer bei k1 und wechselt erst zur nächsten Klasse wenn alle
// Disziplinen der aktuellen Klasse prüfungsreif sind.
export function computeTHSKlasse(
  exerciseMap: Record<string, string>,
  obstacleMap: Record<string, string>
): THSKlasse {
  function isKlasseComplete(k: THSKlasse): boolean {
    const gehorsamOk = THS_GEHORSAM
      .filter(u => u.classes.includes(k))
      .every(u => exerciseMap[u.id] === 'pruefungsreif')
    const huerdeLaufOk  = exerciseMap[THS_DISZIPLIN_EXERCISE_ID.huerdenlauf]   === 'pruefungsreif'
    const slalomOk      = exerciseMap[THS_DISZIPLIN_EXERCISE_ID.slalom]         === 'pruefungsreif'
    const hindernisOk   = exerciseMap[THS_DISZIPLIN_EXERCISE_ID.hindernislauf]  === 'pruefungsreif'
    const obstaclesOk   = THS_HINDERNISSE.every(h => obstacleMap[h.id] === 'pruefungsreif')
    return gehorsamOk && huerdeLaufOk && slalomOk && hindernisOk && obstaclesOk
  }

  if (isKlasseComplete('k1')) {
    if (isKlasseComplete('k2')) return 'k3'
    return 'k2'
  }
  return 'k1'
}

export const DISZIPLIN_LABEL: Record<THSDisziplin, string> = {
  gehorsam:      'Gehorsam',
  huerdenlauf:   'Hürdenlauf',
  slalom:        'Slalomlauf',
  hindernislauf: 'Hindernislauf',
}
