/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRhythmPatternById } from '../../domain/rhythmTrainer'
import RhythmPatternView from './RhythmPatternView'

vi.mock('vexflow/core', () => {
  class Renderer {
    static Backends = { SVG: 'svg' }

    resize = vi.fn()

    getContext() {
      return { setFont: vi.fn() }
    }
  }

  class Stave {
    addClef() {
      return this
    }

    addTimeSignature() {
      return this
    }

    setContext() {
      return this
    }

    draw() {
      return this
    }
  }

  class StaveNote {
    addModifier() {
      return this
    }
  }

  class Accidental {}
  class BeamMock {
    setContext() {
      return this
    }

    draw() {
      return this
    }
  }

  return {
    default: {
      setFonts: vi.fn(),
      Font: { load: vi.fn(() => Promise.resolve()) },
    },
    Accidental,
    Beam: { generateBeams: vi.fn(() => [new BeamMock()]) },
    Dot: { buildAndAttach: vi.fn() },
    Formatter: { FormatAndDraw: vi.fn() },
    Renderer,
    Stave,
    StaveNote,
  }
})

describe('RhythmPatternView', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders guitar tab, staff notation containers, and rhythm notes', () => {
    const pattern = getRhythmPatternById('basic-4-4-quarter-rest')

    render(<RhythmPatternView pattern={pattern} />)

    expect(screen.getByRole('group', { name: /节奏型：第二拍休止/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '吉他六线谱' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '五线谱' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /第二拍休止 吉他扫弦六线谱/ })).toBeInTheDocument()
    expect(screen.getByText('第二拍休止的四分节奏')).toBeInTheDocument()
    expect(screen.getByText('休止拍也要在心里数出来，第三拍再进入。')).toBeInTheDocument()
    expect(screen.getByText(/数拍：1 · 3 · 4/)).toBeInTheDocument()
    expect(screen.getByText(/C 大调上行/)).toBeInTheDocument()
  })

  it('shows accent and rest markers in the six-line tab', () => {
    const pattern = getRhythmPatternById('sync-4-4-tresillo')

    render(<RhythmPatternView pattern={pattern} />)

    const tab = screen.getByRole('img', { name: /3-3-2 \/ Tresillo 吉他扫弦六线谱/ })
    expect(within(tab).getByText('>')).toBeInTheDocument()
    expect(within(tab).queryByText('x')).not.toBeInTheDocument()
    expect(within(tab).getAllByText('↓').length).toBeGreaterThan(0)
    expect(within(tab).getByText('↑')).toBeInTheDocument()
    expect(within(tab).getByText('C')).toBeInTheDocument()
    expect(within(tab).getAllByText('G').length).toBeGreaterThan(0)
    expect(screen.getByText(/数拍：1 · 2 & · 4/)).toBeInTheDocument()
  })
})
