import { useState } from 'react'
import type { Exercise, ExerciseOverride, ExerciseStatus, LevelCriteria, Command } from '../data/types'
import { CUSTOM_CRITERIA } from '../data/exercises'
import { getStatusMap, levelIndex, nextLevel } from '../data/progression'
import { LEVEL_LABEL, LEVEL_ORDER } from '../data/labels'
import { LevelBadge } from '../components/LevelBadge'
import { LevelTimeline } from '../components/LevelTimeline'
import { CommandChip } from '../components/CommandChip'
import { useUpdateExerciseOverride, useUploadExercisePhoto, useUploadExerciseVideo } from '../hooks/useExerciseOverrides'
import { useDeleteCustomExercise, useUpdateCustomExercise } from '../hooks/useCustomExercises'
import { useAllExerciseCommands, useLinkCommand, useUnlinkCommand } from '../hooks/useExerciseCommands'
import { useAllExerciseLevelHistory } from '../hooks/useExerciseLevelHistory'

const GL_CATEGORIES = [
  { key: 'gl_mindset' as const, label: 'Mindset' },
  { key: 'gl_physio'  as const, label: 'Physio' },
  { key: 'gl_fuss'    as const, label: 'Fuß' },
  { key: 'gl_sitz'    as const, label: 'Sitz' },
  { key: 'gl_platz'   as const, label: 'Platz' },
  { key: 'gl_steh'    as const, label: 'Steh' },
]

interface AddFormState {
  name: string
  description: string
  aufbau: string
  basis: string
  stabil: string
  pruefungsreif: string
}

interface EditFormState {
  name: string
  description: string
  aufbau: string
  basis: string
  stabil: string
  pruefungsreif: string
}

const EMPTY_FORM: AddFormState = { name: '', description: '', aufbau: '', basis: '', stabil: '', pruefungsreif: '' }

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  overrides: Record<string, ExerciseOverride>
  dogId: string
  userId: string
  allCommands: Command[]
  onAddExercise: (fields: { name: string; category: Exercise['category']; description?: string; criteria?: LevelCriteria }) => void
}

export function GrundlagenFortschritt({ statuses, allExercises, overrides, dogId, userId, allCommands, onAddExercise }: Props) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_FORM)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showCommandPickerFor, setShowCommandPickerFor] = useState<string | null>(null)

  const updateOverride = useUpdateExerciseOverride(userId)
  const uploadPhoto = useUploadExercisePhoto(userId)
  const uploadVideo = useUploadExerciseVideo(userId)
  const deleteExercise = useDeleteCustomExercise(userId)
  const updateExercise = useUpdateCustomExercise(userId)
  const linkCommand = useLinkCommand(userId)
  const unlinkCommand = useUnlinkCommand(userId)

  const { data: exerciseCommandLinks = {} } = useAllExerciseCommands(userId)
  const { data: levelHistoryAll = {} } = useAllExerciseLevelHistory(dogId)

  const map = getStatusMap(statuses, allExercises)
  const foundationalExercises = allExercises.filter(e => e.isFoundational)

  function handleAddSubmit(categoryKey: string) {
    if (!addForm.name.trim()) return
    const hasCriteria = addForm.aufbau || addForm.basis || addForm.stabil || addForm.pruefungsreif
    const criteria: LevelCriteria | undefined = hasCriteria ? {
      nicht_begonnen: CUSTOM_CRITERIA.nicht_begonnen,
      aufbau: addForm.aufbau || CUSTOM_CRITERIA.aufbau,
      basis: addForm.basis || CUSTOM_CRITERIA.basis,
      stabil: addForm.stabil || CUSTOM_CRITERIA.stabil,
      pruefungsreif: addForm.pruefungsreif || CUSTOM_CRITERIA.pruefungsreif,
    } : undefined
    onAddExercise({
      name: addForm.name.trim(),
      category: categoryKey as Exercise['category'],
      description: addForm.description.trim() || undefined,
      criteria,
    })
    setAddingTo(null)
    setAddForm(EMPTY_FORM)
  }

  function handleEditStart(ex: Exercise) {
    const criteria = ex.criteria ?? {}
    setEditForm({
      name: ex.name,
      description: ex.description ?? '',
      aufbau: criteria.aufbau && criteria.aufbau !== CUSTOM_CRITERIA.aufbau ? criteria.aufbau : '',
      basis: criteria.basis && criteria.basis !== CUSTOM_CRITERIA.basis ? criteria.basis : '',
      stabil: criteria.stabil && criteria.stabil !== CUSTOM_CRITERIA.stabil ? criteria.stabil : '',
      pruefungsreif: criteria.pruefungsreif && criteria.pruefungsreif !== CUSTOM_CRITERIA.pruefungsreif ? criteria.pruefungsreif : '',
    })
    setEditingId(ex.id)
  }

  function handleEditSubmit(ex: Exercise) {
    if (!editForm.name.trim()) return
    const hasCriteria = editForm.aufbau || editForm.basis || editForm.stabil || editForm.pruefungsreif
    const criteria: LevelCriteria | undefined = hasCriteria ? {
      nicht_begonnen: CUSTOM_CRITERIA.nicht_begonnen,
      aufbau: editForm.aufbau || CUSTOM_CRITERIA.aufbau,
      basis: editForm.basis || CUSTOM_CRITERIA.basis,
      stabil: editForm.stabil || CUSTOM_CRITERIA.stabil,
      pruefungsreif: editForm.pruefungsreif || CUSTOM_CRITERIA.pruefungsreif,
    } : undefined
    updateExercise.mutate({
      id: ex.id,
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
      criteria,
    })
    setEditingId(null)
  }

  function handleDelete(id: string) {
    deleteExercise.mutate(id)
    setConfirmDeleteId(null)
  }

  function handleNotesSave(ex: Exercise) {
    const current = editNotes[ex.id]
    if (current === undefined) return
    const saved = ex.notes ?? ''
    if (current === saved) return
    const ov = overrides[ex.id] ?? {}
    updateOverride.mutate({
      exerciseId: ex.id,
      changes: { ...ov, notes: current || undefined },
    })
  }

  async function handlePhotoUpload(ex: Exercise, file: File) {
    setUploadingPhotoId(ex.id)
    try {
      const url = await uploadPhoto.mutateAsync({ exerciseId: ex.id, file })
      const ov = overrides[ex.id] ?? {}
      await updateOverride.mutateAsync({ exerciseId: ex.id, changes: { ...ov, photo_url: url } })
    } finally {
      setUploadingPhotoId(null)
    }
  }

  async function handleVideoUpload(ex: Exercise, file: File) {
    setUploadingVideoId(ex.id)
    try {
      const url = await uploadVideo.mutateAsync({ exerciseId: ex.id, file })
      const ov = overrides[ex.id] ?? {}
      await updateOverride.mutateAsync({ exerciseId: ex.id, changes: { ...ov, video_url: url } })
    } finally {
      setUploadingVideoId(null)
    }
  }

  function handleLinkCommand(exerciseId: string, commandId: string) {
    linkCommand.mutate({ exerciseId, commandId })
    setShowCommandPickerFor(null)
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-stone-800">Grundlagen</h1>
        <p className="text-sm text-stone-500 mt-0.5">Fundament für alle Sportarten</p>
      </div>

      {GL_CATEGORIES.map(cat => {
        const customExs = allExercises.filter(e => e.category === cat.key)
        const mindsetExs = cat.key === 'gl_mindset' ? foundationalExercises : []
        const allCatExs = [...mindsetExs, ...customExs]

        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{cat.label}</p>
              {addingTo !== cat.key && (
                <button
                  onClick={() => { setAddingTo(cat.key); setAddForm(EMPTY_FORM) }}
                  className="text-xs text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1 active:bg-teal-50 transition-colors"
                >
                  + Übung
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {allCatExs.map(ex => {
                const current = map[ex.id] ?? 'nicht_begonnen'
                const idx = levelIndex(current)
                const next = nextLevel(current)
                const isUploadingPhoto = uploadingPhotoId === ex.id
                const isUploadingVideo = uploadingVideoId === ex.id
                const notesValue = editNotes[ex.id] ?? ex.notes ?? ''
                const isCustom = !ex.isFoundational
                const links = exerciseCommandLinks[ex.id] ?? []
                const history = levelHistoryAll[ex.id] ?? []

                if (editingId === ex.id && isCustom) {
                  return (
                    <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-teal-200 p-4 flex flex-col gap-3">
                      <p className="text-sm font-semibold text-stone-700">Übung bearbeiten</p>
                      <input
                        autoFocus
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Name der Übung *"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Beschreibung (optional)"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      />
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-stone-400 font-medium">Level-Kriterien (optional)</p>
                        {(['aufbau', 'basis', 'stabil', 'pruefungsreif'] as const).map(l => (
                          <div key={l} className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 w-24 flex-shrink-0 capitalize">{l === 'pruefungsreif' ? 'Prüfungsreif' : l}:</span>
                            <input
                              type="text"
                              placeholder={CUSTOM_CRITERIA[l]}
                              value={editForm[l]}
                              onChange={e => setEditForm(f => ({ ...f, [l]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleEditSubmit(ex)}
                          disabled={!editForm.name.trim()}
                          className="flex-1 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <details key={ex.id} className="bg-white rounded-xl shadow-sm group border border-stone-100">
                    <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none active:bg-stone-50 rounded-xl">
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-stone-800 truncate">{ex.name}</span>
                          {ex.isFoundational && (
                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full flex-shrink-0">BH-Grundlage</span>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 mt-0.5 truncate">{ex.criteria?.[current]}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <LevelBadge level={current} />
                        <span className="text-stone-300 text-xs group-open:rotate-180 transition-transform">▾</span>
                      </div>
                    </summary>

                    <div className="px-4 pb-4 flex flex-col gap-4 border-t border-stone-50 pt-3">

                      {/* Titel-Wiederholung damit er beim Tippen sichtbar bleibt */}
                      <p className="text-xs font-semibold text-stone-500">{ex.name}</p>

                      {/* Level-Progression */}
                      <div>
                        <div className="flex gap-1 mb-2">
                          {LEVEL_ORDER.filter(l => l !== 'nicht_begonnen').map((l, i) => (
                            <div
                              key={l}
                              className={`flex-1 h-1.5 rounded-full transition-colors ${i < idx ? 'bg-teal-400' : 'bg-stone-100'}`}
                            />
                          ))}
                        </div>

                        {!next && (
                          <div className="text-center py-2">
                            <span className="text-xs text-green-600 font-semibold">✓ Höchste Stufe erreicht</span>
                          </div>
                        )}
                      </div>

                      {/* Nächste Stufe Beschreibung */}
                      {next && (
                        <div className="bg-teal-50 rounded-xl p-3">
                          <p className="text-xs font-medium text-teal-700 mb-0.5">Ziel: {LEVEL_LABEL[next]}</p>
                          <p className="text-xs text-teal-600">{ex.criteria?.[next]}</p>
                        </div>
                      )}

                      {/* Beschreibung */}
                      {ex.description && (
                        <p className="text-xs text-stone-500">{ex.description}</p>
                      )}

                      {/* Kommandos */}
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-stone-400">Kommandos</p>
                        {links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {links.map(link => {
                              const cmd = allCommands.find(c => c.id === link.commandId)
                              if (!cmd) return null
                              return (
                                <CommandChip
                                  key={link.id}
                                  name={cmd.name}
                                  onRemove={() => unlinkCommand.mutate({ linkId: link.id, exerciseId: ex.id })}
                                />
                              )
                            })}
                          </div>
                        )}
                        {showCommandPickerFor === ex.id ? (
                          <div className="flex flex-col gap-1">
                            {allCommands.filter(c => !links.some(l => l.commandId === c.id)).length === 0 ? (
                              <p className="text-xs text-stone-400 italic">Alle Kommandos bereits verknüpft</p>
                            ) : (
                              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                {allCommands
                                  .filter(c => !links.some(l => l.commandId === c.id))
                                  .map(cmd => (
                                    <button
                                      key={cmd.id}
                                      onClick={() => handleLinkCommand(ex.id, cmd.id)}
                                      className="text-left text-xs px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 text-stone-700 active:bg-teal-50 active:border-teal-200"
                                    >
                                      <span className="font-medium">{cmd.name}</span>
                                      {cmd.description && <span className="text-stone-400"> — {cmd.description}</span>}
                                    </button>
                                  ))}
                              </div>
                            )}
                            <button
                              onClick={() => setShowCommandPickerFor(null)}
                              className="text-xs text-stone-400 mt-0.5"
                            >
                              Schließen
                            </button>
                          </div>
                        ) : (
                          allCommands.length > 0 && (
                            <button
                              onClick={() => setShowCommandPickerFor(ex.id)}
                              className="text-xs text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1.5 self-start active:bg-teal-50"
                            >
                              + Kommando verknüpfen
                            </button>
                          )
                        )}
                        {allCommands.length === 0 && (
                          <p className="text-xs text-stone-300 italic">Kommandos anlegen in den Einstellungen</p>
                        )}
                      </div>

                      {/* Medien: Foto */}
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-stone-400">Referenzfoto</p>
                        {ex.photo_url && (
                          <img
                            src={ex.photo_url}
                            alt={`Foto ${ex.name}`}
                            className="w-full max-h-48 object-cover rounded-xl border border-stone-100"
                          />
                        )}
                        <label className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                          isUploadingPhoto ? 'border-stone-100 text-stone-300' : 'border-stone-200 text-stone-500 active:bg-stone-50'
                        }`}>
                          <span>{isUploadingPhoto ? '⏳' : '📷'}</span>
                          <span>{isUploadingPhoto ? 'Wird hochgeladen…' : ex.photo_url ? 'Foto ändern' : 'Foto hinzufügen'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingPhoto}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(ex, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>

                      {/* Medien: Video */}
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-stone-400">Referenzvideo</p>
                        {ex.video_url && (
                          <video
                            src={ex.video_url}
                            controls
                            playsInline
                            className="w-full max-h-48 rounded-xl border border-stone-100 bg-stone-900"
                          />
                        )}
                        <label className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                          isUploadingVideo ? 'border-stone-100 text-stone-300' : 'border-stone-200 text-stone-500 active:bg-stone-50'
                        }`}>
                          <span>{isUploadingVideo ? '⏳' : '🎬'}</span>
                          <span>{isUploadingVideo ? 'Wird hochgeladen…' : ex.video_url ? 'Video ändern' : 'Video hinzufügen'}</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            disabled={isUploadingVideo}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleVideoUpload(ex, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>

                      {/* Notizen */}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium text-stone-400">Notizen</p>
                        <textarea
                          rows={3}
                          placeholder="Trainingsausrüstung, Tipps, Besonderheiten…"
                          value={notesValue}
                          onChange={e => setEditNotes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                          onBlur={() => handleNotesSave(ex)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                        />
                      </div>

                      {/* Lernkurve */}
                      {history.length > 0 && <LevelTimeline history={history} />}

                      {/* Edit / Delete für eigene Übungen */}
                      {isCustom && (
                        <div className="flex gap-2 pt-1 border-t border-stone-50">
                          <button
                            onClick={() => handleEditStart(ex)}
                            className="flex-1 py-2 text-xs text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                          >
                            ✏️ Bearbeiten
                          </button>
                          {confirmDeleteId === ex.id ? (
                            <div className="flex gap-1.5 flex-1">
                              <button
                                onClick={() => handleDelete(ex.id)}
                                className="flex-1 py-2 text-xs bg-red-500 text-white rounded-xl active:scale-95 transition-transform font-semibold"
                              >
                                Löschen
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-2 text-xs border border-stone-200 text-stone-500 rounded-xl"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(ex.id)}
                              className="py-2 px-3 text-xs text-red-400 border border-red-100 rounded-xl active:bg-red-50"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                )
              })}

              {/* Inline-Formular für neue Übung */}
              {addingTo === cat.key && (
                <div className="bg-white rounded-xl shadow-sm border border-teal-200 p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-stone-700">Neue Übung — {cat.label}</p>

                  <input
                    autoFocus
                    type="text"
                    placeholder="Name der Übung *"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />

                  <input
                    type="text"
                    placeholder="Beschreibung (optional)"
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />

                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-stone-400 font-medium">Level-Kriterien (optional)</p>
                    {(['aufbau', 'basis', 'stabil', 'pruefungsreif'] as const).map(l => (
                      <div key={l} className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 w-24 flex-shrink-0 capitalize">{l === 'pruefungsreif' ? 'Prüfungsreif' : l}:</span>
                        <input
                          type="text"
                          placeholder={CUSTOM_CRITERIA[l]}
                          value={addForm[l]}
                          onChange={e => setAddForm(f => ({ ...f, [l]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddSubmit(cat.key)}
                      disabled={!addForm.name.trim()}
                      className="flex-1 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => { setAddingTo(null); setAddForm(EMPTY_FORM) }}
                      className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {allCatExs.length === 0 && addingTo !== cat.key && (
                <div className="text-center py-4 px-2">
                  <p className="text-sm text-stone-300">Noch keine Übungen</p>
                  <p className="text-xs text-stone-300 mt-0.5">Tippe auf „+ Übung" um zu starten</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
