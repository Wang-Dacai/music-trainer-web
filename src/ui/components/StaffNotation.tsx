import { useEffect, useRef } from 'react'
import VexFlow, { Accidental, Formatter, Renderer, Stave, StaveNote } from 'vexflow/core'
import type { Pitch } from '../../domain/pitch'
import type { StaffClefName } from '../../domain/staffTrainer'

export interface StaffNotationProps {
  clef: StaffClefName
  firstPitch?: Pitch
  secondPitch?: Pitch
  pitches?: readonly Pitch[]
  notationMode?: 'sequence' | 'chord'
  ariaLabel?: string
}

const STAFF_WIDTH = 700
const STAFF_HEIGHT = 230
const VEXFLOW_FONT_BASE = '/fonts/vexflow'

let vexflowFontsReady: Promise<void> | null = null

export function StaffNotation({
  clef,
  firstPitch,
  secondPitch,
  pitches,
  notationMode = 'sequence',
  ariaLabel = '五线谱题目',
}: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function renderStaff() {
      const container = containerRef.current

      if (!container) {
        return
      }

      container.innerHTML = ''
      await ensureVexflowFonts()

      if (isCancelled || containerRef.current !== container) {
        return
      }

      const notes = createNotationNotes({ clef, firstPitch, secondPitch, pitches, notationMode })

      if (notes.length === 0) {
        return
      }

      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(STAFF_WIDTH, STAFF_HEIGHT)

      const context = renderer.getContext()
      context.setFont('Arial', 12)

      const stave = new Stave(36, 62, STAFF_WIDTH - 72)
      stave.addClef(clef).addTimeSignature('4/4')
      stave.setContext(context).draw()

      Formatter.FormatAndDraw(context, stave, notes)
    }

    void renderStaff()

    return () => {
      isCancelled = true
    }
  }, [clef, firstPitch, notationMode, pitches, secondPitch])

  return (
    <div className="staff-notation" aria-label={ariaLabel}>
      <div ref={containerRef} className="staff-notation-canvas" />
    </div>
  )
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

function createNotationNotes({
  clef,
  firstPitch,
  secondPitch,
  pitches,
  notationMode,
}: Pick<StaffNotationProps, 'clef' | 'firstPitch' | 'secondPitch' | 'pitches' | 'notationMode'>): StaveNote[] {
  if (pitches && pitches.length > 0) {
    if (notationMode === 'chord') {
      return [createStaveNote(pitches, clef)]
    }

    return pitches.map((pitch) => createStaveNote([pitch], clef))
  }

  if (!firstPitch || !secondPitch) {
    return []
  }

  return [createStaveNote([firstPitch], clef), createStaveNote([secondPitch], clef)]
}

function createStaveNote(pitches: readonly Pitch[], clef: StaffClefName): StaveNote {
  const staveNote = new StaveNote({
    clef,
    keys: pitches.map(toVexflowKey),
    duration: 'q',
  })

  pitches.forEach((pitch, index) => {
    const accidental = toVexflowAccidental(pitch.accidental)

    if (accidental) {
      staveNote.addModifier(new Accidental(accidental), index)
    }
  })

  return staveNote
}

function toVexflowKey(pitch: Pitch): string {
  const accidental = pitch.accidental === 'sharp' ? '#' : pitch.accidental === 'flat' ? 'b' : ''
  return `${pitch.step.toLowerCase()}${accidental}/${pitch.octave}`
}

function toVexflowAccidental(accidental: Pitch['accidental']): string | null {
  if (accidental === 'sharp') return '#'
  if (accidental === 'flat') return 'b'
  if (accidental === 'natural') return 'n'
  return null
}

export default StaffNotation
