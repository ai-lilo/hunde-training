import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Exercise } from '../data/types'

export function useBuiltinExercises() {
  return useQuery({
    queryKey: ['builtin-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, category, bh_required, is_foundational, description, criteria, prerequisites, parent_id')
        .order('sort_order')
      if (error) throw error
      return (data ?? []).map(r => ({
        id: r.id as string,
        name: r.name as string,
        category: r.category as Exercise['category'],
        bh_required: r.bh_required as boolean,
        isFoundational: r.is_foundational as boolean,
        description: r.description as string,
        criteria: r.criteria as Exercise['criteria'],
        prerequisites: r.prerequisites as string[],
        parentId: (r.parent_id as string | null) ?? undefined,
      })) as Exercise[]
    },
    staleTime: Infinity,
  })
}
