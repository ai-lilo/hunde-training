import { useState, useMemo } from 'react'
import { buildAllExercises } from './data/exercises'
import { Dashboard } from './screens/Dashboard'
import { LogSession } from './screens/LogSession'
import { Progress } from './screens/Progress'
import { Empfehlung } from './screens/Empfehlung'
import { Tagebuch } from './screens/Tagebuch'
import { ROFortschritt } from './screens/ROFortschritt'
import { ROEinheit } from './screens/ROEinheit'
import { GrundlagenFortschritt } from './screens/GrundlagenFortschritt'
import { GrundlagenEinheit } from './screens/GrundlagenEinheit'
import { getStatusMap } from './data/progression'
import { useExerciseProgress } from './hooks/useExerciseProgress'
import { useROSignProgress, useSetROSignLevel } from './hooks/useROSignProgress'
import { useSessions, useAddBHSession, useAddROSession, useDeleteSession } from './hooks/useSessions'
import { useCustomExercises, useAddCustomExercise } from './hooks/useCustomExercises'
import { useExerciseOverrides, useUpdateExerciseOverride } from './hooks/useExerciseOverrides'
import { useHiddenExercises, useHideExercise } from './hooks/useHiddenExercises'
import { useUserSports } from './hooks/useUserSports'
import { useAllSports } from './hooks/useUserSports'
import type { Dog } from './hooks/useDogs'
import type { Exercise, Level, ExerciseOverride, LevelCriteria } from './data/types'

type BHScreen = 'dashboard' | 'fortschritt' | 'empfehlung' | 'einheit' | 'tagebuch'
type ROScreen = 'ro-fortschritt' | 'ro-einheit' | 'ro-tagebuch'
type GLScreen = 'gl-fortschritt' | 'gl-einheit'

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

const GL_NAV: { id: GLScreen; label: string; icon: string }[] = [
  { id: 'gl-fortschritt', label: 'Fortschritt',    icon: '📈' },
  { id: 'gl-einheit',     label: 'Schnell-Einheit', icon: '⚡' },
]

interface Props {
  dogId: string
  dog: Dog
  userId: string
}

export default function MainApp({ dogId, dog, userId }: Props) {
  const [bhScreen, setBhScreen] = useState<BHScreen>('dashboard')
  const [roScreen, setRoScreen] = useState<ROScreen>('ro-fortschritt')
  const [glScreen, setGlScreen] = useState<GLScreen>('gl-fortschritt')
  const [recentSave, setRecentSave] = useState<RecentSave[] | null>(null)

  // Daten aus Supabase
  const { data: exerciseStatuses = [] } = useExerciseProgress(dogId)
  const { data: roSignStatuses = [] } = useROSignProgress(dogId)
  const { data: sessions = [] } = useSessions(dogId)
  const { data: customExercises = [] } = useCustomExercises(dogId, userId)
  const { data: exerciseOverrides = {} } = useExerciseOverrides(userId)
  const { data: hiddenExerciseIds = [] } = useHiddenExercises(userId)
  const { data: userSportSlugs = [] } = useUserSports(userId)
  const { data: allSports = [] } = useAllSports()

  // Mutationen
  const setROSignLevel = useSetROSignLevel(dogId, userId)
  const addBHSession = useAddBHSession(dogId, userId)
  const addROSession = useAddROSession(dogId, userId)
  const deleteSession = useDeleteSession(dogId)
  const addCustomExercise = useAddCustomExercise(dogId, userId)
  const updateExerciseOverride = useUpdateExerciseOverride(userId)
  const hideExercise = useHideExercise(userId)

  // Sport-IDs aus der Sports-Tabelle auflösen
  const bhSportId = allSports.find(s => s.slug === 'bh')?.id ?? ''
  const roSportId = allSports.find(s => s.slug === 'ro')?.id ?? ''
  const glSportId = allSports.find(s => s.slug === 'grundlagen')?.id ?? ''

  // Aktive Sportarten aus User-Selektion (BH und RO als Fallback)
  const activeSports = userSportSlugs.length > 0 ? userSportSlugs : ['bh', 'ro']
  const hasBH = activeSports.includes('bh')
  const hasRO = activeSports.includes('ro')

  // Aktiver Sport-Tab
  const [sport, setSport] = useState<'bh' | 'ro' | 'grundlagen'>(hasBH ? 'bh' : 'ro')

  const allExercises: Exercise[] = useMemo(() =>
    buildAllExercises(customExercises, exerciseOverrides, hiddenExerciseIds),
    [customExercises, exerciseOverrides, hiddenExerciseIds]
  )

  const handleUpdateExercise = (id: string, changes: ExerciseOverride) => {
    updateExerciseOverride.mutate({ exerciseId: id, changes })
  }

  const handleDeleteExercise = (id: string) => {
    hideExercise.mutate(id)
  }

  const handleAddCustomExercise = (fields: { name: string; category: Exercise['category']; description?: string; criteria?: LevelCriteria }) => {
    addCustomExercise.mutate(fields)
  }

  // BH LogSession full-screen
  if (sport === 'bh' && bhScreen === 'einheit') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <LogSession
          statuses={exerciseStatuses}
          allExercises={allExercises}
          onAddCustomExercise={handleAddCustomExercise}
          onSave={(entries, note, date) => {
            const prevMap = getStatusMap(exerciseStatuses, allExercises)
            const saveInfo: RecentSave[] = entries.map(e => ({
              exerciseId: e.exerciseId,
              levelBefore: prevMap[e.exerciseId] ?? 'nicht_begonnen',
              levelAfter: e.levelAfter,
              rating: e.rating,
              note: e.note,
            }))
            addBHSession.mutate({ entries, generalNote: note, date, sportId: bhSportId })
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
      {/* Sport-Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 flex">
        {/* Hund wechseln */}
        <button
          onClick={async () => {
            localStorage.removeItem('active_dog_id')
            window.location.reload()
          }}
          className="px-3 py-2.5 text-stone-400 text-sm"
          title="Hund wechseln"
        >
          🐕
        </button>
        <div className="flex flex-1 overflow-x-auto">
          <button
            onClick={() => setSport('grundlagen')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
              sport === 'grundlagen' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-stone-400'
            }`}
          >
            Grundlagen
          </button>
          {hasBH && (
            <button
              onClick={() => setSport('bh')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
                sport === 'bh' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-stone-400'
              }`}
            >
              BH
            </button>
          )}
          {hasRO && (
            <button
              onClick={() => setSport('ro')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap px-3 ${
                sport === 'ro' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-stone-400'
              }`}
            >
              Rally Obedience
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {sport === 'bh' && (
          <>
            {bhScreen === 'dashboard' && (
              <Dashboard
                dog={dog}
                statuses={exerciseStatuses}
                allExercises={allExercises}
                recentSave={recentSave}
                onDismissRecentSave={() => setRecentSave(null)}
                onNavigate={s => setBhScreen(s as BHScreen)}
              />
            )}
            {bhScreen === 'fortschritt' && (
              <Progress
                statuses={exerciseStatuses}
                allExercises={allExercises}
                sessions={sessions.filter(s => s.sport === 'bh' || !s.sport)}
                onUpdateExercise={handleUpdateExercise}
                onDeleteExercise={handleDeleteExercise}
              />
            )}
            {bhScreen === 'empfehlung' && (
              <Empfehlung
                statuses={exerciseStatuses}
                onLogSession={() => setBhScreen('einheit')}
              />
            )}
            {bhScreen === 'tagebuch' && (
              <Tagebuch
                sessions={sessions.filter(s => s.sport === 'bh' || !s.sport)}
                allExercises={allExercises}
                onDeleteSession={id => deleteSession.mutate(id)}
              />
            )}
          </>
        )}

        {sport === 'grundlagen' && (
          <>
            {glScreen === 'gl-fortschritt' && (
              <GrundlagenFortschritt
                statuses={exerciseStatuses}
                allExercises={allExercises}
                dogId={dogId}
                userId={userId}
                onAddExercise={handleAddCustomExercise}
              />
            )}
            {glScreen === 'gl-einheit' && (
              <GrundlagenEinheit
                statuses={exerciseStatuses}
                allExercises={allExercises}
                onSave={(entries, date) => {
                  addBHSession.mutate({ entries, generalNote: '', date, sportId: glSportId })
                  setGlScreen('gl-fortschritt')
                }}
                onCancel={() => setGlScreen('gl-fortschritt')}
              />
            )}
          </>
        )}

        {sport === 'ro' && (
          <>
            {roScreen === 'ro-fortschritt' && (
              <ROFortschritt
                roSignStatuses={roSignStatuses}
                sessions={sessions.filter(s => s.sport === 'ro')}
                onSetLevel={(signId, level) => setROSignLevel.mutate({ signId, level })}
                onNavigateToEinheit={() => setRoScreen('ro-einheit')}
              />
            )}
            {roScreen === 'ro-einheit' && (
              <ROEinheit
                roSignStatuses={roSignStatuses}
                onSave={(signIds, note, feedback, date) => {
                  addROSession.mutate({ signIds, generalNote: note, feedback, date, sportId: roSportId })
                  setRoScreen('ro-tagebuch')
                }}
                onCancel={() => setRoScreen('ro-fortschritt')}
              />
            )}
            {roScreen === 'ro-tagebuch' && (
              <Tagebuch
                sessions={sessions.filter(s => s.sport === 'ro')}
                allExercises={allExercises}
                onDeleteSession={id => deleteSession.mutate(id)}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="flex-shrink-0 bg-white border-t border-stone-100 flex items-center">
        {sport === 'grundlagen'
          ? GL_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setGlScreen(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors active:scale-95 ${
                  glScreen === item.id ? 'text-amber-700' : 'text-stone-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
          : sport === 'bh'
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
