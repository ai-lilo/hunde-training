import { useState, useCallback } from 'react'

const STORAGE_KEY = 'active_dog_id'

export function useActiveDog() {
  const [dogId, setDogIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  )

  const setDogId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setDogIdState(id)
  }, [])

  const clearDogId = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setDogIdState(null)
  }, [])

  return { dogId, setDogId, clearDogId }
}
