export type Level = 'nicht_begonnen' | 'aufbau' | 'basis' | 'stabil' | 'pruefungsreif'
export type Category =
  | 'grundlage' | 'unterordnung' | 'verkehr' | 'pruefung' | 'sport'
  | 'gl_mindset' | 'gl_physio' | 'gl_fuss' | 'gl_sitz' | 'gl_platz' | 'gl_steh'
export type Sport = 'bh' | 'ro' | 'grundlagen'
export type ROClass = 'beginner' | 'klasse1' | 'klasse2' | 'klasse3'

export interface LevelCriteria {
  nicht_begonnen: string
  aufbau: string
  basis: string
  stabil: string
  pruefungsreif: string
}

export interface Exercise {
  id: string
  name: string
  category: Category
  bh_required: boolean
  description: string
  criteria: LevelCriteria
  prerequisites: string[]
  parentId?: string
  isFoundational?: boolean
}

export interface ExerciseOverride {
  name?: string
  description?: string
  prerequisites?: string[]
}

export interface ExerciseStatus {
  exerciseId: string
  level: Level
  updatedAt: string
}

export interface TrainingEntry {
  exerciseId: string
  rating: 1 | 2 | 3
  note: string
  levelAfter: Level
}

export interface TrainingSession {
  id: string
  date: string
  sport?: Sport
  entries: TrainingEntry[]
  roEntries?: ROSessionEntry[]
  generalNote: string
}

export interface ROSign {
  id: string
  number: string
  name: string
  hauptbestandteil: string
  classes: ROClass[]
}

export interface ROSignStatus {
  signId: string
  level: Level
  updatedAt: string
  lastPracticedAt?: string
  leitnerBox?: number
}

export interface ROSessionEntry {
  signId: string
  note?: string
  feedback?: 'gut' | 'weiter'
}

export interface AppState {
  exerciseStatuses: ExerciseStatus[]
  sessions: TrainingSession[]
  customExercises: Exercise[]
  exerciseOverrides: Record<string, ExerciseOverride>
  hiddenExerciseIds: string[]
  roSignStatuses: ROSignStatus[]
}
