import type { EarTrainingNote } from '../domain/earTraining'
import {
  DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID,
  ONLINE_SAMPLE_INSTRUMENTS,
  playOnlineSamplePitch,
  preloadOnlineSampleInstrument,
  stopOnlineSample,
  type OnlineSampleInstrumentId,
} from './onlineSamples'

export type EarTrainingInstrumentId = OnlineSampleInstrumentId

export interface EarTrainingInstrument {
  id: EarTrainingInstrumentId
  label: string
  source: string
}

export const EAR_TRAINING_INSTRUMENTS: EarTrainingInstrument[] = ONLINE_SAMPLE_INSTRUMENTS.map((instrument) => ({
  id: instrument.id,
  label: instrument.label,
  source: instrument.source,
}))

export const DEFAULT_EAR_TRAINING_INSTRUMENT_ID: EarTrainingInstrumentId = DEFAULT_ONLINE_SAMPLE_INSTRUMENT_ID

export function preloadEarTrainingSounds(instrumentId: EarTrainingInstrumentId): void {
  preloadOnlineSampleInstrument(instrumentId)
}

export async function playEarTrainingSound(
  note: EarTrainingNote,
  instrumentId: EarTrainingInstrumentId,
  durationMs: number,
): Promise<void> {
  await playOnlineSamplePitch(note.pitch, instrumentId, durationMs)
}

export function stopEarTrainingSound(): void {
  stopOnlineSample()
}
