import { describe, expect, it } from 'vitest'
import {
  buildStaffChoices,
  calculateStaffIntervalName,
  generateStaffIntervalExercise,
  normalizeStaffPitchName,
  parseStaffPitchName,
  STAFF_CLEF_LABELS,
  STAFF_INTERVAL_NAMES,
  STAFF_PITCHES_BY_CLEF,
} from './staffTrainer'

function sequenceRandom(values: number[]) {
  let index = 0
  return () => values[index++] ?? 0
}

describe('staffTrainer', () => {
  it('保留旧项目四种谱号和对应音域', () => {
    expect(STAFF_CLEF_LABELS).toEqual({
      treble: '高音',
      bass: '低音',
      alto: '中音',
      tenor: '次中音',
    })
    expect(STAFF_PITCHES_BY_CLEF.treble).toContain('C4')
    expect(STAFF_PITCHES_BY_CLEF.bass).toContain('A1')
    expect(STAFF_PITCHES_BY_CLEF.alto).toContain('C3')
    expect(STAFF_PITCHES_BY_CLEF.tenor).toContain('A2')
  })

  it('规范化音高答案时移除升降号', () => {
    expect(normalizeStaffPitchName(parseStaffPitchName('C4', 'sharp'))).toBe('C4')
    expect(normalizeStaffPitchName(parseStaffPitchName('B3', 'flat'))).toBe('B3')
  })

  it('能计算常见音程中文名称', () => {
    expect(calculateStaffIntervalName(parseStaffPitchName('C4'), parseStaffPitchName('E4'))).toBe('大三度')
    expect(calculateStaffIntervalName(parseStaffPitchName('C4'), parseStaffPitchName('G4'))).toBe('纯五度')
    expect(calculateStaffIntervalName(parseStaffPitchName('C4'), parseStaffPitchName('C5'))).toBe('纯八度')
    expect(calculateStaffIntervalName(parseStaffPitchName('C4'), parseStaffPitchName('F4', 'sharp'))).toBe('增四度')
  })

  it('保持旧项目行为：下行两音不进入可用题目范围', () => {
    expect(calculateStaffIntervalName(parseStaffPitchName('C5'), parseStaffPitchName('C4'))).toBeNull()
  })

  it('四选一答案包含正确答案且不重复', () => {
    const choices = buildStaffChoices('C4', STAFF_PITCHES_BY_CLEF.treble, 4, sequenceRandom([0.1, 0.2, 0.3, 0.4, 0.5]))

    expect(choices).toHaveLength(4)
    expect(choices).toContain('C4')
    expect(new Set(choices).size).toBe(4)
  })

  it('能生成包含两个音和三组四选一的五线谱题目', () => {
    const exercise = generateStaffIntervalExercise({
      clef: 'treble',
      random: sequenceRandom([0.2, 0.25, 0.55, 0.25, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.2, 0.3, 0.4, 0.5, 0.6]),
      idFactory: () => 'staff-1',
    })

    expect(exercise.id).toBe('staff-1')
    expect(exercise.clef).toBe('treble')
    expect(exercise.choices.firstPitch).toContain(exercise.firstPitchAnswer)
    expect(exercise.choices.secondPitch).toContain(exercise.secondPitchAnswer)
    expect(exercise.choices.interval).toContain(exercise.intervalName)
    expect(Object.values(STAFF_INTERVAL_NAMES)).toContain(exercise.intervalName)
  })
})
