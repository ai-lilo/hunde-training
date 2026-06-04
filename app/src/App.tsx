import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { buildAllExercises } from './data/exercises'
import { Dashboard } from './screens/Dashboard'
import { getDogEmoji } from './screens/DogSelector'
import { LogSession } from './screens/LogSession'
import { GrundlagenFortschritt } from './screens/GrundlagenFortschritt'
import { GrundlagenEinheit } from './screens/GrundlagenEinheit'
import { Einstellungen } from './screens/Einstellungen'

// Lazy-loaded: selten genutzte Screens — reduzieren Initial-Bundle
const Tagebuch = lazy(() => import('./screens/Tagebuch').then(m => ({ default: m.Tagebuch })))
const ROFortschritt = lazy(() => import('./screens/ROFortschritt').then(m => ({ default: m.ROFortschritt })))
const ROEinheit = lazy(() => import('./screens/ROEinheit').then(m => ({ default: m.ROEinheit })))
const THSFortschritt = lazy(() => import('./screens/THSFortschritt').then(m => ({ default: m.THSFortschritt })))
const THSEinheit = lazy(() => import('./screens/THSEinheit').then(m => ({ default: m.THSEinheit })))

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
import { getStatusMap } from './data/progression'
import { useExerciseProgress } from './hooks/useExerciseProgress'
import { useROSignProgress, useSetROSignLevel } from './hooks/useROSignProgress'
import { useSessions, useAddBHSession, useAddROSession, useDeleteSession } from './hooks/useSessions'
import { useBuiltinExercises } from './hooks/useBuiltinExercises'
import { useCustomExercises, useAddCustomExercise } from './hooks/useCustomExercises'
import { useExerciseOverrides } from './hooks/useExerciseOverrides'
import { useHiddenExercises } from './hooks/useHiddenExercises'
import { useUserSports, useAllSports } from './hooks/useUserSports'
import { useCommands } from './hooks/useCommands'
import { useTHSObstacleProgress } from './hooks/useTHSObstacleProgress'
import { useTHSTimes } from './hooks/useTHSTimes'
import type { Exercise, Level, LevelCriteria, Sport } from './data/types'

type BHScreen = 'dashboard' | 'tagebuch' | 'einheit'
type ROScreen = 'ro-fortschritt' | 'ro-einheit' | 'ro-tagebuch'
type GLScreen = 'gl-fortschritt' | 'gl-einheit' | 'gl-tagebuch'
type THSScreen = 'ths-fortschritt' | 'ths-einheit' | 'ths-tagebuch'

export interface RecentSave {
  exerciseId: string
  levelBefore: Level
  levelAfter: Level
  rating: 1 | 2 | 3
  note: string
}

const BH_NAV: { id: BHScreen; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Übersicht', icon: '📋' },
  { id: 'einheit',   label: 'Einheit',   icon: '▶️' },
  { id: 'tagebuch',  label: 'Tagebuch',  icon: '📔' },
]

const RO_NAV: { id: ROScreen; label: string; icon: string }[] = [
  { id: 'ro-fortschritt', label: 'Übersicht', icon: '📋' },
  { id: 'ro-einheit',     label: 'Einheit',   icon: '▶️' },
  { id: 'ro-tagebuch',    label: 'Tagebuch',  icon: '📔' },
]

const GL_NAV: { id: GLScreen; label: string; icon: string }[] = [
  { id: 'gl-fortschritt', label: 'Übersicht', icon: '📋' },
  { id: 'gl-einheit',     label: 'Einheit',   icon: '▶️' },
  { id: 'gl-tagebuch',    label: 'Tagebuch',  icon: '📔' },
]

const THS_NAV: { id: THSScreen; label: string; icon: string }[] = [
  { id: 'ths-fortschritt', label: 'Übersicht', icon: '📋' },
  { id: 'ths-einheit',     label: 'Einheit',   icon: '▶️' },
  { id: 'ths-tagebuch',    label: 'Tagebuch',  icon: '📔' },
]

interface Props {
  dogId: string
  userId: string
  onSwitchDog: () => void
}

export default function MainApp({ dogId, userId, onSwitchDog }: Props) {
  const [bhScreen, setBhScreen] = useState<BHScreen>('dashboard')
  const [roScreen, setRoScreen] = useState<ROScreen>('ro-fortschritt')
  const [glScreen, setGlScreen] = useState<GLScreen>('gl-fortschritt')
  const [thsScreen, setThsScreen] = useState<THSScreen>('ths-fortschritt')
  const [recentSave, setRecentSave] = useState<RecentSave[] | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Daten aus Supabase
  const { data: builtinExercises = [], isLoading: builtinLoading } = useBuiltinExercises()
  const { data: exerciseStatuses = [] } = useExerciseProgress(dogId)
  const { data: roSignStatuses = [] } = useROSignProgress(dogId)
  const { data: sessions = [] } = useSessions(dogId)
  const { data: customExercises = [] } = useCustomExercises(dogId, userId)
  const { data: exerciseOverrides = {} } = useExerciseOverrides(userId)
  const { data: hiddenExerciseIds = [] } = useHiddenExercises(userId)
  const { data: userSportSlugs = [] } = useUserSports(userId)
  const { data: allSports = [] } = useAllSports()
  const { data: commands = [] } = useCommands(userId)
  const { data: thsObstacleStatuses = [] } = useTHSObstacleProgress(dogId)
  const { data: thsTimes = [] } = useTHSTimes(dogId)

  const allExercises: Exercise[] = useMemo(() =>
    buildAllExercises(builtinExercises, customExercises, exerciseOverrides, hiddenExerciseIds),
    [builtinExercises, customExercises, exerciseOverrides, hiddenExerciseIds]
  )

  // Mutationen
  const setROSignLevel = useSetROSignLevel(dogId, userId)
  const addBHSession = useAddBHSession(dogId, userId)
  const addROSession = useAddROSession(dogId, userId)
  const deleteSession = useDeleteSession(dogId)
  const addCustomExercise = useAddCustomExercise(dogId, userId)

  // Sport-IDs aus der Sports-Tabelle auflösen
  const bhSportId = allSports.find(s => s.slug === 'bh')?.id ?? ''
  const roSportId = allSports.find(s => s.slug === 'ro')?.id ?? ''
  const glSportId = allSports.find(s => s.slug === 'grundlagen')?.id ?? ''
  const thsSportId = allSports.find(s => s.slug === 'ths')?.id ?? ''

  // Aktive Sportarten aus User-Selektion (BH und RO als Fallback)
  const activeSports = userSportSlugs.length > 0 ? userSportSlugs : ['bh', 'ro']
  const hasBH = activeSports.includes('bh')
  const hasRO = activeSports.includes('ro')
  const hasTHS = activeSports.includes('ths')

  const [sport, setSport] = useState<Sport>(hasBH ? 'bh' : 'ro')

  const sportTabs: { id: Sport; label: string }[] = [
    { id: 'grundlagen', label: 'Grundlagen' },
    ...(hasBH ? [{ id: 'bh' as Sport, label: 'BH' }] : []),
    ...(hasRO ? [{ id: 'ro' as Sport, label: 'RO' }] : []),
    ...(hasTHS ? [{ id: 'ths' as Sport, label: 'THS' }] : []),
  ]

  // Wenn die aktive Sportart nicht mehr im Tab-Set ist, auf erste verfügbare wechseln
  useEffect(() => {
    if (sportTabs.length > 0 && !sportTabs.find(t => t.id === sport)) {
      setSport(sportTabs[0].id)
    }
  }, [hasBH, hasRO, hasTHS, sport]) // eslint-disable-line react-hooks/exhaustive-deps

  if (builtinLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showSettings) {
    return <Einstellungen userId={userId} onClose={() => setShowSettings(false)} />
  }

  const handleAddCustomExercise = (fields: { name: string; category: Exercise['category']; description?: string; criteria?: LevelCriteria }) => {
    addCustomExercise.mutate(fields)
  }

  const currentNavId = sport === 'bh' ? bhScreen : sport === 'ro' ? roScreen : sport === 'ths' ? thsScreen : glScreen

  return (
    <div className="flex flex-col h-full">
      {/* Sport-Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 flex" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button
          onClick={onSwitchDog}
          className="px-3 py-3 text-stone-400 text-sm flex-shrink-0"
          title="Hund wechseln"
        >
          {getDogEmoji(dogId)}
        </button>
        <div className="flex flex-1 overflow-x-auto">
          {sportTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSport(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors whitespace-nowrap px-3 min-w-0 ${
                sport === tab.id
                  ? 'text-teal-700 border-b-2 border-teal-600'
                  : 'text-stone-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-3 py-3 text-stone-400 text-sm flex-shrink-0"
          title="Einstellungen"
        >
          ⚙️
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {sport === 'bh' && (
          <>
            {bhScreen === 'dashboard' && (
              <Dashboard
                statuses={exerciseStatuses}
                allExercises={allExercises}
                sessions={sessions.filter(s => s.sport === 'bh' || !s.sport)}
                recentSave={recentSave}
                onDismissRecentSave={() => setRecentSave(null)}
                onNavigate={s => setBhScreen(s as BHScreen)}
              />
            )}
            {bhScreen === 'einheit' && (
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
            )}
            {bhScreen === 'tagebuch' && (
              <Suspense fallback={<ScreenLoader />}>
                <Tagebuch
                  sessions={sessions.filter(s => s.sport === 'bh' || !s.sport)}
                  allExercises={allExercises}
                  onDeleteSession={id => deleteSession.mutate(id)}
                />
              </Suspense>
            )}
          </>
        )}

        {sport === 'grundlagen' && (
          <Suspense fallback={<ScreenLoader />}>
            {glScreen === 'gl-fortschritt' && (
              <GrundlagenFortschritt
                statuses={exerciseStatuses}
                allExercises={allExercises}
                overrides={exerciseOverrides}
                dogId={dogId}
                userId={userId}
                allCommands={commands}
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
            {glScreen === 'gl-tagebuch' && (
              <Tagebuch
                sessions={sessions.filter(s => s.sport === 'grundlagen')}
                allExercises={allExercises}
                onDeleteSession={id => deleteSession.mutate(id)}
              />
            )}
          </Suspense>
        )}

        {sport === 'ths' && (
          <Suspense fallback={<ScreenLoader />}>
            {thsScreen === 'ths-fortschritt' && (
              <THSFortschritt
                statuses={exerciseStatuses}
                obstacleStatuses={thsObstacleStatuses}
                times={thsTimes}
                dogId={dogId}
                userId={userId}
                onNavigateToEinheit={() => setThsScreen('ths-einheit')}
              />
            )}
            {thsScreen === 'ths-einheit' && (
              <THSEinheit
                statuses={exerciseStatuses}
                obstacleStatuses={thsObstacleStatuses}
                dogId={dogId}
                userId={userId}
                thsSportId={thsSportId}
                onSave={() => setThsScreen('ths-fortschritt')}
                onCancel={() => setThsScreen('ths-fortschritt')}
              />
            )}
            {thsScreen === 'ths-tagebuch' && (
              <Tagebuch
                sessions={sessions.filter(s => s.sport === 'ths')}
                allExercises={allExercises}
                onDeleteSession={id => deleteSession.mutate(id)}
              />
            )}
          </Suspense>
        )}

        {sport === 'ro' && (
          <>
            <Suspense fallback={<ScreenLoader />}>
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
                  onSave={(signIds, note, feedback, levelChanges, date) => {
                    addROSession.mutate({ signIds, generalNote: note, feedback, date, sportId: roSportId })
                    Object.entries(levelChanges).forEach(([signId, level]) => {
                      const current = roSignStatuses.find(s => s.signId === signId)?.level ?? 'nicht_begonnen'
                      if (level !== current) setROSignLevel.mutate({ signId, level })
                    })
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
            </Suspense>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="flex-shrink-0 bg-white border-t border-stone-100 flex items-center safe-area-inset-bottom">
        {sport === 'ths'
          ? THS_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setThsScreen(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors active:scale-95 ${
                  thsScreen === item.id ? 'text-teal-700 border-t-2 border-teal-600' : 'text-stone-400'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))
          : sport === 'grundlagen'
          ? GL_NAV.map(item => (
              <button
                key={item.id}
                onClick={() => setGlScreen(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors active:scale-95 ${
                  glScreen === item.id ? 'text-teal-700 border-t-2 border-teal-600' : 'text-stone-400'
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
                  className={`flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors active:scale-95 ${
                    currentNavId === item.id ? 'text-teal-700 border-t-2 border-teal-600' : 'text-stone-400'
                  }`}
                >
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))
            : sport === 'ro'
              ? RO_NAV.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setRoScreen(item.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3.5 transition-colors active:scale-95 ${
                      currentNavId === item.id ? 'text-teal-700 border-t-2 border-teal-600' : 'text-stone-400'
                    }`}
                  >
                    <span className="text-xl leading-none">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ))
              : null
        }
      </nav>
    </div>
  )
}
