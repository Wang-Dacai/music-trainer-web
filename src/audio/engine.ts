export interface AudioEngineOptions {
  waveform?: OscillatorType
  gain?: number
  attackSeconds?: number
  releaseSeconds?: number
}

export interface PlayToneOptions extends AudioEngineOptions {
  frequency: number
  durationSeconds?: number
  startDelaySeconds?: number
}

const DEFAULT_DURATION_SECONDS = 0.8
const DEFAULT_GAIN = 0.18
const DEFAULT_ATTACK_SECONDS = 0.015
const DEFAULT_RELEASE_SECONDS = 0.08
const DEFAULT_WAVEFORM: OscillatorType = 'sine'

let sharedContext: AudioContext | null = null

export async function getAudioContext(): Promise<AudioContext> {
  sharedContext ??= new AudioContext()

  if (sharedContext.state === 'suspended') {
    await Promise.race([sharedContext.resume().catch(() => undefined), waitForMilliseconds(180)])
  }

  return sharedContext
}

export async function playTone(options: PlayToneOptions): Promise<void> {
  const context = await getAudioContext()
  const durationSeconds = options.durationSeconds ?? DEFAULT_DURATION_SECONDS
  const startAt = context.currentTime + (options.startDelaySeconds ?? 0)
  const stopAt = startAt + durationSeconds
  const releaseSeconds = Math.min(options.releaseSeconds ?? DEFAULT_RELEASE_SECONDS, durationSeconds / 2)
  const attackSeconds = Math.min(options.attackSeconds ?? DEFAULT_ATTACK_SECONDS, durationSeconds / 2)
  const gainValue = options.gain ?? DEFAULT_GAIN

  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = options.waveform ?? DEFAULT_WAVEFORM
  oscillator.frequency.setValueAtTime(options.frequency, startAt)

  gainNode.gain.setValueAtTime(0, startAt)
  gainNode.gain.linearRampToValueAtTime(gainValue, startAt + attackSeconds)
  gainNode.gain.setValueAtTime(gainValue, Math.max(startAt + attackSeconds, stopAt - releaseSeconds))
  gainNode.gain.linearRampToValueAtTime(0.0001, stopAt)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(startAt)
  oscillator.stop(stopAt)

  await Promise.race([waitForEnded(oscillator), waitForScheduledStop(stopAt - context.currentTime)])
  oscillator.disconnect()
  gainNode.disconnect()
}

export function closeAudioContext(): void {
  void sharedContext?.close()
  sharedContext = null
}

function waitForEnded(oscillator: OscillatorNode): Promise<void> {
  return new Promise((resolve) => {
    oscillator.addEventListener('ended', () => resolve(), { once: true })
  })
}

function waitForScheduledStop(secondsUntilStop: number): Promise<void> {
  return waitForMilliseconds(Math.max(0, secondsUntilStop * 1000) + 40)
}

function waitForMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
