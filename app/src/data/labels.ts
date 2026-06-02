import type { Level } from './types'

export const LEVEL_LABEL: Record<Level, string> = {
  nicht_begonnen: 'Nicht begonnen',
  aufbau: 'Aufbau',
  basis: 'Basis',
  stabil: 'Stabil',
  pruefungsreif: 'Prüfungsreif',
}

export const CATEGORY_LABEL: Record<string, string> = {
  grundlage: 'Grundlagen',
  unterordnung: 'Unterordnung',
  verkehr: 'Verkehrsteil',
  pruefung: 'Prüfungsablauf',
  sport: 'Sport',
}

export const LEVEL_ORDER: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil', 'pruefungsreif']
