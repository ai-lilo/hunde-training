import type { Level } from '../data/types'

const CONFIG: Record<Level, { label: string; color: string; dot: string }> = {
  aufbau:       { label: 'Aufbau',        color: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  basis:        { label: 'Basis',         color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  stabil:       { label: 'Stabil',        color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  pruefungsreif:{ label: 'Prüfungsreif',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

export function LevelBadge({ level }: { level: Level }) {
  const c = CONFIG[level]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export function LevelDot({ level }: { level: Level }) {
  const c = CONFIG[level]
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot}`} title={c.label} />
}
