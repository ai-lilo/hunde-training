import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Level } from '../data/types'

export interface LevelHistoryEntry {
  level: Level
  date: string
}

// Lädt die komplette Level-Historie aller Übungen für einen Hund (ein Query, effizient)
export function useAllExerciseLevelHistory(dogId: string) {
  return useQuery({
    queryKey: ['exercise-level-history-all', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_exercises')
        .select('exercise_ref_id, level_after, created_at, training_sessions!inner(dog_id)')
        .eq('training_sessions.dog_id', dogId)
        .not('level_after', 'is', null)
        .order('created_at', { ascending: true })
      if (error) throw error

      const result: Record<string, LevelHistoryEntry[]> = {}
      const lastLevels: Record<string, string> = {}

      for (const row of data ?? []) {
        const eid = row.exercise_ref_id as string
        if (!result[eid]) result[eid] = []
        if (row.level_after && row.level_after !== lastLevels[eid]) {
          result[eid].push({
            level: row.level_after as Level,
            date: (row.created_at as string).split('T')[0],
          })
          lastLevels[eid] = row.level_after as string
        }
      }
      return result
    },
    enabled: !!dogId,
    staleTime: 60_000,
  })
}
