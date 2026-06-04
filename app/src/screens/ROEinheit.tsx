import { useState, useMemo } from 'react'
import { useWakeLock } from '../hooks/useWakeLock'
import type { Level, ROSign, ROSignStatus } from '../data/types'
import { RO_SIGNS } from '../data/ro-signs'
import { LevelBadge } from '../components/LevelBadge'
import { LEVEL_LABEL } from '../data/labels'
import { nextLevel } from '../data/progression'

interface Props {
  roSignStatuses: ROSignStatus[]
  onSave: (signIds: string[], note: string, feedback: Record<string, 'gut' | 'weiter'>, levelChanges: Record<string, Level>, date?: string) => void
  onCancel: () => void
}

type Rating = 'bad' | 'ok' | 'good'

const ZUSATZ_IDS = ['z0a', 'z0b', 'z0c', 'z0d']

function hasVorsitzBestandteil(sign: ROSign): boolean {
  const h = sign.hauptbestandteil.toLowerCase()
  return h.includes('vorsitz') || h.includes('vorsteh') || h.includes('vorplatz')
}

function suggestSigns(roSignStatuses: ROSignStatus[]): string[] {
  const statusMap = Object.fromEntries(roSignStatuses.map(s => [s.signId, s]))
  const now = Date.now()

  const eligible = RO_SIGNS.filter(sign => {
    if (!sign.classes.includes('beginner')) return false
    if (ZUSATZ_IDS.includes(sign.id)) return false
    const status = statusMap[sign.id]
    if (!status) return false
    return status.level === 'stabil' || status.level === 'pruefungsreif'
  })

  eligible.sort((a, b) => {
    const sa = statusMap[a.id]
    const sb = statusMap[b.id]
    const boxA = sa?.leitnerBox ?? 1
    const boxB = sb?.leitnerBox ?? 1
    const daysA = sa?.lastPracticedAt
      ? (now - new Date(sa.lastPracticedAt).getTime()) / 86400000
      : Infinity
    const daysB = sb?.lastPracticedAt
      ? (now - new Date(sb.lastPracticedAt).getTime()) / 86400000
      : Infinity
    const urgencyA = daysA / Math.pow(2, boxA - 1)
    const urgencyB = daysB / Math.pow(2, boxB - 1)
    return urgencyB - urgencyA
  })

  const base = eligible.slice(0, 10)
  const result: string[] = []
  const usedZusatz = new Set<string>()

  for (const sign of base) {
    result.push(sign.id)
    if (hasVorsitzBestandteil(sign)) {
      const available = ZUSATZ_IDS.filter(z => !usedZusatz.has(z))
      if (available.length > 0) {
        const picked = available[Math.floor(Math.random() * available.length)]
        result.push(picked)
        usedZusatz.add(picked)
      }
    }
  }

  return result
}

export function ROEinheit({ roSignStatuses, onSave, onCancel }: Props) {
  useWakeLock(true)
  const statusMap = useMemo(
    () => Object.fromEntries(roSignStatuses.map(s => [s.signId, s])),
    [roSignStatuses]
  )
  const signMap = useMemo(
    () => Object.fromEntries(RO_SIGNS.map(s => [s.id, s])),
    []
  )

  const initialIds = useMemo(() => suggestSigns(roSignStatuses), [roSignStatuses])
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds)
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const [levelChoices, setLevelChoices] = useState<Record<string, Level>>({})
  const [signNotes, setSignNotes] = useState<Record<string, string>>({})

  const eligibleForSwap = useMemo(() => {
    return RO_SIGNS.filter(sign => {
      if (!sign.classes.includes('beginner')) return false
      if (ZUSATZ_IDS.includes(sign.id)) return false
      if (selectedIds.includes(sign.id)) return false
      const status = statusMap[sign.id]
      if (!status) return false
      return status.level === 'stabil' || status.level === 'pruefungsreif'
    })
  }, [selectedIds, statusMap])

  function swapSign(oldId: string, newId: string) {
    setSelectedIds(prev => prev.map(id => id === oldId ? newId : id))
    setSwapTargetId(null)
  }

  const eligibleCount = RO_SIGNS.filter(s => {
    if (!s.classes.includes('beginner')) return false
    if (ZUSATZ_IDS.includes(s.id)) return false
    const status = statusMap[s.id]
    return status && (status.level === 'stabil' || status.level === 'pruefungsreif')
  }).length

  const allRated = selectedIds.every(id => ratings[id] != null)

  function handleSave() {
    const feedback: Record<string, 'gut' | 'weiter'> = {}
    const levelChanges: Record<string, Level> = {}
    for (const id of selectedIds) {
      feedback[id] = ratings[id] === 'good' ? 'gut' : 'weiter'
      const chosen = levelChoices[id]
      if (chosen) levelChanges[id] = chosen
    }
    onSave(selectedIds, note, feedback, levelChanges)
  }

  if (eligibleCount === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-stone-800">Einheit vorschlagen</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-stone-100 text-center">
          <p className="text-stone-500 text-sm">Noch keine Schilder mit Status „Stabil" oder „Prüfungsreif".</p>
          <p className="text-stone-400 text-xs mt-1">Trage erst Statuswerte unter „Schilder" ein.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Einheit vorschlagen</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {selectedIds.length} Schilder · Beginner
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-stone-400 text-sm px-3 py-1.5 rounded-lg active:bg-stone-100"
        >
          Abbrechen
        </button>
      </div>

      {selectedIds.length < 10 && eligibleCount > 0 && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5 text-xs text-teal-700">
          Nur {eligibleCount} Schilder qualifiziert (Stabil/Prüfungsreif) — {selectedIds.length} vorgeschlagen.
        </div>
      )}

      {/* Heute üben */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Heute üben</p>
        {selectedIds.map(id => {
          const sign = signMap[id]
          const currentLevel: Level = statusMap[id]?.level ?? 'nicht_begonnen'
          const next = nextLevel(currentLevel)
          const isSwapping = swapTargetId === id
          if (!sign) return null

          const rating = ratings[id] ?? null
          const levelChoice = levelChoices[id] ?? currentLevel

          return (
            <div key={id} className={`rounded-xl border transition-all ${rating !== null ? 'border-teal-300 bg-teal-50 shadow-sm' : 'bg-white border-stone-100'}`}>
              <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400">{sign.number}</span>
                    <span className="text-sm font-semibold text-stone-800">{sign.name}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">{sign.hauptbestandteil}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <LevelBadge level={currentLevel} />
                  <button
                    onClick={() => setSwapTargetId(isSwapping ? null : id)}
                    className="text-xs text-stone-400 active:text-stone-600"
                  >
                    tauschen
                  </button>
                </div>
              </div>

              {/* Wie lief es? */}
              <div className="px-4 pb-3 flex gap-2">
                {(['bad', 'ok', 'good'] as Rating[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRatings(prev => ({ ...prev, [id]: r }))}
                    className={`flex-1 py-2 rounded-xl text-xl transition-colors ${
                      rating === r ? 'bg-teal-100 ring-2 ring-teal-400' : 'bg-white border border-stone-200'
                    }`}
                  >
                    {r === 'good' ? '😄' : r === 'ok' ? '🙂' : '😕'}
                  </button>
                ))}
              </div>

              {/* Level + Notiz nach Rating */}
              {rating !== null && (
                <div className="px-4 pb-3 flex flex-col gap-2.5 border-t border-teal-100 pt-2.5">
                  <div>
                    <p className="text-xs text-stone-500 mb-1.5">Level nach Einheit</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLevelChoices(p => ({ ...p, [id]: currentLevel }))}
                        className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                          levelChoice === currentLevel
                            ? 'bg-teal-500 text-white border-teal-500 font-semibold'
                            : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                        }`}
                      >
                        {LEVEL_LABEL[currentLevel]}
                        <span className="block text-[10px] opacity-70">Aktuell beibehalten</span>
                      </button>
                      {next && (
                        <button
                          onClick={() => setLevelChoices(p => ({ ...p, [id]: next }))}
                          className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                            levelChoice === next
                              ? 'bg-green-500 text-white border-green-500 font-semibold'
                              : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                          }`}
                        >
                          {LEVEL_LABEL[next]}
                          <span className="block text-[10px] opacity-70">Level up! 🎉</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Notiz (optional)"
                    value={signNotes[id] ?? ''}
                    onChange={e => setSignNotes(p => ({ ...p, [id]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                  />
                </div>
              )}

              {isSwapping && (
                <div className="mx-4 mb-3 border-t border-stone-100 pt-2">
                  <p className="text-xs text-stone-400 mb-2">Ersetzen durch:</p>
                  <div className="flex flex-col gap-1">
                    {eligibleForSwap.map(s => (
                      <button
                        key={s.id}
                        onClick={() => swapSign(id, s.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 active:bg-stone-100 text-left"
                      >
                        <span className="text-xs text-stone-700">
                          <span className="font-mono text-stone-400 mr-1.5">{s.number}</span>
                          {s.name}
                        </span>
                        <LevelBadge level={statusMap[s.id]?.level ?? 'nicht_begonnen'} />
                      </button>
                    ))}
                    {eligibleForSwap.length === 0 && (
                      <p className="text-xs text-stone-400 text-center py-2">Keine weiteren qualifizierten Schilder.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Einheits-Notiz */}
      <div className="bg-white rounded-xl border border-stone-100 px-4 py-3">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Notiz (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Wie lief die Einheit?"
          className="w-full mt-1.5 text-sm text-stone-800 placeholder:text-stone-300 resize-none outline-none"
        />
      </div>

      {!allRated && (
        <p className="text-xs text-center text-stone-400 -mb-2">
          Bitte für jedes Schild eine Bewertung auswählen.
        </p>
      )}
      <button
        disabled={!allRated}
        onClick={handleSave}
        className={`rounded-xl py-3.5 text-sm font-semibold transition-colors ${
          allRated
            ? 'bg-teal-600 text-white active:bg-teal-700'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        Einheit speichern
      </button>
    </div>
  )
}
