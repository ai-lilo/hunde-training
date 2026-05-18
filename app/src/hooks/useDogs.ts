import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Dog {
  id: string
  owner_id: string
  name: string
  breed: string | null
  gender: 'male' | 'female' | 'unknown' | null
  birthdate: string | null
  weight_kg: number | null
  photo_url: string | null
  notes: string | null
  created_at: string
}

export type NewDog = Pick<Dog, 'name'> & Partial<Omit<Dog, 'id' | 'owner_id' | 'created_at'>>

export function useDogs() {
  return useQuery({
    queryKey: ['dogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Dog[]
    },
  })
}

export function useDog(dogId: string | null) {
  return useQuery({
    queryKey: ['dogs', dogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dogId!)
        .single()
      if (error) throw error
      return data as Dog
    },
    enabled: !!dogId,
  })
}

export function useCreateDog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dog: NewDog) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht angemeldet')
      const { data, error } = await supabase
        .from('dogs')
        .insert({ ...dog, owner_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Dog
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dogs'] }),
  })
}

export function useUpdateDog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Dog> & { id: string }) => {
      const { error } = await supabase.from('dogs').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dogs'] }),
  })
}

export function useDeleteDog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dogId: string) => {
      const { error } = await supabase.from('dogs').delete().eq('id', dogId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dogs'] }),
  })
}
