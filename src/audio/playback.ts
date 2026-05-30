import type { Pitch } from '../domain/pitch'
import { getFrequency } from '../domain/pitch'
import { playTone, type AudioEngineOptions } from './engine'

export interface PitchPlaybackOptions extends AudioEngineOptions {
  durationSeconds?: number
}

export interface IntervalPlaybackOptions extends PitchPlaybackOptions {
  gapSeconds?: number
}

const DEFAULT_NOTE_SECONDS = 0.8
const DEFAULT_GAP_SECONDS = 0.18

export async function playPitch(pitch: Pitch, options: PitchPlaybackOptions = {}): Promise<void> {
  await playTone({
    ...options,
    frequency: getFrequency(pitch),
    durationSeconds: options.durationSeconds ?? DEFAULT_NOTE_SECONDS,
  })
}

export async function playIntervalSequential(
  root: Pitch,
  target: Pitch,
  options: IntervalPlaybackOptions = {},
): Promise<void> {
  const durationSeconds = options.durationSeconds ?? DEFAULT_NOTE_SECONDS
  const gapSeconds = options.gapSeconds ?? DEFAULT_GAP_SECONDS

  await playPitch(root, { ...options, durationSeconds })
  await delay(gapSeconds)
  await playPitch(target, { ...options, durationSeconds })
}

export async function playIntervalHarmonic(
  root: Pitch,
  target: Pitch,
  options: PitchPlaybackOptions = {},
): Promise<void> {
  const durationSeconds = options.durationSeconds ?? DEFAULT_NOTE_SECONDS

  await Promise.all([
    playPitch(root, { ...options, durationSeconds }),
    playPitch(target, { ...options, durationSeconds }),
  ])
}

function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, seconds * 1000)
  })
}
