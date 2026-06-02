import { describe, expect, it } from 'vitest'
import {
  createInitialEarTrainingStats,
  EAR_TRAINING_NOTE_NAMES,
  EAR_TRAINING_PITCH_RANGES,
  EAR_TRAINING_SCALES,
  formatEarTrainingAnswerLabel,
  getEarTrainingAccuracy,
  getEarTrainingNote,
  getEarTrainingPitchRange,
  getEarTrainingScaleNotes,
  getEarTrainingScalePlaybackNotes,
  pickEarTrainingNote,
  recordEarTrainingAnswer,
} from './earTraining'

describe('earTraining', () => {
  it('默认使用 C 大调中心区音阶作为单音听辨范围', () => {
    expect(EAR_TRAINING_NOTE_NAMES).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(getEarTrainingNote(1).pitch.midiNumber).toBe(60)
    expect(getEarTrainingNote(7).pitch.midiNumber).toBe(71)
  })

  it('提供常用大调音阶并保留调号内的升降音', () => {
    expect(EAR_TRAINING_SCALES.map((scale) => scale.label)).toEqual([
      'C 大调',
      'G 大调',
      'F 大调',
      'D 大调',
      'Bb 大调',
      'A 大调',
      'Eb 大调',
      'E 大调',
      'Ab 大调',
    ])
    expect(getEarTrainingScaleNotes('G').map((note) => note.noteName)).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#'])
    expect(getEarTrainingScaleNotes('Bb').map((note) => note.noteName)).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'])
    expect(getEarTrainingScaleNotes('Ab').map((note) => note.noteName)).toEqual(['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'])
  })

  it('按七个上行音阶音和原主音创建参考播放序列', () => {
    const playbackNotes = getEarTrainingScalePlaybackNotes('C', 'middle')

    expect(playbackNotes.map((note) => note.noteName)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'])
    expect(playbackNotes.map((note) => note.pitch.midiNumber)).toEqual([60, 62, 64, 65, 67, 69, 71, 60])
  })

  it('支持低音区、中心区、高音区切换', () => {
    expect(EAR_TRAINING_PITCH_RANGES.map((range) => range.label)).toEqual(['低音区', '中心区', '高音区'])
    expect(getEarTrainingPitchRange('middle').label).toBe('中心区')
    expect(getEarTrainingScaleNotes('C', 'low')[0].pitch.midiNumber).toBe(48)
    expect(getEarTrainingScaleNotes('C', 'middle')[0].pitch.midiNumber).toBe(60)
    expect(getEarTrainingScaleNotes('C', 'high')[0].pitch.midiNumber).toBe(72)
    expect(getEarTrainingScaleNotes('G', 'middle')[0].pitch.midiNumber).toBe(55)
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
    expect(pickEarTrainingNote(() => 0).noteName).toBe('C')
    expect(pickEarTrainingNote(() => 0.999).noteName).toBe('B')
  })

  it('支持按所选按钮模式展示音名、唱名和级数', () => {
    const note = getEarTrainingScaleNotes('Bb')[3]

    expect(formatEarTrainingAnswerLabel(note, ['noteName'])).toBe('Eb')
    expect(formatEarTrainingAnswerLabel(note, ['noteName', 'scaleDegree'])).toBe('Eb · 4级')
    expect(formatEarTrainingAnswerLabel(note, ['solfege', 'scaleDegree'])).toBe('Fa · 4级')
  })
})
