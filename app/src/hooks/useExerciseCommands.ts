import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ExerciseCommandLink {
  id: string
  commandId: string
}

// Lädt alle Übungs-Kommando-Verknüpfungen für einen User auf einmal (effizient)
export function useAllExerciseCommands(userId: string) {
  return useQuery({
    queryKey: ['exercise-commands-all', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_commands')
        .select('id, command_id, exercise_ref_id')
        .eq('user_id', userId)
      if (error) throw error
      const result: Record<string, ExerciseCommandLink[]> = {}
      for (const row of data ?? []) {
        const eid = row.exercise_ref_id as string
        if (!result[eid]) result[eid] = []
        result[eid].push({ id: row.id as string, commandId: row.command_id as string })
      }
      return result
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useLinkCommand(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ exerciseId, commandId }: { exerciseId: string; commandId: string }) => {
      const { error } = await supabase
        .from('exercise_commands')
        .insert({ user_id: userId, exercise_ref_id: exerciseId, command_id: commandId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-commands-all', userId] })
    },
  })
}

export function useUnlinkCommand(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ linkId }: { linkId: string; exerciseId: string }) => {
      const { error } = await supabase
        .from('exercise_commands')
        .delete()
        .eq('id', linkId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-commands-all', userId] })
    },
  })
}
