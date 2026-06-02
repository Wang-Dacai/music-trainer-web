import { describe, expect, it } from 'vitest'
import {
  GUITAR_CHORDS,
  formatChordToneText,
  formatFretPattern,
  formatStaffPitchText,
  getGuitarChordById,
  searchGuitarChords,
} from './guitarChords'

describe('guitarChords', () => {
  it('includes common example chords with Chinese names, tones, staff pitches, and multiple fingerings', () => {
    for (const chordId of ['C', 'Am', 'G7', 'Cmaj7'] as const) {
      const chord = getGuitarChordById(chordId)

      expect(chord).not.toBeNull()
      expect(chord?.chineseName).toContain(chordId[0])
      expect(chord?.tones.length).toBeGreaterThanOrEqual(3)
      expect(chord?.staffPitches.length).toBe(chord?.tones.length)
      expect(chord?.fingerings.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('keeps every fingering in a six-string 6-to-1 representation', () => {
    for (const chord of GUITAR_CHORDS) {
      expect(chord.fingerings.length).toBeGreaterThanOrEqual(2)

      for (const fingering of chord.fingerings) {
        expect(fingering.frets).toHaveLength(6)
        expect(formatFretPattern(fingering).split(' ')).toHaveLength(6)
      }
    }
  })

  it('searches chord symbols case-insensitively and supports common aliases', () => {
    expect(searchGuitarChords('C')[0]?.id).toBe('C')
    expect(searchGuitarChords('c')[0]?.id).toBe('C')
    expect(searchGuitarChords('Am')[0]?.id).toBe('Am')
    expect(searchGuitarChords('am')[0]?.id).toBe('Am')
    expect(searchGuitarChords('G7')[0]?.id).toBe('G7')
    expect(searchGuitarChords('Cmaj7')[0]?.id).toBe('Cmaj7')
    expect(searchGuitarChords('CM7')[0]?.id).toBe('Cmaj7')
    expect(searchGuitarChords('C△7')[0]?.id).toBe('Cmaj7')
  })

  it('formats chord tone and staff pitch text for display', () => {
    const cmaj7 = getGuitarChordById('Cmaj7')

    expect(cmaj7).not.toBeNull()
    expect(formatChordToneText(cmaj7!)).toBe('C（根音）、E（大三音）、G（纯五音）、B（大七音）')
    expect(formatStaffPitchText(cmaj7!)).toBe('C4、E4、G4、B4')
  })

  it('returns an empty list for unmatched searches', () => {
    expect(searchGuitarChords('H13')).toEqual([])
  })
})
