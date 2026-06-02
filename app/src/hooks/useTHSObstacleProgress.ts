import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { THSObstacleStatus, Level } from '../data/types'

export function useTHSObstacleProgress(dogId: string) {
  return useQuery({
    queryKey: ['ths-obstacle-progress', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ths_obstacle_progress')
        .select('obstacle_ref_id, level, last_practiced_at, updated_at')
        .eq('dog_id', dogId)
      if (error) throw error
      return (data ?? []).map(r => ({
        obstacleId: r.obstacle_ref_id as string,
        level: r.level as Level,
        lastPracticedAt: r.last_practiced_at as string | undefined,
        updatedAt: r.updated_at as string,
      })) as THSObstacleStatus[]
    },
    enabled: !!dogId,
  })
}

export function useSetTHSObstacleLevel(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ obstacleId, level }: { obstacleId: string; level: Level }) => {
      const { error } = await supabase
        .from('ths_obstacle_progress')
        .upsert(
          { user_id: userId, dog_id: dogId, obstacle_ref_id: obstacleId, level, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,dog_id,obstacle_ref_id' }
        )
      if (error) throw error
    },
    onMutate: async ({ obstacleId, level }) => {
      const key = ['ths-obstacle-progress', dogId]
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<THSObstacleStatus[]>(key)
      qc.setQueryData<THSObstacleStatus[]>(key, old => {
        if (!old) return [{ obstacleId, level, updatedAt: new Date().toISOString() }]
        const exists = old.find(s => s.obstacleId === obstacleId)
        if (exists) return old.map(s => s.obstacleId === obstacleId ? { ...s, level } : s)
        return [...old, { obstacleId, level, updatedAt: new Date().toISOString() }]
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['ths-obstacle-progress', dogId], ctx?.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['ths-obstacle-progress', dogId] })
    },
  })
}
