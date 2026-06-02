import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAllSports, useUserSports, useSaveUserSports } from '../hooks/useUserSports'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useCommands, useAddCommand, useUpdateCommand, useDeleteCommand } from '../hooks/useCommands'
import type { Command } from '../data/types'

interface Props {
  userId: string
  onClose: () => void
}

const SPORT_OPTIONS = [
  { value: null,     label: 'Alle' },
  { value: 'alltag', label: 'Alltag' },
  { value: 'bh',     label: 'BH' },
  { value: 'ro',     label: 'RO' },
]

const SPORT_COLOR: Record<string, string> = {
  alltag: 'bg-stone-100 text-stone-600',
  bh: 'bg-teal-100 text-teal-700',
  ro: 'bg-blue-100 text-blue-700',
}

interface CmdForm { name: string; description: string; sportContext: string | null }
const EMPTY_CMD: CmdForm = { name: '', description: '', sportContext: null }

export function Einstellungen({ userId, onClose }: Props) {
  const { data: allSports = [] } = useAllSports()
  const { data: userSportSlugs = [] } = useUserSports(userId)
  const { data: profile } = useProfile(userId)
  const { data: commands = [] } = useCommands(userId)
  const saveSports = useSaveUserSports()
  const updateProfile = useUpdateProfile()
  const addCommand = useAddCommand(userId)
  const updateCommand = useUpdateCommand(userId)
  const deleteCommand = useDeleteCommand(userId)

  const [selectedIds, setSelectedIds] = useState<string[] | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Kommando-CRUD State
  const [showAddCmd, setShowAddCmd] = useState(false)
  const [addForm, setAddForm] = useState<CmdForm>(EMPTY_CMD)
  const [editingCmdId, setEditingCmdId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CmdForm>(EMPTY_CMD)
  const [confirmDeleteCmdId, setConfirmDeleteCmdId] = useState<string | null>(null)

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

  function handleAddCmd() {
    if (!addForm.name.trim()) return
    addCommand.mutate({ name: addForm.name.trim(), description: addForm.description.trim() || undefined, sportContext: addForm.sportContext })
    setShowAddCmd(false)
    setAddForm(EMPTY_CMD)
  }

  function handleEditCmdStart(cmd: Command) {
    setEditForm({ name: cmd.name, description: cmd.description ?? '', sportContext: cmd.sportContext ?? null })
    setEditingCmdId(cmd.id)
  }

  function handleEditCmdSubmit() {
    if (!editingCmdId || !editForm.name.trim()) return
    updateCommand.mutate({ id: editingCmdId, name: editForm.name.trim(), description: editForm.description.trim() || undefined, sportContext: editForm.sportContext })
    setEditingCmdId(null)
  }

  function handleDeleteCmd(id: string) {
    deleteCommand.mutate(id)
    setConfirmDeleteCmdId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 pb-3 bg-white border-b border-stone-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
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
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <span className="text-2xl">{sport.icon}</span>
                  <span className={`font-medium ${isActive ? 'text-teal-800' : 'text-stone-700'}`}>
                    {sport.name}
                  </span>
                  {isActive && <span className="ml-auto text-teal-600">✓</span>}
                </button>
              )
            })}
          </div>
        </section>

        {/* Kommandos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Kommandos
            </h2>
            {!showAddCmd && !editingCmdId && (
              <button
                onClick={() => { setShowAddCmd(true); setAddForm(EMPTY_CMD) }}
                className="text-xs text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1 active:bg-teal-50"
              >
                + Neu
              </button>
            )}
          </div>

          {showAddCmd && (
            <div className="bg-white rounded-xl border border-teal-200 p-4 flex flex-col gap-3 mb-3">
              <input
                autoFocus
                type="text"
                placeholder='z.B. "Sitz" oder "🤚 Platz"'
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <input
                type="text"
                placeholder="Beschreibung (optional)"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <div className="flex gap-1.5 flex-wrap">
                {SPORT_OPTIONS.map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setAddForm(f => ({ ...f, sportContext: opt.value }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      addForm.sportContext === opt.value
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCmd}
                  disabled={!addForm.name.trim()}
                  className="flex-1 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setShowAddCmd(false)}
                  className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {commands.length === 0 && !showAddCmd && (
            <p className="text-sm text-stone-400 text-center py-4">Noch keine Kommandos. Tippe auf „+ Neu".</p>
          )}

          <div className="flex flex-col gap-2">
            {commands.map(cmd => {
              if (editingCmdId === cmd.id) {
                return (
                  <div key={cmd.id} className="bg-white rounded-xl border border-teal-200 p-4 flex flex-col gap-3">
                    <input
                      autoFocus
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <input
                      type="text"
                      placeholder="Beschreibung (optional)"
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {SPORT_OPTIONS.map(opt => (
                        <button
                          key={String(opt.value)}
                          onClick={() => setEditForm(f => ({ ...f, sportContext: opt.value }))}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                            editForm.sportContext === opt.value
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditCmdSubmit}
                        disabled={!editForm.name.trim()}
                        className="flex-1 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingCmdId(null)}
                        className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={cmd.id} className="bg-white rounded-xl border border-stone-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-stone-800">{cmd.name}</span>
                        {cmd.sportContext && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SPORT_COLOR[cmd.sportContext] ?? 'bg-stone-100 text-stone-600'}`}>
                            {cmd.sportContext.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {cmd.description && <p className="text-xs text-stone-400 mt-0.5">{cmd.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEditCmdStart(cmd)} className="p-1.5 text-stone-300 active:text-stone-600 rounded-lg">
                        ✏️
                      </button>
                      {confirmDeleteCmdId === cmd.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeleteCmd(cmd.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg font-semibold">Löschen</button>
                          <button onClick={() => setConfirmDeleteCmdId(null)} className="text-xs px-2 py-1 border border-stone-200 text-stone-500 rounded-lg">Nein</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteCmdId(cmd.id)} className="p-1.5 text-stone-300 active:text-red-400 rounded-lg">🗑️</button>
                      )}
                    </div>
                  </div>
                </div>
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
          className="w-full py-3 bg-teal-700 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
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
