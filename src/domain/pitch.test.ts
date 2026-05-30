import { describe, expect, it } from 'vitest'
import { createPitch, formatPitch, fromMidiNumber, getFrequency, toMidiNumber, transposeBySemitones } from './pitch'

describe('pitch', () => {
  it('能把音高转换为 MIDI 编号', () => {
    expect(toMidiNumber('C', 4)).toBe(60)
    expect(toMidiNumber('A', 4)).toBe(69)
    expect(toMidiNumber('C', 4, 'sharp')).toBe(61)
    expect(toMidiNumber('D', 4, 'flat')).toBe(61)
  })

  it('能从 MIDI 编号生成音高', () => {
    expect(fromMidiNumber(60)).toEqual(createPitch('C', 4))
    expect(fromMidiNumber(61)).toEqual(createPitch('C', 4, 'sharp'))
    expect(fromMidiNumber(69)).toEqual(createPitch('A', 4))
  })

  it('能按半音移调并格式化显示', () => {
    const c4 = createPitch('C', 4)
    const e4 = transposeBySemitones(c4, 4)

    expect(formatPitch(e4)).toBe('E4')
  })

  it('能计算 A4 的标准频率', () => {
    expect(getFrequency(createPitch('A', 4))).toBe(440)
  })
})
