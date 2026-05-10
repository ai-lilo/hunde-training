import { useState, useEffect, useCallback } from 'react'
import type { AppState, Exercise, ExerciseOverride, ExerciseStatus, Level, TrainingSession, TrainingEntry } from '../data/types'
import { CUSTOM_CRITERIA, EXERCISES } from '../data/exercises'

const STORAGE_KEY = 'hundetraining_v1'

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        exerciseStatuses: parsed.exerciseStatuses ?? [],
        sessions: parsed.sessions ?? [],
        customExercises: parsed.customExercises ?? [],
        exerciseOverrides: parsed.exerciseOverrides ?? {},
        hiddenExerciseIds: parsed.hiddenExerciseIds ?? [],
      }
    }
  } catch { /* ignore */ }
  return { exerciseStatuses: [], sessions: [], customExercises: [], exerciseOverrides: {}, hiddenExerciseIds: [] }
}

function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const setExerciseLevel = useCallback((exerciseId: string, level: Level) => {
    setState(prev => {
      const existing = prev.exerciseStatuses.find(s => s.exerciseId === exerciseId)
      const updated: ExerciseStatus = { exerciseId, level, updatedAt: new Date().toISOString() }
      return {
        ...prev,
        exerciseStatuses: existing
          ? prev.exerciseStatuses.map(s => s.exerciseId === exerciseId ? updated : s)
          : [...prev.exerciseStatuses, updated],
      }
    })
  }, [])

  const addSession = useCallback((entries: TrainingEntry[], generalNote: string, date?: string) => {
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      date: date ?? new Date().toISOString(),
      entries,
      generalNote,
    }
    setState(prev => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      exerciseStatuses: mergeEntriesToStatuses(prev.exerciseStatuses, entries),
    }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setState(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }))
  }, [])

  const addCustomExercise = useCallback((fields: { name: string; category: Exercise['category']; description?: string }) => {
    const exercise: Exercise = {
      id: `custom_${crypto.randomUUID()}`,
      name: fields.name,
      category: fields.category,
      description: fields.description ?? '',
      bh_required: false,
      prerequisites: [],
      criteria: CUSTOM_CRITERIA,
    }
    setState(prev => ({ ...prev, customExercises: [...prev.customExercises, exercise] }))
  }, [])

  const updateExercise = useCallback((id: string, changes: ExerciseOverride) => {
    const isCustom = id.startsWith('custom_')
    setState(prev => {
      if (isCustom) {
        return {
          ...prev,
          customExercises: prev.customExercises.map(e =>
            e.id === id ? { ...e, ...changes } : e
          ),
        }
      }
      return {
        ...prev,
        exerciseOverrides: {
          ...prev.exerciseOverrides,
          [id]: { ...(prev.exerciseOverrides[id] ?? {}), ...changes },
        },
      }
    })
  }, [])

  const deleteExercise = useCallback((id: string) => {
    const isCustom = id.startsWith('custom_')
    setState(prev => {
      if (isCustom) {
        return { ...prev, customExercises: prev.customExercises.filter(e => e.id !== id) }
      }
      // For built-in exercises, also remove any sub-exercises
      const subIds = EXERCISES.filter(e => e.parentId === id).map(e => e.id)
      return {
        ...prev,
        hiddenExerciseIds: [...prev.hiddenExerciseIds, id, ...subIds.filter(sid => !prev.hiddenExerciseIds.includes(sid))],
      }
    })
  }, [])

  return { state, setExerciseLevel, addSession, deleteSession, addCustomExercise, updateExercise, deleteExercise }
}

function mergeEntriesToStatuses(
  existing: ExerciseStatus[],
  entries: TrainingEntry[]
): ExerciseStatus[] {
  const map = Object.fromEntries(existing.map(s => [s.exerciseId, s]))
  for (const entry of entries) {
    map[entry.exerciseId] = {
      exerciseId: entry.exerciseId,
      level: entry.levelAfter,
      updatedAt: new Date().toISOString(),
    }
  }
  return Object.values(map)
}
