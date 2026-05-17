import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAllSports, useUserSports, useSaveUserSports } from '../hooks/useUserSports'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'

interface Props {
  userId: string
  onClose: () => void
}

export function Einstellungen({ userId, onClose }: Props) {
  const { data: allSports = [] } = useAllSports()
  const { data: userSportSlugs = [] } = useUserSports(userId)
  const { data: profile } = useProfile(userId)
  const saveSports = useSaveUserSports()
  const updateProfile = useUpdateProfile()

  const [selectedIds, setSelectedIds] = useState<string[] | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const computedIds = useMemo(
    () => allSports.filter(s => userSportSlugs.includes(s.slug)).map(s => s.id),
    [allSports, userSportSlugs]
  )
  const activeIds = selectedIds ?? computedIds
  const activeName = displayName ?? (profile?.display_name ?? '')

  const toggleSport = (id: string) => {
    setSelectedIds(prev => {
      const current = prev ?? computedIds
      return current.includes(id) ? current.filter(s => s !== id) : [...current, id]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSports.mutateAsync({ userId, sportIds: activeIds })
      await updateProfile.mutateAsync({ id: userId, display_name: activeName.trim() || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-100">
        <button
          onClick={onClose}
          className="text-stone-400 text-sm font-medium active:scale-95 transition-transform"
        >
          ← Zurück
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-stone-800 pr-14">
          Einstellungen
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* Anzeigename */}
        <section>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Dein Name
          </h2>
          <input
            type="text"
            value={activeName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </section>

        {/* Sportarten */}
        <section>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Sportarten
          </h2>
          <div className="flex flex-col gap-2">
            {allSports.map(sport => {
              const isActive = activeIds.includes(sport.id)
              return (
                <button
                  key={sport.id}
                  onClick={() => toggleSport(sport.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors active:scale-95 ${
                    isActive
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className={`font-medium ${isActive ? 'text-amber-800' : 'text-stone-700'}`}>
                    {sport.name}
                  </span>
                  {isActive && <span className="ml-auto text-amber-600">✓</span>}
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-5 flex flex-col gap-3 bg-white border-t border-stone-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {saving ? 'Wird gespeichert…' : 'Speichern'}
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-stone-400 text-center underline"
        >
          Abmelden
        </button>
      </div>
    </div>
  )
}
