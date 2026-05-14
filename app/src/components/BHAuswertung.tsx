import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import type { Exercise, TrainingSession } from '../data/types'
import {
  filterSessionsByRange,
  bhFrequency,
  bhRatingHistory,
  bhAverageRatings,
  type TimeRange,
} from '../utils/stats'

interface Props {
  sessions: TrainingSession[]
  allExercises: Exercise[]
}

type Tab = 'haeufigkeit' | 'verlauf' | 'schnitt'

const RANGE_LABELS: { value: TimeRange; label: string }[] = [
  { value: '30d', label: '30 Tage' },
  { value: '90d', label: '90 Tage' },
  { value: 'all', label: 'Alles' },
]

const TAB_LABELS: { value: Tab; label: string }[] = [
  { value: 'haeufigkeit', label: 'Häufigkeit' },
  { value: 'verlauf', label: 'Verlauf' },
  { value: 'schnitt', label: 'Ø Bewertung' },
]

const RATING_TICKS: { value: number; label: string }[] = [
  { value: 1, label: '😕' },
  { value: 2, label: '🙂' },
  { value: 3, label: '😄' },
]

export function BHAuswertung({ sessions, allExercises }: Props) {
  const [range, setRange] = useState<TimeRange>('all')
  const [activeTab, setActiveTab] = useState<Tab>('haeufigkeit')
  const [selectedExercise, setSelectedExercise] = useState<string>('')

  const exerciseMap = useMemo(
    () => Object.fromEntries(allExercises.map(e => [e.id, e])),
    [allExercises]
  )

  const filtered = useMemo(() => filterSessionsByRange(sessions, range), [sessions, range])

  const frequency = useMemo(() => bhFrequency(filtered).slice(0, 10), [filtered])
  const averages = useMemo(() => bhAverageRatings(filtered).slice(0, 10), [filtered])

  const trainedIds = useMemo(() => frequency.map(f => f.id), [frequency])
  const defaultExercise = trainedIds[0] ?? ''
  const currentExercise = selectedExercise && trainedIds.includes(selectedExercise)
    ? selectedExercise
    : defaultExercise

  const ratingHistory = useMemo(
    () => bhRatingHistory(filtered, currentExercise),
    [filtered, currentExercise]
  )

  function exerciseName(id: string): string {
    const ex = exerciseMap[id]
    if (!ex) return id
    if (ex.parentId) {
      const parent = exerciseMap[ex.parentId]
      return parent ? `${parent.name} – ${ex.name}` : ex.name
    }
    return ex.name
  }

  function shortName(id: string): string {
    const name = exerciseName(id)
    return name.length > 18 ? name.slice(0, 16) + '…' : name
  }

  const freqData = frequency.map(f => ({ name: shortName(f.id), Einheiten: f.count }))
  const avgData = averages.map(a => ({ name: shortName(a.id), Schnitt: +a.avg.toFixed(2) }))

  if (sessions.length === 0) return null

  return (
    <details className="bg-white rounded-xl border border-stone-100 group">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none active:bg-stone-50">
        <div>
          <span className="text-sm font-semibold text-stone-800">Trainingsauswertung</span>
          <span className="text-xs text-stone-400 ml-2">{sessions.length} Einheit{sessions.length !== 1 ? 'en' : ''}</span>
        </div>
        <span className="text-stone-400 text-xs group-open:rotate-180 transition-transform">▾</span>
      </summary>

      <div className="border-t border-stone-50 px-4 pt-3 pb-4 flex flex-col gap-3">
        {/* Zeitraum-Filter */}
        <div className="flex gap-1.5">
          {RANGE_LABELS.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                range === r.value
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-stone-50 text-stone-500 border-stone-200 active:bg-stone-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tab-Auswahl */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          {TAB_LABELS.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t.value
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-stone-500 active:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Häufigkeit */}
        {activeTab === 'haeufigkeit' && (
          <>
            {freqData.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">Keine Daten im gewählten Zeitraum.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={freqData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#57534e' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                    formatter={(v) => { const n = Number(v); return [`${n} Einheit${n !== 1 ? 'en' : ''}`, 'Trainiert'] }}
                  />
                  <Bar dataKey="Einheiten" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {/* Tab: Bewertungsverlauf */}
        {activeTab === 'verlauf' && (
          <>
            {trainedIds.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">Keine Daten im gewählten Zeitraum.</p>
            ) : (
              <>
                <select
                  value={currentExercise}
                  onChange={e => setSelectedExercise(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700"
                >
                  {trainedIds.map(id => (
                    <option key={id} value={id}>{exerciseName(id)}</option>
                  ))}
                </select>
                {ratingHistory.length < 2 ? (
                  <p className="text-xs text-stone-400 text-center py-4">Mindestens 2 Einheiten nötig für einen Verlauf.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={ratingHistory} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} />
                      <YAxis
                        domain={[1, 3]}
                        ticks={[1, 2, 3]}
                        tickFormatter={v => RATING_TICKS.find(r => r.value === v)?.label ?? String(v)}
                        tick={{ fontSize: 12 }}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                        formatter={(v) => { const n = Number(v); return [RATING_TICKS.find(r => r.value === n)?.label ?? n, 'Bewertung'] }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#d97706', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Durchschnittsbewertung */}
        {activeTab === 'schnitt' && (
          <>
            {avgData.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">Keine Daten im gewählten Zeitraum.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={avgData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                  <XAxis
                    type="number"
                    domain={[0, 3]}
                    ticks={[1, 2, 3]}
                    tickFormatter={v => RATING_TICKS.find(r => r.value === v)?.label ?? String(v)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#57534e' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                    formatter={(v) => { const n = Number(v); const emoji = n >= 2.5 ? '😄' : n >= 1.5 ? '🙂' : '😕'; return [`${emoji} ${n.toFixed(2)}`, 'Ø Bewertung'] }}
                  />
                  <Bar
                    dataKey="Schnitt"
                    radius={[0, 4, 4, 0]}
                    fill="#d97706"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </details>
  )
}
