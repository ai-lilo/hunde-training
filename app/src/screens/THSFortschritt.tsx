import { useState, useMemo } from 'react'
import type { ExerciseStatus, THSObstacleStatus, THSTimeRecord, Level } from '../data/types'
import {
  THS_GEHORSAM, THS_HINDERNISSE, THS_DISZIPLIN_INFO, THS_DISZIPLIN_EXERCISE_ID,
  KLASSE_LABEL, DISZIPLIN_LABEL, computeTHSKlasse,
  type THSKlasse, type THSDisziplin,
} from '../data/ths-data'
import { LevelBadge } from '../components/LevelBadge'
import { useAddTHSTime, useDeleteTHSTime, formatTime, parseTimeInput } from '../hooks/useTHSTimes'

const DISZIPLINEN: THSDisziplin[] = ['gehorsam', 'huerdenlauf', 'slalom', 'hindernislauf']

interface Props {
  statuses: ExerciseStatus[]
  obstacleStatuses: THSObstacleStatus[]
  times: THSTimeRecord[]
  dogId: string
  userId: string
  onNavigateToEinheit: () => void
}

export function THSFortschritt({ statuses, obstacleStatuses, times, dogId, userId, onNavigateToEinheit }: Props) {
  const [tab, setTab] = useState<THSDisziplin>('gehorsam')
  const [showTimeFormFor, setShowTimeFormFor] = useState<THSDisziplin | null>(null)
  const [timeInput, setTimeInput] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [timeError, setTimeError] = useState(false)

  const addTime = useAddTHSTime(dogId, userId)
  const deleteTime = useDeleteTHSTime(dogId)

  const exerciseMap = useMemo(() =>
    Object.fromEntries(statuses.map(s => [s.exerciseId, s.level])),
    [statuses]
  )
  const obstacleMap = useMemo(() =>
    Object.fromEntries(obstacleStatuses.map(s => [s.obstacleId, s.level])),
    [obstacleStatuses]
  )

  const klasse: THSKlasse = useMemo(
    () => computeTHSKlasse(exerciseMap, obstacleMap),
    [exerciseMap, obstacleMap]
  )

  function handleTimeSubmit(discipline: THSDisziplin) {
    const secs = parseTimeInput(timeInput)
    if (secs === null) { setTimeError(true); return }
    addTime.mutate({
      discipline: discipline as THSTimeRecord['discipline'],
      klasse,
      timeSeconds: secs,
      note: timeNote.trim() || undefined,
    })
    setShowTimeFormFor(null)
    setTimeInput('')
    setTimeNote('')
    setTimeError(false)
  }

  const gehorsamUebungen = THS_GEHORSAM.filter(u => u.classes.includes(klasse))

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-stone-800">Turnierhundesport</h1>
        <p className="text-sm text-stone-500 mt-0.5">Vierkampf · {KLASSE_LABEL[klasse]}</p>
      </div>

      {/* Klassen-Anzeige (automatisch berechnet) */}
      <div className="flex items-center gap-2 px-4 mb-4">
        {(['k1', 'k2', 'k3'] as THSKlasse[]).map((k, i) => {
          const isActive = k === klasse
          const isPassed = ['k1', 'k2', 'k3'].indexOf(k) < ['k1', 'k2', 'k3'].indexOf(klasse)
          return (
            <div key={k} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 py-2 text-sm font-semibold rounded-xl border text-center ${
                isActive  ? 'bg-teal-700 text-white border-teal-700' :
                isPassed  ? 'bg-teal-100 text-teal-600 border-teal-200' :
                            'bg-white text-stone-300 border-stone-200'
              }`}>
                {isPassed ? '✓ ' : ''}{KLASSE_LABEL[k]}
              </div>
              {i < 2 && <span className="text-stone-300 text-xs">→</span>}
            </div>
          )
        })}
      </div>

      {/* Disziplin-Tabs */}
      <div className="flex border-b border-stone-100 px-2 mb-4">
        {DISZIPLINEN.map(d => (
          <button
            key={d}
            onClick={() => setTab(d)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap px-1 ${
              tab === d ? 'text-teal-700 border-b-2 border-teal-600' : 'text-stone-400'
            }`}
          >
            {DISZIPLIN_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* ── GEHORSAM ── */}
        {tab === 'gehorsam' && (
          <>
            <p className="text-xs text-stone-400">
              {klasse === 'k1' && 'Verkürztes BH-Schema · max. 60 Punkte · mindestens 42 zum Bestehen'}
              {klasse === 'k2' && 'Alle Übungen ohne Leine · Schema wie BH · max. 60 Punkte'}
              {klasse === 'k3' && 'Alle Übungen ohne Leine · Platz und Steh aus Laufschritt · max. 60 Punkte'}
            </p>
            <div className="flex flex-col gap-3">
              {gehorsamUebungen.map(u => {
                const current = exerciseMap[u.id] ?? 'nicht_begonnen'
                return (
                  <div key={u.id} className="bg-white rounded-xl border border-stone-100 shadow-sm flex items-center justify-between px-4 py-3.5">
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{u.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5 truncate">{u.beschreibung}</p>
                    </div>
                    <LevelBadge level={current} />
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── HÜRDENLAUF / SLALOM ── */}
        {(tab === 'huerdenlauf' || tab === 'slalom') && (
          <TimeDisziplinView
            discipline={tab}
            klasse={klasse}
            level={(exerciseMap[THS_DISZIPLIN_EXERCISE_ID[tab]] ?? 'nicht_begonnen') as Level}
            times={times.filter(t => t.discipline === tab)}
            showForm={showTimeFormFor === tab}
            timeInput={timeInput}
            timeNote={timeNote}
            timeError={timeError}
            onOpenForm={() => { setShowTimeFormFor(tab); setTimeInput(''); setTimeNote(''); setTimeError(false) }}
            onCloseForm={() => setShowTimeFormFor(null)}
            onTimeInputChange={v => { setTimeInput(v); setTimeError(false) }}
            onTimeNoteChange={setTimeNote}
            onSubmit={() => handleTimeSubmit(tab)}
            onDelete={id => deleteTime.mutate(id)}
          />
        )}

        {/* ── HINDERNISLAUF ── */}
        {tab === 'hindernislauf' && (
          <>
            <p className="text-xs text-stone-400">{THS_DISZIPLIN_INFO.hindernislauf[klasse]} · Feste Reihenfolge</p>
            <div className="flex flex-col gap-2">
              {THS_HINDERNISSE.map(h => {
                const current = obstacleMap[h.id] ?? 'nicht_begonnen'
                return (
                  <div key={h.id} className="bg-white rounded-xl border border-stone-100 shadow-sm flex items-center px-4 py-3 gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {h.position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{h.name}</p>
                      {h.massangabe && <p className="text-xs text-stone-400">{h.massangabe}</p>}
                    </div>
                    <LevelBadge level={current} />
                  </div>
                )
              })}
            </div>

            {/* Gesamtzeiten */}
            <div className="mt-2 border-t border-stone-100 pt-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Gesamtzeiten</p>
              <TimeDisziplinView
                discipline="hindernislauf"
                klasse={klasse}
                level={(exerciseMap[THS_DISZIPLIN_EXERCISE_ID['hindernislauf']] ?? 'nicht_begonnen') as Level}
                times={times.filter(t => t.discipline === 'hindernislauf')}
                showForm={showTimeFormFor === 'hindernislauf'}
                timeInput={timeInput}
                timeNote={timeNote}
                timeError={timeError}
                onOpenForm={() => { setShowTimeFormFor('hindernislauf'); setTimeInput(''); setTimeNote(''); setTimeError(false) }}
                onCloseForm={() => setShowTimeFormFor(null)}
                onTimeInputChange={v => { setTimeInput(v); setTimeError(false) }}
                onTimeNoteChange={setTimeNote}
                onSubmit={() => handleTimeSubmit('hindernislauf')}
                onDelete={id => deleteTime.mutate(id)}
                compact
              />
            </div>
          </>
        )}

        {/* Einheit starten Button */}
        <button
          onClick={onNavigateToEinheit}
          className="w-full py-3.5 bg-teal-600 text-white text-sm font-semibold rounded-2xl shadow-sm active:scale-95 transition-transform mt-2"
        >
          + Neue Trainingseinheit
        </button>
      </div>
    </div>
  )
}

interface TimeDisziplinViewProps {
  discipline: THSDisziplin
  klasse: THSKlasse
  level: Level
  times: THSTimeRecord[]
  showForm: boolean
  timeInput: string
  timeNote: string
  timeError: boolean
  onOpenForm: () => void
  onCloseForm: () => void
  onTimeInputChange: (v: string) => void
  onTimeNoteChange: (v: string) => void
  onSubmit: () => void
  onDelete: (id: string) => void
  compact?: boolean
}

function TimeDisziplinView({
  discipline, klasse, level, times, showForm,
  timeInput, timeNote, timeError,
  onOpenForm, onCloseForm, onTimeInputChange, onTimeNoteChange, onSubmit, onDelete,
  compact,
}: TimeDisziplinViewProps) {
  const bestTime = times.length > 0 ? Math.min(...times.map(t => t.timeSeconds)) : null

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <p className="text-xs text-stone-400">
          {discipline !== 'hindernislauf' && THS_DISZIPLIN_INFO[discipline as 'huerdenlauf' | 'slalom'][klasse]}
        </p>
      )}

      {/* Trainingsstand (read-only) */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-stone-700">Trainingsstand</span>
        <LevelBadge level={level} />
      </div>

      {/* Bestzeit */}
      {bestTime !== null && (
        <div className="bg-teal-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-teal-100">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-xs text-teal-600 font-medium">Bestzeit</p>
            <p className="text-xl font-bold text-teal-800">{formatTime(bestTime)}</p>
          </div>
        </div>
      )}

      {/* Zeitliste */}
      {times.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
          {times.slice(0, 8).map((t, i) => (
            <div key={t.id} className={`flex items-center px-4 py-2.5 gap-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
              <span className={`text-sm font-bold ${t.timeSeconds === bestTime ? 'text-teal-600' : 'text-stone-700'}`}>
                {formatTime(t.timeSeconds)}
              </span>
              {t.timeSeconds === bestTime && <span className="text-xs text-teal-500">⚡</span>}
              <span className="text-xs text-stone-400 flex-1">
                {new Date(t.recordedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                {t.note && ` · ${t.note}`}
              </span>
              <button
                onClick={() => onDelete(t.id)}
                className="text-xs text-stone-300 active:text-red-400 px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zeit-Formular */}
      {showForm ? (
        <div className="bg-white rounded-xl border border-teal-200 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-stone-700">Zeit eintragen</p>
          <div>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              placeholder="z.B. 32.4 oder 1:12.5"
              value={timeInput}
              onChange={e => onTimeInputChange(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                timeError ? 'border-red-300 bg-red-50' : 'border-stone-200'
              }`}
            />
            {timeError && <p className="text-xs text-red-500 mt-1">Ungültiges Format — z.B. 32.4 oder 1:12</p>}
          </div>
          <input
            type="text"
            placeholder="Notiz (optional)"
            value={timeNote}
            onChange={e => onTimeNoteChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <div className="flex gap-2">
            <button
              onClick={onSubmit}
              className="flex-1 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
            >
              Speichern
            </button>
            <button
              onClick={onCloseForm}
              className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onOpenForm}
          className="w-full py-2.5 border border-teal-200 text-teal-700 text-sm font-semibold rounded-xl active:bg-teal-50 transition-colors"
        >
          + Zeit eintragen
        </button>
      )}
    </div>
  )
}

