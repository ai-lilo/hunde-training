import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise } from '../data/types'
import { CUSTOM_CRITERIA } from '../data/exercises'

interface RawCustomExercise {
  id: string
  name: string
  category: string
  description: string | null
}

function mapToExercise(raw: RawCustomExercise): Exercise {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as Exercise['category'],
    description: raw.description ?? '',
    bh_required: false,
    prerequisites: [],
    criteria: CUSTOM_CRITERIA,
  }
}

export function useCustomExercises(_dogId: string, userId: string) {
  return useQuery({
    queryKey: ['custom-exercises', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('id, name, category, description')
        .eq('user_id', userId)
        .order('created_at')
      if (error) throw error
      return (data ?? []).map(mapToExercise)
    },
    enabled: !!userId,
  })
}

export function useAddCustomExercise(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fields: { name: string; category: Exercise['category']; description?: string }) => {
      const { data, error } = await supabase
        .from('custom_exercises')
        .insert({ user_id: userId, dog_id: dogId, name: fields.name, category: fields.category, description: fields.description ?? null })
        .select()
        .single()
      if (error) throw error
      return mapToExercise(data as RawCustomExercise)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-exercises', userId] }),
  })
}

export function useDeleteCustomExercise(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['custom-exercises', userId] }),
  })
}
