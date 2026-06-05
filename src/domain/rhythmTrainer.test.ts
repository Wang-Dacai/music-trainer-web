import { describe, expect, it } from 'vitest'
import {
  createInitialRhythmStats,
  DEFAULT_RHYTHM_BPM,
  generateRhythmExercise,
  getRhythmAccuracy,
  getRhythmAverageScore,
  getRhythmMelodyPreset,
  getRhythmMillisecondsPerTick,
  getRhythmPatternById,
  getRhythmPatternMelodyEvents,
  getRhythmPatterns,
  getRhythmTicksForValue,
  getRhythmTimeSignature,
  judgeRhythmTaps,
  recordRhythmAnswer,
} from './rhythmTrainer'

describe('rhythmTrainer', () => {
  it('calculates time signature and note value ticks', () => {
    expect(getRhythmTimeSignature('4/4').ticksPerMeasure).toBe(16)
    expect(getRhythmTimeSignature('3/4').ticksPerMeasure).toBe(12)
    expect(getRhythmTimeSignature('2/4').ticksPerMeasure).toBe(8)

    expect(getRhythmTicksForValue('quarter')).toBe(4)
    expect(getRhythmTicksForValue('eighth')).toBe(2)
    expect(getRhythmTicksForValue('half')).toBe(8)
    expect(getRhythmTicksForValue('whole')).toBe(16)
    expect(getRhythmTicksForValue('dotted-quarter')).toBe(6)
    expect(getRhythmTicksForValue('dotted-eighth')).toBe(3)
  })

  it('generates deterministic rhythm exercises with continuous event starts', () => {
    const exercise = generateRhythmExercise({
      difficulty: 'beginner',
      timeSignature: '4/4',
      bpm: 72,
      random: () => 0,
      idFactory: () => 'rhythm-fixed',
    })

    expect(exercise.id).toBe('rhythm-fixed')
    expect(exercise.pattern.id).toBe('basic-4-4-quarters')
    expect(exercise.pattern.totalTicks).toBe(16)
    expect(exercise.pattern.expectedOnsets).toEqual([0, 4, 8, 12])
    expect(exercise.pattern.events.map((event) => event.startTick)).toEqual([0, 4, 8, 12])
    expect(exercise.pattern.events.map((event) => event.countLabel)).toEqual(['1', '2', '3', '4'])
    expect(exercise.pattern.title).toBe('四分音符稳定拍')
  })

  it('keeps rests out of expected onsets and only requires long note onsets', () => {
    const restExercise = generateRhythmExercise({ difficulty: 'beginner', timeSignature: '4/4', random: () => 0.6 })
    expect(restExercise.pattern.id).toBe('basic-4-4-quarter-rest')
    expect(restExercise.pattern.expectedOnsets).toEqual([0, 8, 12])

    const wholeExercise = generateRhythmExercise({ difficulty: 'beginner', timeSignature: '4/4', random: () => 0.9 })
    expect(wholeExercise.pattern.id).toBe('basic-4-4-whole')
    expect(wholeExercise.pattern.expectedOnsets).toEqual([0])
  })

  it('filters rhythm patterns and exposes common complex references', () => {
    const syncopationPatterns = getRhythmPatterns({ category: 'syncopation', timeSignature: '4/4' })
    expect(syncopationPatterns.map((pattern) => pattern.id)).toContain('sync-4-4-tresillo')
    expect(syncopationPatterns.map((pattern) => pattern.id)).toContain('sync-4-4-charleston')

    const drummerPatterns = getRhythmPatterns({ category: 'drummer', difficulty: 'advanced' })
    expect(drummerPatterns.map((pattern) => pattern.id)).toContain('drummer-4-4-funk-ghost')
    expect(drummerPatterns.map((pattern) => pattern.id)).toContain('drummer-4-4-bossa-cell')

    const tresillo = getRhythmPatternById('sync-4-4-tresillo')
    expect(tresillo.expectedOnsets).toEqual([0, 6, 12])
    expect(tresillo.countGuide).toBe('1 · 2 & · 4')
  })

  it('maps rhythm onsets to selectable melody presets and guitar tab positions', () => {
    const tresillo = getRhythmPatternById('sync-4-4-tresillo')
    const melodyPreset = getRhythmMelodyPreset('a-minor-pentatonic')
    const melodyEvents = getRhythmPatternMelodyEvents(tresillo, melodyPreset.id)

    expect(melodyPreset.label).toBe('A 小调五声')
    expect(melodyEvents.filter((event) => event.melodyNote !== null).map((event) => event.melodyNote?.label)).toEqual(['A3', 'C4', 'D4'])
    expect(melodyEvents.filter((event) => event.melodyNote !== null).map((event) => event.melodyNote?.tab)).toEqual([
      { string: 3, fret: 2 },
      { string: 2, fret: 1 },
      { string: 2, fret: 3 },
    ])
  })

  it('generates templates for supported meters and difficulties', () => {
    expect(generateRhythmExercise({ difficulty: 'easy', timeSignature: '3/4', random: () => 0 }).pattern.totalTicks).toBe(12)
    expect(generateRhythmExercise({ difficulty: 'easy', timeSignature: '2/4', random: () => 0 }).pattern.totalTicks).toBe(8)
    expect(generateRhythmExercise({ difficulty: 'intermediate', timeSignature: '3/4', random: () => 0 }).pattern.totalTicks).toBe(12)
    expect(generateRhythmExercise({ difficulty: 'intermediate', timeSignature: '2/4', random: () => 0 }).pattern.totalTicks).toBe(8)
  })

  it('judges accurate taps as correct', () => {
    const exercise = generateRhythmExercise({ difficulty: 'beginner', timeSignature: '4/4', random: () => 0, bpm: DEFAULT_RHYTHM_BPM })
    const millisecondsPerTick = getRhythmMillisecondsPerTick(DEFAULT_RHYTHM_BPM)
    const taps = exercise.pattern.expectedOnsets.map((tick) => tick * millisecondsPerTick)

    const judgement = judgeRhythmTaps(exercise.pattern, taps, DEFAULT_RHYTHM_BPM, 'beginner')

    expect(judgement.hitCount).toBe(4)
    expect(judgement.missCount).toBe(0)
    expect(judgement.extraCount).toBe(0)
    expect(judgement.score).toBe(100)
    expect(judgement.isCorrect).toBe(true)
  })

  it('accepts taps inside tolerance and rejects misses or extras', () => {
    const exercise = generateRhythmExercise({ difficulty: 'beginner', timeSignature: '4/4', random: () => 0, bpm: 60 })
    const millisecondsPerTick = getRhythmMillisecondsPerTick(60)
    const expected = exercise.pattern.expectedOnsets.map((tick) => tick * millisecondsPerTick)

    const insideTolerance = judgeRhythmTaps(exercise.pattern, expected.map((time) => time + 80), 60, 'beginner')
    expect(insideTolerance.hitCount).toBe(4)
    expect(insideTolerance.missCount).toBe(0)
    expect(insideTolerance.extraCount).toBe(0)
    expect(insideTolerance.isCorrect).toBe(true)

    const missed = judgeRhythmTaps(exercise.pattern, [0, expected[1], expected[2]], 60, 'beginner')
    expect(missed.hitCount).toBe(3)
    expect(missed.missCount).toBe(1)
    expect(missed.isCorrect).toBe(false)

    const extra = judgeRhythmTaps(exercise.pattern, [...expected, expected[3] + 260], 60, 'beginner')
    expect(extra.extraCount).toBe(1)
    expect(extra.isCorrect).toBe(false)
  })

  it('updates rhythm practice stats', () => {
    const stats = createInitialRhythmStats()
    const correctJudgement = {
      expectedCount: 4,
      hitCount: 4,
      missCount: 0,
      extraCount: 0,
      averageErrorMs: 20,
      score: 96,
      isCorrect: true,
      matches: [],
    }
    const wrongJudgement = {
      ...correctJudgement,
      hitCount: 3,
      missCount: 1,
      score: 70,
      isCorrect: false,
    }

    const afterCorrect = recordRhythmAnswer(stats, correctJudgement)
    const afterWrong = recordRhythmAnswer(afterCorrect, wrongJudgement)

    expect(afterCorrect).toEqual({ completedQuestions: 1, correctQuestions: 1, streak: 1, totalScore: 96, latestScore: 96 })
    expect(afterWrong).toEqual({ completedQuestions: 2, correctQuestions: 1, streak: 0, totalScore: 166, latestScore: 70 })
    expect(getRhythmAccuracy(afterWrong)).toBe(50)
    expect(getRhythmAverageScore(afterWrong)).toBe(83)
  })
})
