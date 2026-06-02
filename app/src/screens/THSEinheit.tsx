import { useState } from 'react'
import type { ExerciseStatus, Level } from '../data/types'
import { THS_GEHORSAM, THS_HINDERNISSE, KLASSE_LABEL, type THSKlasse } from '../data/ths-data'
import { LEVEL_LABEL, LEVEL_ORDER } from '../data/labels'
import { useAddTHSSession } from '../hooks/useSessions'
import { useAddTHSTime, parseTimeInput } from '../hooks/useTHSTimes'

function getKlasse(dogId: string): THSKlasse {
  return (localStorage.getItem(`ths_klasse_${dogId}`) as THSKlasse) ?? 'k1'
}

interface Props {
  statuses: ExerciseStatus[]
  dogId: string
  userId: string
  thsSportId: string
  onSave: () => void
  onCancel: () => void
}

type DisziplinKey = 'gehorsam' | 'huerdenlauf' | 'slalom' | 'hindernislauf'

export function THSEinheit({ statuses, dogId, userId, thsSportId, onSave, onCancel }: Props) {
  const klasse = getKlasse(dogId)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<Set<DisziplinKey>>(new Set())
  const [note, setNote] = useState('')

  // Gehorsam
  const [gehorsamLevels, setGehorsamLevels] = useState<Record<string, Level>>(() =>
    Object.fromEntries(statuses.map(s => [s.exerciseId, s.level]))
  )

  // Hindernislauf
  const [obstacleFeedback, setObstacleFeedback] = useState<Record<string, 'gut' | 'weiter'>>({})
  const [hindernisZeit, setHindernisZeit] = useState('')

  // Zeitdisziplinen
  const [huerdeLaufZeit, setHuerdeLaufZeit] = useState('')
  const [slalomZeit, setSlalomZeit] = useState('')

  const addSession = useAddTHSSession(dogId, userId)
  const addTime = useAddTHSTime(dogId, userId)

  const gehorsamUebungen = THS_GEHORSAM.filter(u => u.classes.includes(klasse))

  function toggleDisziplin(d: DisziplinKey) {
    setSelectedDisziplinen(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  async function handleSave() {
    const sessionDate = new Date(date).toISOString()

    // Gehorsam-Entries nur für ausgewählte Übungen die sich geändert haben
    const gehorsamEntries = selectedDisziplinen.has('gehorsam')
      ? gehorsamUebungen.map(u => ({
          exerciseId: u.id,
          levelAfter: gehorsamLevels[u.id] ?? 'nicht_begonnen' as Level,
        }))
      : []

    // Hindernisse mit Feedback
    const obstacleIds = selectedDisziplinen.has('hindernislauf')
      ? THS_HINDERNISSE.filter(h => obstacleFeedback[h.id]).map(h => h.id)
      : []

    await addSession.mutateAsync({
      gehorsamEntries,
      obstacleIds,
      obstacleFeedback,
      generalNote: note,
      date: sessionDate,
      sportId: thsSportId,
    })

    // Zeiten separat speichern
    const zeitPromises: Promise<unknown>[] = []

    if (selectedDisziplinen.has('huerdenlauf') && huerdeLaufZeit.trim()) {
      const secs = parseTimeInput(huerdeLaufZeit)
      if (secs !== null) {
        zeitPromises.push(addTime.mutateAsync({ discipline: 'huerdenlauf', klasse, timeSeconds: secs }))
      }
    }
    if (selectedDisziplinen.has('slalom') && slalomZeit.trim()) {
      const secs = parseTimeInput(slalomZeit)
      if (secs !== null) {
        zeitPromises.push(addTime.mutateAsync({ discipline: 'slalom', klasse, timeSeconds: secs }))
      }
    }
    if (selectedDisziplinen.has('hindernislauf') && hindernisZeit.trim()) {
      const secs = parseTimeInput(hindernisZeit)
      if (secs !== null) {
        zeitPromises.push(addTime.mutateAsync({ discipline: 'hindernislauf', klasse, timeSeconds: secs }))
      }
    }

    await Promise.all(zeitPromises)
    onSave()
  }

  const canSave = selectedDisziplinen.size > 0 && !addSession.isPending

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-xl font-bold text-stone-800">THS Einheit · {KLASSE_LABEL[klasse]}</h1>
            <button onClick={onCancel} className="text-stone-400 text-sm px-2 py-1 active:text-stone-600">
              Abbrechen
            </button>
          </div>

          {/* Datum */}
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3">
            <label className="text-xs font-medium text-stone-400 block mb-1.5">Datum</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm text-stone-700 bg-transparent focus:outline-none"
            />
          </div>

          {/* Disziplin-Auswahl */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Disziplinen heute</p>
            <div className="flex flex-col gap-2">
              {(['gehorsam', 'huerdenlauf', 'slalom', 'hindernislauf'] as DisziplinKey[]).map(d => (
                <button
                  key={d}
                  onClick={() => toggleDisziplin(d)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                    selectedDisziplinen.has(d)
                      ? 'bg-teal-50 border-teal-200 text-teal-700'
                      : 'bg-white border-stone-100 text-stone-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedDisziplinen.has(d) ? 'bg-teal-600 border-teal-600' : 'border-stone-300'
                  }`}>
                    {selectedDisziplinen.has(d) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm font-medium">
                    {{ gehorsam: 'Gehorsam', huerdenlauf: 'Hürdenlauf', slalom: 'Slalomlauf', hindernislauf: 'Hindernislauf' }[d]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Gehorsam ── */}
          {selectedDisziplinen.has('gehorsam') && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Gehorsam — Level</p>
              <div className="flex flex-col gap-2">
                {gehorsamUebungen.map(u => {
                  const current = gehorsamLevels[u.id] ?? 'nicht_begonnen'
                  return (
                    <div key={u.id} className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3">
                      <p className="text-sm font-semibold text-stone-800 mb-2">{u.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {LEVEL_ORDER.map(l => (
                          <button
                            key={l}
                            onClick={() => setGehorsamLevels(prev => ({ ...prev, [u.id]: l }))}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              current === l
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                            }`}
                          >
                            {LEVEL_LABEL[l]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Hürdenlauf ── */}
          {selectedDisziplinen.has('huerdenlauf') && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Hürdenlauf — Zeit</p>
              <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Zeit eingeben — z.B. 32.4 oder 1:12.5"
                  value={huerdeLaufZeit}
                  onChange={e => setHuerdeLaufZeit(e.target.value)}
                  className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-300"
                />
              </div>
            </div>
          )}

          {/* ── Slalomlauf ── */}
          {selectedDisziplinen.has('slalom') && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Slalomlauf — Zeit</p>
              <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Zeit eingeben — z.B. 32.4 oder 1:12.5"
                  value={slalomZeit}
                  onChange={e => setSlalomZeit(e.target.value)}
                  className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-300"
                />
              </div>
            </div>
          )}

          {/* ── Hindernislauf ── */}
          {selectedDisziplinen.has('hindernislauf') && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Hindernislauf</p>
              <div className="flex flex-col gap-2">
                {THS_HINDERNISSE.map(h => {
                  const fb = obstacleFeedback[h.id]
                  return (
                    <div key={h.id} className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {h.position}
                      </span>
                      <p className="text-sm font-medium text-stone-700 flex-1">{h.name}</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setObstacleFeedback(p => ({ ...p, [h.id]: 'gut' }))}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            fb === 'gut' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-stone-500 border-stone-200 active:bg-green-50'
                          }`}
                        >
                          Gut
                        </button>
                        <button
                          onClick={() => setObstacleFeedback(p => ({ ...p, [h.id]: 'weiter' }))}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            fb === 'weiter' ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-stone-500 border-stone-200 active:bg-orange-50'
                          }`}
                        >
                          Üben
                        </button>
                      </div>
                    </div>
                  )
                })}
                {/* Gesamtzeit */}
                <div className="bg-white rounded-xl border border-stone-100 shadow-sm px-4 py-3 mt-1">
                  <p className="text-xs text-stone-400 mb-1.5 font-medium">Gesamtzeit (optional)</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="z.B. 45.2"
                    value={hindernisZeit}
                    onChange={e => setHindernisZeit(e.target.value)}
                    className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Allgemeine Notiz */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Notiz</p>
            <textarea
              rows={3}
              placeholder="Beobachtungen, Besonderheiten…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-200 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex-shrink-0 bg-white border-t border-stone-100 px-4 py-3 safe-area-inset-bottom">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-3.5 bg-teal-600 text-white text-sm font-semibold rounded-2xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {addSession.isPending ? 'Speichert…' : 'Einheit speichern'}
        </button>
      </div>
    </div>
  )
}
