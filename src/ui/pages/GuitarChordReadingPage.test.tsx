/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GuitarChordReadingPage from './GuitarChordReadingPage'

vi.mock('../components/StaffNotation', () => ({
  default: ({ ariaLabel = '五线谱题目' }: { ariaLabel?: string }) => <div aria-label={ariaLabel}>mock chord staff</div>,
}))

describe('GuitarChordReadingPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders a searchable guitar chord reference without practice controls', () => {
    render(<GuitarChordReadingPage />)

    expect(screen.getByRole('heading', { name: '吉他和弦识读' })).toBeInTheDocument()
    expect(screen.getByLabelText('搜索和弦名称')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('找到')
    expect(screen.queryByRole('button', { name: '开始练习' })).not.toBeInTheDocument()
  })

  it('searches Am and shows Chinese name, tones, staff info, and multiple fingerings', async () => {
    const user = userEvent.setup()

    render(<GuitarChordReadingPage />)
    await user.type(screen.getByLabelText('搜索和弦名称'), 'Am')
    await user.click(screen.getByRole('button', { name: /Am A 小三和弦/ }))

    expect(screen.getByRole('heading', { name: /Am A 小三和弦/ })).toBeInTheDocument()
    expect(screen.getByLabelText('和弦组成音')).toHaveTextContent('A（根音）、C（小三音）、E（纯五音）')
    expect(screen.getByLabelText('五线谱信息')).toHaveTextContent('高音谱号：A3、C4、E4')
    expect(screen.getByLabelText('和弦构成音五线谱')).toHaveTextContent('mock chord staff')

    const fingeringSection = screen.getByLabelText('常用吉他指法')
    expect(within(fingeringSection).getAllByText('6弦 → 1弦')).toHaveLength(2)
    expect(within(fingeringSection).getByText('x 0 2 2 1 0')).toBeInTheDocument()
    expect(within(fingeringSection).getByLabelText(/Am 开放式 Am和弦图/)).toBeInTheDocument()
  })

  it('searches G7 and Cmaj7 with stable chord details', async () => {
    const user = userEvent.setup()

    render(<GuitarChordReadingPage />)
    const searchBox = screen.getByLabelText('搜索和弦名称')

    await user.clear(searchBox)
    await user.type(searchBox, 'G7')
    await user.click(screen.getByRole('button', { name: /G7 G 属七和弦/ }))

    expect(screen.getByRole('heading', { name: /G7 G 属七和弦/ })).toBeInTheDocument()
    expect(screen.getByLabelText('和弦组成音')).toHaveTextContent('G（根音）、B（大三音）、D（纯五音）、F（小七音）')
    expect(screen.getByText('3 2 0 0 0 1')).toBeInTheDocument()

    await user.clear(searchBox)
    await user.type(searchBox, 'Cmaj7')
    await user.click(screen.getByRole('button', { name: /Cmaj7 C 大七和弦/ }))

    expect(screen.getByRole('heading', { name: /Cmaj7 C 大七和弦/ })).toBeInTheDocument()
    expect(screen.getByText('C、E、G、B')).toBeInTheDocument()
    expect(screen.getByLabelText('五线谱信息')).toHaveTextContent('C4、E4、G4、B4')
  })

  it('shows an empty state when no chord matches', async () => {
    const user = userEvent.setup()

    render(<GuitarChordReadingPage />)
    await user.type(screen.getByLabelText('搜索和弦名称'), 'H13')

    expect(screen.getByRole('status')).toHaveTextContent('没有找到“H13”相关和弦')
    expect(screen.getByText('请尝试输入 C、Am、G7、Cmaj7，或清空搜索查看全部常见和弦。')).toBeInTheDocument()
  })
})
