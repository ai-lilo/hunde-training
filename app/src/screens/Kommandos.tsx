import { useState } from 'react'
import type { Command } from '../data/types'
import { useAddCommand, useUpdateCommand, useDeleteCommand } from '../hooks/useCommands'

const SPORT_OPTIONS = [
  { value: null,     label: 'Alle Sportarten' },
  { value: 'alltag', label: 'Alltag' },
  { value: 'bh',     label: 'BH' },
  { value: 'ro',     label: 'Rally Obedience' },
]

const SPORT_LABEL: Record<string, string> = {
  alltag: 'Alltag',
  bh: 'BH',
  ro: 'RO',
}

const SPORT_COLOR: Record<string, string> = {
  alltag: 'bg-stone-100 text-stone-600',
  bh: 'bg-amber-100 text-amber-700',
  ro: 'bg-blue-100 text-blue-700',
}

interface AddFormState {
  name: string
  description: string
  sportContext: string | null
}

interface EditFormState {
  name: string
  description: string
  sportContext: string | null
}

const EMPTY_FORM: AddFormState = { name: '', description: '', sportContext: null }

interface Props {
  commands: Command[]
  userId: string
}

export function Kommandos({ commands, userId }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const addCommand = useAddCommand(userId)
  const updateCommand = useUpdateCommand(userId)
  const deleteCommand = useDeleteCommand(userId)

  function handleAdd() {
    if (!addForm.name.trim()) return
    addCommand.mutate({
      name: addForm.name.trim(),
      description: addForm.description.trim() || undefined,
      sportContext: addForm.sportContext,
    })
    setShowAddForm(false)
    setAddForm(EMPTY_FORM)
  }

  function handleEditStart(cmd: Command) {
    setEditForm({ name: cmd.name, description: cmd.description ?? '', sportContext: cmd.sportContext ?? null })
    setEditingId(cmd.id)
  }

  function handleEditSubmit() {
    if (!editingId || !editForm.name.trim()) return
    updateCommand.mutate({
      id: editingId,
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      sportContext: editForm.sportContext,
    })
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteCommand.mutate(id)
    setConfirmDeleteId(null)
  }

  // Kommandos nach Sportkontext gruppieren
  const grouped: Record<string, Command[]> = {}
  for (const cmd of commands) {
    const key = cmd.sportContext ?? 'alle'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(cmd)
  }

  const groupOrder = ['alle', 'alltag', 'bh', 'ro']
  const groupLabel: Record<string, string> = {
    alle: 'Alle Sportarten',
    alltag: 'Alltag',
    bh: 'BH',
    ro: 'Rally Obedience',
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-28">
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Kommandos</h1>
          <p className="text-sm text-stone-500 mt-0.5">Deine Signalwörter & Handzeichen</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setAddForm(EMPTY_FORM) }}
            className="mt-1 bg-amber-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-transform"
          >
            + Neu
          </button>
        )}
      </div>

      {/* Formular: Neues Kommando */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-stone-700">Neues Kommando</p>

          <input
            autoFocus
            type="text"
            placeholder='Name, z.B. "Sitz" oder "🤚 Handzeichen Platz"'
            value={addForm.name}
            onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          <input
            type="text"
            placeholder="Beschreibung (optional)"
            value={addForm.description}
            onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />

          <div>
            <p className="text-xs text-stone-400 font-medium mb-1.5">Zuordnung</p>
            <div className="flex flex-wrap gap-1.5">
              {SPORT_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setAddForm(f => ({ ...f, sportContext: opt.value }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    addForm.sportContext === opt.value
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!addForm.name.trim()}
              className="flex-1 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
            >
              Speichern
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Leerer Zustand */}
      {commands.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-4xl">🗣️</span>
          <p className="text-base font-semibold text-stone-600 text-center">Noch keine Kommandos</p>
          <p className="text-sm text-stone-400 text-center max-w-xs">
            Leg deine Signalwörter und Handzeichen an — dann kannst du sie mit Übungen verknüpfen.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Erstes Kommando anlegen
          </button>
        </div>
      )}

      {/* Gruppierte Kommando-Liste */}
      {groupOrder.map(groupKey => {
        const group = grouped[groupKey]
        if (!group || group.length === 0) return null
        return (
          <div key={groupKey}>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{groupLabel[groupKey]}</p>
            <div className="flex flex-col gap-2">
              {group.map(cmd => {
                if (editingId === cmd.id) {
                  return (
                    <div key={cmd.id} className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4 flex flex-col gap-3">
                      <input
                        autoFocus
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <input
                        type="text"
                        placeholder="Beschreibung (optional)"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {SPORT_OPTIONS.map(opt => (
                          <button
                            key={String(opt.value)}
                            onClick={() => setEditForm(f => ({ ...f, sportContext: opt.value }))}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              editForm.sportContext === opt.value
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleEditSubmit}
                          disabled={!editForm.name.trim()}
                          className="flex-1 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={cmd.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800">{cmd.name}</span>
                          {cmd.sportContext && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SPORT_COLOR[cmd.sportContext] ?? 'bg-stone-100 text-stone-600'}`}>
                              {SPORT_LABEL[cmd.sportContext] ?? cmd.sportContext}
                            </span>
                          )}
                        </div>
                        {cmd.description && (
                          <p className="text-xs text-stone-500 mt-0.5">{cmd.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditStart(cmd)}
                          className="p-1.5 text-stone-400 active:text-stone-600 rounded-lg active:bg-stone-50"
                        >
                          <span className="text-sm">✏️</span>
                        </button>
                        {confirmDeleteId === cmd.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(cmd.id)}
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg font-semibold active:scale-95"
                            >
                              Löschen
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-1 border border-stone-200 text-stone-500 rounded-lg"
                            >
                              Nein
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(cmd.id)}
                            className="p-1.5 text-stone-300 active:text-red-400 rounded-lg active:bg-red-50"
                          >
                            <span className="text-sm">🗑️</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
