import { useState, useMemo } from 'react'
import { useStore } from './store/store'
import { buildAllExercises } from './data/exercises'
import { Dashboard } from './screens/Dashboard'
import { LogSession } from './screens/LogSession'
import { Progress } from './screens/Progress'
import { Empfehlung } from './screens/Empfehlung'
import { Tagebuch } from './screens/Tagebuch'
import { ROFortschritt } from './screens/ROFortschritt'
import { ROEinheit } from './screens/ROEinheit'
import { getStatusMap } from './data/progression'
import type { Exercise, Level, Sport } from './data/types'

type BHScreen = 'dashboard' | 'fortschritt' | 'empfehlung' | 'einheit' | 'tagebuch'
type ROScreen = 'ro-fortschritt' | 'ro-einheit' | 'ro-tagebuch'

export interface RecentSave {
  exerciseId: string
  levelBefore: Level
  levelAfter: Level
  rating: 1 | 2 | 3
  note: string
}

const BH_NAV: { id: BHScreen; label: string; icon: string }[] = [
  { id: 'dashboard',   label: 'Übersicht',   icon: '🏠' },
  { id: 'empfehlung',  label: 'Was heute?',  icon: '💡' },
  { id: 'fortschritt', label: 'Fortschritt', icon: '📈' },
  { id: 'tagebuch',    label: 'Tagebuch',    icon: '📔' },
]

const RO_NAV: { id: ROScreen; label: string; icon: string }[] = [
  { id: 'ro-fortschritt', label: 'Schilder',  icon: '📋' },
  { id: 'ro-einheit',     label: 'Einheit',   icon: '▶️' },
  { id: 'ro-tagebuch',    label: 'Tagebuch',  icon: '📔' },
]

export default function App() {
  const [sport, setSport] = useState<Sport>('bh')
  const [bhScreen, setBhScreen] = useState<BHScreen>('dashboard')
  const [roScreen, setRoScreen] = useState<ROScreen>('ro-fortschritt')
  const [recentSave, setRecentSave] = useState<RecentSave[] | null>(null)

  const {
    state,
    addSession,
    addROSession,
    deleteSession,
    addCustomExercise,
    updateExercise,
    deleteExercise,
    setROSignLevel,
  } = useStore()

  const allExercises: Exercise[] = useMemo(() =>
    buildAllExercises(
      state.customExercises ?? [],
      state.exerciseOverrides ?? {},
      state.hiddenExerciseIds ?? []
    ),
    [state.customExercises, state.exerciseOverrides, state.hiddenExerciseIds]
  )

  // BH LogSession shown full-screen (no nav)
  if (sport === 'bh' && bhScreen === 'einheit') {
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
              levelBefore: prevMap[e.exerciseId] ?? 'nicht_begonnen',
              levelAfter: e.levelAfter,
              rating: e.rating,
              note: e.note,
            }))
            addSession(entries, note, date)
            setRecentSave(saveInfo)
            setBhScreen('dashboard')
          }}
          onCancel={() => setBhScreen('dashboard')}
        />
      </div>
    )
  }

  const currentNavId = sport === 'bh' ? bhScreen : roScreen

  return (
    <div className="flex flex-col h-full">
      {/* Sport tabs */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 flex">
        {(['bh', 'ro'] as Sport[]).map(s => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              sport === s
                ? 'text-amber-700 border-b-2 border-amber-600'
                : 'text-stone-400'
            }`}
          >
            {s === 'bh' ? 'Begleithundeprüfung' : 'Rally Obedience'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {sport === 'bh' && (
          <>
            {bhScreen === 'dashboard' && (
              <Dashboard
                statuses={state.exerciseStatuses}
                allExercises={allExercises}
                recentSave={recentSave}
                onDismissRecentSave={() => setRecentSave(null)}
                onNavigate={s => setBhScreen(s as BHScreen)}
              />
            )}
            {bhScreen === 'fortschritt' && (
              <Progress
                statuses={state.exerciseStatuses}
                allExercises={allExercises}
                sessions={state.sessions}
                onUpdateExercise={updateExercise}
                onDeleteExercise={deleteExercise}
              />
            )}
            {bhScreen === 'empfehlung' && (
              <Empfehlung
                statuses={state.exerciseStatuses}
                onLogSession={() => setBhScreen('einheit')}
              />
            )}
            {bhScreen === 'tagebuch' && (
              <Tagebuch
                sessions={state.sessions.filter(s => s.sport === 'bh' || !s.sport)}
                allExercises={allExercises}
                onDeleteSession={deleteSession}
              />
            )}
          </>
        )}

        {sport === 'ro' && (
          <>
            {roScreen === 'ro-fortschritt' && (
              <ROFortschritt
                roSignStatuses={state.roSignStatuses}
                sessions={state.sessions.filter(s => s.sport === 'ro')}
                onSetLevel={setROSignLevel}
                onNavigateToEinheit={() => setRoScreen('ro-einheit')}
              />
            )}
            {roScreen === 'ro-einheit' && (
              <ROEinheit
                roSignStatuses={state.roSignStatuses}
                onSave={(signIds, note, feedback, date) => {
                  addROSession(signIds, note, feedback, date)
                  setRoScreen('ro-tagebuch')
                }}
                onCancel={() => setRoScreen('ro-fortschritt')}
              />
            )}
            {roScreen === 'ro-tagebuch' && (
              <Tagebuch
                sessions={state.sessions.filter(s => s.sport === 'ro')}
                allExercises={allExercises}
                onDeleteSession={deleteSession}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 bg-white border-t border-stone-100 flex items-center">
        {sport === 'bh'
          ? BH_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setBhScreen(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors active:scale-95 ${
                  currentNavId === item.id ? 'text-amber-700' : 'text-stone-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
          : RO_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setRoScreen(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors active:scale-95 ${
                  currentNavId === item.id ? 'text-amber-700' : 'text-stone-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
        }
      </nav>
    </div>
  )
}
