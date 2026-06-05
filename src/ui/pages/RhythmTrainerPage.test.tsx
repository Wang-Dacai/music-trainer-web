/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playRhythmPatternDemo, stopRhythmPlayback } from '../../audio/rhythmPlayback'
import RhythmTrainerPage from './RhythmTrainerPage'

vi.mock('../../audio/rhythmPlayback', () => ({
  DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID: 'acousticGuitar',
  DEFAULT_RHYTHM_REPEAT_COUNT: 2,
  RHYTHM_DEMO_INSTRUMENTS: [
    { id: 'acousticGuitar', label: '原声吉他', summary: '短音清楚。' },
    { id: 'grandPiano', label: '三角钢琴', summary: '起音明确。' },
  ],
  RHYTHM_REPEAT_OPTIONS: [1, 2, 4],
  playRhythmPatternDemo: vi.fn(() => Promise.resolve()),
  stopRhythmPlayback: vi.fn(),
}))

vi.mock('../components/RhythmPatternView', () => ({
  default: ({ pattern }: { pattern: { title: string; summary: string } }) => (
    <div role="group" aria-label={`节奏型：${pattern.title}`}>
      {pattern.summary}
    </div>
  ),
}))

describe('RhythmTrainerPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders a selectable rhythm reference library without answer controls', () => {
    render(<RhythmTrainerPage />)

    expect(screen.getByRole('heading', { name: 'Rhythm Trainer：节奏参考' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '分类' })).toHaveValue('basic')
    expect(screen.getByRole('combobox', { name: '拍号' })).toHaveValue('4/4')
    expect(screen.getByRole('combobox', { name: '音色' })).toHaveValue('acousticGuitar')
    expect(screen.getByRole('combobox', { name: '旋律' })).toHaveValue('c-major-step')
    expect(screen.getByRole('button', { name: '播放示范' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '开始作答' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '开始练习' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /节奏型：四分音符稳定拍/ })).toHaveTextContent('四个稳定四分音符')
  })

  it('filters patterns and selects a complex rhythm pattern', async () => {
    const user = userEvent.setup()

    render(<RhythmTrainerPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: '分类' }), 'syncopation')
    expect(screen.getByRole('button', { name: /3-3-2/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /3-3-2/ }))

    expect(screen.getByRole('status')).toHaveTextContent('已选择 3-3-2 / Tresillo')
    expect(screen.getByRole('group', { name: /节奏型：3-3-2 \/ Tresillo/ })).toBeInTheDocument()
    expect(screen.getByLabelText('节奏型标签')).toHaveTextContent('综合')
  })

  it('plays the selected pattern with the chosen instrument, melody, and repeat count', async () => {
    const user = userEvent.setup()
    let resolvePlayback: () => void = () => undefined
    vi.mocked(playRhythmPatternDemo).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePlayback = resolve
        }),
    )

    render(<RhythmTrainerPage />)
    await user.selectOptions(screen.getByRole('combobox', { name: '音色' }), 'grandPiano')
    await user.selectOptions(screen.getByRole('combobox', { name: '旋律' }), 'a-minor-pentatonic')
    await user.selectOptions(screen.getByRole('combobox', { name: '遍数' }), '4')
    await user.click(screen.getByLabelText('节奏播放控制').querySelector('input') as HTMLInputElement)
    await user.click(screen.getByRole('button', { name: '播放示范' }))

    expect(playRhythmPatternDemo).toHaveBeenCalledWith(
      expect.objectContaining({ title: '四分音符稳定拍', timeSignature: '4/4' }),
      72,
      { instrumentId: 'grandPiano', keepMetronome: false, melodyPresetId: 'a-minor-pentatonic', repeatCount: 4 },
    )
    expect(screen.getByRole('status')).toHaveTextContent('正在播放 四分音符稳定拍 · 三角钢琴 · A 小调五声')
    expect(screen.getByRole('button', { name: '停止' })).toBeEnabled()

    resolvePlayback()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已播放 四分音符稳定拍'))
  })

  it('stops playback when the page becomes inactive', async () => {
    const user = userEvent.setup()
    let resolvePlayback: () => void = () => undefined
    vi.mocked(playRhythmPatternDemo).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePlayback = resolve
        }),
    )

    const { rerender } = render(<RhythmTrainerPage isActive />)
    await user.click(screen.getByRole('button', { name: '播放示范' }))

    rerender(<RhythmTrainerPage isActive={false} />)

    expect(stopRhythmPlayback).toHaveBeenCalled()
    expect(screen.getByText('已暂停')).toBeInTheDocument()

    resolvePlayback()
  })

  it('shows current sound and rhythm metadata', () => {
    render(<RhythmTrainerPage />)

    const detail = screen.getByRole('article', { name: /四分音符稳定拍 节奏详情/ })
    expect(within(detail).getByText('声音参考')).toBeInTheDocument()
    expect(within(detail).getByText(/短音清楚/)).toBeInTheDocument()
    expect(within(detail).getByText(/C 大调上行/)).toBeInTheDocument()
    expect(within(detail).getByText('发声点')).toBeInTheDocument()
  })
})
