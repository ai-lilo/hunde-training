import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { ROSignStatus, TrainingSession } from '../data/types'
import { RO_SIGNS } from '../data/ro-signs'
import {
  filterSessionsByRange,
  roFrequency,
  roFeedbackRatio,
  roSuccessRate,
  type TimeRange,
} from '../utils/stats'

interface Props {
  sessions: TrainingSession[]
  roSignStatuses: ROSignStatus[]
}

type Tab = 'haeufigkeit' | 'feedback'

const RANGE_LABELS: { value: TimeRange; label: string }[] = [
  { value: '30d', label: '30 Tage' },
  { value: '90d', label: '90 Tage' },
  { value: 'all', label: 'Alles' },
]

const signMap = Object.fromEntries(RO_SIGNS.map(s => [s.id, s]))

function shortSignName(id: string): string {
  const sign = signMap[id]
  if (!sign) return id
  const name = sign.name.length > 16 ? sign.name.slice(0, 14) + '…' : sign.name
  return `${sign.number} ${name}`
}

export function ROAuswertung({ sessions }: Props) {
  const [range, setRange] = useState<TimeRange>('all')
  const [activeTab, setActiveTab] = useState<Tab>('haeufigkeit')

  const filtered = useMemo(() => filterSessionsByRange(sessions, range), [sessions, range])

  const frequency = useMemo(() => roFrequency(filtered).slice(0, 10), [filtered])
  const feedbackRatio = useMemo(() => roFeedbackRatio(filtered).slice(0, 10), [filtered])
  const successRate = useMemo(() => roSuccessRate(filtered), [filtered])

  const freqData = frequency.map(f => ({ name: shortSignName(f.id), Einheiten: f.count }))
  const feedbackData = feedbackRatio.map(f => ({
    name: shortSignName(f.id),
    Gut: f.gut,
    'Weiter üben': f.weiter,
  }))

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
        {/* Erfolgsquote */}
        {successRate !== null && (
          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
            <div className="text-3xl font-bold text-blue-700">{successRate}%</div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Erfolgsquote</p>
              <p className="text-xs text-blue-600">Anteil „gut" im gewählten Zeitraum</p>
            </div>
          </div>
        )}

        {/* Zeitraum-Filter */}
        <div className="flex gap-1.5">
          {RANGE_LABELS.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                range === r.value
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-stone-50 text-stone-500 border-stone-200 active:bg-stone-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tab-Auswahl */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          {([
            { value: 'haeufigkeit', label: 'Häufigkeit' },
            { value: 'feedback', label: 'Gut vs. Weiter' },
          ] as { value: Tab; label: string }[]).map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t.value
                  ? 'bg-white text-blue-700 shadow-sm'
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
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9, fill: '#57534e' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                    formatter={(v) => { const n = Number(v); return [`${n} Einheit${n !== 1 ? 'en' : ''}`, 'Trainiert'] }}
                  />
                  <Bar dataKey="Einheiten" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}

        {/* Tab: Gut vs. Weiter üben */}
        {activeTab === 'feedback' && (
          <>
            {feedbackData.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-stone-400">Noch keine Feedback-Daten vorhanden.</p>
                <p className="text-xs text-stone-400 mt-1">Trage eine neue Einheit ein — dann werden Gut/Weiter gespeichert.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={feedbackData} layout="vertical" margin={{ left: 4, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#78716c' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9, fill: '#57534e' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e5e4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Gut" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Weiter üben" stackId="a" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </details>
  )
}
