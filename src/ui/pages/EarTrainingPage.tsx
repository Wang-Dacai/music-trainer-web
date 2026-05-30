import { useEffect, useRef, useState } from 'react'
import { playPianoSample, preloadPianoSamples, stopPianoSample } from '../../audio/pianoSamples'
import {
  createInitialEarTrainingStats,
  EAR_TRAINING_NOTES,
  getEarTrainingAccuracy,
  pickEarTrainingNote,
  recordEarTrainingAnswer,
  type EarTrainingNote,
  type EarTrainingNoteName,
} from '../../domain/earTraining'

type EarTrainingMode = 'idle' | 'playing' | 'guessing' | 'feedback'
type StatusTone = 'neutral' | 'success' | 'error'

const SCALE_NOTE_MS = 650
const TARGET_NOTE_MS = 900
const FEEDBACK_MS = 950

export function EarTrainingPage() {
  const [mode, setMode] = useState<EarTrainingMode>('idle')
  const [targetNote, setTargetNote] = useState<EarTrainingNote | null>(null)
  const [activeNote, setActiveNote] = useState<EarTrainingNoteName | null>(null)
  const [selectedNote, setSelectedNote] = useState<EarTrainingNoteName | null>(null)
  const [status, setStatus] = useState('准备开始')
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral')
  const [stats, setStats] = useState(createInitialEarTrainingStats)
  const roundTokenRef = useRef(0)
  const feedbackTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const noteName = event.key.toUpperCase() as EarTrainingNoteName

      if (mode === 'guessing' && EAR_TRAINING_NOTES.some((note) => note.name === noteName)) {
        submitAnswer(noteName)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  useEffect(() => {
    mountedRef.current = true
    preloadPianoSamples()

    return () => {
      mountedRef.current = false
      clearFeedbackTimer()
      stopPianoSample()
      createRoundToken()
    }
  }, [])

  async function startRound() {
    if (mode === 'playing') {
      return
    }

    const token = createRoundToken()
    clearFeedbackTimer()
    setSelectedNote(null)
    setTargetNote(null)
    setActiveNote(null)
    setStatusTone('neutral')
    setMode('playing')
    setStatus('正在播放参考音阶')

    try {
      await playScale(token)

      if (!isCurrentRound(token)) {
        return
      }

      const nextTarget = pickEarTrainingNote()
      setTargetNote(nextTarget)
      setStatus('正在播放随机单音')
      await playNote(nextTarget, token, false, TARGET_NOTE_MS)

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

  async function replayScale() {
    if (mode === 'playing' || mode === 'feedback') {
      return
    }

    const token = roundTokenRef.current
    const previousMode = mode
    setMode('playing')
    setStatusTone('neutral')
    setStatus('正在重播参考音阶')

    try {
      await playScale(token)

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
      await playNote(targetNote, token, false, TARGET_NOTE_MS)

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

  function submitAnswer(noteName: EarTrainingNoteName) {
    if (mode !== 'guessing' || !targetNote) {
      return
    }

    const isCorrect = noteName === targetNote.name
    const token = roundTokenRef.current
    setSelectedNote(noteName)
    setStats((current) => recordEarTrainingAnswer(current, isCorrect))
    setMode('feedback')
    setStatusTone(isCorrect ? 'success' : 'error')
    setStatus(isCorrect ? '正确' : `错误，答案是 ${targetNote.name}`)

    feedbackTimerRef.current = window.setTimeout(() => {
      if (isCurrentRound(token)) {
        void startRound()
      }
    }, FEEDBACK_MS)
  }

  function stopPractice() {
    createRoundToken()
    clearFeedbackTimer()
    stopPianoSample()
    setMode('idle')
    setTargetNote(null)
    setActiveNote(null)
    setSelectedNote(null)
    setStatusTone('neutral')
    setStatus('已停止')
  }

  function resetStats() {
    setStats(createInitialEarTrainingStats())
  }

  async function playScale(token: number) {
    for (const note of EAR_TRAINING_NOTES) {
      if (!isCurrentRound(token)) {
        break
      }

      await playNote(note, token, true, SCALE_NOTE_MS)
    }

    if (isCurrentRound(token)) {
      setActiveNote(null)
    }
  }

  async function playNote(note: EarTrainingNote, token: number, highlight: boolean, durationMs: number) {
    if (highlight) {
      setActiveNote(note.name)
    }

    await playPianoSample(note.name, durationMs)

    if (highlight && isCurrentRound(token)) {
      setActiveNote(null)
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

  const isPlaying = mode === 'playing'
  const isGuessing = mode === 'guessing'
  const isIdle = mode === 'idle'
  const accuracy = getEarTrainingAccuracy(stats)

  return (
    <section className="module-panel" aria-labelledby="ear-training-title">
      <header className="module-header">
        <div>
          <p className="module-kicker">C 大调 · 小字一组</p>
          <h1 id="ear-training-title">Ear Training：单音听辨</h1>
          <p>先播放 C 到 B 的参考音阶，再播放一个随机单音。通过音名按钮判断听到的音高。</p>
        </div>
        <div className="stats-grid" aria-label="当前练习统计">
          <StatTile value={stats.total} label="总题数" />
          <StatTile value={stats.correct} label="正确题数" />
          <StatTile value={`${accuracy}%`} label="正确率" />
          <StatTile value={stats.streak} label="当前连对" />
        </div>
      </header>

      <div className={`status-line tone-${statusTone}`} role="status" aria-live="polite">
        {status}
      </div>

      <div className="note-answer-grid" aria-label="参考音阶和选择音名">
        {EAR_TRAINING_NOTES.map((note) => {
          const isActive = activeNote === note.name
          const isCorrectAnswer = mode === 'feedback' && targetNote?.name === note.name
          const isWrongSelection = mode === 'feedback' && selectedNote === note.name && selectedNote !== targetNote?.name

          return (
            <button
              key={note.name}
              type="button"
              className={`note-button ${isActive ? 'is-active' : ''} ${isCorrectAnswer ? 'is-correct' : ''} ${isWrongSelection ? 'is-incorrect' : ''}`}
              disabled={!isGuessing}
              onClick={() => submitAnswer(note.name)}
            >
              {note.name}
            </button>
          )
        })}
      </div>

      <div className="toolbar" aria-label="单音听辨控制">
        <button type="button" className="primary-action" disabled={!isIdle} onClick={() => void startRound()}>
          {isIdle ? '开始' : '练习中'}
        </button>
        <button type="button" className="secondary-action" disabled={isPlaying || mode === 'feedback'} onClick={() => void replayScale()}>
          重播音阶
        </button>
        <button type="button" className="secondary-action" disabled={!isGuessing || !targetNote} onClick={() => void replayTarget()}>
          重播单音
        </button>
        <button type="button" className="secondary-action" disabled={mode === 'idle'} onClick={stopPractice}>
          停止
        </button>
        <button type="button" className="secondary-action" onClick={resetStats}>
          清空统计
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

export default EarTrainingPage
