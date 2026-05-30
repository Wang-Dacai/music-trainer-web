import { createPitch, type NoteStep, type Pitch } from './pitch'

export type EarTrainingNoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface EarTrainingNote {
  name: EarTrainingNoteName
  pitch: Pitch
}

export interface EarTrainingStats {
  total: number
  correct: number
  streak: number
}

export const EAR_TRAINING_NOTES: EarTrainingNote[] = [
  createEarTrainingNote('C'),
  createEarTrainingNote('D'),
  createEarTrainingNote('E'),
  createEarTrainingNote('F'),
  createEarTrainingNote('G'),
  createEarTrainingNote('A'),
  createEarTrainingNote('B'),
]

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

export function getEarTrainingNote(name: EarTrainingNoteName): EarTrainingNote {
  const note = EAR_TRAINING_NOTES.find((candidate) => candidate.name === name)

  if (!note) {
    throw new Error(`不支持的单音听辨音名: ${name}`)
  }

  return note
}

export function pickEarTrainingNote(random: () => number = Math.random): EarTrainingNote {
  const value = random()

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(`随机数必须满足 0 <= value < 1: ${value}`)
  }

  return EAR_TRAINING_NOTES[Math.floor(value * EAR_TRAINING_NOTES.length)]
}

function createEarTrainingNote(name: EarTrainingNoteName): EarTrainingNote {
  return {
    name,
    pitch: createPitch(name as NoteStep, 4),
  }
}
