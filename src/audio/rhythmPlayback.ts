import { createPitch } from '../domain/pitch'
import {
  DEFAULT_RHYTHM_MELODY_PRESET_ID,
  getRhythmMeasureDurationMs,
  getRhythmMillisecondsPerBeat,
  getRhythmMillisecondsPerTick,
  getRhythmPatternDurationMs,
  getRhythmPatternMelodyEvents,
  getRhythmTimeSignature,
  type RhythmExercise,
  type RhythmMelodyPresetId,
  type RhythmPattern,
} from '../domain/rhythmTrainer'
import {
  ONLINE_SAMPLE_INSTRUMENTS,
  playOnlineSampleSequence,
  stopOnlineSample,
  type OnlineSampleInstrumentId,
  type OnlineSampleSequenceEvent,
} from './onlineSamples'

export type RhythmDemoInstrumentId = Extract<OnlineSampleInstrumentId, 'grandPiano' | 'acousticGuitar' | 'nylonGuitar' | 'organ'>

export interface RhythmDemoInstrument {
  id: RhythmDemoInstrumentId
  label: string
  summary: string
}

export interface RhythmPlaybackOptions {
  keepMetronome?: boolean
  instrumentId?: RhythmDemoInstrumentId
  melodyPresetId?: RhythmMelodyPresetId
  repeatCount?: number
}

export const RHYTHM_DEMO_INSTRUMENTS: RhythmDemoInstrument[] = [
  {
    id: 'acousticGuitar',
    label: '原声吉他',
    summary: '短音清楚、音色自然，适合作为默认节奏参考。',
  },
  {
    id: 'grandPiano',
    label: '三角钢琴',
    summary: '起音明确、延音稳定，适合听复杂切分和附点节奏。',
  },
  {
    id: 'nylonGuitar',
    label: '尼龙吉他',
    summary: '音色更柔和，适合慢速听节奏位置。',
  },
  {
    id: 'organ',
    label: '风琴',
    summary: '音头温和且音高持续，适合听长音和休止后的进入。',
  },
]

export const DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID: RhythmDemoInstrumentId = 'acousticGuitar'
export const RHYTHM_REPEAT_OPTIONS = [1, 2, 4] as const
export const DEFAULT_RHYTHM_REPEAT_COUNT = 2

let playbackToken = 0

export async function playRhythmPatternDemo(pattern: RhythmPattern, bpm: number, options: RhythmPlaybackOptions = {}): Promise<void> {
  stopRhythmPlayback()
  const token = createPlaybackToken()
  const instrumentId = options.instrumentId ?? DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID
  const melodyPresetId = options.melodyPresetId ?? DEFAULT_RHYTHM_MELODY_PRESET_ID
  const repeatCount = normalizeRepeatCount(options.repeatCount)
  const sequence = createRhythmSampleSequence(pattern, bpm, {
    keepMetronome: options.keepMetronome ?? true,
    melodyPresetId,
    repeatCount,
  })

  await playOnlineSampleSequence(sequence, instrumentId, {
    gainScale: 0.72,
    shouldContinue: () => isCurrentPlayback(token),
  })
}

export async function playRhythmExerciseDemo(exercise: RhythmExercise, options: RhythmPlaybackOptions = {}): Promise<void> {
  await playRhythmPatternDemo(exercise.pattern, exercise.bpm, options)
}

export async function playRhythmRecordingGuide(exercise: RhythmExercise, options: RhythmPlaybackOptions = {}): Promise<void> {
  await playRhythmPatternDemo(exercise.pattern, exercise.bpm, {
    ...options,
    repeatCount: 1,
  })
}

export function playRhythmTapFeedback(): void {
  void playOnlineSampleSequence(
    [
      {
        pitches: [createPitch('C', 4)],
        startMs: 0,
        durationMs: 90,
        gainScale: 0.55,
      },
    ],
    DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID,
    { gainScale: 0.55 },
  ).catch(() => undefined)
}

export function stopRhythmPlayback(): void {
  createPlaybackToken()
  stopOnlineSample()
}

export function getRhythmCountInDurationMs(exercise: RhythmExercise): number {
  return getRhythmMeasureDurationMs(exercise.timeSignature, exercise.bpm)
}

export function getRhythmDemoInstrument(instrumentId: RhythmDemoInstrumentId): RhythmDemoInstrument {
  const instrument = RHYTHM_DEMO_INSTRUMENTS.find((candidate) => candidate.id === instrumentId)

  if (!instrument) {
    throw new Error(`不支持的节奏示范音色: ${instrumentId}`)
  }

  return instrument
}

function createRhythmSampleSequence(
  pattern: RhythmPattern,
  bpm: number,
  {
    keepMetronome,
    melodyPresetId,
    repeatCount,
  }: {
    keepMetronome: boolean
    melodyPresetId: RhythmMelodyPresetId
    repeatCount: number
  },
): OnlineSampleSequenceEvent[] {
  const sequence: OnlineSampleSequenceEvent[] = []
  const countInMs = keepMetronome ? getRhythmMeasureDurationMs(pattern.timeSignature, bpm) : 0
  const patternDurationMs = getRhythmPatternDurationMs(pattern, bpm)

  if (keepMetronome) {
    sequence.push(...createCountInEvents(pattern.timeSignature, bpm))
  }

  for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
    sequence.push(...createPatternEvents(pattern, bpm, melodyPresetId, countInMs + repeatIndex * patternDurationMs))
  }

  return sequence
}

function createCountInEvents(timeSignatureId: RhythmPattern['timeSignature'], bpm: number): OnlineSampleSequenceEvent[] {
  const timeSignature = getRhythmTimeSignature(timeSignatureId)
  const beatMs = getRhythmMillisecondsPerBeat(bpm)

  return Array.from({ length: timeSignature.beatsPerMeasure }, (_, beatIndex) => ({
    pitches: [beatIndex === 0 ? createPitch('C', 3) : createPitch('G', 3)],
    startMs: beatIndex * beatMs,
    durationMs: Math.min(150, beatMs * 0.28),
    gainScale: beatIndex === 0 ? 0.62 : 0.46,
  }))
}

function createPatternEvents(
  pattern: RhythmPattern,
  bpm: number,
  melodyPresetId: RhythmMelodyPresetId,
  patternStartMs: number,
): OnlineSampleSequenceEvent[] {
  const millisecondsPerTick = getRhythmMillisecondsPerTick(bpm)
  const ticksPerBeat = getRhythmTimeSignature(pattern.timeSignature).ticksPerBeat

  return getRhythmPatternMelodyEvents(pattern, melodyPresetId)
    .filter((melodyEvent) => melodyEvent.melodyNote !== null)
    .map(({ event, melodyNote }) => {
      const rawDurationMs = event.ticks * millisecondsPerTick
      const isBeatStart = event.startTick % ticksPerBeat === 0

      return {
        pitches: melodyNote ? [melodyNote.pitch] : [],
        startMs: patternStartMs + event.startTick * millisecondsPerTick,
        durationMs: Math.max(90, rawDurationMs * 0.86),
        gainScale: event.isAccent ? 0.95 : isBeatStart ? 0.78 : 0.66,
      }
    })
}

function createPlaybackToken(): number {
  playbackToken += 1
  return playbackToken
}

function isCurrentPlayback(token: number): boolean {
  return playbackToken === token
}

function normalizeRepeatCount(repeatCount = DEFAULT_RHYTHM_REPEAT_COUNT): number {
  if (!Number.isFinite(repeatCount)) {
    return DEFAULT_RHYTHM_REPEAT_COUNT
  }

  return Math.max(1, Math.min(8, Math.round(repeatCount)))
}

export function getRhythmDemoInstrumentSource(instrumentId: RhythmDemoInstrumentId): string {
  return ONLINE_SAMPLE_INSTRUMENTS.find((instrument) => instrument.id === instrumentId)?.source ?? instrumentId
}
