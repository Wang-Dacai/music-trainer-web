import { useEffect, useMemo, useRef } from 'react'
import VexFlow, { Accidental as VexflowAccidental, Beam, Dot, Formatter, Renderer, Stave, StaveNote } from 'vexflow/core'
import {
  DEFAULT_RHYTHM_MELODY_PRESET_ID,
  getRhythmMelodyPreset,
  getRhythmPatternMelodyEvents,
  getRhythmTimeSignature,
  type RhythmMelodyEvent,
  type RhythmMelodyNote,
  type RhythmMelodyPresetId,
  type RhythmNoteValue,
  type RhythmPattern,
} from '../../domain/rhythmTrainer'

interface RhythmPatternViewProps {
  pattern: RhythmPattern
  melodyPresetId?: RhythmMelodyPresetId
  ariaLabel?: string
}

const STAFF_WIDTH = 780
const STAFF_HEIGHT = 210
const VEXFLOW_FONT_BASE = '/fonts/vexflow'
const TAB_LEFT = 56
const TAB_TOP = 60
const TAB_STRING_GAP = 15
const TAB_HEIGHT = 198
const TAB_MIN_WIDTH = 680
const STRUM_CHORD_PROGRESSIONS: Record<RhythmMelodyPresetId, readonly string[]> = {
  'c-major-step': ['C', 'G', 'Am', 'F'],
  'c-major-arpeggio': ['C', 'G', 'Am', 'F'],
  'a-minor-pentatonic': ['Am', 'G', 'F', 'E'],
  'pop-motif': ['C', 'G', 'Am', 'F'],
}

let vexflowFontsReady: Promise<void> | null = null

export function RhythmPatternView({
  pattern,
  melodyPresetId = DEFAULT_RHYTHM_MELODY_PRESET_ID,
  ariaLabel = `节奏型：${pattern.title}`,
}: RhythmPatternViewProps) {
  const tabWidth = getTabWidth(pattern)
  const staffWidth = getStaffWidth(pattern, getRhythmPatternMelodyEvents(pattern, melodyPresetId).length)
  const melodyPreset = getRhythmMelodyPreset(melodyPresetId)
  const melodyEvents = useMemo(() => getRhythmPatternMelodyEvents(pattern, melodyPresetId), [melodyPresetId, pattern])

  return (
    <div className="rhythm-pattern-view" role="group" aria-label={ariaLabel}>
      <div className="rhythm-notation-grid">
        <section className="rhythm-notation-panel" aria-label="吉他六线谱">
          <div className="rhythm-notation-heading">
            <h3>吉他六线谱</h3>
            <span>扫弦 · {pattern.timeSignature}</span>
          </div>
          <div className="rhythm-tab-scroll">
            <RhythmTabSvg pattern={pattern} melodyEvents={melodyEvents} melodyPresetId={melodyPresetId} width={tabWidth} />
          </div>
        </section>

        <section className="rhythm-notation-panel" aria-label="五线谱">
          <div className="rhythm-notation-heading">
            <h3>五线谱</h3>
            <span>{pattern.timeSignature}</span>
          </div>
          <RhythmStaffNotation pattern={pattern} melodyEvents={melodyEvents} width={staffWidth} />
        </section>
      </div>

      <div className="rhythm-pattern-notes">
        <div>
          <strong>{pattern.summary}</strong>
          <span>{pattern.practiceTip}</span>
        </div>
        <div>
          <strong>{melodyPreset.label}</strong>
          <span>
            {melodyPreset.summary} 数拍：{pattern.countGuide}
          </span>
        </div>
      </div>
    </div>
  )
}

function RhythmTabSvg({
  pattern,
  melodyEvents,
  melodyPresetId,
  width,
}: {
  pattern: RhythmPattern
  melodyEvents: RhythmMelodyEvent[]
  melodyPresetId: RhythmMelodyPresetId
  width: number
}) {
  const timeSignature = getRhythmTimeSignature(pattern.timeSignature)
  const tickWidth = (width - TAB_LEFT - 28) / pattern.totalTicks
  const stringYs = Array.from({ length: 6 }, (_, index) => TAB_TOP + index * TAB_STRING_GAP)
  const beatLines = Array.from({ length: Math.max(0, timeSignature.beatsPerMeasure - 1) }, (_, index) => (index + 1) * timeSignature.ticksPerBeat)
  const barlineTicks = [0, pattern.totalTicks]
  const chordProgression = STRUM_CHORD_PROGRESSIONS[melodyPresetId]

  return (
    <svg className="rhythm-tab-svg" viewBox={`0 0 ${width} ${TAB_HEIGHT}`} role="img" aria-label={`${pattern.title} 吉他扫弦六线谱`}>
      <text className="rhythm-tab-label" x="12" y={stringYs[0] + 4}>
        e
      </text>
      <text className="rhythm-tab-label" x="12" y={stringYs[1] + 4}>
        B
      </text>
      <text className="rhythm-tab-label" x="12" y={stringYs[2] + 4}>
        G
      </text>
      <text className="rhythm-tab-label" x="12" y={stringYs[3] + 4}>
        D
      </text>
      <text className="rhythm-tab-label" x="12" y={stringYs[4] + 4}>
        A
      </text>
      <text className="rhythm-tab-label" x="12" y={stringYs[5] + 4}>
        E
      </text>

      {stringYs.map((y) => (
        <line key={y} className="rhythm-tab-string" x1={TAB_LEFT} y1={y} x2={width - 24} y2={y} />
      ))}

      {beatLines.map((tick) => {
        const x = TAB_LEFT + tick * tickWidth
        return <line key={tick} className="rhythm-tab-beatline" x1={x} y1={TAB_TOP - 7} x2={x} y2={stringYs[5] + 7} />
      })}

      {barlineTicks.map((tick) => {
        const x = TAB_LEFT + tick * tickWidth
        return <line key={tick} className="rhythm-tab-barline" x1={x} y1={TAB_TOP - 12} x2={x} y2={stringYs[5] + 12} />
      })}

      {melodyEvents.map((melodyEvent) => (
        <RhythmTabEvent key={melodyEvent.event.id} melodyEvent={melodyEvent} tickWidth={tickWidth} stringYs={stringYs} timeSignature={timeSignature} chordProgression={chordProgression} />
      ))}
    </svg>
  )
}

function RhythmTabEvent({
  melodyEvent,
  tickWidth,
  stringYs,
  timeSignature,
  chordProgression,
}: {
  melodyEvent: RhythmMelodyEvent
  tickWidth: number
  stringYs: number[]
  timeSignature: ReturnType<typeof getRhythmTimeSignature>
  chordProgression: readonly string[]
}) {
  const { event, melodyNote } = melodyEvent
  const startX = TAB_LEFT + event.startTick * tickWidth
  const endX = TAB_LEFT + (event.startTick + event.ticks) * tickWidth
  const markerX = startX + Math.min(18, Math.max(10, event.ticks * tickWidth * 0.36))
  const restY = TAB_TOP + TAB_STRING_GAP * 2.35

  if (event.kind === 'rest' || !melodyNote) {
    return (
      <g className="rhythm-tab-event rhythm-tab-event-rest">
        <text x={(startX + endX) / 2} y={restY}>
          休
        </text>
        <text className="rhythm-tab-count" x={startX + 2} y={TAB_TOP + TAB_STRING_GAP * 5 + 36}>
          {event.countLabel}
        </text>
      </g>
    )
  }

  const direction = getStrumDirection(event.startTick, event.value, timeSignature.ticksPerBeat)
  const isDown = direction === 'down'
  const strokeTop = stringYs[0] - 3
  const strokeBottom = stringYs[5] + 3
  const strokeStartY = isDown ? strokeTop : strokeBottom
  const strokeEndY = isDown ? strokeBottom : strokeTop
  const arrowHeadPath = isDown
    ? `M ${markerX - 5} ${strokeEndY - 7} L ${markerX} ${strokeEndY + 1} L ${markerX + 5} ${strokeEndY - 7}`
    : `M ${markerX - 5} ${strokeEndY + 7} L ${markerX} ${strokeEndY - 1} L ${markerX + 5} ${strokeEndY + 7}`
  const chordLabel = chordProgression[(melodyEvent.noteIndex ?? 0) % chordProgression.length]

  return (
    <g className="rhythm-tab-event rhythm-tab-event-note">
      {event.isAccent && (
        <text className="rhythm-tab-accent" x={markerX} y={TAB_TOP - 20}>
          &gt;
        </text>
      )}
      <text className="rhythm-tab-chord" x={markerX} y={TAB_TOP - 34}>
        {chordLabel}
      </text>
      <text className="rhythm-tab-direction" x={markerX} y={TAB_TOP - 18}>
        {isDown ? '↓' : '↑'}
      </text>
      <line className="rhythm-strum-stroke" x1={markerX} y1={strokeStartY} x2={markerX} y2={strokeEndY} />
      <path className="rhythm-strum-arrowhead" d={arrowHeadPath} />
      <text className="rhythm-tab-count" x={startX + 2} y={TAB_TOP + TAB_STRING_GAP * 5 + 36}>
        {event.countLabel}
      </text>
    </g>
  )
}

function RhythmStaffNotation({ pattern, melodyEvents, width }: { pattern: RhythmPattern; melodyEvents: RhythmMelodyEvent[]; width: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const noteDescriptors = useMemo(
    () => melodyEvents.map(({ event, melodyNote }) => `${event.kind}:${event.value}:${event.isAccent}:${melodyNote?.label ?? 'rest'}`).join('|'),
    [melodyEvents],
  )

  useEffect(() => {
    let isCancelled = false

    async function renderStaff() {
      const container = containerRef.current

      if (!container) {
        return
      }

      container.innerHTML = ''

      try {
        await ensureVexflowFonts()

        if (isCancelled || containerRef.current !== container) {
          return
        }

        const renderer = new Renderer(container, Renderer.Backends.SVG)
        renderer.resize(width, STAFF_HEIGHT)

        const context = renderer.getContext()
        context.setFont('Arial', 12)

        const stave = new Stave(34, 58, width - 68)
        stave.addClef('treble').addTimeSignature(pattern.timeSignature)
        stave.setContext(context).draw()

        const notes = melodyEvents.map(createRhythmStaveNote)
        const beams = Beam.generateBeams(notes)
        Formatter.FormatAndDraw(context, stave, notes)
        beams.forEach((beam) => {
          beam.setContext(context).draw()
        })
      } catch (error) {
        console.error(error)

        if (!isCancelled && containerRef.current === container) {
          container.innerHTML = '<div class="rhythm-staff-fallback">五线谱渲染失败，请刷新后重试。</div>'
        }
      }
    }

    void renderStaff()

    return () => {
      isCancelled = true
    }
  }, [melodyEvents, noteDescriptors, pattern.timeSignature, width])

  return (
    <div className="rhythm-staff-notation" aria-label={`${pattern.title} 五线谱`}>
      <div ref={containerRef} className="rhythm-staff-canvas" style={{ width, minWidth: width }} />
    </div>
  )
}

function getTabWidth(pattern: RhythmPattern): number {
  return Math.max(TAB_MIN_WIDTH, Math.min(980, pattern.totalTicks * 30 + pattern.events.length * 14 + TAB_LEFT + 56))
}

function getStaffWidth(pattern: RhythmPattern, eventCount: number): number {
  return Math.max(560, Math.min(STAFF_WIDTH, eventCount * 44 + pattern.totalTicks * 12 + 180))
}

function getStrumDirection(startTick: number, noteValue: RhythmNoteValue, ticksPerBeat: number): 'down' | 'up' {
  const beatOffset = startTick % ticksPerBeat

  if (beatOffset === 0) {
    return 'down'
  }

  if (noteValue === 'sixteenth' && beatOffset === ticksPerBeat / 2) {
    return 'down'
  }

  return 'up'
}

function ensureVexflowFonts(): Promise<void> {
  if (!vexflowFontsReady) {
    VexFlow.setFonts('Bravura', 'Academico')
    vexflowFontsReady = Promise.allSettled([
      VexFlow.Font.load('Bravura', `${VEXFLOW_FONT_BASE}/bravura.woff2`, { display: 'block' }),
      VexFlow.Font.load('Academico', `${VEXFLOW_FONT_BASE}/academico.woff2`, { display: 'swap' }),
      VexFlow.Font.load('Academico', `${VEXFLOW_FONT_BASE}/academicobold.woff2`, {
        display: 'swap',
        weight: 'bold',
      }),
    ]).then(() => undefined)
  }

  return vexflowFontsReady
}

function createRhythmStaveNote(melodyEvent: RhythmMelodyEvent): StaveNote {
  const { event, melodyNote } = melodyEvent
  const duration = `${toVexflowDuration(event.value)}${event.kind === 'rest' ? 'r' : ''}`
  const staveNote = new StaveNote({
    clef: 'treble',
    keys: [event.kind === 'note' && melodyNote ? toVexflowKey(melodyNote) : 'b/4'],
    duration,
  })

  if (event.kind === 'note' && melodyNote) {
    const accidental = toVexflowAccidental(melodyNote)

    if (accidental) {
      staveNote.addModifier(new VexflowAccidental(accidental), 0)
    }
  }

  if (isDotted(event.value)) {
    Dot.buildAndAttach([staveNote], { all: true })
  }

  return staveNote
}

function toVexflowDuration(value: RhythmNoteValue): string {
  if (value === 'whole') return 'w'
  if (value === 'half') return 'h'
  if (value === 'quarter') return 'q'
  if (value === 'eighth') return '8'
  if (value === 'sixteenth') return '16'
  if (value === 'dotted-quarter') return 'qd'
  return '8d'
}

function isDotted(value: RhythmNoteValue): boolean {
  return value === 'dotted-quarter' || value === 'dotted-eighth'
}

function toVexflowKey(melodyNote: RhythmMelodyNote): string {
  const pitch = melodyNote.pitch
  const accidental = pitch.accidental === 'sharp' ? '#' : pitch.accidental === 'flat' ? 'b' : ''
  return `${pitch.step.toLowerCase()}${accidental}/${pitch.octave}`
}

function toVexflowAccidental(melodyNote: RhythmMelodyNote): string | null {
  if (melodyNote.pitch.accidental === 'sharp') return '#'
  if (melodyNote.pitch.accidental === 'flat') return 'b'
  if (melodyNote.pitch.accidental === 'natural') return 'n'
  return null
}

export default RhythmPatternView
