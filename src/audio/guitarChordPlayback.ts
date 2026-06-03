import type { Pitch } from '../domain/pitch'
import { playOnlineSamplePitches, stopOnlineSample } from './onlineSamples'

export type GuitarChordPlaybackMode = 'chord' | 'arpeggio'

export interface GuitarChordPlaybackModeOption {
  id: GuitarChordPlaybackMode
  label: string
}

export const DEFAULT_GUITAR_CHORD_PLAYBACK_MODE: GuitarChordPlaybackMode = 'chord'

export const GUITAR_CHORD_PLAYBACK_MODES: GuitarChordPlaybackModeOption[] = [
  { id: 'chord', label: '整和弦' },
  { id: 'arpeggio', label: '分解和弦' },
]

const GUITAR_CHORD_INSTRUMENT_ID = 'acousticGuitar'
const CHORD_DURATION_MS = 1400
const ARPEGGIO_NOTE_DURATION_MS = 520
const ARPEGGIO_GAP_MS = 90

let playbackToken = 0

export async function playGuitarChordSound(
  pitches: readonly Pitch[],
  mode: GuitarChordPlaybackMode = DEFAULT_GUITAR_CHORD_PLAYBACK_MODE,
): Promise<void> {
  const token = createPlaybackToken()

  if (mode === 'arpeggio') {
    await playGuitarChordArpeggio(pitches, token)
    return
  }

  await playOnlineSamplePitches(pitches, GUITAR_CHORD_INSTRUMENT_ID, CHORD_DURATION_MS, {
    gainScale: getChordGainScale(pitches),
    shouldContinue: () => isCurrentPlayback(token),
  })
}

export function stopGuitarChordPlayback(): void {
  createPlaybackToken()
  stopOnlineSample()
}

async function playGuitarChordArpeggio(pitches: readonly Pitch[], token: number): Promise<void> {
  for (let index = 0; index < pitches.length; index += 1) {
    if (!isCurrentPlayback(token)) {
      return
    }

    await playOnlineSamplePitches([pitches[index]], GUITAR_CHORD_INSTRUMENT_ID, ARPEGGIO_NOTE_DURATION_MS, {
      shouldContinue: () => isCurrentPlayback(token),
    })

    if (index < pitches.length - 1) {
      await delay(ARPEGGIO_GAP_MS)
    }
  }
}

function createPlaybackToken(): number {
  playbackToken += 1
  return playbackToken
}

function isCurrentPlayback(token: number): boolean {
  return playbackToken === token
}

function getChordGainScale(pitches: readonly Pitch[]): number {
  return Math.min(0.82, 1 / Math.sqrt(Math.max(1, pitches.length)))
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
