import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ExerciseOverride } from '../data/types'

export function useExerciseOverrides(userId: string) {
  return useQuery({
    queryKey: ['exercise-overrides', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_overrides')
        .select('exercise_ref_id, name_override, description_override, photo_url, notes')
        .eq('user_id', userId)
      if (error) throw error
      const result: Record<string, ExerciseOverride> = {}
      for (const row of data ?? []) {
        result[row.exercise_ref_id as string] = {
          name: (row.name_override as string | null) ?? undefined,
          description: (row.description_override as string | null) ?? undefined,
          photo_url: (row.photo_url as string | null) ?? undefined,
          notes: (row.notes as string | null) ?? undefined,
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
            photo_url: changes.photo_url ?? null,
            notes: changes.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exercise_ref_id' }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise-overrides', userId] }),
  })
}

export function useUploadExercisePhoto(userId: string) {
  return useMutation({
    mutationFn: async ({ exerciseId, file }: { exerciseId: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${exerciseId}/foto.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('exercise-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('exercise-photos').getPublicUrl(path)
      return data.publicUrl
    },
  })
}
