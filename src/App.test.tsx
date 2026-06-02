/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createPracticeSessionRecord, savePracticeHistory } from './domain/practiceHistory'

vi.mock('./audio/earTrainingPlayback', () => ({
  DEFAULT_EAR_TRAINING_INSTRUMENT_ID: 'grandPiano',
  EAR_TRAINING_INSTRUMENTS: [{ id: 'grandPiano', label: '三角钢琴', source: 'Salamander Grand Piano' }],
  playEarTrainingSound: vi.fn(() => Promise.resolve()),
  preloadEarTrainingSounds: vi.fn(),
  stopEarTrainingSound: vi.fn(),
}))

vi.mock('./audio/staffPlayback', () => ({
  playStaffExerciseNotes: vi.fn(() => Promise.resolve()),
  preloadStaffPlaybackSounds: vi.fn(),
  stopStaffPlayback: vi.fn(),
}))

vi.mock('./ui/components/StaffNotation', () => ({
  default: ({ ariaLabel = '五线谱题目' }: { ariaLabel?: string }) => <div aria-label={ariaLabel}>mock staff</div>,
}))

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('shows practice records below the active trainer and allows deleting a record', async () => {
    const user = userEvent.setup()
    const session = createPracticeSessionRecord(
      {
        module: 'interval-trainer',
        completedItems: 6,
        correctItems: 4,
        detail: '高音谱号 · 入门',
      },
      new Date('2026-05-31T12:05:00.000Z'),
      () => 0.2,
    )
    savePracticeHistory({ sessions: [session] })

    render(<App />)

    const trainerPanel = screen.getByRole('region', { name: 'Ear Training：单音听辨' })
    const recordsPanel = screen.getByRole('region', { name: '练习记录' })
    const recordList = screen.getByLabelText('逐条练习记录')

    expect(trainerPanel.compareDocumentPosition(recordsPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('heading', { name: '练习记录' })).toBeInTheDocument()
    expect(screen.queryByText('练习次数')).not.toBeInTheDocument()
    expect(recordList).toHaveTextContent('五线谱练习')
    expect(recordList).toHaveTextContent('高音谱号 · 入门')

    await user.click(screen.getByRole('button', { name: '删除' }))

    expect(recordList).toHaveTextContent('还没有练习记录')
    expect(window.localStorage.getItem('music-trainer-web:practice-history:v1')).toBe('{"sessions":[]}')
  })

  it('keeps Ear Training progress without recording when switching modules', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await screen.findByText('请判断听到的单音')
    await user.click(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'C · 1级' }))

    await user.click(screen.getByRole('button', { name: /Interval Trainer/ }))

    const recordList = screen.getByLabelText('逐条练习记录')
    expect(recordList).toHaveTextContent('还没有练习记录')
    expect(within(recordList).queryByText('单音听辨')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ear Training/ }))

    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: '停止' }))

    await waitFor(() => expect(recordList).toHaveTextContent('单音听辨'))
    expect(recordList).toHaveTextContent('1/1')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
  })

  it('keeps the active Interval Trainer question when switching modules', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /Interval Trainer/ }))
    await screen.findByRole('heading', { name: 'Interval Trainer：音符与音程判断' })
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    expect(await screen.findByLabelText('五线谱题目')).toHaveTextContent('mock staff')

    await user.click(screen.getByRole('button', { name: /Ear Training/ }))
    await user.click(screen.getByRole('button', { name: /Interval Trainer/ }))

    expect(screen.getByLabelText('五线谱题目')).toHaveTextContent('mock staff')
    expect(screen.getByRole('button', { name: '开始练习' })).toBeDisabled()
  })

  it('opens the guitar chord reference without creating practice records and keeps its browsing state', async () => {
    const user = userEvent.setup()

    render(<App />)
    expect(screen.getByRole('button', { name: /Guitar Chords/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Guitar Chords/ }))
    await screen.findByRole('heading', { name: '吉他和弦识读' })
    await user.type(screen.getByLabelText('搜索和弦名称'), 'Cmaj7')
    await user.click(screen.getByRole('button', { name: /Cmaj7 C 大七和弦/ }))

    const recordList = screen.getByLabelText('逐条练习记录')
    expect(recordList).toHaveTextContent('还没有练习记录')
    expect(screen.getByLabelText('五线谱信息')).toHaveTextContent('C4、E4、G4、B4')

    await user.click(screen.getByRole('button', { name: /Ear Training/ }))
    await user.click(screen.getByRole('button', { name: /Guitar Chords/ }))

    expect(screen.getByLabelText('搜索和弦名称')).toHaveValue('Cmaj7')
    expect(screen.getByRole('heading', { name: /Cmaj7 C 大七和弦/ })).toBeInTheDocument()
    expect(recordList).toHaveTextContent('还没有练习记录')
  })
})
