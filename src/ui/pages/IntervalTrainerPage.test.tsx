/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IntervalTrainerPage from './IntervalTrainerPage'

vi.mock('../components/StaffNotation', () => ({
  default: () => <div aria-label="五线谱题目">mock staff</div>,
}))

const exerciseOne = {
  id: 'staff-1',
  clef: 'treble',
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
  STAFF_CLEF_LABELS: {
    treble: '高音',
    bass: '低音',
    alto: '中音',
    tenor: '次中音',
  },
  generateStaffIntervalExercise: (...args: unknown[]) => generateStaffIntervalExercise(...args),
}))

describe('IntervalTrainerPage', () => {
  beforeEach(() => {
    generateStaffIntervalExercise.mockReset()
    generateStaffIntervalExercise.mockReturnValueOnce(exerciseOne).mockReturnValueOnce(exerciseTwo)
  })

  afterEach(() => {
    cleanup()
  })

  it('开始后生成五线谱题目，三组作答完成后自动进入下一题', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.click(screen.getByRole('button', { name: '开始游戏' }))

    expect(generateStaffIntervalExercise).toHaveBeenCalledWith({ clef: 'treble' })
    expect(screen.getByRole('status')).toHaveTextContent('第 1 题')
    expect(screen.getByLabelText('五线谱题目')).toHaveTextContent('mock staff')

    await user.click(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' }))
    expect(screen.getByRole('status')).toHaveTextContent('已完成 1 / 3 项判断')
    expect(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'C4' })).toBeDisabled()

    await user.click(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' }))
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'E4' })).toHaveClass('is-correct')
    expect(within(screen.getByRole('group', { name: '第二个音' })).getByRole('button', { name: 'F4' })).toHaveClass('is-incorrect')

    await user.click(within(screen.getByRole('group', { name: '音程关系' })).getByRole('button', { name: '大三度' }))
    expect(screen.getByRole('status')).toHaveTextContent('本题完成，正在进入下一题')

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('第 2 题'), { timeout: 1200 })
    expect(within(screen.getByRole('group', { name: '第一个音' })).getByRole('button', { name: 'G4' })).toBeEnabled()
  })

  it('未开始时可切换谱号，停止后清空当前题目', async () => {
    const user = userEvent.setup()

    render(<IntervalTrainerPage />)
    await user.click(screen.getByRole('button', { name: '低音' }))
    expect(screen.getByRole('status')).toHaveTextContent('已选择低音谱号')

    await user.click(screen.getByRole('button', { name: '开始游戏' }))
    expect(generateStaffIntervalExercise).toHaveBeenCalledWith({ clef: 'bass' })

    await user.click(screen.getByRole('button', { name: '游戏结束' }))
    expect(screen.getByRole('status')).toHaveTextContent('已停止')
    expect(screen.getByText('点击“开始游戏”生成五线谱题目')).toBeInTheDocument()
  })
})
