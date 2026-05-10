import { useState, useMemo } from 'react'
import { useStore } from './store/store'
import { buildAllExercises } from './data/exercises'
import { Dashboard } from './screens/Dashboard'
import { LogSession } from './screens/LogSession'
import { Progress } from './screens/Progress'
import { Empfehlung } from './screens/Empfehlung'
import { Tagebuch } from './screens/Tagebuch'
import { getStatusMap } from './data/progression'
import type { Exercise, Level } from './data/types'

type Screen = 'dashboard' | 'fortschritt' | 'empfehlung' | 'einheit' | 'tagebuch'

export interface RecentSave {
  exerciseId: string
  levelBefore: Level
  levelAfter: Level
  rating: 1 | 2 | 3
  note: string
}

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Übersicht',  icon: '🏠' },
  { id: 'empfehlung',  label: 'Was heute?', icon: '💡' },
  { id: 'fortschritt', label: 'Fortschritt',icon: '📈' },
  { id: 'tagebuch',    label: 'Tagebuch',   icon: '📔' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [recentSave, setRecentSave] = useState<RecentSave[] | null>(null)
  const { state, addSession, deleteSession, addCustomExercise, updateExercise, deleteExercise } = useStore()

  const allExercises: Exercise[] = useMemo(() =>
    buildAllExercises(
      state.customExercises ?? [],
      state.exerciseOverrides ?? {},
      state.hiddenExerciseIds ?? []
    ),
    [state.customExercises, state.exerciseOverrides, state.hiddenExerciseIds]
  )

  if (screen === 'einheit') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <LogSession
          statuses={state.exerciseStatuses}
          allExercises={allExercises}
          onAddCustomExercise={addCustomExercise}
          onSave={(entries, note, date) => {
            const prevMap = getStatusMap(state.exerciseStatuses, allExercises)
            const saveInfo: RecentSave[] = entries.map(e => ({
              exerciseId: e.exerciseId,
              levelBefore: prevMap[e.exerciseId] ?? 'aufbau',
              levelAfter: e.levelAfter,
              rating: e.rating,
              note: e.note,
            }))
            addSession(entries, note, date)
            setRecentSave(saveInfo)
            setScreen('dashboard')
          }}
          onCancel={() => setScreen('dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {screen === 'dashboard' && (
          <Dashboard
            statuses={state.exerciseStatuses}
            allExercises={allExercises}
            recentSave={recentSave}
            onDismissRecentSave={() => setRecentSave(null)}
            onNavigate={s => setScreen(s as Screen)}
          />
        )}
        {screen === 'fortschritt' && (
          <Progress
            statuses={state.exerciseStatuses}
            allExercises={allExercises}
            sessions={state.sessions}
            onUpdateExercise={updateExercise}
            onDeleteExercise={deleteExercise}
          />
        )}
        {screen === 'empfehlung' && (
          <Empfehlung
            statuses={state.exerciseStatuses}
            onLogSession={() => setScreen('einheit')}
          />
        )}
        {screen === 'tagebuch' && (
          <Tagebuch
            sessions={state.sessions}
            allExercises={allExercises}
            onDeleteSession={deleteSession}
          />
        )}
      </div>

      <nav className="flex-shrink-0 bg-white border-t border-stone-100 flex items-center">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors active:scale-95 ${
              screen === item.id ? 'text-amber-700' : 'text-stone-400'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
