import { createPitch, type NoteStep, type Pitch } from './pitch'

export type EarTrainingNoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type EarTrainingPitchRangeId = 'smallOctave' | 'oneLineOctave' | 'twoLineOctave'

export interface EarTrainingNote {
  name: EarTrainingNoteName
  pitch: Pitch
  keyboardKey: string
}

export interface EarTrainingPitchRange {
  id: EarTrainingPitchRangeId
  label: string
  kicker: string
  notes: EarTrainingNote[]
}

export interface EarTrainingStats {
  total: number
  correct: number
  streak: number
}

export const DEFAULT_EAR_TRAINING_PITCH_RANGE_ID: EarTrainingPitchRangeId = 'oneLineOctave'

export const EAR_TRAINING_PITCH_RANGES: EarTrainingPitchRange[] = [
  createEarTrainingPitchRange('smallOctave', '小字组 C3-B3', '小字组 · C3-B3', 3),
  createEarTrainingPitchRange('oneLineOctave', '小字一组 C4-B4', '小字一组 · C4-B4', 4),
  createEarTrainingPitchRange('twoLineOctave', '小字二组 C5-B5', '小字二组 · C5-B5', 5),
]

export const EAR_TRAINING_NOTES = getEarTrainingPitchRange(DEFAULT_EAR_TRAINING_PITCH_RANGE_ID).notes
export const EAR_TRAINING_NOTE_NAMES = EAR_TRAINING_NOTES.map((note) => note.name)

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

export function getEarTrainingPitchRange(rangeId: EarTrainingPitchRangeId): EarTrainingPitchRange {
  const range = EAR_TRAINING_PITCH_RANGES.find((candidate) => candidate.id === rangeId)

  if (!range) {
    throw new Error(`不支持的单音听辨音域: ${rangeId}`)
  }

  return range
}

export function getEarTrainingNote(
  name: EarTrainingNoteName,
  rangeId: EarTrainingPitchRangeId = DEFAULT_EAR_TRAINING_PITCH_RANGE_ID,
): EarTrainingNote {
  const note = getEarTrainingPitchRange(rangeId).notes.find((candidate) => candidate.name === name)

  if (!note) {
    throw new Error(`不支持的单音听辨音名: ${name}`)
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
    throw new Error('单音听辨音域至少需要包含一个音')
  }

  return notes[Math.floor(value * notes.length)]
}

function createEarTrainingPitchRange(
  id: EarTrainingPitchRangeId,
  label: string,
  kicker: string,
  octave: number,
): EarTrainingPitchRange {
  const steps: EarTrainingNoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

  return {
    id,
    label,
    kicker,
    notes: steps.map((step) => createEarTrainingNote(step, step, octave)),
  }
}

function createEarTrainingNote(name: EarTrainingNoteName, step: NoteStep, octave: number): EarTrainingNote {
  return {
    name,
    keyboardKey: step,
    pitch: createPitch(step, octave),
  }
}
