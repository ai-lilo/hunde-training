import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ExerciseOverride } from '../data/types'

export function useExerciseOverrides(userId: string) {
  return useQuery({
    queryKey: ['exercise-overrides', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_overrides')
        .select('exercise_ref_id, name_override, description_override')
        .eq('user_id', userId)
      if (error) throw error
      const result: Record<string, ExerciseOverride> = {}
      for (const row of data ?? []) {
        result[row.exercise_ref_id as string] = {
          name: (row.name_override as string | null) ?? undefined,
          description: (row.description_override as string | null) ?? undefined,
        }
      }
      return result
    },
    enabled: !!userId,
  })
}

export function useUpdateExerciseOverride(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, changes }: { exerciseId: string; changes: ExerciseOverride }) => {
      const { error } = await supabase
        .from('exercise_overrides')
        .upsert(
          {
            user_id: userId,
            exercise_ref_id: exerciseId,
            name_override: changes.name ?? null,
            description_override: changes.description ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exercise_ref_id' }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise-overrides', userId] }),
  })
}
