import { useEffect, useRef, useState } from 'react'
import {
  generateStaffIntervalExercise,
  STAFF_CLEF_LABELS,
  type StaffAnswerGroup,
  type StaffClefName,
  type StaffIntervalExercise,
} from '../../domain/staffTrainer'
import StaffNotation from '../components/StaffNotation'

interface AnswerState {
  selected: string
  isCorrect: boolean
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

export function IntervalTrainerPage() {
  const [clef, setClef] = useState<StaffClefName>('treble')
  const [isPracticing, setIsPracticing] = useState(false)
  const [exercise, setExercise] = useState<StaffIntervalExercise | null>(null)
  const [answers, setAnswers] = useState<Partial<Record<StaffAnswerGroup, AnswerState>>>({})
  const [status, setStatus] = useState('选择谱号后开始练习')
  const [questionNumber, setQuestionNumber] = useState(0)
  const nextTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => clearNextTimer()
  }, [])

  function startPractice() {
    clearNextTimer()
    setIsPracticing(true)
    setQuestionNumber(1)
    loadNextExercise(clef, 1)
  }

  function stopPractice() {
    clearNextTimer()
    setIsPracticing(false)
    setExercise(null)
    setAnswers({})
    setQuestionNumber(0)
    setStatus('已停止')
  }

  function loadNextExercise(nextClef = clef, nextQuestionNumber = questionNumber + 1) {
    clearNextTimer()
    const nextExercise = generateStaffIntervalExercise({ clef: nextClef })
    setExercise(nextExercise)
    setAnswers({})
    setQuestionNumber(nextQuestionNumber)
    setStatus(`第 ${nextQuestionNumber} 题：观察谱面并完成三项判断`)
  }

  function handleClefChange(nextClef: StaffClefName) {
    setClef(nextClef)

    if (!isPracticing) {
      setStatus(`已选择${STAFF_CLEF_LABELS[nextClef]}谱号`)
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

    const nextAnswers = {
      ...answers,
      [group]: {
        selected,
        isCorrect: selected === correctAnswer,
      },
    }
    setAnswers(nextAnswers)

    const answeredCount = Object.keys(nextAnswers).length
    if (answeredCount === ANSWER_GROUPS.length) {
      setStatus('本题完成，正在进入下一题')
      nextTimerRef.current = window.setTimeout(() => {
        if (isPracticing) {
          loadNextExercise(clef, questionNumber + 1)
        }
      }, 700)
    } else {
      setStatus(`已完成 ${answeredCount} / ${ANSWER_GROUPS.length} 项判断`)
    }
  }

  function clearNextTimer() {
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current)
      nextTimerRef.current = null
    }
  }

  return (
    <section className="module-panel" aria-labelledby="interval-trainer-title">
      <header className="module-header compact">
        <div>
          <p className="module-kicker">五线谱 · 两音题</p>
          <h1 id="interval-trainer-title">Interval Trainer：音符与音程判断</h1>
          <p>程序生成两个音符的五线谱题目，分别判断第一个音、第二个音以及两个音之间的音程关系。</p>
        </div>
      </header>

      <div className="interval-toolbar">
        <fieldset className="segmented-field">
          <legend>谱号</legend>
          <div className="segmented-control">
            {Object.entries(STAFF_CLEF_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={clef === key ? 'is-active' : ''}
                aria-pressed={clef === key}
                onClick={() => handleClefChange(key as StaffClefName)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="toolbar compact-toolbar" aria-label="五线谱练习控制">
          <button type="button" className="primary-action" disabled={isPracticing} onClick={startPractice}>
            开始游戏
          </button>
          <button type="button" className="secondary-action" disabled={!isPracticing} onClick={stopPractice}>
            游戏结束
          </button>
        </div>
      </div>

      <div className="status-line tone-neutral" role="status" aria-live="polite">
        {status}
      </div>

      <div className="staff-stage">
        {exercise ? (
          <StaffNotation clef={exercise.clef} firstPitch={exercise.firstPitch} secondPitch={exercise.secondPitch} />
        ) : (
          <div className="staff-placeholder">点击“开始游戏”生成五线谱题目</div>
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
