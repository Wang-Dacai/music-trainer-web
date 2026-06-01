import type { Pitch } from '../domain/pitch'
import { DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID, playOnlineSamplePitch, preloadOnlineSampleInstrument, stopOnlineSample } from './onlineSamples'

const STAFF_NOTE_MS = 760
const STAFF_GAP_MS = 180

export function preloadStaffPlaybackSounds(): void {
  preloadOnlineSampleInstrument(DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID)
}

export function stopStaffPlayback(): void {
  stopOnlineSample()
}

export async function playStaffExerciseNotes(firstPitch: Pitch, secondPitch: Pitch): Promise<void> {
  await playOnlineSamplePitch(firstPitch, DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID, STAFF_NOTE_MS)
  await waitForMilliseconds(STAFF_GAP_MS)
  await playOnlineSamplePitch(secondPitch, DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID, STAFF_NOTE_MS)
}

function waitForMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
