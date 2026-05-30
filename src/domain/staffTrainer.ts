import { createPitch, type Accidental, type NoteStep, type Pitch } from './pitch'

export type StaffClefName = 'treble' | 'bass' | 'alto' | 'tenor'
export type StaffAnswerGroup = 'firstPitch' | 'secondPitch' | 'interval'

export interface StaffIntervalExercise {
  id: string
  clef: StaffClefName
  firstPitch: Pitch
  secondPitch: Pitch
  firstPitchAnswer: string
  secondPitchAnswer: string
  intervalName: string
  choices: Record<StaffAnswerGroup, string[]>
}

export interface GenerateStaffIntervalExerciseOptions {
  clef: StaffClefName
  random?: () => number
  idFactory?: () => string
  maxAttempts?: number
}

export const STAFF_CLEF_LABELS: Record<StaffClefName, string> = {
  treble: '高音',
  bass: '低音',
  alto: '中音',
  tenor: '次中音',
}

export const STAFF_PITCHES_BY_CLEF: Record<StaffClefName, readonly string[]> = {
  treble: [
    'F3',
    'G3',
    'A3',
    'B3',
    'C4',
    'D4',
    'E4',
    'F4',
    'G4',
    'A4',
    'B4',
    'C5',
    'D5',
    'E5',
    'F5',
    'G5',
    'A5',
    'B5',
    'C6',
    'D6',
    'E6',
  ],
  bass: [
    'A1',
    'B1',
    'C2',
    'D2',
    'E2',
    'F2',
    'G2',
    'A2',
    'B2',
    'C3',
    'D3',
    'E3',
    'F3',
    'G3',
    'A3',
    'B3',
    'C4',
    'D4',
    'E4',
    'F4',
    'G4',
  ],
  alto: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  tenor: ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'],
}

export const STAFF_INTERVAL_NAMES: Record<string, string> = {
  P1: '纯一度',
  A1: '增一度',
  AA1: '倍增一度',
  d2: '减二度',
  m2: '小二度',
  M2: '大二度',
  A2: '增二度',
  AA2: '倍增二度',
  dd2: '倍减二度',
  d3: '减三度',
  m3: '小三度',
  M3: '大三度',
  A3: '增三度',
  AA3: '倍增三度',
  dd3: '倍减三度',
  P4: '纯四度',
  d4: '减四度',
  A4: '增四度',
  AA4: '倍增四度',
  dd4: '倍减四度',
  P5: '纯五度',
  d5: '减五度',
  A5: '增五度',
  AA5: '倍增五度',
  dd5: '倍减五度',
  m6: '小六度',
  M6: '大六度',
  A6: '增六度',
  AA6: '倍增六度',
  dd6: '倍减六度',
  d7: '减七度',
  m7: '小七度',
  M7: '大七度',
  A7: '增七度',
  AA7: '倍增七度',
  dd7: '倍减七度',
  P8: '纯八度',
  d8: '减八度',
  A8: '增八度',
  AA8: '倍增八度',
  dd8: '倍减八度',
}

const STAFF_ACCIDENTALS: Accidental[] = [null, 'sharp', 'flat', 'natural']
const STEP_ORDER: NoteStep[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const PERFECT_BASE_SEMITONES: Record<number, number> = {
  1: 0,
  4: 5,
  5: 7,
  8: 12,
}
const MAJOR_BASE_SEMITONES: Record<number, number> = {
  2: 2,
  3: 4,
  6: 9,
  7: 11,
}

export function generateStaffIntervalExercise(options: GenerateStaffIntervalExerciseOptions): StaffIntervalExercise {
  validateClef(options.clef)

  const random = options.random ?? Math.random
  const maxAttempts = options.maxAttempts ?? 500

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const firstPitch = pickStaffPitch(options.clef, random)
    const secondPitch = pickStaffPitch(options.clef, random)
    const intervalName = calculateStaffIntervalName(firstPitch, secondPitch)

    if (!intervalName) {
      continue
    }

    const firstPitchAnswer = normalizeStaffPitchName(firstPitch)
    const secondPitchAnswer = normalizeStaffPitchName(secondPitch)

    return {
      id: options.idFactory?.() ?? createDefaultStaffExerciseId(),
      clef: options.clef,
      firstPitch,
      secondPitch,
      firstPitchAnswer,
      secondPitchAnswer,
      intervalName,
      choices: {
        firstPitch: buildStaffChoices(firstPitchAnswer, STAFF_PITCHES_BY_CLEF[options.clef], 4, random),
        secondPitch: buildStaffChoices(secondPitchAnswer, STAFF_PITCHES_BY_CLEF[options.clef], 4, random),
        interval: buildStaffChoices(intervalName, Object.values(STAFF_INTERVAL_NAMES), 4, random),
      },
    }
  }

  throw new Error(`无法生成符合音程范围的${STAFF_CLEF_LABELS[options.clef]}谱号题目`)
}

export function parseStaffPitchName(pitchName: string, accidental: Accidental = null): Pitch {
  const match = /^([A-G])(\d+)$/.exec(pitchName)

  if (!match) {
    throw new Error(`无法解析音高名称: ${pitchName}`)
  }

  return createPitch(match[1] as NoteStep, Number(match[2]), accidental)
}

export function normalizeStaffPitchName(pitch: Pick<Pitch, 'step' | 'octave'>): string {
  return `${pitch.step}${pitch.octave}`
}

export function calculateStaffIntervalName(firstPitch: Pitch, secondPitch: Pitch): string | null {
  const intervalNumber = getDiatonicIntervalNumber(firstPitch, secondPitch)
  const semitones = secondPitch.midiNumber - firstPitch.midiNumber

  if (intervalNumber < 1 || intervalNumber > 8 || semitones < 0) {
    return null
  }

  const intervalCode = getIntervalCode(intervalNumber, semitones)

  return intervalCode ? (STAFF_INTERVAL_NAMES[intervalCode] ?? null) : null
}

export function buildStaffChoices(
  correctAnswer: string,
  candidates: readonly string[],
  count = 4,
  random: () => number = Math.random,
): string[] {
  validateChoiceCount(count)

  const uniqueCandidates = [...new Set(candidates)]
  const available = uniqueCandidates.filter((candidate) => candidate !== correctAnswer)

  if (!uniqueCandidates.includes(correctAnswer)) {
    throw new Error(`正确答案不在候选答案中: ${correctAnswer}`)
  }

  if (available.length < count - 1) {
    throw new Error('候选答案数量不足')
  }

  const distractors = shuffleWithRandom(available, random).slice(0, count - 1)
  return shuffleWithRandom([correctAnswer, ...distractors], random)
}

function pickStaffPitch(clef: StaffClefName, random: () => number): Pitch {
  const pitchName = STAFF_PITCHES_BY_CLEF[clef][getRandomIndex(STAFF_PITCHES_BY_CLEF[clef].length, random)]
  const accidental = STAFF_ACCIDENTALS[getRandomIndex(STAFF_ACCIDENTALS.length, random)]

  return parseStaffPitchName(pitchName, accidental)
}

function getDiatonicIntervalNumber(firstPitch: Pick<Pitch, 'step' | 'octave'>, secondPitch: Pick<Pitch, 'step' | 'octave'>): number {
  return getDiatonicIndex(secondPitch) - getDiatonicIndex(firstPitch) + 1
}

function getDiatonicIndex(pitch: Pick<Pitch, 'step' | 'octave'>): number {
  return pitch.octave * STEP_ORDER.length + STEP_ORDER.indexOf(pitch.step)
}

function getIntervalCode(intervalNumber: number, semitones: number): string | null {
  if (intervalNumber in PERFECT_BASE_SEMITONES) {
    const difference = semitones - PERFECT_BASE_SEMITONES[intervalNumber]

    if (difference === 0) return `P${intervalNumber}`
    if (difference === 1) return `A${intervalNumber}`
    if (difference === 2) return `AA${intervalNumber}`
    if (difference === -1) return `d${intervalNumber}`
    if (difference === -2) return `dd${intervalNumber}`

    return null
  }

  if (intervalNumber in MAJOR_BASE_SEMITONES) {
    const difference = semitones - MAJOR_BASE_SEMITONES[intervalNumber]

    if (difference === 0) return `M${intervalNumber}`
    if (difference === -1) return `m${intervalNumber}`
    if (difference === 1) return `A${intervalNumber}`
    if (difference === 2) return `AA${intervalNumber}`
    if (difference === -2) return `d${intervalNumber}`
    if (difference === -3) return `dd${intervalNumber}`

    return null
  }

  return null
}

function validateChoiceCount(count: number): void {
  if (!Number.isInteger(count)) {
    throw new Error(`选项数量必须是整数: ${count}`)
  }

  if (count < 2) {
    throw new Error('选项数量至少为 2')
  }
}

function validateClef(clef: StaffClefName): void {
  if (!(clef in STAFF_PITCHES_BY_CLEF)) {
    throw new Error(`不支持的谱号: ${clef}`)
  }
}

function getRandomIndex(length: number, random: () => number): number {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error(`随机选择长度必须是正整数: ${length}`)
  }

  const value = random()

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error(`随机数必须满足 0 <= value < 1: ${value}`)
  }

  return Math.floor(value * length)
}

function shuffleWithRandom<T>(values: readonly T[], random: () => number): T[] {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1, random)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

function createDefaultStaffExerciseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `staff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
