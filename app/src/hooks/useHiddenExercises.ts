import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise } from '../data/types'

export function useHiddenExercises(userId: string) {
  return useQuery({
    queryKey: ['hidden-exercises', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hidden_exercises')
        .select('exercise_ref_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map(r => r.exercise_ref_id as string)
    },
    enabled: !!userId,
  })
}

export function useHideExercise(userId: string, exercises: Exercise[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const subIds = exercises.filter(e => e.parentId === exerciseId).map(e => e.id)
      const ids = [exerciseId, ...subIds]
      const rows = ids.map(exercise_ref_id => ({ user_id: userId, exercise_ref_id }))
      const { error } = await supabase.from('hidden_exercises').upsert(rows, { onConflict: 'user_id,exercise_ref_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hidden-exercises', userId] }),
  })
}
