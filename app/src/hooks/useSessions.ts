import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TrainingSession, TrainingEntry, ROSessionEntry } from '../data/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(raw: any): TrainingSession {
  const sportsData = Array.isArray(raw.sports) ? raw.sports[0] : raw.sports
  const sport = sportsData?.slug ?? 'bh'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: TrainingEntry[] = (raw.session_exercises as any[])
    .filter((e: any) => !e.is_ro)
    .map((e: any) => ({
      exerciseId: e.exercise_ref_id,
      rating: (e.rating ?? 2) as 1 | 2 | 3,
      note: e.note ?? '',
      levelAfter: (e.level_after ?? 'nicht_begonnen') as TrainingEntry['levelAfter'],
    }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roEntries: ROSessionEntry[] = (raw.session_exercises as any[])
    .filter((e: any) => e.is_ro)
    .map((e: any) => ({
      signId: e.exercise_ref_id,
      feedback: (e.feedback ?? undefined) as 'gut' | 'weiter' | undefined,
    }))
  return {
    id: raw.id,
    date: raw.session_date,
    sport: sport as 'bh' | 'ro',
    entries,
    roEntries,
    generalNote: raw.general_note ?? '',
  }
}

export function useSessions(dogId: string) {
  return useQuery({
    queryKey: ['sessions', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          id, dog_id, session_date, general_note, created_at,
          sports(slug),
          session_exercises(exercise_ref_id, rating, level_after, note, is_ro, feedback)
        `)
        .eq('dog_id', dogId)
        .order('session_date', { ascending: false })
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => mapSession(row))
    },
    enabled: !!dogId,
  })
}

interface AddBHSessionParams {
  entries: TrainingEntry[]
  generalNote: string
  date?: string
  sportId: string
}

export function useAddBHSession(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ entries, generalNote, date, sportId }: AddBHSessionParams) => {
      const sessionDate = date ?? new Date().toISOString()

      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({ dog_id: dogId, sport_id: sportId, session_date: sessionDate, general_note: generalNote })
        .select()
        .single()
      if (sessionError) throw sessionError

      if (entries.length > 0) {
        const exerciseRows = entries.map(e => ({
          training_session_id: session.id,
          exercise_ref_id: e.exerciseId,
          rating: e.rating,
          level_after: e.levelAfter,
          note: e.note || null,
          is_ro: false,
          feedback: null,
        }))
        const { error: exError } = await supabase.from('session_exercises').insert(exerciseRows)
        if (exError) throw exError

        // Fortschritt upserten
        const progressRows = entries.map(e => ({
          user_id: userId,
          dog_id: dogId,
          exercise_ref_id: e.exerciseId,
          level: e.levelAfter,
          updated_at: new Date().toISOString(),
        }))
        const { error: progError } = await supabase
          .from('exercise_progress')
          .upsert(progressRows, { onConflict: 'user_id,dog_id,exercise_ref_id' })
        if (progError) throw progError
      }

      return session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', dogId] })
      qc.invalidateQueries({ queryKey: ['exercise-progress', dogId] })
    },
  })
}

interface AddROSessionParams {
  signIds: string[]
  generalNote: string
  feedback: Record<string, 'gut' | 'weiter'>
  date?: string
  sportId: string
}

export function useAddROSession(dogId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ signIds, generalNote, feedback, date, sportId }: AddROSessionParams) => {
      const sessionDate = date ?? new Date().toISOString()

      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({ dog_id: dogId, sport_id: sportId, session_date: sessionDate, general_note: generalNote })
        .select()
        .single()
      if (sessionError) throw sessionError

      if (signIds.length > 0) {
        const exerciseRows = signIds.map(signId => ({
          training_session_id: session.id,
          exercise_ref_id: signId,
          rating: null,
          level_after: null,
          note: null,
          is_ro: true,
          feedback: feedback[signId] ?? null,
        }))
        const { error: exError } = await supabase.from('session_exercises').insert(exerciseRows)
        if (exError) throw exError

        // Leitner-Box + lastPracticedAt aktualisieren
        const { data: current } = await supabase
          .from('ro_sign_progress')
          .select('sign_ref_id, leitner_box')
          .eq('dog_id', dogId)
          .in('sign_ref_id', signIds)

        const currentMap = Object.fromEntries(
          (current ?? []).map(r => [r.sign_ref_id, r.leitner_box as number])
        )

        const progressRows = signIds.map(signId => {
          const currentBox = currentMap[signId] ?? 1
          const fb = feedback[signId]
          const newBox = fb === 'gut' ? Math.min(currentBox + 1, 5) : 1
          return {
            user_id: userId,
            dog_id: dogId,
            sign_ref_id: signId,
            leitner_box: newBox,
            last_practiced_at: sessionDate,
            updated_at: new Date().toISOString(),
          }
        })
        const { error: progError } = await supabase
          .from('ro_sign_progress')
          .upsert(progressRows, { onConflict: 'user_id,dog_id,sign_ref_id' })
        if (progError) throw progError
      }

      return session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', dogId] })
      qc.invalidateQueries({ queryKey: ['ro-sign-progress', dogId] })
    },
  })
}

export function useDeleteSession(dogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('training_sessions').delete().eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', dogId] })
    },
  })
}
