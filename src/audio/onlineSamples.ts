import type { Pitch } from '../domain/pitch'
import { getAudioContext } from './engine'

export type OnlineSampleInstrumentId = 'grandPiano' | 'acousticGuitar' | 'nylonGuitar' | 'violin' | 'flute' | 'clarinet' | 'organ'

export interface OnlineSampleInstrument {
  id: OnlineSampleInstrumentId
  label: string
  source: string
  sourceUrl: string
  gain: number
  releaseSeconds: number
  samples: Record<string, string>
}

interface ActiveSampleVoice {
  source: AudioBufferSourceNode
  gainNode: GainNode
}

interface ActiveSamplePlayback {
  id: number
  voices: ActiveSampleVoice[]
}

export interface OnlineSamplePlaybackOptions {
  gainScale?: number
  shouldContinue?: () => boolean
}

const PIANO_SAMPLE_BASE_URL = 'https://tonejs.github.io/audio/salamander'
const TONEJS_INSTRUMENT_SAMPLE_BASE_URL = 'https://nbrosowsky.github.io/tonejs-instruments/samples'

export const ONLINE_SAMPLE_INSTRUMENTS: OnlineSampleInstrument[] = [
  {
    id: 'grandPiano',
    label: '三角钢琴',
    source: 'Salamander Grand Piano via Tone.js',
    sourceUrl: 'https://archive.org/details/SalamanderGrandPianoV3',
    gain: 0.9,
    releaseSeconds: 0.12,
    samples: createSalamanderPianoSamples(),
  },
  {
    id: 'acousticGuitar',
    label: '原声吉他',
    source: 'tonejs-instruments guitar-acoustic',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.82,
    releaseSeconds: 0.1,
    samples: createTonejsInstrumentSamples('guitar-acoustic', [
      'D2',
      'D#2',
      'F2',
      'F#2',
      'G2',
      'G#2',
      'A2',
      'A#2',
      'B2',
      'C3',
      'C#3',
      'D3',
      'D#3',
      'E3',
      'F3',
      'F#3',
      'G3',
      'G#3',
      'A3',
      'A#3',
      'B3',
      'C4',
      'C#4',
      'D4',
      'D#4',
      'E4',
      'F4',
      'F#4',
      'G4',
      'G#4',
      'A4',
      'A#4',
      'B4',
      'C5',
      'C#5',
      'D5',
    ]),
  },
  {
    id: 'nylonGuitar',
    label: '尼龙吉他',
    source: 'tonejs-instruments guitar-nylon',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.82,
    releaseSeconds: 0.1,
    samples: createTonejsInstrumentSamples('guitar-nylon', [
      'B1',
      'D2',
      'E2',
      'F#2',
      'G#2',
      'A2',
      'B2',
      'C#3',
      'D3',
      'E3',
      'F#3',
      'G3',
      'A3',
      'B3',
      'C#4',
      'D#4',
      'E4',
      'F#4',
      'G#4',
      'A4',
      'B4',
      'C#5',
      'D5',
      'E5',
      'F#5',
      'G5',
      'G#5',
      'A5',
      'A#5',
    ]),
  },
  {
    id: 'violin',
    label: '小提琴',
    source: 'tonejs-instruments violin',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.76,
    releaseSeconds: 0.18,
    samples: createTonejsInstrumentSamples('violin', [
      'G3',
      'A3',
      'C4',
      'E4',
      'G4',
      'A4',
      'C5',
      'E5',
      'G5',
      'A5',
      'C6',
      'E6',
      'G6',
      'A6',
    ]),
  },
  {
    id: 'flute',
    label: '长笛',
    source: 'tonejs-instruments flute',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.72,
    releaseSeconds: 0.16,
    samples: createTonejsInstrumentSamples('flute', [
      'C4',
      'E4',
      'A4',
      'C5',
      'E5',
      'A5',
      'C6',
      'E6',
      'A6',
      'C7',
    ]),
  },
  {
    id: 'clarinet',
    label: '单簧管',
    source: 'tonejs-instruments clarinet',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.78,
    releaseSeconds: 0.16,
    samples: createTonejsInstrumentSamples('clarinet', [
      'D3',
      'F3',
      'A#3',
      'D4',
      'F4',
      'A#4',
      'D5',
      'F5',
      'A#5',
      'D6',
    ]),
  },
  {
    id: 'organ',
    label: '风琴',
    source: 'tonejs-instruments organ',
    sourceUrl: 'https://github.com/nbrosowsky/tonejs-instruments',
    gain: 0.66,
    releaseSeconds: 0.12,
    samples: createTonejsInstrumentSamples('organ', [
      'C1',
      'D#1',
      'F#1',
      'A1',
      'C2',
      'D#2',
      'F#2',
      'A2',
      'C3',
      'D#3',
      'F#3',
      'A3',
      'C4',
      'D#4',
      'F#4',
      'A4',
      'C5',
      'D#5',
      'F#5',
      'A5',
      'C6',
    ]),
  },
]

export const DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID: OnlineSampleInstrumentId = 'grandPiano'

const audioBufferCache = new Map<string, Promise<AudioBuffer>>()

let activePlayback: ActiveSamplePlayback | null = null
let playbackId = 0

export function getOnlineSampleInstrument(instrumentId: OnlineSampleInstrumentId): OnlineSampleInstrument {
  const instrument = ONLINE_SAMPLE_INSTRUMENTS.find((candidate) => candidate.id === instrumentId)

  if (!instrument) {
    throw new Error(`不支持的在线采样音色: ${instrumentId}`)
  }

  return instrument
}

export function preloadOnlineSampleInstrument(instrumentId: OnlineSampleInstrumentId): void {
  getOnlineSampleInstrument(instrumentId)
}

export async function playOnlineSamplePitch(
  pitch: Pitch,
  instrumentId: OnlineSampleInstrumentId,
  durationMs: number,
): Promise<void> {
  await playOnlineSamplePitches([pitch], instrumentId, durationMs)
}

export async function playOnlineSamplePitches(
  pitches: readonly Pitch[],
  instrumentId: OnlineSampleInstrumentId,
  durationMs: number,
  options: OnlineSamplePlaybackOptions = {},
): Promise<void> {
  stopOnlineSample()

  if (pitches.length === 0) {
    return
  }

  const context = await getAudioContext()
  const instrument = getOnlineSampleInstrument(instrumentId)
  const currentPlayback: ActiveSamplePlayback = { id: ++playbackId, voices: [] }
  activePlayback = currentPlayback

  try {
    const loadedSamples = await Promise.all(
      pitches.map(async (pitch) => {
        const sample = findNearestSample(pitch.midiNumber, instrument.samples)
        const buffer = await loadAudioBuffer(sample.url)

        return { pitch, sample, buffer }
      }),
    )

    if (activePlayback?.id !== currentPlayback.id || options.shouldContinue?.() === false) {
      if (activePlayback?.id === currentPlayback.id) {
        activePlayback = null
      }
      return
    }

    const startAt = context.currentTime
    const durationSeconds = durationMs / 1000
    const stopAt = startAt + durationSeconds
    const releaseSeconds = Math.min(instrument.releaseSeconds, durationSeconds / 2)
    const gainValue = instrument.gain * (options.gainScale ?? 1)

    currentPlayback.voices = loadedSamples.map(({ pitch, sample, buffer }) => {
      const source = context.createBufferSource()
      const gainNode = context.createGain()

      source.buffer = buffer
      source.playbackRate.setValueAtTime(2 ** ((pitch.midiNumber - sample.midiNumber) / 12), startAt)

      gainNode.gain.setValueAtTime(0.0001, startAt)
      gainNode.gain.linearRampToValueAtTime(gainValue, startAt + 0.012)
      gainNode.gain.setValueAtTime(gainValue, Math.max(startAt + 0.012, stopAt - releaseSeconds))
      gainNode.gain.linearRampToValueAtTime(0.0001, stopAt)

      source.connect(gainNode)
      gainNode.connect(context.destination)

      return { source, gainNode }
    })

    currentPlayback.voices.forEach(({ source }) => {
      source.start(startAt)
      source.stop(stopAt + 0.04)
    })

    await Promise.all(currentPlayback.voices.map(({ source }) => waitForSampleEnd(source, durationMs + 80)))
  } catch (error) {
    if (activePlayback?.id === currentPlayback.id) {
      stopOnlineSample()
    }
    throw error
  }

  if (activePlayback?.id === currentPlayback.id) {
    stopOnlineSample()
  }
}

export function stopOnlineSample(): void {
  if (!activePlayback) {
    return
  }

  activePlayback.voices.forEach(({ source, gainNode }) => {
    try {
      source.stop()
    } catch {
      // 采样可能已经按计划结束。
    }
    disconnectNode(source)
    disconnectNode(gainNode)
  })

  activePlayback = null
}

function createSalamanderPianoSamples(): Record<string, string> {
  const notes = ['A0']

  for (let octave = 1; octave <= 7; octave += 1) {
    notes.push(`C${octave}`, `D#${octave}`, `F#${octave}`, `A${octave}`)
  }

  notes.push('C8')

  return Object.fromEntries(notes.map((note) => [note, `${PIANO_SAMPLE_BASE_URL}/${toTonejsSampleFileName(note)}.mp3`]))
}

function createTonejsInstrumentSamples(instrumentName: string, notes: readonly string[]): Record<string, string> {
  return Object.fromEntries(
    notes.map((note) => [note, `${TONEJS_INSTRUMENT_SAMPLE_BASE_URL}/${instrumentName}/${toTonejsSampleFileName(note)}.mp3`]),
  )
}

function toTonejsSampleFileName(note: string): string {
  return note.replace('#', 's')
}

function findNearestSample(targetMidiNumber: number, samples: Record<string, string>): { midiNumber: number; url: string } {
  const entries = Object.entries(samples).map(([noteName, url]) => ({
    midiNumber: noteNameToMidiNumber(noteName),
    url,
  }))

  if (entries.length === 0) {
    throw new Error('在线采样音色至少需要一个采样')
  }

  return entries.reduce((nearest, current) =>
    Math.abs(current.midiNumber - targetMidiNumber) < Math.abs(nearest.midiNumber - targetMidiNumber) ? current : nearest,
  )
}

function noteNameToMidiNumber(noteName: string): number {
  const match = /^([A-G])(#?)(\d+)$/.exec(noteName)

  if (!match) {
    throw new Error(`无法解析采样音名: ${noteName}`)
  }

  const [, step, accidental, octaveText] = match
  const stepToSemitone: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }

  return (Number(octaveText) + 1) * 12 + stepToSemitone[step] + (accidental ? 1 : 0)
}

function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const cached = audioBufferCache.get(url)

  if (cached) {
    return cached
  }

  const loadPromise = getAudioContext()
    .then((context) => fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`在线采样加载失败: ${url}`)
      }

      return response.arrayBuffer().then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
    }))

  audioBufferCache.set(url, loadPromise)
  return loadPromise
}

function waitForSampleEnd(source: AudioBufferSourceNode, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId)
      source.removeEventListener('ended', finish)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, timeoutMs)

    source.addEventListener('ended', finish, { once: true })
  })
}

function disconnectNode(node: AudioNode): void {
  try {
    node.disconnect()
  } catch {
    // 已断开的节点无需处理。
  }
}
