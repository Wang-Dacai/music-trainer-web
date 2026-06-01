import { useEffect, useRef, useState } from 'react'
import { playStaffExerciseNotes, preloadStaffPlaybackSounds, stopStaffPlayback } from '../../audio/staffPlayback'
import {
  DEFAULT_STAFF_DIFFICULTY_ID,
  generateStaffIntervalExercise,
  STAFF_CLEF_LABELS,
  STAFF_DIFFICULTY_LEVELS,
  type StaffAnswerGroup,
  type StaffClefName,
  type StaffDifficultyId,
  type StaffIntervalExercise,
} from '../../domain/staffTrainer'
import type { PracticeSessionInput } from '../../domain/practiceHistory'
import StaffNotation from '../components/StaffNotation'

interface AnswerState {
  selected: string
  isCorrect: boolean
}

interface PracticeStats {
  completedQuestions: number
  correctQuestions: number
  streak: number
}

type NextQuestionMode = 'instant' | 'delayed' | 'manual'

interface IntervalTrainerPageProps {
  isActive?: boolean
  onSessionComplete?: (session: PracticeSessionInput) => void
}

const ANSWER_GROUPS: Array<{
  key: StaffAnswerGroup
  label: string
  description: string
}> = [
  { key: 'firstPitch', label: '第一个音', description: '判断谱面左侧音符的音名' },
  { key: 'secondPitch', label: '第二个音', description: '判断谱面右侧音符的音名' },
  { key: 'interval', label: '音程关系', description: '判断两个音之间的音程名称' },
]

const NEXT_QUESTION_MODES: Array<{ id: NextQuestionMode; label: string }> = [
  { id: 'instant', label: '立即' },
  { id: 'delayed', label: '3 秒' },
  { id: 'manual', label: '手动' },
]

const NEXT_QUESTION_DELAYS: Record<Exclude<NextQuestionMode, 'manual'>, number> = {
  instant: 700,
  delayed: 3000,
}

export function IntervalTrainerPage({ isActive = true, onSessionComplete }: IntervalTrainerPageProps) {
  const [clef, setClef] = useState<StaffClefName>('treble')
  const [difficulty, setDifficulty] = useState<StaffDifficultyId>(DEFAULT_STAFF_DIFFICULTY_ID)
  const [nextQuestionMode, setNextQuestionMode] = useState<NextQuestionMode>('instant')
  const [isPracticing, setIsPracticing] = useState(false)
  const [exercise, setExercise] = useState<StaffIntervalExercise | null>(null)
  const [answers, setAnswers] = useState<Partial<Record<StaffAnswerGroup, AnswerState>>>({})
  const [status, setStatus] = useState('选择谱号后开始练习')
  const [questionNumber, setQuestionNumber] = useState(0)
  const [isPlayingNotes, setIsPlayingNotes] = useState(false)
  const [autoPlayNotes, setAutoPlayNotes] = useState(true)
  const [practiceStats, setPracticeStats] = useState<PracticeStats>(() => createEmptyPracticeStats())
  const nextTimerRef = useRef<number | null>(null)
  const playbackTokenRef = useRef(0)
  const statusRef = useRef(status)
  const sessionStartStatsRef = useRef(createEmptyPracticeStats())
  const currentDifficulty = STAFF_DIFFICULTY_LEVELS.find((level) => level.id === difficulty) ?? STAFF_DIFFICULTY_LEVELS[0]
  const answeredCount = Object.keys(answers).length
  const isQuestionComplete = answeredCount === ANSWER_GROUPS.length
  const currentQuestionProgress = `${answeredCount}/${ANSWER_GROUPS.length}`
  const canAdvanceManually = isPracticing && Boolean(exercise) && isQuestionComplete && nextQuestionMode === 'manual'
  const accuracy =
    practiceStats.completedQuestions > 0 ? Math.round((practiceStats.correctQuestions / practiceStats.completedQuestions) * 100) : 0

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    preloadStaffPlaybackSounds()

    return () => {
      clearNextTimer()
      createPlaybackToken()
      stopStaffPlayback()
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      if (isPracticing && exercise && isQuestionComplete) {
        scheduleNextQuestion(nextQuestionMode, questionNumber + 1)
      } else if (isPracticing && exercise && statusRef.current === '已暂停') {
        setStatus(`第 ${questionNumber} 题：观察谱面并完成三项判断`)
      }

      return
    }

    clearNextTimer()
    createPlaybackToken()
    stopStaffPlayback()
    setIsPlayingNotes(false)
    setStatus((currentStatus) => (currentStatus.startsWith('正在') ? '已暂停' : currentStatus))
  }, [isActive])

  function startPractice() {
    const nextStats = createEmptyPracticeStats()
    clearNextTimer()
    setPracticeStats(nextStats)
    sessionStartStatsRef.current = nextStats
    setIsPracticing(true)
    setQuestionNumber(1)
    loadNextExercise(clef, difficulty, 1)
  }

  function stopPractice() {
    recordCurrentSession()
    const nextStats = createEmptyPracticeStats()
    clearNextTimer()
    setIsPracticing(false)
    setExercise(null)
    setAnswers({})
    setIsPlayingNotes(false)
    setQuestionNumber(0)
    setPracticeStats(nextStats)
    sessionStartStatsRef.current = nextStats
    createPlaybackToken()
    stopStaffPlayback()
    setStatus('已停止')
  }

  function loadNextExercise(nextClef = clef, nextDifficulty = difficulty, nextQuestionNumber = questionNumber + 1) {
    clearNextTimer()
    createPlaybackToken()
    stopStaffPlayback()
    const nextExercise = generateStaffIntervalExercise({ clef: nextClef, difficulty: nextDifficulty })
    const nextStatus = `第 ${nextQuestionNumber} 题：观察谱面并完成三项判断`
    setExercise(nextExercise)
    setAnswers({})
    setIsPlayingNotes(false)
    setQuestionNumber(nextQuestionNumber)
    setStatus(nextStatus)

    if (autoPlayNotes) {
      void playExerciseNotes(nextExercise, nextStatus, true)
    }
  }

  function handleClefChange(nextClef: StaffClefName) {
    setClef(nextClef)

    if (!isPracticing) {
      setStatus(`已选择${STAFF_CLEF_LABELS[nextClef]}谱号`)
    }
  }

  async function handlePlayExerciseNotes() {
    if (!exercise || isPlayingNotes) {
      return
    }

    await playExerciseNotes(exercise, status, false)
  }

  async function playExerciseNotes(targetExercise: StaffIntervalExercise, returnStatus: string, isAutomatic: boolean) {
    const token = createPlaybackToken()
    const playbackStatus = isAutomatic ? '正在自动播放本题两个音' : '正在播放本题两个音'
    setIsPlayingNotes(true)
    statusRef.current = playbackStatus
    setStatus(playbackStatus)

    try {
      await playStaffExerciseNotes(targetExercise.firstPitch, targetExercise.secondPitch)
    } catch (error) {
      console.error(error)

      if (isCurrentPlayback(token)) {
        setStatus('音频播放失败，请确认浏览器允许播放声音')
      }
      return
    } finally {
      if (isCurrentPlayback(token)) {
        setIsPlayingNotes(false)
      }
    }

    if (isCurrentPlayback(token) && statusRef.current === playbackStatus) {
      setStatus(returnStatus)
    }
  }

  function handleDifficultyChange(nextDifficulty: StaffDifficultyId) {
    setDifficulty(nextDifficulty)

    if (!isPracticing) {
      setStatus(`已选择${getDifficultyLabel(nextDifficulty)}难度`)
    }
  }

  function handleAutoPlayChange(checked: boolean) {
    const nextStatus = checked ? '已开启自动播放' : '已关闭自动播放'
    setAutoPlayNotes(checked)
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }

  function handleNextQuestionModeChange(nextMode: NextQuestionMode) {
    setNextQuestionMode(nextMode)

    if (isPracticing && exercise && isQuestionComplete) {
      scheduleNextQuestion(nextMode, questionNumber + 1)
      return
    }

    if (!isPracticing) {
      setStatus(`已选择下一题方式：${getNextQuestionModeLabel(nextMode)}`)
    }
  }

  function getCorrectAnswer(group: StaffAnswerGroup): string | null {
    if (!exercise) {
      return null
    }

    if (group === 'firstPitch') return exercise.firstPitchAnswer
    if (group === 'secondPitch') return exercise.secondPitchAnswer
    return exercise.intervalName
  }

  function handleAnswer(group: StaffAnswerGroup, selected: string) {
    if (!exercise || answers[group]) {
      return
    }

    const correctAnswer = getCorrectAnswer(group)

    if (!correctAnswer) {
      return
    }

    const isCorrect = selected === correctAnswer
    const nextAnswers = {
      ...answers,
      [group]: {
        selected,
        isCorrect,
      },
    }
    setAnswers(nextAnswers)

    const answeredCount = Object.keys(nextAnswers).length
    setPracticeStats((currentStats) => {
      if (answeredCount === ANSWER_GROUPS.length) {
        const isQuestionCorrect = ANSWER_GROUPS.every(({ key }) => nextAnswers[key]?.isCorrect)
        return {
          ...currentStats,
          completedQuestions: currentStats.completedQuestions + 1,
          correctQuestions: currentStats.correctQuestions + (isQuestionCorrect ? 1 : 0),
          streak: isQuestionCorrect ? currentStats.streak + 1 : 0,
        }
      }

      return currentStats
    })

    if (answeredCount === ANSWER_GROUPS.length) {
      scheduleNextQuestion(nextQuestionMode, questionNumber + 1)
    } else {
      setStatus(`已完成 ${answeredCount} / ${ANSWER_GROUPS.length} 项判断`)
    }
  }

  function scheduleNextQuestion(mode: NextQuestionMode, nextQuestionNumber: number) {
    clearNextTimer()

    if (mode === 'manual') {
      setStatus('本题完成，可查看答案，点击“下一题”继续')
      return
    }

    const delayMs = NEXT_QUESTION_DELAYS[mode]
    const nextStatus = mode === 'delayed' ? '本题完成，可查看答案，3 秒后进入下一题' : '本题完成，正在进入下一题'
    setStatus(nextStatus)
    nextTimerRef.current = window.setTimeout(() => {
      if (isActive && isPracticing) {
        loadNextExercise(clef, difficulty, nextQuestionNumber)
      }
    }, delayMs)
  }

  function handleManualNextExercise() {
    if (!canAdvanceManually) {
      return
    }

    loadNextExercise(clef, difficulty, questionNumber + 1)
  }

  function recordCurrentSession() {
    const sessionStartStats = sessionStartStatsRef.current
    const completedItems = practiceStats.completedQuestions - sessionStartStats.completedQuestions

    if (completedItems <= 0) {
      return
    }

    const correctItems = practiceStats.correctQuestions - sessionStartStats.correctQuestions
    onSessionComplete?.({
      module: 'interval-trainer',
      completedItems,
      correctItems,
      detail: `${STAFF_CLEF_LABELS[clef]}谱号 · ${currentDifficulty.label}`,
      streak: practiceStats.streak,
    })
    sessionStartStatsRef.current = practiceStats
  }

  function clearNextTimer() {
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current)
      nextTimerRef.current = null
    }
  }

  function createPlaybackToken(): number {
    playbackTokenRef.current += 1
    return playbackTokenRef.current
  }

  function isCurrentPlayback(token: number): boolean {
    return playbackTokenRef.current === token
  }

  return (
    <section className="module-panel" aria-labelledby="interval-trainer-title">
      <header className="module-header interval-header">
        <div>
          <p className="module-kicker">五线谱 · 两音题</p>
          <h1 id="interval-trainer-title">Interval Trainer：音符与音程判断</h1>
        </div>
        <div className="stats-grid" aria-label="五线谱练习统计">
          <StatTile value={practiceStats.completedQuestions} label="完成题" />
          <StatTile value={currentQuestionProgress} label="本题" />
          <StatTile value={`${accuracy}%`} label="正确率" />
          <StatTile value={practiceStats.streak} label="连对" />
        </div>
        <p className="module-summary">程序生成两个音符的五线谱题目，分别判断第一个音、第二个音以及两个音之间的音程关系。</p>
      </header>

      <div className="interval-control-panel">
        <div className="interval-toolbar">
          <div className="compact-select-grid" aria-label="五线谱练习设置">
            <label className="compact-select-field">
              <span>谱号</span>
              <select value={clef} disabled={isPracticing} onChange={(event) => handleClefChange(event.currentTarget.value as StaffClefName)}>
                {Object.entries(STAFF_CLEF_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="compact-select-field">
              <span>难度</span>
              <select
                value={difficulty}
                disabled={isPracticing}
                onChange={(event) => handleDifficultyChange(event.currentTarget.value as StaffDifficultyId)}
              >
                {STAFF_DIFFICULTY_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="compact-select-field">
              <span>下一题</span>
              <select value={nextQuestionMode} onChange={(event) => handleNextQuestionModeChange(event.currentTarget.value as NextQuestionMode)}>
                {NEXT_QUESTION_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="toolbar compact-toolbar" aria-label="五线谱练习控制">
            <label className="switch-field">
              <input type="checkbox" checked={autoPlayNotes} onChange={(event) => handleAutoPlayChange(event.currentTarget.checked)} />
              <span>自动播放</span>
            </label>
            <button type="button" className="primary-action" disabled={isPracticing} onClick={startPractice}>
              开始练习
            </button>
            <button type="button" className="secondary-action" disabled={!exercise || isPlayingNotes} onClick={() => void handlePlayExerciseNotes()}>
              {isPlayingNotes ? '播放中' : '播放两音'}
            </button>
            <button type="button" className="secondary-action" disabled={!canAdvanceManually} onClick={handleManualNextExercise}>
              下一题
            </button>
            <button type="button" className="secondary-action" disabled={!isPracticing} onClick={stopPractice}>
              结束练习
            </button>
          </div>
        </div>

        <div className="interval-context">
          <p className="difficulty-note" aria-label="当前难度约束说明">
            <strong>{currentDifficulty.label}</strong>
            <span>{currentDifficulty.summary}</span>
          </p>
          <div className="status-line tone-neutral" role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </div>

      <div className="staff-stage">
        {exercise ? (
          <StaffNotation clef={exercise.clef} firstPitch={exercise.firstPitch} secondPitch={exercise.secondPitch} />
        ) : (
          <div className="staff-placeholder">点击“开始练习”生成五线谱题目</div>
        )}
      </div>

      <div className="staff-answer-stack" aria-label="五线谱题目答案区">
        {ANSWER_GROUPS.map((group) => (
          <AnswerGroup
            key={group.key}
            group={group.key}
            label={group.label}
            description={group.description}
            choices={exercise?.choices[group.key] ?? []}
            correctAnswer={getCorrectAnswer(group.key)}
            answerState={answers[group.key]}
            disabled={!exercise || !isPracticing}
            onSelect={handleAnswer}
          />
        ))}
      </div>
    </section>
  )
}

function createEmptyPracticeStats(): PracticeStats {
  return {
    completedQuestions: 0,
    correctQuestions: 0,
    streak: 0,
  }
}

function getDifficultyLabel(difficulty: StaffDifficultyId): string {
  return STAFF_DIFFICULTY_LEVELS.find((level) => level.id === difficulty)?.label ?? difficulty
}

function getNextQuestionModeLabel(mode: NextQuestionMode): string {
  return NEXT_QUESTION_MODES.find((option) => option.id === mode)?.label ?? mode
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stat-tile" aria-label={`${label} ${value}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

interface AnswerGroupProps {
  group: StaffAnswerGroup
  label: string
  description: string
  choices: string[]
  correctAnswer: string | null
  answerState: AnswerState | undefined
  disabled: boolean
  onSelect: (group: StaffAnswerGroup, selected: string) => void
}

function AnswerGroup({ group, label, description, choices, correctAnswer, answerState, disabled, onSelect }: AnswerGroupProps) {
  return (
    <section className="answer-row" aria-labelledby={`${group}-title`}>
      <div className="answer-row-label">
        <h2 id={`${group}-title`}>{label}</h2>
        <p>{description}</p>
      </div>
      <div className="choice-grid four-choice" role="group" aria-labelledby={`${group}-title`}>
        {choices.length > 0
          ? choices.map((choice) => {
              const isSelected = answerState?.selected === choice
              const isCorrectChoice = answerState !== undefined && correctAnswer === choice
              const isWrongSelection = answerState !== undefined && isSelected && !isCorrectChoice

              return (
                <button
                  key={choice}
                  type="button"
                  className={`choice-button ${isSelected ? 'is-selected' : ''} ${isCorrectChoice ? 'is-correct' : ''} ${isWrongSelection ? 'is-incorrect' : ''}`}
                  disabled={disabled || answerState !== undefined}
                  onClick={() => onSelect(group, choice)}
                >
                  <span>{choice}</span>
                </button>
              )
            })
          : Array.from({ length: 4 }, (_, index) => (
              <button key={index} type="button" className="choice-button is-empty" disabled>
                <span>--</span>
              </button>
            ))}
      </div>
    </section>
  )
}

export default IntervalTrainerPage
