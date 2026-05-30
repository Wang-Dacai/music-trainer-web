import type { EarTrainingNoteName } from '../domain/earTraining'

const SAMPLE_URL_BY_NOTE: Record<EarTrainingNoteName, string> = {
  C: '/audio/ear-training/c4.mp3',
  D: '/audio/ear-training/d4.mp3',
  E: '/audio/ear-training/e4.mp3',
  F: '/audio/ear-training/f4.mp3',
  G: '/audio/ear-training/g4.mp3',
  A: '/audio/ear-training/a4.mp3',
  B: '/audio/ear-training/b4.mp3',
}

interface ActivePlayback {
  audio: HTMLAudioElement
  id: number
}

const audioCache = new Map<EarTrainingNoteName, HTMLAudioElement>()

let activePlayback: ActivePlayback | null = null
let playbackId = 0

export function preloadPianoSamples(): void {
  for (const noteName of Object.keys(SAMPLE_URL_BY_NOTE) as EarTrainingNoteName[]) {
    getAudio(noteName)
  }
}

export async function playPianoSample(noteName: EarTrainingNoteName, durationMs: number): Promise<void> {
  stopPianoSample()

  const audio = getAudio(noteName)
  const currentPlayback = { audio, id: ++playbackId }
  activePlayback = currentPlayback
  audio.currentTime = 0

  try {
    await audio.play()
    await waitForEndedOrTimeout(audio, durationMs)
  } finally {
    if (activePlayback?.id === currentPlayback.id) {
      stopPianoSample()
    }
  }
}

export function stopPianoSample(): void {
  if (!activePlayback) {
    return
  }

  activePlayback.audio.pause()
  activePlayback.audio.currentTime = 0
  activePlayback = null
}

function getAudio(noteName: EarTrainingNoteName): HTMLAudioElement {
  const cached = audioCache.get(noteName)

  if (cached) {
    return cached
  }

  const audio = new Audio(SAMPLE_URL_BY_NOTE[noteName])
  audio.preload = 'auto'
  audioCache.set(noteName, audio)
  return audio
}

function waitForEndedOrTimeout(audio: HTMLAudioElement, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId)
      audio.removeEventListener('ended', finish)
      resolve()
    }

    const timeoutId = window.setTimeout(finish, durationMs)
    audio.addEventListener('ended', finish, { once: true })
  })
}
