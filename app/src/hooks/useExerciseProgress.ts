import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ExerciseStatus, Level } from '../data/types'

export function useExerciseProgress(dogId: string) {
  return useQuery({
    queryKey: ['exercise-progress', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_progress')
        .select('exercise_ref_id, level, updated_at')
        .eq('dog_id', dogId)
      if (error) throw error
      return (data ?? []).map(r => ({
        exerciseId: r.exercise_ref_id as string,
        level: r.level as Level,
        updatedAt: r.updated_at as string,
      })) as ExerciseStatus[]
    },
    enabled: !!dogId,
  })
}

export function useSetExerciseLevel(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, level }: { exerciseId: string; level: Level }) => {
      const { error } = await supabase
        .from('exercise_progress')
        .upsert(
          { user_id: userId, dog_id: dogId, exercise_ref_id: exerciseId, level, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,dog_id,exercise_ref_id' }
        )
      if (error) throw error
    },
    onMutate: async ({ exerciseId, level }) => {
      const key = ['exercise-progress', dogId]
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ExerciseStatus[]>(key)
      qc.setQueryData<ExerciseStatus[]>(key, old => {
        if (!old) return [{ exerciseId, level, updatedAt: new Date().toISOString() }]
        const exists = old.find(s => s.exerciseId === exerciseId)
        if (exists) return old.map(s => s.exerciseId === exerciseId ? { ...s, level } : s)
        return [...old, { exerciseId, level, updatedAt: new Date().toISOString() }]
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['exercise-progress', dogId], ctx?.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['exercise-progress', dogId] })
    },
  })
}
