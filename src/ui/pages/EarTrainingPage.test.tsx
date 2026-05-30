/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playPianoSample } from '../../audio/pianoSamples'
import EarTrainingPage from './EarTrainingPage'

vi.mock('../../audio/pianoSamples', () => ({
  playPianoSample: vi.fn(() => Promise.resolve()),
  preloadPianoSamples: vi.fn(),
  stopPianoSample: vi.fn(),
}))

describe('EarTrainingPage', () => {
  afterEach(() => {
    cleanup()
    vi.mocked(playPianoSample).mockClear()
    vi.restoreAllMocks()
  })

  it('从参考音阶进入随机单音答题，并在答对后更新会话统计', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()

    render(<EarTrainingPage />)
    await user.click(screen.getByRole('button', { name: '开始' }))

    await screen.findByText('请判断听到的单音')
    expect(playPianoSample).toHaveBeenCalledTimes(8)
    expect(screen.getByRole('button', { name: '练习中' })).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'C' })).toHaveLength(1)

    await user.click(within(screen.getByLabelText('参考音阶和选择音名')).getByRole('button', { name: 'C' }))

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

    await user.click(within(screen.getByLabelText('参考音阶和选择音名')).getByRole('button', { name: 'D' }))

    expect(screen.getByRole('status')).toHaveTextContent('错误，答案是 C')
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('正确题数').previousElementSibling).toHaveTextContent('0')
    expect(screen.getByText('正确率').previousElementSibling).toHaveTextContent('0%')

    await user.click(screen.getByRole('button', { name: '清空统计' }))
    expect(screen.getByText('总题数').previousElementSibling).toHaveTextContent('0')

    await user.click(screen.getByRole('button', { name: '停止' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('已停止'))
  })
})
