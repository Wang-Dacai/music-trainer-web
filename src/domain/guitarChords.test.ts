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
    for (const chordId of ['C', 'Am', 'G7', 'Cmaj7', 'F#m', 'C#m', 'Bb', 'Eb', 'Am7', 'Dm7', 'Dsus4', 'Asus2'] as const) {
      const chord = getGuitarChordById(chordId)

      expect(chord).not.toBeNull()
      expect(chord?.symbol).toBe(chordId)
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
    expect(searchGuitarChords('Cm7')[0]?.id).toBe('Cm7')
    expect(searchGuitarChords('cm7')[0]?.id).toBe('Cm7')
    expect(searchGuitarChords('Dbm')[0]?.id).toBe('C#m')
    expect(searchGuitarChords('A#')[0]?.id).toBe('Bb')
    expect(searchGuitarChords('D#')[0]?.id).toBe('Eb')
    expect(searchGuitarChords('Dsus')[0]?.id).toBe('Dsus4')
    expect(searchGuitarChords('Asus2')[0]?.id).toBe('Asus2')
  })

  it('limits single-root searches to matching chord names instead of component tones', () => {
    const cResultIds = searchGuitarChords('C').map((chord) => chord.id)
    const lowercaseCResultIds = searchGuitarChords('c').map((chord) => chord.id)

    expect(cResultIds).toHaveLength(14)
    expect(lowercaseCResultIds).toEqual(cResultIds)
    expect(cResultIds.every((id) => id.startsWith('C'))).toBe(true)
    expect(cResultIds).toEqual(expect.arrayContaining(['C', 'Cm', 'C7', 'Cmaj7', 'Cm7', 'Csus4', 'Csus2', 'C#', 'C#m']))
    expect(cResultIds).not.toEqual(expect.arrayContaining(['Am', 'F', 'A', 'D7', 'Dmaj7']))
  })

  it('formats chord tone and staff pitch text for display', () => {
    const cmaj7 = getGuitarChordById('Cmaj7')
    const am7 = getGuitarChordById('Am7')
    const fSharpMinor = getGuitarChordById('F#m')
    const dSus4 = getGuitarChordById('Dsus4')

    expect(cmaj7).not.toBeNull()
    expect(formatChordToneText(cmaj7!)).toBe('C（根音）、E（大三音）、G（纯五音）、B（大七音）')
    expect(formatStaffPitchText(cmaj7!)).toBe('C4、E4、G4、B4')
    expect(formatChordToneText(am7!)).toBe('A（根音）、C（小三音）、E（纯五音）、G（小七音）')
    expect(formatStaffPitchText(fSharpMinor!)).toBe('F#4、A4、C#5')
    expect(formatChordToneText(dSus4!)).toBe('D（根音）、G（纯四音）、A（纯五音）')
  })

  it('returns an empty list for unmatched searches', () => {
    expect(searchGuitarChords('H13')).toEqual([])
  })
})
