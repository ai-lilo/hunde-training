import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Sport {
  id: string
  slug: string
  name: string
  icon: string
  is_active: boolean
  sort_order: number
}

export function useAllSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data as Sport[]
    },
  })
}

export function useUserSports(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-sports', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sports')
        .select('sport_id, sports(slug)')
        .eq('user_id', userId!)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => {
        const sports = Array.isArray(row.sports) ? row.sports[0] : row.sports
        return sports?.slug ?? ''
      }).filter(Boolean) as string[]
    },
    enabled: !!userId,
  })
}

export function useSaveUserSports() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, sportIds }: { userId: string; sportIds: string[] }) => {
      // Delete existing, then insert new
      await supabase.from('user_sports').delete().eq('user_id', userId)
      if (sportIds.length > 0) {
        const rows = sportIds.map(sport_id => ({ user_id: userId, sport_id }))
        const { error } = await supabase.from('user_sports').insert(rows)
        if (error) throw error
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['user-sports', variables.userId] })
    },
  })
}
