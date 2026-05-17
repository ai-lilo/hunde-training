import type { Exercise, ExerciseOverride, LevelCriteria } from './types'

export const CUSTOM_CRITERIA: LevelCriteria = {
  nicht_begonnen: 'Noch nicht begonnen',
  aufbau: 'Im Aufbau – Übung bekannt, noch unsicher',
  basis: 'In ruhiger Umgebung zuverlässig',
  stabil: 'Auch mit leichter Ablenkung stabil',
  pruefungsreif: 'Prüfungstauglich und zuverlässig',
}

export function buildAllExercises(
  builtinExercises: Exercise[],
  customExercises: Exercise[],
  overrides: Record<string, ExerciseOverride>,
  hiddenIds: string[]
): Exercise[] {
  const hiddenSet = new Set(hiddenIds)
  return [
    ...builtinExercises.filter(e => !hiddenSet.has(e.id)),
    ...customExercises,
  ].map(e => {
    const ov = overrides[e.id]
    return ov ? { ...e, ...ov } : e
  })
}
