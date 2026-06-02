import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_EAR_TRAINING_INSTRUMENT_ID,
  EAR_TRAINING_INSTRUMENTS,
  playEarTrainingSound,
  preloadEarTrainingSounds,
  stopEarTrainingSound,
  type EarTrainingInstrumentId,
} from '../../audio/earTrainingPlayback'
import {
  createInitialEarTrainingStats,
  DEFAULT_EAR_TRAINING_ANSWER_LABEL_MODES,
  DEFAULT_EAR_TRAINING_PITCH_RANGE_ID,
  DEFAULT_EAR_TRAINING_SCALE_ID,
  EAR_TRAINING_ANSWER_LABEL_MODES,
  EAR_TRAINING_PITCH_RANGES,
  EAR_TRAINING_SCALES,
  formatEarTrainingAnswerLabel,
  getEarTrainingAccuracy,
  getEarTrainingPitchRange,
  getEarTrainingScale,
  getEarTrainingScaleNotes,
  getEarTrainingScalePlaybackNotes,
  pickEarTrainingNote,
  recordEarTrainingAnswer,
  type EarTrainingAnswerLabelMode,
  type EarTrainingNote,
  type EarTrainingPitchRangeId,
  type EarTrainingScaleId,
} from '../../domain/earTraining'
import type { PracticeSessionInput } from '../../domain/practiceHistory'

type EarTrainingMode = 'idle' | 'playing' | 'guessing' | 'feedback'
type StatusTone = 'neutral' | 'success' | 'error'

interface EarTrainingPageProps {
  isActive?: boolean
  onSessionComplete?: (session: PracticeSessionInput) => void
}

const SCALE_NOTE_MS = 650
const TARGET_NOTE_MS = 900
const FEEDBACK_MS = 950

export function EarTrainingPage({ isActive = true, onSessionComplete }: EarTrainingPageProps) {
  const [mode, setMode] = useState<EarTrainingMode>('idle')
  const [targetNote, setTargetNote] = useState<EarTrainingNote | null>(null)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [status, setStatus] = useState('准备开始')
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral')
  const [stats, setStats] = useState(createInitialEarTrainingStats)
  const [pitchRangeId, setPitchRangeId] = useState<EarTrainingPitchRangeId>(DEFAULT_EAR_TRAINING_PITCH_RANGE_ID)
  const [scaleId, setScaleId] = useState<EarTrainingScaleId>(DEFAULT_EAR_TRAINING_SCALE_ID)
  const [instrumentId, setInstrumentId] = useState<EarTrainingInstrumentId>(DEFAULT_EAR_TRAINING_INSTRUMENT_ID)
  const [answerLabelModes, setAnswerLabelModes] = useState<EarTrainingAnswerLabelMode[]>(DEFAULT_EAR_TRAINING_ANSWER_LABEL_MODES)
  const roundTokenRef = useRef(0)
  const feedbackTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)
  const sessionStartStatsRef = useRef(createInitialEarTrainingStats())
  const activePitchRange = getEarTrainingPitchRange(pitchRangeId)
  const activeScale = getEarTrainingScale(scaleId)
  const activeScaleNotes = getEarTrainingScaleNotes(scaleId, pitchRangeId)
  const activeInstrument = EAR_TRAINING_INSTRUMENTS.find((instrument) => instrument.id === instrumentId) ?? EAR_TRAINING_INSTRUMENTS[0]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toUpperCase()
      const matchingNote = activeScaleNotes.find(
        (note) => note.keyboardKey === key || note.noteName.toUpperCase() === key || String(note.scaleDegree) === key,
      )

      if (isActive && mode === 'guessing' && matchingNote) {
        submitAnswer(matchingNote)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => {
    if (isActive) {
      return
    }

    createRoundToken()
    clearFeedbackTimer()
    stopEarTrainingSound()
    setActiveNoteId(null)
    setMode((currentMode) => {
      if (currentMode === 'playing') {
        return targetNote ? 'guessing' : 'idle'
      }

      if (currentMode === 'feedback') {
        return 'idle'
      }

      return currentMode
    })
    setStatus((currentStatus) => {
      if (currentStatus.startsWith('正在')) {
        return targetNote ? '请判断听到的单音' : '已暂停'
      }

      if (currentStatus === '正确' || currentStatus.startsWith('错误')) {
        return '已暂停'
      }

      return currentStatus
    })
  }, [isActive])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearFeedbackTimer()
      stopEarTrainingSound()
      createRoundToken()
    }
  }, [])

  useEffect(() => {
    preloadEarTrainingSounds(instrumentId)
  }, [instrumentId])

  async function startRound() {
    if (mode === 'playing') {
      return
    }

    const token = createRoundToken()
    const roundNotes = activeScaleNotes
    const referenceNotes = getEarTrainingScalePlaybackNotes(scaleId, pitchRangeId)
    const roundInstrumentId = instrumentId
    if (mode === 'idle' && stats.total <= sessionStartStatsRef.current.total) {
      sessionStartStatsRef.current = stats
    }
    clearFeedbackTimer()
    setSelectedNoteId(null)
    setTargetNote(null)
    setActiveNoteId(null)
    setStatusTone('neutral')
    setMode('playing')
    setStatus('正在播放参考音阶')

    try {
      await playReferenceScale(token, referenceNotes, roundInstrumentId)

      if (!isCurrentRound(token)) {
        return
      }

      const nextTarget = pickEarTrainingNote(Math.random, roundNotes)
      setTargetNote(nextTarget)
      setStatus('正在播放随机单音')
      await playNote(nextTarget, token, false, TARGET_NOTE_MS, roundInstrumentId)

      if (!isCurrentRound(token)) {
        return
      }

      setMode('guessing')
      setStatus('请判断听到的单音')
    } catch (error) {
      console.error(error)

      if (isCurrentRound(token)) {
        setMode('idle')
        setStatusTone('error')
        setStatus('音频播放失败，请确认浏览器允许播放声音')
      }
    }
  }

  async function replayPitchRange() {
    if (mode === 'playing' || mode === 'feedback') {
      return
    }

    const token = roundTokenRef.current
    const previousMode = mode
    setMode('playing')
    setStatusTone('neutral')
    setStatus('正在重播参考音阶')

    try {
      await playReferenceScale(token, getEarTrainingScalePlaybackNotes(scaleId, pitchRangeId), instrumentId)

      if (!isCurrentRound(token)) {
        return
      }

      setMode(previousMode)
      setStatus(previousMode === 'guessing' ? '请判断听到的单音' : '准备开始')
    } catch (error) {
      console.error(error)

      if (isCurrentRound(token)) {
        setMode('idle')
        setStatusTone('error')
        setStatus('音频播放失败，请确认浏览器允许播放声音')
      }
    }
  }

  async function replayTarget() {
    if (mode !== 'guessing' || !targetNote) {
      return
    }

    const token = roundTokenRef.current
    setMode('playing')
    setStatusTone('neutral')
    setStatus('正在重播单音')

    try {
      await playNote(targetNote, token, false, TARGET_NOTE_MS, instrumentId)

      if (!isCurrentRound(token)) {
        return
      }

      setMode('guessing')
      setStatus('请判断听到的单音')
    } catch (error) {
      console.error(error)

      if (isCurrentRound(token)) {
        setMode('idle')
        setStatusTone('error')
        setStatus('音频播放失败，请确认浏览器允许播放声音')
      }
    }
  }

  function submitAnswer(note: EarTrainingNote) {
    if (mode !== 'guessing' || !targetNote) {
      return
    }

    const isCorrect = note.id === targetNote.id
    const token = roundTokenRef.current
    setSelectedNoteId(note.id)
    setStats((current) => recordEarTrainingAnswer(current, isCorrect))
    setMode('feedback')
    setStatusTone(isCorrect ? 'success' : 'error')
    setStatus(isCorrect ? '正确' : `错误，答案是 ${formatEarTrainingAnswerLabel(targetNote, answerLabelModes)}`)

    feedbackTimerRef.current = window.setTimeout(() => {
      if (isCurrentRound(token)) {
        void startRound()
      }
    }, FEEDBACK_MS)
  }

  function stopPractice() {
    recordCurrentSession()
    const nextStats = createInitialEarTrainingStats()
    createRoundToken()
    clearFeedbackTimer()
    stopEarTrainingSound()
    setMode('idle')
    setTargetNote(null)
    setActiveNoteId(null)
    setSelectedNoteId(null)
    setStats(nextStats)
    sessionStartStatsRef.current = nextStats
    setStatusTone('neutral')
    setStatus('已停止')
  }

  function handlePitchRangeChange(nextRangeId: EarTrainingPitchRangeId) {
    setPitchRangeId(nextRangeId)
    setStatusTone('neutral')
    setStatus(`已选择 ${getEarTrainingPitchRange(nextRangeId).label}`)
  }

  function handleScaleChange(nextScaleId: EarTrainingScaleId) {
    setScaleId(nextScaleId)
    setStatusTone('neutral')
    setStatus(`已选择 ${getEarTrainingScale(nextScaleId).label}`)
  }

  function handleInstrumentChange(nextInstrumentId: EarTrainingInstrumentId) {
    setInstrumentId(nextInstrumentId)
    setStatusTone('neutral')
    setStatus(`已选择 ${EAR_TRAINING_INSTRUMENTS.find((instrument) => instrument.id === nextInstrumentId)?.label ?? '音色'}`)
  }

  function handleAnswerLabelModeToggle(labelMode: EarTrainingAnswerLabelMode) {
    setAnswerLabelModes((currentModes) => {
      if (currentModes.includes(labelMode)) {
        return currentModes.length > 1 ? sortAnswerLabelModes(currentModes.filter((mode) => mode !== labelMode)) : currentModes
      }

      if (currentModes.length >= 2) {
        return sortAnswerLabelModes([currentModes[1], labelMode])
      }

      return sortAnswerLabelModes([...currentModes, labelMode])
    })
  }

  async function playReferenceScale(token: number, notes: readonly EarTrainingNote[], selectedInstrumentId: EarTrainingInstrumentId) {
    for (const note of notes) {
      if (!isCurrentRound(token)) {
        break
      }

      await playNote(note, token, true, SCALE_NOTE_MS, selectedInstrumentId)
    }

    if (isCurrentRound(token)) {
      setActiveNoteId(null)
    }
  }

  async function playNote(
    note: EarTrainingNote,
    token: number,
    highlight: boolean,
    durationMs: number,
    selectedInstrumentId: EarTrainingInstrumentId,
  ) {
    if (highlight) {
      setActiveNoteId(note.id)
    }

    await playEarTrainingSound(note, selectedInstrumentId, durationMs)

    if (highlight && isCurrentRound(token)) {
      setActiveNoteId(null)
    }
  }

  function createRoundToken(): number {
    roundTokenRef.current += 1
    return roundTokenRef.current
  }

  function isCurrentRound(token: number): boolean {
    return mountedRef.current && roundTokenRef.current === token
  }

  function clearFeedbackTimer() {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current)
      feedbackTimerRef.current = null
    }
  }

  function recordCurrentSession() {
    const sessionStartStats = sessionStartStatsRef.current
    const completedItems = stats.total - sessionStartStats.total

    if (completedItems <= 0) {
      return
    }

    const correctItems = stats.correct - sessionStartStats.correct
    onSessionComplete?.({
      module: 'ear-training',
      completedItems,
      correctItems,
      detail: `${activeScale.label} · ${activePitchRange.label} · ${activeInstrument.label}`,
      streak: stats.streak,
    })
    sessionStartStatsRef.current = stats
  }

  const isPlaying = mode === 'playing'
  const isGuessing = mode === 'guessing'
  const isIdle = mode === 'idle'
  const accuracy = getEarTrainingAccuracy(stats)
  const hasUnrecordedAnswers = stats.total > sessionStartStatsRef.current.total
  const canChangeSettings = isIdle && !hasUnrecordedAnswers
  const canStop = mode !== 'idle' || hasUnrecordedAnswers

  return (
    <section className="module-panel" aria-labelledby="ear-training-title">
      <header className="module-header">
        <div>
          <p className="module-kicker">
            {activeScale.label} · {activePitchRange.kicker} · {activeInstrument.label}
          </p>
          <h1 id="ear-training-title">Ear Training：单音听辨</h1>
          <p>先听七个上行大调音阶音和主音建立调性感，再判断目标音在当前音阶中的位置。</p>
        </div>
        <div className="stats-grid" aria-label="当前练习统计">
          <StatTile value={stats.total} label="总题数" />
          <StatTile value={stats.correct} label="正确题数" />
          <StatTile value={`${accuracy}%`} label="正确率" />
          <StatTile value={stats.streak} label="当前连对" />
        </div>
      </header>

      <div className="settings-grid" aria-label="单音听辨设置">
        <label className="select-field">
          <span>音色</span>
          <select
            value={instrumentId}
            disabled={!canChangeSettings}
            onChange={(event) => handleInstrumentChange(event.target.value as EarTrainingInstrumentId)}
          >
            {EAR_TRAINING_INSTRUMENTS.map((instrument) => (
              <option
                key={instrument.id}
                value={instrument.id}
              >
                {instrument.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>音阶</span>
          <select
            value={scaleId}
            disabled={!canChangeSettings}
            onChange={(event) => handleScaleChange(event.target.value as EarTrainingScaleId)}
          >
            {EAR_TRAINING_SCALES.map((scale) => (
              <option
                key={scale.id}
                value={scale.id}
              >
                {scale.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>音域</span>
          <select
            value={pitchRangeId}
            disabled={!canChangeSettings}
            onChange={(event) => handlePitchRangeChange(event.target.value as EarTrainingPitchRangeId)}
          >
            {EAR_TRAINING_PITCH_RANGES.map((range) => (
              <option
                key={range.id}
                value={range.id}
              >
                {range.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="segmented-field ear-label-mode-field">
          <legend>按钮</legend>
          <div className="segmented-control ear-label-mode-control">
            {EAR_TRAINING_ANSWER_LABEL_MODES.map((labelMode) => (
              <button
                key={labelMode.id}
                type="button"
                className={answerLabelModes.includes(labelMode.id) ? 'is-active' : ''}
                aria-pressed={answerLabelModes.includes(labelMode.id)}
                disabled={!canChangeSettings}
                onClick={() => handleAnswerLabelModeToggle(labelMode.id)}
              >
                {labelMode.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`status-line tone-${statusTone}`} role="status" aria-live="polite">
        {status}
      </div>

      <div className="note-answer-grid" aria-label="参考音阶和选择目标音">
        {activeScaleNotes.map((note) => {
          const isActive = activeNoteId === note.id
          const isCorrectAnswer = mode === 'feedback' && targetNote?.id === note.id
          const isWrongSelection = mode === 'feedback' && selectedNoteId === note.id && selectedNoteId !== targetNote?.id

          return (
            <button
              key={note.id}
              type="button"
              className={`note-button ${isActive ? 'is-active' : ''} ${isCorrectAnswer ? 'is-correct' : ''} ${isWrongSelection ? 'is-incorrect' : ''}`}
              disabled={!isGuessing}
              onClick={() => submitAnswer(note)}
            >
              {formatEarTrainingAnswerLabel(note, answerLabelModes)}
            </button>
          )
        })}
      </div>

      <div className="toolbar" aria-label="单音听辨控制">
        <button type="button" className="primary-action" disabled={!isIdle} onClick={() => void startRound()}>
          {isIdle ? '开始练习' : '练习中'}
        </button>
        <button type="button" className="secondary-action" disabled={isPlaying || mode === 'feedback'} onClick={() => void replayPitchRange()}>
          重播音阶
        </button>
        <button type="button" className="secondary-action" disabled={!isGuessing || !targetNote} onClick={() => void replayTarget()}>
          重播单音
        </button>
        <button type="button" className="secondary-action" disabled={!canStop} onClick={stopPractice}>
          停止
        </button>
      </div>
    </section>
  )
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stat-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function sortAnswerLabelModes(modes: readonly EarTrainingAnswerLabelMode[]): EarTrainingAnswerLabelMode[] {
  return EAR_TRAINING_ANSWER_LABEL_MODES
    .map((mode) => mode.id)
    .filter((mode): mode is EarTrainingAnswerLabelMode => modes.includes(mode))
}

export default EarTrainingPage
