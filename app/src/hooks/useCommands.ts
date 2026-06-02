import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Command } from '../data/types'

interface RawCommand {
  id: string
  name: string
  description: string | null
  sport_context: string | null
}

function mapToCommand(raw: RawCommand): Command {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? undefined,
    sportContext: raw.sport_context ?? undefined,
  }
}

export function useCommands(userId: string) {
  return useQuery({
    queryKey: ['commands', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commands')
        .select('id, name, description, sport_context')
        .eq('user_id', userId)
        .order('created_at')
      if (error) throw error
      return (data ?? []).map(mapToCommand)
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useAddCommand(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fields: { name: string; description?: string; sportContext?: string | null }) => {
      const { data, error } = await supabase
        .from('commands')
        .insert({
          user_id: userId,
          name: fields.name,
          description: fields.description ?? null,
          sport_context: fields.sportContext ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return mapToCommand(data as RawCommand)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commands', userId] }),
  })
}

export function useUpdateCommand(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fields: { id: string; name: string; description?: string; sportContext?: string | null }) => {
      const { error } = await supabase
        .from('commands')
        .update({
          name: fields.name,
          description: fields.description ?? null,
          sport_context: fields.sportContext ?? null,
        })
        .eq('id', fields.id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commands', userId] }),
  })
}

export function useDeleteCommand(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commands')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commands', userId] }),
  })
}
