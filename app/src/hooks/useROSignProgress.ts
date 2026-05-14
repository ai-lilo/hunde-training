import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ROSignStatus, Level } from '../data/types'

export function useROSignProgress(dogId: string) {
  return useQuery({
    queryKey: ['ro-sign-progress', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ro_sign_progress')
        .select('sign_ref_id, level, leitner_box, last_practiced_at, updated_at')
        .eq('dog_id', dogId)
      if (error) throw error
      return (data ?? []).map(r => ({
        signId: r.sign_ref_id as string,
        level: r.level as Level,
        leitnerBox: (r.leitner_box as number) ?? 1,
        lastPracticedAt: r.last_practiced_at as string | undefined,
        updatedAt: r.updated_at as string,
      })) as ROSignStatus[]
    },
    enabled: !!dogId,
  })
}

export function useSetROSignLevel(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ signId, level }: { signId: string; level: Level }) => {
      const { error } = await supabase
        .from('ro_sign_progress')
        .upsert(
          { user_id: userId, dog_id: dogId, sign_ref_id: signId, level, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,dog_id,sign_ref_id' }
        )
      if (error) throw error
    },
    onMutate: async ({ signId, level }) => {
      const key = ['ro-sign-progress', dogId]
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ROSignStatus[]>(key)
      qc.setQueryData<ROSignStatus[]>(key, old => {
        if (!old) return [{ signId, level, updatedAt: new Date().toISOString() }]
        const exists = old.find(s => s.signId === signId)
        if (exists) return old.map(s => s.signId === signId ? { ...s, level } : s)
        return [...old, { signId, level, updatedAt: new Date().toISOString() }]
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['ro-sign-progress', dogId], ctx?.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['ro-sign-progress', dogId] })
    },
  })
}
