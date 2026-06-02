import type { GuitarFingering, GuitarStringNumber } from '../../domain/guitarChords'
import { formatFretPattern } from '../../domain/guitarChords'

export interface GuitarChordDiagramProps {
  chordSymbol: string
  fingering: GuitarFingering
}

const STRING_COUNT = 6
const VISIBLE_FRET_COUNT = 5
const DIAGRAM_WIDTH = 220
const DIAGRAM_HEIGHT = 250
const TOP_LABEL_Y = 26
const NUT_Y = 46
const FRET_GAP = 30
const STRING_GAP = 28
const LEFT_X = 36
const RIGHT_X = LEFT_X + STRING_GAP * (STRING_COUNT - 1)
const STRING_NUMBERS: readonly GuitarStringNumber[] = [6, 5, 4, 3, 2, 1]

export function GuitarChordDiagram({ chordSymbol, fingering }: GuitarChordDiagramProps) {
  const baseFret = fingering.baseFret ?? 1
  const maxFret = Math.max(...fingering.frets.filter((fret) => typeof fret === 'number'), baseFret)
  const visibleFretCount = Math.max(VISIBLE_FRET_COUNT, maxFret - baseFret + 1)
  const bottomY = NUT_Y + FRET_GAP * visibleFretCount
  const ariaLabel = `${chordSymbol} ${fingering.name}和弦图，六弦到一弦为 ${formatFretPattern(fingering)}`

  return (
    <svg
      className="guitar-chord-diagram"
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}`}
    >
      <title>{ariaLabel}</title>
      <g aria-hidden="true">
        {STRING_NUMBERS.map((stringNumber, index) => {
          const x = getStringX(index)
          const fret = fingering.frets[index]
          const label = fret === 'x' ? '×' : fret === 0 ? '○' : ''

          return (
            <g key={stringNumber}>
              <text className="diagram-string-label" x={x} y={14} textAnchor="middle">
                {stringNumber}弦
              </text>
              {label ? (
                <text className="diagram-open-muted" x={x} y={TOP_LABEL_Y} textAnchor="middle">
                  {label}
                </text>
              ) : null}
              <line className="diagram-string" x1={x} y1={NUT_Y} x2={x} y2={bottomY} />
            </g>
          )
        })}

        {Array.from({ length: visibleFretCount + 1 }, (_, fretIndex) => {
          const y = NUT_Y + FRET_GAP * fretIndex
          const isNut = fretIndex === 0 && baseFret === 1

          return (
            <line
              key={fretIndex}
              className={isNut ? 'diagram-nut' : 'diagram-fret'}
              x1={LEFT_X}
              y1={y}
              x2={RIGHT_X}
              y2={y}
            />
          )
        })}

        {baseFret > 1 ? (
          <text className="diagram-fret-label" x={RIGHT_X + 14} y={NUT_Y + 19}>
            {baseFret}fr
          </text>
        ) : null}

        {fingering.barres?.map((barre) => {
          const y = getFretY(barre.fret, baseFret)
          const firstStringIndex = getStringIndex(barre.fromString)
          const secondStringIndex = getStringIndex(barre.toString)
          const x1 = getStringX(Math.min(firstStringIndex, secondStringIndex))
          const x2 = getStringX(Math.max(firstStringIndex, secondStringIndex))

          return (
            <g key={`${barre.fret}-${barre.fromString}-${barre.toString}`}>
              <rect
                className="diagram-barre"
                x={x1 - 12}
                y={y - 12}
                width={x2 - x1 + 24}
                height={24}
                rx={12}
              />
              {barre.finger ? (
                <text className="diagram-dot-label" x={(x1 + x2) / 2} y={y + 5} textAnchor="middle">
                  {barre.finger}
                </text>
              ) : null}
            </g>
          )
        })}

        {fingering.frets.map((fret, index) => {
          if (typeof fret !== 'number' || fret === 0 || isCoveredByBarre(fingering, fret, STRING_NUMBERS[index])) {
            return null
          }

          const x = getStringX(index)
          const y = getFretY(fret, baseFret)
          const finger = fingering.fingers?.[index]

          return (
            <g key={`${index}-${fret}`}>
              <circle className="diagram-dot" cx={x} cy={y} r={11} />
              {finger ? (
                <text className="diagram-dot-label" x={x} y={y + 5} textAnchor="middle">
                  {finger}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function getStringX(index: number): number {
  return LEFT_X + STRING_GAP * index
}

function getStringIndex(stringNumber: GuitarStringNumber): number {
  return STRING_NUMBERS.indexOf(stringNumber)
}

function getFretY(fret: number, baseFret: number): number {
  return NUT_Y + FRET_GAP * (fret - baseFret) + FRET_GAP / 2
}

function isCoveredByBarre(fingering: GuitarFingering, fret: number, stringNumber: GuitarStringNumber): boolean {
  return (
    fingering.barres?.some((barre) => {
      const lowString = Math.min(barre.fromString, barre.toString)
      const highString = Math.max(barre.fromString, barre.toString)

      return barre.fret === fret && stringNumber >= lowString && stringNumber <= highString
    }) ?? false
  )
}

export default GuitarChordDiagram
