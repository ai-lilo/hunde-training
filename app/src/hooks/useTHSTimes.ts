import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { THSTimeRecord } from '../data/types'

export function useTHSTimes(dogId: string) {
  return useQuery({
    queryKey: ['ths-times', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ths_times')
        .select('id, discipline, klasse, time_seconds, note, recorded_at')
        .eq('dog_id', dogId)
        .order('recorded_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(r => ({
        id: r.id as string,
        discipline: r.discipline as THSTimeRecord['discipline'],
        klasse: r.klasse as THSTimeRecord['klasse'],
        timeSeconds: Number(r.time_seconds),
        note: r.note as string | undefined,
        recordedAt: r.recorded_at as string,
      })) as THSTimeRecord[]
    },
    enabled: !!dogId,
  })
}

interface AddTHSTimeParams {
  discipline: THSTimeRecord['discipline']
  klasse: THSTimeRecord['klasse']
  timeSeconds: number
  note?: string
  trainingSessionId?: string
}

export function useAddTHSTime(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ discipline, klasse, timeSeconds, note, trainingSessionId }: AddTHSTimeParams) => {
      const { error } = await supabase.from('ths_times').insert({
        user_id: userId,
        dog_id: dogId,
        discipline,
        klasse,
        time_seconds: timeSeconds,
        note: note || null,
        training_session_id: trainingSessionId ?? null,
        recorded_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ths-times', dogId] })
    },
  })
}

export function useDeleteTHSTime(dogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ths_times').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ths-times', dogId] })
    },
  })
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(1)
  return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : `${secs}s`
}

export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  // Format "1:23.4" oder "1:23" → Minuten:Sekunden
  const colonMatch = trimmed.match(/^(\d+):(\d+(?:\.\d+)?)$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseFloat(colonMatch[2])
    if (secs >= 60) return null
    return mins * 60 + secs
  }
  // Format "23.4" → nur Sekunden
  const secsOnly = parseFloat(trimmed)
  if (!isNaN(secsOnly) && secsOnly > 0) return secsOnly
  return null
}
