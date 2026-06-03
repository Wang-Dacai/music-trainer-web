/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playGuitarChordSound, stopGuitarChordPlayback } from '../../audio/guitarChordPlayback'
import { getGuitarChordById } from '../../domain/guitarChords'
import GuitarChordReadingPage from './GuitarChordReadingPage'

vi.mock('../../audio/guitarChordPlayback', () => ({
  DEFAULT_GUITAR_CHORD_PLAYBACK_MODE: 'chord',
  GUITAR_CHORD_PLAYBACK_MODES: [
    { id: 'chord', label: '整和弦' },
    { id: 'arpeggio', label: '分解和弦' },
  ],
  playGuitarChordSound: vi.fn(() => Promise.resolve()),
  stopGuitarChordPlayback: vi.fn(),
}))

vi.mock('../components/StaffNotation', () => ({
  default: ({ ariaLabel = '五线谱题目' }: { ariaLabel?: string }) => <div aria-label={ariaLabel}>mock chord staff</div>,
}))

describe('GuitarChordReadingPage', () => {
  beforeEach(() => {
    vi.mocked(playGuitarChordSound).mockReset()
    vi.mocked(playGuitarChordSound).mockResolvedValue(undefined)
    vi.mocked(stopGuitarChordPlayback).mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders a searchable guitar chord reference without practice controls', () => {
    render(<GuitarChordReadingPage />)

    expect(screen.getByRole('heading', { name: '吉他和弦识读' })).toBeInTheDocument()
    expect(screen.getByLabelText('搜索和弦名称')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '搜索结果状态' })).toHaveTextContent('常见和弦')
    expect(screen.getByLabelText('和弦声音试听')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '开始练习' })).not.toBeInTheDocument()
  })

  it('defaults playback to the whole chord', () => {
    render(<GuitarChordReadingPage />)

    const playbackPanel = screen.getByLabelText('和弦声音试听')
    expect(within(playbackPanel).getByRole('button', { name: '整和弦' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(playbackPanel).getByRole('button', { name: '分解和弦' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(playbackPanel).getByRole('button', { name: '播放整和弦' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('默认播放整和弦')
  })

  it('plays the selected chord as a whole chord by default', async () => {
    const user = userEvent.setup()
    const cChord = getGuitarChordById('C')

    render(<GuitarChordReadingPage />)
    await user.click(screen.getByRole('button', { name: '播放整和弦' }))

    expect(playGuitarChordSound).toHaveBeenCalledWith(cChord?.staffPitches, 'chord')
    await waitFor(() => expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('已播放 C 整和弦'))
  })

  it('can switch to arpeggio playback', async () => {
    const user = userEvent.setup()
    const cChord = getGuitarChordById('C')

    render(<GuitarChordReadingPage />)
    await user.click(screen.getByRole('button', { name: '分解和弦' }))
    expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('已选择分解和弦')

    await user.click(screen.getByRole('button', { name: '播放分解和弦' }))

    expect(playGuitarChordSound).toHaveBeenCalledWith(cChord?.staffPitches, 'arpeggio')
  })

  it('shows playback progress while a chord is playing', async () => {
    const user = userEvent.setup()
    vi.mocked(playGuitarChordSound).mockImplementationOnce(() => new Promise<void>(() => undefined))

    render(<GuitarChordReadingPage />)
    await user.click(screen.getByRole('button', { name: '播放整和弦' }))

    expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('正在播放 C 整和弦')
    expect(screen.getByRole('button', { name: '播放中' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '停止' })).toBeEnabled()
  })

  it('shows an error status when playback fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.mocked(playGuitarChordSound).mockRejectedValueOnce(new Error('audio unavailable'))

    render(<GuitarChordReadingPage />)
    await user.click(screen.getByRole('button', { name: '播放整和弦' }))

    await waitFor(() =>
      expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('音频播放失败，请确认浏览器允许播放声音'),
    )
  })

  it('stops chord playback when the page becomes inactive', async () => {
    const user = userEvent.setup()
    vi.mocked(playGuitarChordSound).mockImplementationOnce(() => new Promise<void>(() => undefined))

    const { rerender } = render(<GuitarChordReadingPage isActive />)
    await user.click(screen.getByRole('button', { name: '播放整和弦' }))
    expect(screen.getByRole('status', { name: '播放状态' })).toHaveTextContent('正在播放 C 整和弦')

    rerender(<GuitarChordReadingPage isActive={false} />)

    await waitFor(() => expect(stopGuitarChordPlayback).toHaveBeenCalled())
    expect(screen.getByRole('status', { name: '播放状态', hidden: true })).toHaveTextContent('已暂停')
  })

  it('shows guitar chord diagrams above staff notation', () => {
    render(<GuitarChordReadingPage />)

    const fingeringSection = screen.getByLabelText('常用吉他指法')
    const staffSection = screen.getByLabelText('五线谱信息')

    expect(fingeringSection.compareDocumentPosition(staffSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('limits a C search to C and C# chord names instead of component tones', async () => {
    const user = userEvent.setup()

    render(<GuitarChordReadingPage />)
    await user.type(screen.getByLabelText('搜索和弦名称'), 'C')

    expect(screen.getByRole('status', { name: '搜索结果状态' })).toHaveTextContent('搜索结果 · 14 个')

    const resultList = screen.getByLabelText('和弦搜索结果')
    expect(within(resultList).getByRole('button', { name: 'C C 大三和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'Cmaj7 C 大七和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'Cm C 小三和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'C7 C 属七和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'Cm7 C 小七和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'Csus4 C 挂四和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'Csus2 C 挂二和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'C# C# 大三和弦' })).toBeInTheDocument()
    expect(within(resultList).getByRole('button', { name: 'C#m C# 小三和弦' })).toBeInTheDocument()
    expect(within(resultList).queryByRole('button', { name: 'Am A 小三和弦' })).not.toBeInTheDocument()
    expect(within(resultList).queryByRole('button', { name: 'F F 大三和弦' })).not.toBeInTheDocument()
    expect(within(resultList).queryByRole('button', { name: 'A A 大三和弦' })).not.toBeInTheDocument()
    expect(within(resultList).queryByRole('button', { name: 'D7 D 属七和弦' })).not.toBeInTheDocument()
    expect(within(resultList).queryByRole('button', { name: 'Dmaj7 D 大七和弦' })).not.toBeInTheDocument()
  })

  it('searches newly added common and enharmonic guitar chords', async () => {
    const user = userEvent.setup()

    render(<GuitarChordReadingPage />)
    const searchBox = screen.getByLabelText('搜索和弦名称')

    await user.type(searchBox, 'F#m')
    await user.click(screen.getByRole('button', { name: /F#m F# 小三和弦/ }))

    expect(screen.getByRole('heading', { name: /F#m F# 小三和弦/ })).toBeInTheDocument()
    expect(screen.getByLabelText('和弦组成音')).toHaveTextContent('F#（根音）、A（小三音）、C#（纯五音）')
    expect(screen.getByLabelText('五线谱信息')).toHaveTextContent('F#4、A4、C#5')

    await user.clear(searchBox)
    await user.type(searchBox, 'Dbm')
    expect(screen.getByRole('button', { name: /C#m C# 小三和弦/ })).toBeInTheDocument()

    await user.clear(searchBox)
    await user.type(searchBox, 'Dsus4')
    await user.click(screen.getByRole('button', { name: /Dsus4 D 挂四和弦/ }))

    expect(screen.getByRole('heading', { name: /Dsus4 D 挂四和弦/ })).toBeInTheDocument()
    expect(screen.getByLabelText('和弦组成音')).toHaveTextContent('D（根音）、G（纯四音）、A（纯五音）')
    expect(screen.getByText('x x 0 2 3 3')).toBeInTheDocument()
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

    expect(screen.getByRole('status', { name: '搜索结果状态' })).toHaveTextContent('没有找到“H13”相关和弦')
    expect(screen.getByText('请尝试输入 C、Am、G7、Cmaj7，或清空搜索查看全部常见和弦。')).toBeInTheDocument()
  })
})
