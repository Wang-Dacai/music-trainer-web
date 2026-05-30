import { useEffect, useRef } from 'react'
import VexFlow, { Accidental, Formatter, Renderer, Stave, StaveNote } from 'vexflow/core'
import type { Pitch } from '../../domain/pitch'
import type { StaffClefName } from '../../domain/staffTrainer'

export interface StaffNotationProps {
  clef: StaffClefName
  firstPitch: Pitch
  secondPitch: Pitch
}

const STAFF_WIDTH = 700
const STAFF_HEIGHT = 230
const VEXFLOW_FONT_BASE = '/fonts/vexflow'

let vexflowFontsReady: Promise<void> | null = null

export function StaffNotation({ clef, firstPitch, secondPitch }: StaffNotationProps) {
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

      const renderer = new Renderer(container, Renderer.Backends.SVG)
      renderer.resize(STAFF_WIDTH, STAFF_HEIGHT)

      const context = renderer.getContext()
      context.setFont('Arial', 12)

      const stave = new Stave(36, 62, STAFF_WIDTH - 72)
      stave.addClef(clef).addTimeSignature('4/4')
      stave.setContext(context).draw()

      const notes = [createStaveNote(firstPitch, clef), createStaveNote(secondPitch, clef)]
      Formatter.FormatAndDraw(context, stave, notes)
    }

    void renderStaff()

    return () => {
      isCancelled = true
    }
  }, [clef, firstPitch, secondPitch])

  return (
    <div className="staff-notation" aria-label="五线谱题目">
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

function createStaveNote(pitch: Pitch, clef: StaffClefName): StaveNote {
  const staveNote = new StaveNote({
    clef,
    keys: [toVexflowKey(pitch)],
    duration: 'q',
  })
  const accidental = toVexflowAccidental(pitch.accidental)

  if (accidental) {
    staveNote.addModifier(new Accidental(accidental), 0)
  }

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
