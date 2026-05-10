export type Level = 'aufbau' | 'basis' | 'stabil' | 'pruefungsreif'
export type Category = 'grundlage' | 'unterordnung' | 'verkehr' | 'pruefung' | 'sport'

export interface LevelCriteria {
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
  entries: TrainingEntry[]
  generalNote: string
}

export interface AppState {
  exerciseStatuses: ExerciseStatus[]
  sessions: TrainingSession[]
  customExercises: Exercise[]
  exerciseOverrides: Record<string, ExerciseOverride>
  hiddenExerciseIds: string[]
}
