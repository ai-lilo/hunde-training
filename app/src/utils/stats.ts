import type { TrainingSession } from '../data/types'

export type TimeRange = '30d' | '90d' | 'all'

export function filterSessionsByRange(sessions: TrainingSession[], range: TimeRange): TrainingSession[] {
  if (range === 'all') return sessions
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (range === '30d' ? 30 : 90))
  return sessions.filter(s => new Date(s.date) >= cutoff)
}

export interface FrequencyEntry {
  id: string
  count: number
}

export function bhFrequency(sessions: TrainingSession[]): FrequencyEntry[] {
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    for (const e of s.entries) {
      counts[e.exerciseId] = (counts[e.exerciseId] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
}

export interface RatingPoint {
  date: string
  rating: number
}

export function bhRatingHistory(sessions: TrainingSession[], exerciseId: string): RatingPoint[] {
  return sessions
    .filter(s => s.entries.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const entry = s.entries.find(e => e.exerciseId === exerciseId)!
      const d = new Date(s.date)
      const label = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      return { date: label, rating: entry.rating }
    })
}

export interface AvgRatingEntry {
  id: string
  avg: number
  count: number
}

export function bhAverageRatings(sessions: TrainingSession[]): AvgRatingEntry[] {
  const sums: Record<string, { total: number; count: number }> = {}
  for (const s of sessions) {
    for (const e of s.entries) {
      if (!sums[e.exerciseId]) sums[e.exerciseId] = { total: 0, count: 0 }
      sums[e.exerciseId].total += e.rating
      sums[e.exerciseId].count += 1
    }
  }
  return Object.entries(sums)
    .map(([id, { total, count }]) => ({ id, avg: total / count, count }))
    .sort((a, b) => b.avg - a.avg)
}

export type Trend = 'up' | 'down' | 'stable'

export function bhTrend(sessions: TrainingSession[], exerciseId: string): Trend {
  const history = sessions
    .filter(s => s.entries.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => s.entries.find(e => e.exerciseId === exerciseId)!.rating)

  if (history.length < 4) return 'stable'
  const recent = history.slice(-3)
  const older = history.slice(-6, -3)
  if (older.length === 0) return 'stable'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  if (recentAvg > olderAvg + 0.3) return 'up'
  if (recentAvg < olderAvg - 0.3) return 'down'
  return 'stable'
}

export function roFrequency(sessions: TrainingSession[]): FrequencyEntry[] {
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    for (const e of s.roEntries ?? []) {
      counts[e.signId] = (counts[e.signId] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
}

export interface FeedbackRatioEntry {
  id: string
  gut: number
  weiter: number
  total: number
}

export function roFeedbackRatio(sessions: TrainingSession[]): FeedbackRatioEntry[] {
  const data: Record<string, { gut: number; weiter: number }> = {}
  for (const s of sessions) {
    for (const e of s.roEntries ?? []) {
      if (!e.feedback) continue
      if (!data[e.signId]) data[e.signId] = { gut: 0, weiter: 0 }
      if (e.feedback === 'gut') data[e.signId].gut += 1
      else data[e.signId].weiter += 1
    }
  }
  return Object.entries(data)
    .map(([id, { gut, weiter }]) => ({ id, gut, weiter, total: gut + weiter }))
    .sort((a, b) => b.total - a.total)
}

export function roSuccessRate(sessions: TrainingSession[]): number | null {
  let gut = 0
  let total = 0
  for (const s of sessions) {
    for (const e of s.roEntries ?? []) {
      if (!e.feedback) continue
      total += 1
      if (e.feedback === 'gut') gut += 1
    }
  }
  if (total === 0) return null
  return Math.round((gut / total) * 100)
}
