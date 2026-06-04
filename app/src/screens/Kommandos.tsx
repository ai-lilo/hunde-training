import { useState } from 'react'
import type { Command } from '../data/types'
import { useAddCommand, useUpdateCommand, useDeleteCommand } from '../hooks/useCommands'

// Encoding: 'alltag', 'sport', 'sport,alltag', null (legacy = beide)
// Legacy values 'bh', 'ro', 'ths' werden als 'sport' behandelt

function normalizeSportContext(raw: string | null | undefined): string {
  if (!raw) return 'sport,alltag'
  if (raw === 'bh' || raw === 'ro' || raw === 'ths') return 'sport'
  return raw
}

function contextIncludes(raw: string | null | undefined, cat: 'sport' | 'alltag'): boolean {
  const v = normalizeSportContext(raw)
  return v === cat || v === 'sport,alltag'
}

function encodeContext(sport: boolean, alltag: boolean): string | null {
  if (sport && alltag) return 'sport,alltag'
  if (sport) return 'sport'
  if (alltag) return 'alltag'
  return 'sport,alltag'
}

interface FormState {
  name: string
  description: string
  sport: boolean
  alltag: boolean
}

const EMPTY_FORM: FormState = { name: '', description: '', sport: true, alltag: false }

interface Props {
  commands: Command[]
  userId: string
}

export function Kommandos({ commands, userId }: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const addCommand = useAddCommand(userId)
  const updateCommand = useUpdateCommand(userId)
  const deleteCommand = useDeleteCommand(userId)

  function handleAdd() {
    if (!addForm.name.trim()) return
    addCommand.mutate({
      name: addForm.name.trim(),
      description: addForm.description.trim() || undefined,
      sportContext: encodeContext(addForm.sport, addForm.alltag),
    })
    setShowAddForm(false)
    setAddForm(EMPTY_FORM)
  }

  function handleEditStart(cmd: Command) {
    const v = normalizeSportContext(cmd.sportContext)
    setEditForm({
      name: cmd.name,
      description: cmd.description ?? '',
      sport: v === 'sport' || v === 'sport,alltag',
      alltag: v === 'alltag' || v === 'sport,alltag',
    })
    setEditingId(cmd.id)
  }

  function handleEditSubmit() {
    if (!editingId || !editForm.name.trim()) return
    updateCommand.mutate({
      id: editingId,
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      sportContext: encodeContext(editForm.sport, editForm.alltag),
    })
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteCommand.mutate(id)
    setConfirmDeleteId(null)
  }

  // Kommandos für jede Gruppe sammeln (können in beiden erscheinen)
  const sportCmds = commands.filter(c => contextIncludes(c.sportContext, 'sport'))
  const alltagCmds = commands.filter(c => contextIncludes(c.sportContext, 'alltag'))

  function CategoryToggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
          active
            ? 'bg-teal-500 text-white border-teal-500'
            : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
        }`}
      >
        {label}
      </button>
    )
  }

  function CategoryBadge({ sportContext }: { sportContext?: string | null }) {
    const v = normalizeSportContext(sportContext)
    if (v === 'sport,alltag') return null
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
        v === 'sport' ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-600'
      }`}>
        {v === 'sport' ? 'Sport' : 'Alltag'}
      </span>
    )
  }

  function CommandForm({ form, onChange, onSubmit, onCancel, submitLabel }: {
    form: FormState
    onChange: (f: FormState) => void
    onSubmit: () => void
    onCancel: () => void
    submitLabel: string
  }) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-teal-200 p-4 flex flex-col gap-3">
        <input
          autoFocus
          type="text"
          placeholder='Name, z.B. "Sitz" oder "🤚 Handzeichen Platz"'
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        <input
          type="text"
          placeholder="Beschreibung (optional)"
          value={form.description}
          onChange={e => onChange({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
        <div>
          <p className="text-xs text-stone-400 font-medium mb-1.5">Kategorie</p>
          <div className="flex gap-2">
            <CategoryToggle label="Alltag" active={form.alltag} onToggle={() => onChange({ ...form, alltag: !form.alltag })} />
            <CategoryToggle label="Sport" active={form.sport} onToggle={() => onChange({ ...form, sport: !form.sport })} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSubmit}
            disabled={!form.name.trim()}
            className="flex-1 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
          >
            {submitLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  function CommandCard({ cmd }: { cmd: Command }) {
    if (editingId === cmd.id) {
      return (
        <CommandForm
          form={editForm}
          onChange={setEditForm}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingId(null)}
          submitLabel="Speichern"
        />
      )
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-stone-800">{cmd.name}</span>
              <CategoryBadge sportContext={cmd.sportContext} />
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
            className="mt-1 bg-teal-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-transform"
          >
            + Neu
          </button>
        )}
      </div>

      {showAddForm && (
        <CommandForm
          form={addForm}
          onChange={setAddForm}
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
          submitLabel="Speichern"
        />
      )}

      {commands.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-4xl">🗣️</span>
          <p className="text-base font-semibold text-stone-600 text-center">Noch keine Kommandos</p>
          <p className="text-sm text-stone-400 text-center max-w-xs">
            Leg deine Signalwörter und Handzeichen an — dann kannst du sie mit Übungen verknüpfen.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Erstes Kommando anlegen
          </button>
        </div>
      )}

      {alltagCmds.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Alltag</p>
          <div className="flex flex-col gap-2">
            {alltagCmds.map(cmd => <CommandCard key={cmd.id} cmd={cmd} />)}
          </div>
        </div>
      )}

      {sportCmds.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Sport</p>
          <div className="flex flex-col gap-2">
            {sportCmds.map(cmd => <CommandCard key={cmd.id} cmd={cmd} />)}
          </div>
        </div>
      )}
    </div>
  )
}
