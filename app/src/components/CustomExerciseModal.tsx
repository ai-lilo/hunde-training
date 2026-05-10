import { useState } from 'react'
import type { Category } from '../data/types'

interface Props {
  onAdd: (fields: { name: string; category: Category; description: string }) => void
  onClose: () => void
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'grundlage', label: 'Grundlagen' },
  { value: 'unterordnung', label: 'Unterordnung' },
  { value: 'verkehr', label: 'Verkehrsteil' },
  { value: 'pruefung', label: 'Prüfungsablauf' },
  { value: 'sport', label: 'Sport' },
]

export function CustomExerciseModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('grundlage')
  const [description, setDescription] = useState('')

  function handleSave() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), category, description: description.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl shadow-xl p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800">Eigene Übung hinzufügen</h3>
          <button onClick={onClose} className="text-stone-400 text-xl leading-none px-1">×</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z. B. Apportieren, Dummy, Spin..."
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 bg-white"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">Kategorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">Beschreibung (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung der Übung"
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
            name.trim()
              ? 'bg-amber-600 text-white active:bg-amber-700'
              : 'bg-stone-100 text-stone-300 cursor-not-allowed'
          }`}
        >
          Übung hinzufügen
        </button>
      </div>
    </div>
  )
}
