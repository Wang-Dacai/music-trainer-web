export type NoteStep = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Accidental = 'flat' | 'natural' | 'sharp' | null

export interface Pitch {
  step: NoteStep
  octave: number
  accidental: Accidental
  midiNumber: number
}

const STEP_TO_SEMITONE: Record<NoteStep, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const ACCIDENTAL_TO_OFFSET: Record<Exclude<Accidental, null>, number> = {
  flat: -1,
  natural: 0,
  sharp: 1,
}

export function createPitch(step: NoteStep, octave: number, accidental: Accidental = null): Pitch {
  return {
    step,
    octave,
    accidental,
    midiNumber: toMidiNumber(step, octave, accidental),
  }
}

export function toMidiNumber(step: NoteStep, octave: number, accidental: Accidental = null): number {
  const accidentalOffset = accidental === null ? 0 : ACCIDENTAL_TO_OFFSET[accidental]
  return (octave + 1) * 12 + STEP_TO_SEMITONE[step] + accidentalOffset
}

export function transposeBySemitones(pitch: Pitch, semitones: number): Pitch {
  return fromMidiNumber(pitch.midiNumber + semitones)
}

export function fromMidiNumber(midiNumber: number): Pitch {
  if (!Number.isInteger(midiNumber)) {
    throw new Error(`MIDI 音高必须是整数: ${midiNumber}`)
  }

  const octave = Math.floor(midiNumber / 12) - 1
  const pitchClass = ((midiNumber % 12) + 12) % 12

  switch (pitchClass) {
    case 0:
      return createPitch('C', octave)
    case 1:
      return createPitch('C', octave, 'sharp')
    case 2:
      return createPitch('D', octave)
    case 3:
      return createPitch('D', octave, 'sharp')
    case 4:
      return createPitch('E', octave)
    case 5:
      return createPitch('F', octave)
    case 6:
      return createPitch('F', octave, 'sharp')
    case 7:
      return createPitch('G', octave)
    case 8:
      return createPitch('G', octave, 'sharp')
    case 9:
      return createPitch('A', octave)
    case 10:
      return createPitch('A', octave, 'sharp')
    case 11:
      return createPitch('B', octave)
    default:
      throw new Error(`无法识别的音级: ${pitchClass}`)
  }
}

export function getFrequency(pitch: Pitch): number {
  return 440 * 2 ** ((pitch.midiNumber - 69) / 12)
}

export function formatPitch(pitch: Pitch): string {
  const accidentalText = pitch.accidental === 'sharp' ? '#' : pitch.accidental === 'flat' ? 'b' : ''
  return `${pitch.step}${accidentalText}${pitch.octave}`
}
