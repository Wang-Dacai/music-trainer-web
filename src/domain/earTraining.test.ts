import { describe, expect, it } from 'vitest'
import {
  createInitialEarTrainingStats,
  EAR_TRAINING_NOTE_NAMES,
  getEarTrainingAccuracy,
  getEarTrainingNote,
  pickEarTrainingNote,
  recordEarTrainingAnswer,
} from './earTraining'

describe('earTraining', () => {
  it('使用小字一组 C 到 B 作为单音听辨范围', () => {
    expect(EAR_TRAINING_NOTE_NAMES).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(getEarTrainingNote('C').pitch.midiNumber).toBe(60)
    expect(getEarTrainingNote('B').pitch.midiNumber).toBe(71)
  })

  it('能记录总题数、正确题数、正确率和当前连对', () => {
    const initial = createInitialEarTrainingStats()
    const first = recordEarTrainingAnswer(initial, true)
    const second = recordEarTrainingAnswer(first, false)

    expect(second).toEqual({
      total: 2,
      correct: 1,
      streak: 0,
    })
    expect(getEarTrainingAccuracy(second)).toBe(50)
  })

  it('能使用可控随机源选择目标单音', () => {
    expect(pickEarTrainingNote(() => 0).name).toBe('C')
    expect(pickEarTrainingNote(() => 0.999).name).toBe('B')
  })
})
