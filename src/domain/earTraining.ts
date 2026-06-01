import { createPitch, type Accidental, type NoteStep, type Pitch } from './pitch'

export type EarTrainingScaleId = 'C' | 'G' | 'F' | 'D' | 'Bb' | 'A' | 'Eb' | 'E' | 'Ab'
export type EarTrainingPitchRangeId = 'low' | 'middle' | 'high'
export type EarTrainingAnswerLabelMode = 'noteName' | 'solfege' | 'scaleDegree'

export interface EarTrainingScaleTone {
  step: NoteStep
  accidental: Accidental
  noteName: string
  solfege: string
  scaleDegree: number
  pitchClass: number
}

export interface EarTrainingNote {
  id: string
  noteName: string
  solfege: string
  scaleDegree: number
  pitch: Pitch
  keyboardKey: string
}

export interface EarTrainingScale {
  id: EarTrainingScaleId
  label: string
  tonicName: string
  tonic: EarTrainingScaleTone
  tones: EarTrainingScaleTone[]
}

export interface EarTrainingPitchRange {
  id: EarTrainingPitchRangeId
  label: string
  kicker: string
  octaveOffset: number
}

export interface EarTrainingStats {
  total: number
  correct: number
  streak: number
}

const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'] as const
const KEYBOARD_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const

export const DEFAULT_EAR_TRAINING_SCALE_ID: EarTrainingScaleId = 'C'
export const DEFAULT_EAR_TRAINING_PITCH_RANGE_ID: EarTrainingPitchRangeId = 'middle'
export const DEFAULT_EAR_TRAINING_ANSWER_LABEL_MODES: EarTrainingAnswerLabelMode[] = ['noteName', 'scaleDegree']

export const EAR_TRAINING_SCALES: EarTrainingScale[] = [
  createMajorScale('C', 'C 大调', [
    ['C', null],
    ['D', null],
    ['E', null],
    ['F', null],
    ['G', null],
    ['A', null],
    ['B', null],
  ]),
  createMajorScale('G', 'G 大调', [
    ['G', null],
    ['A', null],
    ['B', null],
    ['C', null],
    ['D', null],
    ['E', null],
    ['F', 'sharp'],
  ]),
  createMajorScale('F', 'F 大调', [
    ['F', null],
    ['G', null],
    ['A', null],
    ['B', 'flat'],
    ['C', null],
    ['D', null],
    ['E', null],
  ]),
  createMajorScale('D', 'D 大调', [
    ['D', null],
    ['E', null],
    ['F', 'sharp'],
    ['G', null],
    ['A', null],
    ['B', null],
    ['C', 'sharp'],
  ]),
  createMajorScale('Bb', 'Bb 大调', [
    ['B', 'flat'],
    ['C', null],
    ['D', null],
    ['E', 'flat'],
    ['F', null],
    ['G', null],
    ['A', null],
  ]),
  createMajorScale('A', 'A 大调', [
    ['A', null],
    ['B', null],
    ['C', 'sharp'],
    ['D', null],
    ['E', null],
    ['F', 'sharp'],
    ['G', 'sharp'],
  ]),
  createMajorScale('Eb', 'Eb 大调', [
    ['E', 'flat'],
    ['F', null],
    ['G', null],
    ['A', 'flat'],
    ['B', 'flat'],
    ['C', null],
    ['D', null],
  ]),
  createMajorScale('E', 'E 大调', [
    ['E', null],
    ['F', 'sharp'],
    ['G', 'sharp'],
    ['A', null],
    ['B', null],
    ['C', 'sharp'],
    ['D', 'sharp'],
  ]),
  createMajorScale('Ab', 'Ab 大调', [
    ['A', 'flat'],
    ['B', 'flat'],
    ['C', null],
    ['D', 'flat'],
    ['E', 'flat'],
    ['F', null],
    ['G', null],
  ]),
]

export const EAR_TRAINING_PITCH_RANGES: EarTrainingPitchRange[] = [
  {
    id: 'low',
    label: '低音区',
    kicker: '低音区',
    octaveOffset: -1,
  },
  {
    id: 'middle',
    label: '中心区',
    kicker: '中心区',
    octaveOffset: 0,
  },
  {
    id: 'high',
    label: '高音区',
    kicker: '高音区',
    octaveOffset: 1,
  },
]

export const EAR_TRAINING_NOTES = getEarTrainingScaleNotes(DEFAULT_EAR_TRAINING_SCALE_ID, DEFAULT_EAR_TRAINING_PITCH_RANGE_ID)
export const EAR_TRAINING_NOTE_NAMES = EAR_TRAINING_NOTES.map((note) => note.noteName)
export const EAR_TRAINING_ANSWER_LABEL_MODES: Array<{ id: EarTrainingAnswerLabelMode; label: string }> = [
  {
    id: 'noteName',
    label: '音名',
  },
  {
    id: 'solfege',
    label: '唱名',
  },
  {
    id: 'scaleDegree',
    label: '级数',
  },
]

export function createInitialEarTrainingStats(): EarTrainingStats {
  return {
    total: 0,
    correct: 0,
    streak: 0,
  }
}

export function recordEarTrainingAnswer(stats: EarTrainingStats, isCorrect: boolean): EarTrainingStats {
  return {
    total: stats.total + 1,
    correct: stats.correct + (isCorrect ? 1 : 0),
    streak: isCorrect ? stats.streak + 1 : 0,
  }
}

export function getEarTrainingAccuracy(stats: EarTrainingStats): number {
  if (stats.total === 0) {
    return 0
  }

  return Math.round((stats.correct / stats.total) * 100)
}

export function getEarTrainingScale(scaleId: EarTrainingScaleId): EarTrainingScale {
  const scale = EAR_TRAINING_SCALES.find((candidate) => candidate.id === scaleId)

  if (!scale) {
    throw new Error(`不支持的单音听辨音阶: ${scaleId}`)
  }

  return scale
}

export function getEarTrainingPitchRange(rangeId: EarTrainingPitchRangeId): EarTrainingPitchRange {
  const range = EAR_TRAINING_PITCH_RANGES.find((candidate) => candidate.id === rangeId)

  if (!range) {
    throw new Error(`不支持的单音听辨音域: ${rangeId}`)
  }

  return range
}

export function getEarTrainingScaleNotes(
  scaleId: EarTrainingScaleId = DEFAULT_EAR_TRAINING_SCALE_ID,
  rangeId: EarTrainingPitchRangeId = DEFAULT_EAR_TRAINING_PITCH_RANGE_ID,
): EarTrainingNote[] {
  const scale = getEarTrainingScale(scaleId)
  const range = getEarTrainingPitchRange(rangeId)
  const tonicOctave = getScaleTonicOctave(scale, range)
  const tonicMidiNumber = createPitch(scale.tonic.step, tonicOctave, scale.tonic.accidental).midiNumber
  let previousMidiNumber = tonicMidiNumber - 1

  return scale.tones.map((tone, index) => {
    let octave = tonicOctave
    let pitch = createPitch(tone.step, octave, tone.accidental)

    while (pitch.midiNumber <= previousMidiNumber) {
      octave += 1
      pitch = createPitch(tone.step, octave, tone.accidental)
    }

    previousMidiNumber = pitch.midiNumber

    return {
      id: String(tone.scaleDegree),
      noteName: tone.noteName,
      solfege: tone.solfege,
      scaleDegree: tone.scaleDegree,
      keyboardKey: KEYBOARD_KEYS[index],
      pitch,
    }
  })
}

export function getEarTrainingScalePlaybackNotes(
  scaleId: EarTrainingScaleId = DEFAULT_EAR_TRAINING_SCALE_ID,
  rangeId: EarTrainingPitchRangeId = DEFAULT_EAR_TRAINING_PITCH_RANGE_ID,
): EarTrainingNote[] {
  const notes = getEarTrainingScaleNotes(scaleId, rangeId)
  const tonic = notes[0]

  return [
    ...notes,
    {
      ...tonic,
      id: tonic.id,
      scaleDegree: 8,
      pitch: createPitch(tonic.pitch.step, tonic.pitch.octave + 1, tonic.pitch.accidental),
    },
    tonic,
  ]
}

export function getEarTrainingNote(
  scaleDegree: number,
  scaleId: EarTrainingScaleId = DEFAULT_EAR_TRAINING_SCALE_ID,
  rangeId: EarTrainingPitchRangeId = DEFAULT_EAR_TRAINING_PITCH_RANGE_ID,
): EarTrainingNote {
  const note = getEarTrainingScaleNotes(scaleId, rangeId).find((candidate) => candidate.scaleDegree === scaleDegree)

  if (!note) {
    throw new Error(`不支持的单音听辨级数: ${scaleDegree}`)
  }

  return note
}

export function pickEarTrainingNote(
  random: () => number = Math.random,
  notes: readonly EarTrainingNote[] = EAR_TRAINING_NOTES,
): EarTrainingNote {
  const value = random()

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(`随机数必须满足 0 <= value < 1: ${value}`)
  }

  if (notes.length === 0) {
    throw new Error('单音听辨音阶至少需要包含一个音')
  }

  return notes[Math.floor(value * notes.length)]
}

export function formatEarTrainingAnswerLabel(note: EarTrainingNote, modes: readonly EarTrainingAnswerLabelMode[]): string {
  const labels = modes.map((mode) => formatEarTrainingAnswerLabelPart(note, mode))
  return labels.join(' · ')
}

function createMajorScale(
  id: EarTrainingScaleId,
  label: string,
  tones: Array<[NoteStep, Accidental]>,
): EarTrainingScale {
  const scaleTones = tones.map(([step, accidental], index) => createScaleTone(step, accidental, index + 1))

  return {
    id,
    label,
    tonicName: scaleTones[0].noteName,
    tonic: scaleTones[0],
    tones: scaleTones,
  }
}

function createScaleTone(step: NoteStep, accidental: Accidental, scaleDegree: number): EarTrainingScaleTone {
  return {
    step,
    accidental,
    noteName: formatNoteName(step, accidental),
    solfege: SOLFEGE[scaleDegree - 1],
    scaleDegree,
    pitchClass: createPitch(step, 0, accidental).midiNumber % 12,
  }
}

function formatEarTrainingAnswerLabelPart(note: EarTrainingNote, mode: EarTrainingAnswerLabelMode): string {
  if (mode === 'noteName') {
    return note.noteName
  }

  if (mode === 'solfege') {
    return note.solfege
  }

  return `${note.scaleDegree}级`
}

function formatNoteName(step: NoteStep, accidental: Accidental): string {
  if (accidental === 'flat') {
    return `${step}b`
  }

  if (accidental === 'sharp') {
    return `${step}#`
  }

  return step
}

function getScaleTonicOctave(scale: EarTrainingScale, range: EarTrainingPitchRange): number {
  const centerOctave = scale.tonic.pitchClass >= 7 ? 3 : 4
  return centerOctave + range.octaveOffset
}
