import type { Exercise, ExerciseStatus, Level } from './types'

const LEVEL_ORDER: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil', 'pruefungsreif']

export function levelIndex(l: Level): number {
  return LEVEL_ORDER.indexOf(l)
}

export function nextLevel(l: Level): Level | null {
  const idx = levelIndex(l)
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null
}

export function getStatusMap(statuses: ExerciseStatus[], exercises: Exercise[] = []): Record<string, Level> {
  const map: Record<string, Level> = {}
  for (const e of exercises) map[e.id] = 'nicht_begonnen'
  for (const s of statuses) map[s.exerciseId] = s.level
  return map
}

function prerequisitesMet(exercise: Exercise, statusMap: Record<string, Level>, minLevel: Level = 'basis'): boolean {
  return exercise.prerequisites.every(
    pid => levelIndex(statusMap[pid] ?? 'nicht_begonnen') >= levelIndex(minLevel)
  )
}

export interface Suggestion {
  exercise: Exercise
  currentLevel: Level
  targetLevel: Level
  reason: string
  priority: 'kritisch' | 'hoch' | 'mittel'
}

export function getSuggestions(statuses: ExerciseStatus[], exercises: Exercise[]): Suggestion[] {
  const map = getStatusMap(statuses, exercises)
  const suggestions: Suggestion[] = []

  for (const exercise of exercises) {
    if (exercise.parentId) continue
    const current = map[exercise.id]
    const target = nextLevel(current)
    if (!target) continue

    if (!prerequisitesMet(exercise, map, 'aufbau')) continue

    const priority = getPriority(exercise, current, map, exercises)
    const reason = buildReason(exercise, current, target, map, exercises)

    suggestions.push({ exercise, currentLevel: current, targetLevel: target, reason, priority })
  }

  return suggestions.sort((a, b) => {
    const pOrder = { kritisch: 0, hoch: 1, mittel: 2 }
    const pd = pOrder[a.priority] - pOrder[b.priority]
    if (pd !== 0) return pd
    if (a.exercise.bh_required !== b.exercise.bh_required)
      return a.exercise.bh_required ? -1 : 1
    return 0
  })
}

function getPriority(
  exercise: Exercise,
  current: Level,
  map: Record<string, Level>,
  exercises: Exercise[]
): Suggestion['priority'] {
  if (exercise.id === 'schwellenwert' && levelIndex(current) < levelIndex('stabil')) {
    return 'kritisch'
  }

  const blocksCount = exercises.filter(e =>
    !e.parentId && e.prerequisites.includes(exercise.id) && levelIndex(map[e.id]) < levelIndex('basis')
  ).length

  if (blocksCount >= 3) return 'kritisch'
  if (blocksCount >= 1 || exercise.bh_required) return 'hoch'
  return 'mittel'
}

function buildReason(
  exercise: Exercise,
  current: Level,
  target: Level,
  map: Record<string, Level>,
  exercises: Exercise[]
): string {
  const blockedExercises = exercises.filter(e =>
    !e.parentId &&
    e.prerequisites.includes(exercise.id) &&
    levelIndex(map[e.id] ?? 'nicht_begonnen') < levelIndex('basis')
  )

  if (exercise.id === 'schwellenwert') {
    return 'Grundvoraussetzung für alle anderen Übungen — ohne Ablenkungsfestigkeit ist kein zuverlässiges Arbeiten in der Umwelt möglich.'
  }

  if (blockedExercises.length > 0) {
    const names = blockedExercises.map(e => e.name).join(', ')
    return `Voraussetzung für: ${names}. Aktuell auf "${current}" — Ziel: "${target}".`
  }

  if (exercise.bh_required && (current === 'nicht_begonnen' || current === 'aufbau')) {
    return `BH-Pflichtübung, noch im Aufbau. Kriterium für "${target}": ${exercise.criteria[target]}`
  }

  return `Bereit für nächste Stufe. Kriterium für "${target}": ${exercise.criteria[target]}`
}

export function getBhProgress(statuses: ExerciseStatus[], exercises: Exercise[]): { done: number; total: number; percent: number } {
  const bhExercises = exercises.filter(e => e.bh_required)
  const map = getStatusMap(statuses, exercises)
  const done = bhExercises.filter(e => map[e.id] === 'pruefungsreif').length
  const total = bhExercises.length
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

export { LEVEL_ORDER }
