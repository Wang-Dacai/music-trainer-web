/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playEarTrainingSound } from '../../audio/earTrainingPlayback'
import EarTrainingPage from './EarTrainingPage'

vi.mock('../../audio/earTrainingPlayback', () => ({
  DEFAULT_EAR_TRAINING_INSTRUMENT_ID: 'grandPiano',
  EAR_TRAINING_INSTRUMENTS: [
    { id: 'grandPiano', label: '三角钢琴', source: 'Salamander Grand Piano' },
    { id: 'acousticGuitar', label: '原声吉他', source: 'tonejs-instruments guitar-acoustic' },
    { id: 'nylonGuitar', label: '尼龙吉他', source: 'tonejs-instruments guitar-nylon' },
    { id: 'violin', label: '小提琴', source: 'tonejs-instruments violin' },
    { id: 'flute', label: '长笛', source: 'tonejs-instruments flute' },
    { id: 'clarinet', label: '单簧管', source: 'tonejs-instruments clarinet' },
    { id: 'organ', label: '风琴', source: 'tonejs-instruments organ' },
  ],
  playEarTrainingSound: vi.fn(() => Promise.resolve()),
  preloadEarTrainingSounds: vi.fn(),
  stopEarTrainingSound: vi.fn(),
}))

describe('EarTrainingPage', () => {
  afterEach(() => {
    cleanup()
    vi.mocked(playEarTrainingSound).mockClear()
    vi.restoreAllMocks()
  })

  it('从参考音阶进入随机单音答题，并在答对后更新会话统计', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))

    await screen.findByText('请判断听到的单音')
    expect(playEarTrainingSound).toHaveBeenCalledTimes(10)
    expect(screen.getByRole('button', { name: '练习中' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'C · 1级' })).toHaveLength(1)

    await user.click(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'C · 1级' }))

    expect(screen.getByRole('status')).toHaveTextContent('正确')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('100%')
    expect(screen.getByText('当前连对').previousElementSibling).toHaveTextContent('1')
  })

  it('答错后显示正确答案，停止练习时清空统计', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await screen.findByText('请判断听到的单音')

    expect(screen.queryByRole('button', { name: '清空统计' })).not.toBeInTheDocument()
    await user.click(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'D · 2级' }))

    expect(screen.getByRole('status')).toHaveTextContent('错误，答案是 C · 1级')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('0%')

    await user.click(screen.getByRole('button', { name: '停止' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已停止'))
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('0%')
  })

  it('停止练习时记录本次单音听辨结果', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()

    render(<EarTrainingPage onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await screen.findByText('请判断听到的单音')
    await user.click(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'C · 1级' }))
    await user.click(screen.getByRole('button', { name: '停止' }))

    expect(onSessionComplete).toHaveBeenCalledWith({
      module: 'ear-training',
      completedItems: 1,
      correctItems: 1,
      detail: 'C 大调 · 中心区 · 三角钢琴',
      streak: 1,
    })
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
  })

  it('切换离开时不记录，并在切回后保留当前单音重播能力', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()

    const { rerender } = render(<EarTrainingPage isActive onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await screen.findByText('请判断听到的单音')

    rerender(<EarTrainingPage isActive={false} onSessionComplete={onSessionComplete} />)

    expect(onSessionComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '重播音阶' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '重播单音' })).toBeEnabled()

    rerender(<EarTrainingPage isActive onSessionComplete={onSessionComplete} />)
    await user.click(screen.getByRole('button', { name: '重播单音' }))
    await screen.findByText('请判断听到的单音')
    await user.click(screen.getByRole('button', { name: '停止' }))

    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
    expect(onSessionComplete).not.toHaveBeenCalled()
  })

  it('可在开始前切换音色和音域，并使用所选音域出题', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.selectOptions(screen.getByLabelText('音色'), 'acousticGuitar')
    await user.selectOptions(screen.getByLabelText('音阶'), 'Bb')
    await user.selectOptions(screen.getByLabelText('音域'), 'high')
    expect(screen.getByRole('status')).toHaveTextContent('已选择 高音区')
    expect(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'Bb · 1级' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'Eb · 4级' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '开始练习' }))
    await screen.findByText('请判断听到的单音')

    expect(playEarTrainingSound).toHaveBeenCalledTimes(10)
    expect(playEarTrainingSound).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ noteName: 'Bb', pitch: expect.objectContaining({ midiNumber: 70 }) }),
      'acousticGuitar',
      expect.any(Number),
    )
    expect(playEarTrainingSound).toHaveBeenLastCalledWith(
      expect.objectContaining({ noteName: 'Bb', pitch: expect.objectContaining({ midiNumber: 70 }) }),
      'acousticGuitar',
      expect.any(Number),
    )
  })

  it('可同时选择两个按钮标签，并自动保留最近两个显示模式', async () => {
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.selectOptions(screen.getByLabelText('音阶'), 'G')

    expect(screen.getByRole('button', { name: '音名' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '级数' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'F# · 7级' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '唱名' }))

    expect(screen.getByRole('button', { name: '音名' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '唱名' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '级数' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByLabelText('参考音阶和选择目标音')).getByRole('button', { name: 'Ti · 7级' })).toBeInTheDocument()
  })

  it('提供多种乐器音色用于单音听辨', () => {
    render(<EarTrainingPage />)

    const instrumentSelect = screen.getByLabelText('音色')

    expect(within(instrumentSelect).getByRole('option', { name: '三角钢琴' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '原声吉他' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '尼龙吉他' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '小提琴' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '长笛' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '单簧管' })).toBeInTheDocument()
    expect(within(instrumentSelect).getByRole('option', { name: '风琴' })).toBeInTheDocument()
  })
})
