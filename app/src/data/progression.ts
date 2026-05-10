import type { Exercise, ExerciseStatus, Level } from './types'
import { EXERCISES } from './exercises'

const LEVEL_ORDER: Level[] = ['aufbau', 'basis', 'stabil', 'pruefungsreif']

export function levelIndex(l: Level): number {
  return LEVEL_ORDER.indexOf(l)
}

export function nextLevel(l: Level): Level | null {
  const idx = levelIndex(l)
  return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null
}

export function getStatusMap(statuses: ExerciseStatus[], exercises: Exercise[] = EXERCISES): Record<string, Level> {
  const map: Record<string, Level> = {}
  for (const e of exercises) map[e.id] = 'aufbau'
  for (const s of statuses) map[s.exerciseId] = s.level
  return map
}

function prerequisitesMet(exercise: Exercise, statusMap: Record<string, Level>, minLevel: Level = 'basis'): boolean {
  return exercise.prerequisites.every(
    pid => levelIndex(statusMap[pid] ?? 'aufbau') >= levelIndex(minLevel)
  )
}

export interface Suggestion {
  exercise: Exercise
  currentLevel: Level
  targetLevel: Level
  reason: string
  priority: 'kritisch' | 'hoch' | 'mittel'
}

export function getSuggestions(statuses: ExerciseStatus[]): Suggestion[] {
  const map = getStatusMap(statuses)
  const suggestions: Suggestion[] = []

  for (const exercise of EXERCISES) {
    if (exercise.parentId) continue // skip sub-exercises
    const current = map[exercise.id]
    const target = nextLevel(current)
    if (!target) continue // already pruefungsreif

    // Check prerequisites are met to start working on next level
    if (!prerequisitesMet(exercise, map, 'aufbau')) continue

    const priority = getPriority(exercise, current, map)
    const reason = buildReason(exercise, current, target, map)

    suggestions.push({ exercise, currentLevel: current, targetLevel: target, reason, priority })
  }

  // Sort: kritisch first, then hoch, then mittel; within each group by BH-required
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
  map: Record<string, Level>
): Suggestion['priority'] {
  // Schwellenwert blocks everything — always kritisch if not stable
  if (exercise.id === 'schwellenwert' && levelIndex(current) < levelIndex('stabil')) {
    return 'kritisch'
  }

  // Exercises that many others depend on
  const blocksCount = EXERCISES.filter(e =>
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
  map: Record<string, Level>
): string {
  const blockedExercises = EXERCISES.filter(e =>
    !e.parentId &&
    e.prerequisites.includes(exercise.id) &&
    levelIndex(map[e.id] ?? 'aufbau') < levelIndex('basis')
  )

  if (exercise.id === 'schwellenwert') {
    return 'Grundvoraussetzung für alle anderen Übungen — ohne Ablenkungsfestigkeit ist kein zuverlässiges Arbeiten in der Umwelt möglich.'
  }

  if (blockedExercises.length > 0) {
    const names = blockedExercises.map(e => e.name).join(', ')
    return `Voraussetzung für: ${names}. Aktuell auf "${current}" — Ziel: "${target}".`
  }

  if (exercise.bh_required && current === 'aufbau') {
    return `BH-Pflichtübung, noch im Aufbau. Kriterium für "${target}": ${exercise.criteria[target]}`
  }

  return `Bereit für nächste Stufe. Kriterium für "${target}": ${exercise.criteria[target]}`
}

export function getBhProgress(statuses: ExerciseStatus[]): { done: number; total: number; percent: number } {
  const bhExercises = EXERCISES.filter(e => e.bh_required)
  const map = getStatusMap(statuses)
  const done = bhExercises.filter(e => map[e.id] === 'pruefungsreif').length
  const total = bhExercises.length
  return { done, total, percent: Math.round((done / total) * 100) }
}

export { LEVEL_ORDER }
