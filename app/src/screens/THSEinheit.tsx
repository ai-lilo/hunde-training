import { useState } from 'react'
import type { ExerciseStatus, Level, THSObstacleStatus } from '../data/types'
import { THS_GEHORSAM, THS_HINDERNISSE, THS_DISZIPLIN_EXERCISE_ID, KLASSE_LABEL, computeTHSKlasse, type THSKlasse } from '../data/ths-data'
import { LEVEL_LABEL } from '../data/labels'
import { LevelBadge } from '../components/LevelBadge'
import { nextLevel } from '../data/progression'
import { useAddTHSSession } from '../hooks/useSessions'
import { useAddTHSTime, parseTimeInput } from '../hooks/useTHSTimes'
import { useSetExerciseLevel } from '../hooks/useExerciseProgress'
import { useSetTHSObstacleLevel } from '../hooks/useTHSObstacleProgress'

interface Props {
  statuses: ExerciseStatus[]
  obstacleStatuses: THSObstacleStatus[]
  dogId: string
  userId: string
  thsSportId: string
  onSave: () => void
  onCancel: () => void
}

type DisziplinKey = 'gehorsam' | 'huerdenlauf' | 'slalom' | 'hindernislauf'
type Rating = 'bad' | 'ok' | 'good'

export function THSEinheit({ statuses, obstacleStatuses, dogId, userId, thsSportId, onSave, onCancel }: Props) {
  const exerciseMap = Object.fromEntries(statuses.map(s => [s.exerciseId, s.level]))
  const obstacleMap = Object.fromEntries(obstacleStatuses.map(s => [s.obstacleId, s.level]))
  const klasse: THSKlasse = computeTHSKlasse(exerciseMap, obstacleMap)

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedDisziplinen, setSelectedDisziplinen] = useState<Set<DisziplinKey>>(new Set())
  const [note, setNote] = useState('')

  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const [levelChoices, setLevelChoices] = useState<Record<string, Level>>({})
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})

  const [huerdeLaufZeit, setHuerdeLaufZeit] = useState('')
  const [slalomZeit, setSlalomZeit] = useState('')
  const [hindernisZeit, setHindernisZeit] = useState('')
  const [zeitLevelChoices, setZeitLevelChoices] = useState<Record<string, Level>>({})

  const addSession = useAddTHSSession(dogId, userId)
  const addTime = useAddTHSTime(dogId, userId)
  const setExerciseLevel = useSetExerciseLevel(dogId, userId)
  const setObstacleLevel = useSetTHSObstacleLevel(dogId, userId)

  const gehorsamUebungen = THS_GEHORSAM.filter(u => u.classes.includes(klasse))

  function toggleDisziplin(d: DisziplinKey) {
    setSelectedDisziplinen(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  function toggleItem(id: string, current: Level) {
    if (ratings[id] !== undefined) {
      setRatings(p => { const n = { ...p }; delete n[id]; return n })
      setLevelChoices(p => { const n = { ...p }; delete n[id]; return n })
      setItemNotes(p => { const n = { ...p }; delete n[id]; return n })
    } else {
      setRatings(p => ({ ...p, [id]: 'ok' }))
      setLevelChoices(p => ({ ...p, [id]: current }))
    }
  }

  async function handleSave() {
    const sessionDate = new Date(date).toISOString()

    const gehorsamEntries = selectedDisziplinen.has('gehorsam')
      ? gehorsamUebungen
          .filter(u => ratings[u.id] !== undefined)
          .map(u => ({
            exerciseId: u.id,
            levelAfter: levelChoices[u.id] ?? ((exerciseMap[u.id] ?? 'nicht_begonnen') as Level),
          }))
      : []

    const obstacleIds = selectedDisziplinen.has('hindernislauf')
      ? THS_HINDERNISSE.filter(h => ratings[h.id] !== undefined).map(h => h.id)
      : []
    const obstacleFeedback: Record<string, 'gut' | 'weiter'> = {}
    for (const id of obstacleIds) {
      obstacleFeedback[id] = ratings[id] === 'good' ? 'gut' : 'weiter'
    }

    await addSession.mutateAsync({
      gehorsamEntries,
      obstacleIds,
      obstacleFeedback,
      generalNote: note,
      date: sessionDate,
      sportId: thsSportId,
    })

    // Hindernislauf: level changes (useAddTHSSession only saves last_practiced_at, not level)
    for (const h of THS_HINDERNISSE) {
      const chosen = levelChoices[h.id]
      const current = (obstacleMap[h.id] ?? 'nicht_begonnen') as Level
      if (chosen && chosen !== current) {
        await setObstacleLevel.mutateAsync({ obstacleId: h.id, level: chosen })
      }
    }

    // Zeitdisziplin level changes
    for (const d of ['huerdenlauf', 'slalom', 'hindernislauf'] as const) {
      if (selectedDisziplinen.has(d)) {
        const exId = THS_DISZIPLIN_EXERCISE_ID[d]
        const chosen = zeitLevelChoices[d]
        const current = (exerciseMap[exId] ?? 'nicht_begonnen') as Level
        if (chosen && chosen !== current) {
          await setExerciseLevel.mutateAsync({ exerciseId: exId, level: chosen })
        }
      }
    }

    const zeitPromises: Promise<unknown>[] = []
    if (selectedDisziplinen.has('huerdenlauf') && huerdeLaufZeit.trim()) {
      const secs = parseTimeInput(huerdeLaufZeit)
      if (secs !== null) zeitPromises.push(addTime.mutateAsync({ discipline: 'huerdenlauf', klasse, timeSeconds: secs }))
    }
    if (selectedDisziplinen.has('slalom') && slalomZeit.trim()) {
      const secs = parseTimeInput(slalomZeit)
      if (secs !== null) zeitPromises.push(addTime.mutateAsync({ discipline: 'slalom', klasse, timeSeconds: secs }))
    }
    if (selectedDisziplinen.has('hindernislauf') && hindernisZeit.trim()) {
      const secs = parseTimeInput(hindernisZeit)
      if (secs !== null) zeitPromises.push(addTime.mutateAsync({ discipline: 'hindernislauf', klasse, timeSeconds: secs }))
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
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Heute üben</p>
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
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Gehorsam — Übungen antippen</p>
              <div className="flex flex-col gap-2.5">
                {gehorsamUebungen.map(u => {
                  const current = (exerciseMap[u.id] ?? 'nicht_begonnen') as Level
                  const next = nextLevel(current)
                  const rating = ratings[u.id]
                  const levelChoice = levelChoices[u.id] ?? current

                  return (
                    <div key={u.id} className={`rounded-2xl border transition-all ${rating !== undefined ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-stone-100 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => toggleItem(u.id, current)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs transition-colors ${rating !== undefined ? 'bg-teal-500 border-teal-500 text-white' : 'border-stone-300'}`}>
                            {rating !== undefined ? '✓' : ''}
                          </span>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-stone-800 block truncate">{u.name}</span>
                            {u.beschreibung && <span className="text-xs text-stone-400 truncate block">{u.beschreibung}</span>}
                          </div>
                        </div>
                        <LevelBadge level={current} />
                      </button>

                      {rating !== undefined && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-teal-100 pt-3">
                          <ExerciseDraftForm
                            rating={rating}
                            current={current}
                            next={next}
                            levelChoice={levelChoice}
                            note={itemNotes[u.id] ?? ''}
                            onRating={r => setRatings(p => ({ ...p, [u.id]: r }))}
                            onLevel={l => setLevelChoices(p => ({ ...p, [u.id]: l }))}
                            onNote={n => setItemNotes(p => ({ ...p, [u.id]: n }))}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Hürdenlauf ── */}
          {selectedDisziplinen.has('huerdenlauf') && (
            <ZeitDisziplinSection
              label="Hürdenlauf"
              zeitValue={huerdeLaufZeit}
              onZeitChange={setHuerdeLaufZeit}
              currentLevel={(exerciseMap[THS_DISZIPLIN_EXERCISE_ID['huerdenlauf']] ?? 'nicht_begonnen') as Level}
              levelChoice={zeitLevelChoices['huerdenlauf']}
              onLevelChoice={l => setZeitLevelChoices(p => ({ ...p, huerdenlauf: l }))}
            />
          )}

          {/* ── Slalomlauf ── */}
          {selectedDisziplinen.has('slalom') && (
            <ZeitDisziplinSection
              label="Slalomlauf"
              zeitValue={slalomZeit}
              onZeitChange={setSlalomZeit}
              currentLevel={(exerciseMap[THS_DISZIPLIN_EXERCISE_ID['slalom']] ?? 'nicht_begonnen') as Level}
              levelChoice={zeitLevelChoices['slalom']}
              onLevelChoice={l => setZeitLevelChoices(p => ({ ...p, slalom: l }))}
            />
          )}

          {/* ── Hindernislauf ── */}
          {selectedDisziplinen.has('hindernislauf') && (
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Hindernislauf — Hindernisse antippen</p>
              <div className="flex flex-col gap-2.5">
                {THS_HINDERNISSE.map(h => {
                  const current = (obstacleMap[h.id] ?? 'nicht_begonnen') as Level
                  const next = nextLevel(current)
                  const rating = ratings[h.id]
                  const levelChoice = levelChoices[h.id] ?? current

                  return (
                    <div key={h.id} className={`rounded-2xl border transition-all ${rating !== undefined ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-stone-100 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => toggleItem(h.id, current)}
                        className="w-full flex items-center px-4 py-3 text-left gap-3"
                      >
                        <span className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs transition-colors ${rating !== undefined ? 'bg-teal-500 border-teal-500 text-white' : 'border-stone-300'}`}>
                          {rating !== undefined ? '✓' : ''}
                        </span>
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {h.position}
                        </span>
                        <span className="text-sm font-medium text-stone-700 flex-1">{h.name}</span>
                        <LevelBadge level={current} />
                      </button>

                      {rating !== undefined && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-teal-100 pt-3">
                          <ExerciseDraftForm
                            rating={rating}
                            current={current}
                            next={next}
                            levelChoice={levelChoice}
                            note={itemNotes[h.id] ?? ''}
                            onRating={r => setRatings(p => ({ ...p, [h.id]: r }))}
                            onLevel={l => setLevelChoices(p => ({ ...p, [h.id]: l }))}
                            onNote={n => setItemNotes(p => ({ ...p, [h.id]: n }))}
                          />
                        </div>
                      )}
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

interface ExerciseDraftFormProps {
  rating: Rating
  current: Level
  next: Level | null
  levelChoice: Level
  note: string
  onRating: (r: Rating) => void
  onLevel: (l: Level) => void
  onNote: (n: string) => void
}

function ExerciseDraftForm({ rating, current, next, levelChoice, note, onRating, onLevel, onNote }: ExerciseDraftFormProps) {
  return (
    <>
      <div>
        <p className="text-xs text-stone-500 mb-1.5">Wie lief es?</p>
        <div className="flex gap-2">
          {(['bad', 'ok', 'good'] as Rating[]).map(r => (
            <button
              key={r}
              onClick={() => onRating(r)}
              className={`flex-1 py-2.5 rounded-xl text-xl transition-colors ${
                rating === r ? 'bg-teal-100 ring-2 ring-teal-400' : 'bg-white border border-stone-200'
              }`}
            >
              {r === 'good' ? '😄' : r === 'ok' ? '🙂' : '😕'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-stone-500 mb-1.5">Level nach Einheit</p>
        <div className="flex gap-2">
          <button
            onClick={() => onLevel(current)}
            className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
              levelChoice === current
                ? 'bg-teal-500 text-white border-teal-500 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
            }`}
          >
            {LEVEL_LABEL[current]}
            <span className="block text-[10px] opacity-70">Aktuell beibehalten</span>
          </button>
          {next && (
            <button
              onClick={() => onLevel(next)}
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
        value={note}
        onChange={e => onNote(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
      />
    </>
  )
}

interface ZeitDisziplinSectionProps {
  label: string
  zeitValue: string
  onZeitChange: (v: string) => void
  currentLevel: Level
  levelChoice?: Level
  onLevelChoice: (l: Level) => void
}

function ZeitDisziplinSection({ label, zeitValue, onZeitChange, currentLevel, levelChoice, onLevelChoice }: ZeitDisziplinSectionProps) {
  const next = nextLevel(currentLevel)
  const chosen = levelChoice ?? currentLevel

  return (
    <div>
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3 flex flex-col gap-3">
        <div>
          <p className="text-xs text-stone-400 mb-1.5 font-medium">Zeit</p>
          <input
            type="text"
            inputMode="decimal"
            placeholder="z.B. 32.4 oder 1:12.5"
            value={zeitValue}
            onChange={e => onZeitChange(e.target.value)}
            className="w-full text-sm text-stone-700 focus:outline-none placeholder-stone-300"
          />
        </div>

        <div>
          <p className="text-xs text-stone-500 mb-1.5">Level nach Einheit</p>
          <div className="flex gap-2">
            <button
              onClick={() => onLevelChoice(currentLevel)}
              className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                chosen === currentLevel
                  ? 'bg-teal-500 text-white border-teal-500 font-semibold'
                  : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
              }`}
            >
              {LEVEL_LABEL[currentLevel]}
              <span className="block text-[10px] opacity-70">Aktuell beibehalten</span>
            </button>
            {next && (
              <button
                onClick={() => onLevelChoice(next)}
                className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                  chosen === next
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
      </div>
    </div>
  )
}
