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

  it('从参考音域进入随机单音答题，并在答对后更新会话统计', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.click(screen.getByRole('button', { name: '开始' }))

    await screen.findByText('请判断听到的单音')
    expect(playEarTrainingSound).toHaveBeenCalledTimes(8)
    expect(screen.getByRole('button', { name: '练习中' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'C' })).toHaveLength(1)

    await user.click(within(screen.getByLabelText('参考音域和选择音名')).getByRole('button', { name: 'C' }))

    expect(screen.getByRole('status')).toHaveTextContent('正确')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('100%')
    expect(screen.getByText('当前连对').previousElementSibling).toHaveTextContent('1')
  })

  it('答错后显示正确答案，支持清空统计和停止练习', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.click(screen.getByRole('button', { name: '开始' }))
    await screen.findByText('请判断听到的单音')

    await user.click(within(screen.getByLabelText('参考音域和选择音名')).getByRole('button', { name: 'D' }))

    expect(screen.getByRole('status')).toHaveTextContent('错误，答案是 C')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('0%')

    await user.click(screen.getByRole('button', { name: '清空统计' }))
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: '停止' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已停止'))
  })

  it('可在开始前切换音色和音域，并使用所选音域出题', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.selectOptions(screen.getByLabelText('音色'), 'acousticGuitar')
    await user.selectOptions(screen.getByLabelText('音域'), 'twoLineOctave')
    expect(screen.getByRole('status')).toHaveTextContent('已选择 小字二组 C5-B5')
    expect(within(screen.getByLabelText('参考音域和选择音名')).getByRole('button', { name: 'B' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '开始' }))
    await screen.findByText('请判断听到的单音')

    expect(playEarTrainingSound).toHaveBeenCalledTimes(8)
    expect(playEarTrainingSound).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'C', pitch: expect.objectContaining({ octave: 5 }) }),
      'acousticGuitar',
      expect.any(Number),
    )
    expect(playEarTrainingSound).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'C', pitch: expect.objectContaining({ octave: 5 }) }),
      'acousticGuitar',
      expect.any(Number),
    )
  })
})
