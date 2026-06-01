/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playStaffExerciseNotes } from '../../audio/staffPlayback'
import IntervalTrainerPage from './IntervalTrainerPage'

vi.mock('../components/StaffNotation', () => ({
  default: () => <div aria-label="五线谱题目">mock staff</div>,
}))

vi.mock('../../audio/staffPlayback', () => ({
  playStaffExerciseNotes: vi.fn(() => Promise.resolve()),
  preloadStaffPlaybackSounds: vi.fn(),
  stopStaffPlayback: vi.fn(),
}))

const exerciseOne = {
  id: 'staff-1',
  clef: 'treble',
  difficulty: 'beginner',
  firstPitch: { step: 'C', octave: 4, accidental: null, midiNumber: 60 },
  secondPitch: { step: 'E', octave: 4, accidental: null, midiNumber: 64 },
  firstPitchAnswer: 'C4',
  secondPitchAnswer: 'E4',
  intervalName: '大三度',
  choices: {
    firstPitch: ['C4', 'D4', 'E4', 'F4'],
    secondPitch: ['E4', 'F4', 'G4', 'A4'],
    interval: ['大三度', '小三度', '纯四度', '纯五度'],
  },
}

const exerciseTwo = {
  id: 'staff-2',
  clef: 'treble',
  difficulty: 'beginner',
  firstPitch: { step: 'G', octave: 4, accidental: null, midiNumber: 67 },
  secondPitch: { step: 'C', octave: 5, accidental: null, midiNumber: 72 },
  firstPitchAnswer: 'G4',
  secondPitchAnswer: 'C5',
  intervalName: '纯四度',
  choices: {
    firstPitch: ['G4', 'A4', 'B4', 'C5'],
    secondPitch: ['C5', 'D5', 'E5', 'F5'],
    interval: ['纯四度', '大三度', '纯五度', '小六度'],
  },
}

const generateStaffIntervalExercise = vi.fn()

vi.mock('../../domain/staffTrainer', () => ({
  DEFAULT_STAFF_DIFFICULTY_ID: 'beginner',
  STAFF_CLEF_LABELS: {
    treble: '高音',
    bass: '低音',
    alto: '中音',
    tenor: '次中音',
  },
  STAFF_DIFFICULTY_LEVELS: [
    { id: 'beginner', label: '入门', summary: '五线内自然音' },
    { id: 'easy', label: '基础', summary: '完整音域自然音' },
    { id: 'intermediate', label: '进阶', summary: '五线内升降号' },
    { id: 'advanced', label: '挑战', summary: '完整音域完整临时记号' },
  ],
  generateStaffIntervalExercise: (...args: unknown[]) => generateStaffIntervalExercise(...args),
}))

describe('IntervalTrainerPage', () => {
  beforeEach(() => {
    generateStaffIntervalExercise.mockReset()
    vi.mocked(playStaffExerciseNotes).mockClear()
    generateStaffIntervalExercise.mockReturnValueOnce(exerciseOne).mockReturnValueOnce(exerciseTwo)
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('开始后生成五线谱题目，三组作答完成后自动进入下一题', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))

    expect(generateStaffIntervalExercise).toHaveBeenCalledWith({ clef: 'treble', difficulty: 'beginner' })
    expect(playStaffExerciseNotes).toHaveBeenCalledWith(exerciseOne.firstPitch, exerciseOne.secondPitch)
    expect(screen.getByRole('status')).toHaveTextContent('第 1 题')
    expect(screen.getByLabelText('五线谱题目')).toHaveTextContent('mock staff')
    expect(screen.getByText('五线内自然音')).toBeInTheDocument()
    expect(screen.getByLabelText('完成题 0')).toBeInTheDocument()
    expect(screen.getByLabelText('本题 0/3')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()
    expect(screen.getByLabelText('连对 0')).toBeInTheDocument()

    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    expect(screen.getByRole('status')).toHaveTextContent('已完成 1 / 3 项判断')
    expect(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' })).toBeDisabled()
    expect(screen.getByLabelText('本题 1/3')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()

    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' }))
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' })).toHaveClass('is-correct')
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' })).toHaveClass('is-incorrect')
    expect(screen.getByLabelText('本题 2/3')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()

    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))
    expect(screen.getByRole('status')).toHaveTextContent('本题完成，正在进入下一题')
    expect(screen.getByLabelText('完成题 1')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()
    expect(screen.getByLabelText('连对 0')).toBeInTheDocument()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('第 2 题'), { timeout: 1200 })
    expect(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'G4' })).toBeEnabled()
    expect(screen.getByLabelText('本题 0/3')).toBeInTheDocument()
  })

  it('可选择三秒后自动进入下一题', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: '下一题' }), 'delayed')
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' }))
    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))

    expect(screen.getByRole('status')).toHaveTextContent('本题完成，可查看答案，3 秒后进入下一题')
    expect(generateStaffIntervalExercise).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('第 2 题'), { timeout: 3800 })
  }, 6000)

  it('可选择手动进入下一题，答错后保留正确答案', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: '下一题' }), 'manual')
    expect(screen.getByRole('status')).toHaveTextContent('已选择下一题方式：手动')

    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' }))
    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))

    expect(screen.getByRole('status')).toHaveTextContent('本题完成，可查看答案，点击“下一题”继续')
    expect(generateStaffIntervalExercise).toHaveBeenCalledTimes(1)
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' })).toHaveClass('is-correct')
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' })).toHaveClass('is-incorrect')

    await user.click(screen.getByRole('button', { name: '下一题' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('第 2 题'))
    expect(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'G4' })).toBeEnabled()
  })

  it('未开始时可切换谱号，停止后清空当前题目', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: '谱号' }), 'bass')
    expect(screen.getByRole('status')).toHaveTextContent('已选择低音谱号')

    await user.click(screen.getByRole('button', { name: '开始练习' }))
    expect(generateStaffIntervalExercise).toHaveBeenCalledWith({ clef: 'bass', difficulty: 'beginner' })

    await user.click(screen.getByRole('button', { name: '结束练习' }))
    expect(screen.getByRole('status')).toHaveTextContent('已停止')
    expect(screen.getByText('点击“开始练习”生成五线谱题目')).toBeInTheDocument()
    expect(screen.getByLabelText('完成题 0')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()
    expect(screen.getByLabelText('连对 0')).toBeInTheDocument()
  })

  it('结束练习时记录本次五线谱练习结果', async () => {
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()

    render(<IntervalTrainerPage onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' }))
    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))
    await user.click(screen.getByRole('button', { name: '结束练习' }))

    expect(onSessionComplete).toHaveBeenCalledWith({
      module: 'interval-trainer',
      completedItems: 1,
      correctItems: 1,
      detail: '高音谱号 · 入门',
      streak: 1,
    })
    expect(screen.getByLabelText('完成题 0')).toBeInTheDocument()
    expect(screen.getByLabelText('正确率 0%')).toBeInTheDocument()
    expect(screen.getByLabelText('连对 0')).toBeInTheDocument()
  })

  it('切换离开时不记录本次五线谱练习结果', async () => {
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()

    const { rerender } = render(<IntervalTrainerPage isActive onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' }))
    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))

    rerender(<IntervalTrainerPage isActive={false} onSessionComplete={onSessionComplete} />)

    expect(onSessionComplete).not.toHaveBeenCalled()

    rerender(<IntervalTrainerPage isActive onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '结束练习' }))

    expect(onSessionComplete).toHaveBeenCalledWith({
      module: 'interval-trainer',
      completedItems: 1,
      correctItems: 1,
      detail: '高音谱号 · 入门',
      streak: 1,
    })
  })

  it('未完成三项判断时不记录本次五线谱练习结果', async () => {
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()

    render(<IntervalTrainerPage onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    await user.click(screen.getByRole('button', { name: '结束练习' }))

    expect(onSessionComplete).not.toHaveBeenCalled()
  })

  it('未开始时可切换难度，并按所选难度生成题目', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: '难度' }), 'intermediate')
    expect(screen.getByRole('status')).toHaveTextContent('已选择进阶难度')

    await user.click(screen.getByRole('button', { name: '开始练习' }))
    expect(generateStaffIntervalExercise).toHaveBeenCalledWith({ clef: 'treble', difficulty: 'intermediate' })
  })

  it('可播放当前五线谱题目的两个音', async () => {
    const user = userEvent.setup()
    let resolvePlayback: () => void = () => undefined
    vi.mocked(playStaffExerciseNotes).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePlayback = resolve
        }),
    )

    render(<IntervalTrainerPage />)
    await user.click(screen.getByRole('checkbox', { name: '自动播放' }))
    expect(screen.getByRole('status')).toHaveTextContent('已关闭自动播放')
    expect(screen.getByRole('button', { name: '播放两音' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '开始练习' }))
    expect(playStaffExerciseNotes).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '播放两音' }))

    expect(screen.getByRole('status')).toHaveTextContent('正在播放本题两个音')
    expect(playStaffExerciseNotes).toHaveBeenCalledWith(exerciseOne.firstPitch, exerciseOne.secondPitch)
    resolvePlayback()
  })
})
