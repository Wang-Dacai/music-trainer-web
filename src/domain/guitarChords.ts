import { createPitch, formatPitch, type Accidental, type NoteStep, type Pitch } from './pitch'

export type GuitarChordRoot = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type GuitarChordQualityId = 'major' | 'minor' | 'dominant7' | 'major7'
export type GuitarChordSuffix = '' | 'm' | '7' | 'maj7'
export type GuitarChordId = `${GuitarChordRoot}${GuitarChordSuffix}`
export type GuitarStringFret = number | 'x'
export type GuitarStringNumber = 1 | 2 | 3 | 4 | 5 | 6
export type SixStringFrets = readonly [
  GuitarStringFret,
  GuitarStringFret,
  GuitarStringFret,
  GuitarStringFret,
  GuitarStringFret,
  GuitarStringFret,
]
export type SixStringFingers = readonly [number | null, number | null, number | null, number | null, number | null, number | null]

export interface GuitarFingeringBarre {
  fret: number
  fromString: GuitarStringNumber
  toString: GuitarStringNumber
  finger?: number
}

export interface GuitarFingering {
  id: string
  name: string
  frets: SixStringFrets
  fingers?: SixStringFingers
  baseFret?: number
  barres?: readonly GuitarFingeringBarre[]
  description: string
}

export interface GuitarChordQuality {
  id: GuitarChordQualityId
  label: string
  formula: string
  suffix: GuitarChordSuffix
  aliases: readonly string[]
  toneRoles: readonly string[]
}

export interface GuitarChord {
  id: GuitarChordId
  symbol: string
  aliases: readonly string[]
  chineseName: string
  quality: GuitarChordQualityId
  qualityLabel: string
  formula: string
  tones: readonly string[]
  toneRoles: readonly string[]
  staffPitches: readonly Pitch[]
  fingerings: readonly GuitarFingering[]
}

type PitchSpec = readonly [NoteStep, number, Accidental?]

interface ChordToneData {
  tones: readonly string[]
  staffPitches: readonly PitchSpec[]
}

export const GUITAR_CHORD_QUALITIES: Record<GuitarChordQualityId, GuitarChordQuality> = {
  major: {
    id: 'major',
    label: '大三和弦',
    formula: '1 · 3 · 5',
    suffix: '',
    aliases: ['major', 'maj', '大三', '大和弦'],
    toneRoles: ['根音', '大三音', '纯五音'],
  },
  minor: {
    id: 'minor',
    label: '小三和弦',
    formula: '1 · b3 · 5',
    suffix: 'm',
    aliases: ['minor', 'min', 'm', '小三', '小和弦'],
    toneRoles: ['根音', '小三音', '纯五音'],
  },
  dominant7: {
    id: 'dominant7',
    label: '属七和弦',
    formula: '1 · 3 · 5 · b7',
    suffix: '7',
    aliases: ['dominant7', 'dom7', '7', '属七', '七和弦'],
    toneRoles: ['根音', '大三音', '纯五音', '小七音'],
  },
  major7: {
    id: 'major7',
    label: '大七和弦',
    formula: '1 · 3 · 5 · 7',
    suffix: 'maj7',
    aliases: ['major7', 'maj7', 'm7', 'M7', '△7', 'Δ7', '大七', '大七和弦'],
    toneRoles: ['根音', '大三音', '纯五音', '大七音'],
  },
}

const ROOTS: readonly GuitarChordRoot[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const QUALITY_ORDER: readonly GuitarChordQualityId[] = ['major', 'minor', 'dominant7', 'major7']
const COMMON_CHORD_ORDER: readonly GuitarChordId[] = ['C', 'Am', 'G', 'G7', 'Cmaj7', 'D', 'Dm', 'Em', 'A', 'E', 'F']

const E_STRING_ROOT_FRETS: Record<GuitarChordRoot, number> = {
  E: 0,
  F: 1,
  G: 3,
  A: 5,
  B: 7,
  C: 8,
  D: 10,
}

const A_STRING_ROOT_FRETS: Record<GuitarChordRoot, number> = {
  A: 0,
  B: 2,
  C: 3,
  D: 5,
  E: 7,
  F: 8,
  G: 10,
}

const TONE_DATA: Record<GuitarChordId, ChordToneData> = {
  C: { tones: ['C', 'E', 'G'], staffPitches: [['C', 4], ['E', 4], ['G', 4]] },
  D: { tones: ['D', 'F#', 'A'], staffPitches: [['D', 4], ['F', 4, 'sharp'], ['A', 4]] },
  E: { tones: ['E', 'G#', 'B'], staffPitches: [['E', 4], ['G', 4, 'sharp'], ['B', 4]] },
  F: { tones: ['F', 'A', 'C'], staffPitches: [['F', 4], ['A', 4], ['C', 5]] },
  G: { tones: ['G', 'B', 'D'], staffPitches: [['G', 4], ['B', 4], ['D', 5]] },
  A: { tones: ['A', 'C#', 'E'], staffPitches: [['A', 3], ['C', 4, 'sharp'], ['E', 4]] },
  B: { tones: ['B', 'D#', 'F#'], staffPitches: [['B', 3], ['D', 4, 'sharp'], ['F', 4, 'sharp']] },
  Am: { tones: ['A', 'C', 'E'], staffPitches: [['A', 3], ['C', 4], ['E', 4]] },
  Bm: { tones: ['B', 'D', 'F#'], staffPitches: [['B', 3], ['D', 4], ['F', 4, 'sharp']] },
  Cm: { tones: ['C', 'Eb', 'G'], staffPitches: [['C', 4], ['E', 4, 'flat'], ['G', 4]] },
  Dm: { tones: ['D', 'F', 'A'], staffPitches: [['D', 4], ['F', 4], ['A', 4]] },
  Em: { tones: ['E', 'G', 'B'], staffPitches: [['E', 4], ['G', 4], ['B', 4]] },
  Fm: { tones: ['F', 'Ab', 'C'], staffPitches: [['F', 4], ['A', 4, 'flat'], ['C', 5]] },
  Gm: { tones: ['G', 'Bb', 'D'], staffPitches: [['G', 4], ['B', 4, 'flat'], ['D', 5]] },
  C7: { tones: ['C', 'E', 'G', 'Bb'], staffPitches: [['C', 4], ['E', 4], ['G', 4], ['B', 4, 'flat']] },
  D7: { tones: ['D', 'F#', 'A', 'C'], staffPitches: [['D', 4], ['F', 4, 'sharp'], ['A', 4], ['C', 5]] },
  E7: { tones: ['E', 'G#', 'B', 'D'], staffPitches: [['E', 4], ['G', 4, 'sharp'], ['B', 4], ['D', 5]] },
  F7: { tones: ['F', 'A', 'C', 'Eb'], staffPitches: [['F', 4], ['A', 4], ['C', 5], ['E', 5, 'flat']] },
  G7: { tones: ['G', 'B', 'D', 'F'], staffPitches: [['G', 4], ['B', 4], ['D', 5], ['F', 5]] },
  A7: { tones: ['A', 'C#', 'E', 'G'], staffPitches: [['A', 3], ['C', 4, 'sharp'], ['E', 4], ['G', 4]] },
  B7: { tones: ['B', 'D#', 'F#', 'A'], staffPitches: [['B', 3], ['D', 4, 'sharp'], ['F', 4, 'sharp'], ['A', 4]] },
  Cmaj7: { tones: ['C', 'E', 'G', 'B'], staffPitches: [['C', 4], ['E', 4], ['G', 4], ['B', 4]] },
  Dmaj7: { tones: ['D', 'F#', 'A', 'C#'], staffPitches: [['D', 4], ['F', 4, 'sharp'], ['A', 4], ['C', 5, 'sharp']] },
  Emaj7: { tones: ['E', 'G#', 'B', 'D#'], staffPitches: [['E', 4], ['G', 4, 'sharp'], ['B', 4], ['D', 5, 'sharp']] },
  Fmaj7: { tones: ['F', 'A', 'C', 'E'], staffPitches: [['F', 4], ['A', 4], ['C', 5], ['E', 5]] },
  Gmaj7: { tones: ['G', 'B', 'D', 'F#'], staffPitches: [['G', 4], ['B', 4], ['D', 5], ['F', 5, 'sharp']] },
  Amaj7: { tones: ['A', 'C#', 'E', 'G#'], staffPitches: [['A', 3], ['C', 4, 'sharp'], ['E', 4], ['G', 4, 'sharp']] },
  Bmaj7: { tones: ['B', 'D#', 'F#', 'A#'], staffPitches: [['B', 3], ['D', 4, 'sharp'], ['F', 4, 'sharp'], ['A', 4, 'sharp']] },
}

const COMMON_OPEN_FINGERINGS: Partial<Record<GuitarChordId, GuitarFingering>> = {
  C: createFingering('C-open', '开放式 C', ['x', 3, 2, 0, 1, 0], '最常见的 C 大三和弦开放指法，保留 3 弦和 1 弦空弦，声音明亮稳定。', {
    fingers: [null, 3, 2, null, 1, null],
  }),
  D: createFingering('D-open', '开放式 D', ['x', 'x', 0, 2, 3, 2], '只弹 4 弦到 1 弦的开放 D 指法，适合民谣和流行伴奏。', {
    fingers: [null, null, null, 1, 3, 2],
  }),
  E: createFingering('E-open', '开放式 E', [0, 2, 2, 1, 0, 0], '以 6 弦空弦为根音的开放 E 大三和弦，低音饱满。', {
    fingers: [null, 2, 3, 1, null, null],
  }),
  G: createFingering('G-open', '开放式 G', [3, 2, 0, 0, 0, 3], '经典开放 G 指法，包含 6 弦和 1 弦的 G 音，适合扫弦。', {
    fingers: [3, 2, null, null, null, 4],
  }),
  A: createFingering('A-open', '开放式 A', ['x', 0, 2, 2, 2, 0], '开放 A 大三和弦，5 弦空弦作为根音，右手避免扫到 6 弦。', {
    fingers: [null, null, 1, 2, 3, null],
  }),
  Am: createFingering('Am-open', '开放式 Am', ['x', 0, 2, 2, 1, 0], '最常见的 A 小三和弦开放指法，和 C 指法形状接近，转换方便。', {
    fingers: [null, null, 2, 3, 1, null],
  }),
  Dm: createFingering('Dm-open', '开放式 Dm', ['x', 'x', 0, 2, 3, 1], '开放 Dm 指法只使用高四根弦，小三度在 1 弦 1 品带来阴柔色彩。', {
    fingers: [null, null, null, 2, 3, 1],
  }),
  Em: createFingering('Em-open', '开放式 Em', [0, 2, 2, 0, 0, 0], '最容易上手的开放小三和弦之一，只需按住 5 弦和 4 弦 2 品。', {
    fingers: [null, 2, 3, null, null, null],
  }),
  C7: createFingering('C7-open', '开放式 C7', ['x', 3, 2, 3, 1, 0], '在开放 C 的基础上加入 3 弦 3 品的 Bb，形成属七张力。', {
    fingers: [null, 3, 2, 4, 1, null],
  }),
  D7: createFingering('D7-open', '开放式 D7', ['x', 'x', 0, 2, 1, 2], '常见开放 D7 指法，常用于回到 G 的属功能进行。', {
    fingers: [null, null, null, 2, 1, 3],
  }),
  E7: createFingering('E7-open', '开放式 E7', [0, 2, 0, 1, 0, 0], '开放 E7 省去 4 弦按音，让 D 音自然出现，布鲁斯和民谣中很常用。', {
    fingers: [null, 2, null, 1, null, null],
  }),
  G7: createFingering('G7-open', '开放式 G7', [3, 2, 0, 0, 0, 1], '开放 G7 在 1 弦加入 F 音，常用来解决到 C 和弦。', {
    fingers: [3, 2, null, null, null, 1],
  }),
  A7: createFingering('A7-open', '开放式 A7', ['x', 0, 2, 0, 2, 0], '开放 A7 保留 3 弦空弦作为小七音，声音通透。', {
    fingers: [null, null, 1, null, 2, null],
  }),
  B7: createFingering('B7-open', '开放式 B7', ['x', 2, 1, 2, 0, 2], '第一把位常用 B7 指法，常在 E 调歌曲中作为属七和弦出现。', {
    fingers: [null, 2, 1, 3, null, 4],
  }),
  Cmaj7: createFingering('Cmaj7-open', '开放式 Cmaj7', ['x', 3, 2, 0, 0, 0], '从开放 C 抬起 2 弦 1 品即可得到 Cmaj7，色彩柔和。', {
    fingers: [null, 3, 2, null, null, null],
  }),
  Dmaj7: createFingering('Dmaj7-open', '开放式 Dmaj7', ['x', 'x', 0, 2, 2, 2], '开放 Dmaj7 使用高三根弦同品按弦，声音集中明亮。', {
    fingers: [null, null, null, 1, 1, 1],
    barres: [{ fret: 2, fromString: 3, toString: 1, finger: 1 }],
  }),
  Emaj7: createFingering('Emaj7-open', '开放式 Emaj7', [0, 2, 1, 1, 0, 0], '开放 Emaj7 在 E 大三和弦中加入 D#，有温暖的爵士色彩。', {
    fingers: [null, 3, 1, 2, null, null],
  }),
  Fmaj7: createFingering('Fmaj7-open', '开放式 Fmaj7', ['x', 'x', 3, 2, 1, 0], '不用横按的 Fmaj7 指法，适合初学者从开放 C 过渡。', {
    fingers: [null, null, 3, 2, 1, null],
  }),
  Gmaj7: createFingering('Gmaj7-open', '开放式 Gmaj7', [3, 2, 0, 0, 0, 2], '开放 Gmaj7 在 1 弦加入 F#，比普通 G 更柔和。', {
    fingers: [3, 2, null, null, null, 1],
  }),
  Amaj7: createFingering('Amaj7-open', '开放式 Amaj7', ['x', 0, 2, 1, 2, 0], '开放 Amaj7 在 3 弦 1 品加入 G#，常见于流行与爵士语汇。', {
    fingers: [null, null, 2, 1, 3, null],
  }),
  Bmaj7: createFingering('Bmaj7-a-shape', 'A 型 Bmaj7', ['x', 2, 4, 3, 4, 2], '以 5 弦 2 品为根音的 Bmaj7 指法，常用于需要明亮大七色彩的段落。', {
    fingers: [null, 1, 4, 2, 3, 1],
    barres: [{ fret: 2, fromString: 5, toString: 1, finger: 1 }],
  }),
}

const ALL_CHORD_IDS = ROOTS.flatMap((root) => QUALITY_ORDER.map((quality) => `${root}${GUITAR_CHORD_QUALITIES[quality].suffix}` as GuitarChordId))
const GUITAR_CHORD_IDS = [...COMMON_CHORD_ORDER, ...ALL_CHORD_IDS.filter((id) => !COMMON_CHORD_ORDER.includes(id))]

export const GUITAR_CHORDS: readonly GuitarChord[] = GUITAR_CHORD_IDS.map(createGuitarChord)

const GUITAR_CHORDS_BY_ID = new Map<GuitarChordId, GuitarChord>(GUITAR_CHORDS.map((chord) => [chord.id, chord]))

export function normalizeGuitarChordQuery(query: string): string {
  return query
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[△Δ]/g, 'maj')
    .replace(/[\s_\-]+/g, '')
}

export function searchGuitarChords(query: string): GuitarChord[] {
  const normalizedQuery = normalizeGuitarChordQuery(query)

  if (!normalizedQuery) {
    return [...GUITAR_CHORDS]
  }

  return GUITAR_CHORDS.filter((chord) => getSearchTokens(chord).some((token) => token.includes(normalizedQuery))).sort(
    (firstChord, secondChord) => getMatchRank(firstChord, normalizedQuery) - getMatchRank(secondChord, normalizedQuery),
  )
}

export function getGuitarChordById(id: GuitarChordId): GuitarChord | null {
  return GUITAR_CHORDS_BY_ID.get(id) ?? null
}

export function formatFretPattern(fingering: GuitarFingering): string {
  return fingering.frets.join(' ')
}

export function formatChordToneText(chord: GuitarChord): string {
  return chord.tones.map((tone, index) => `${tone}（${chord.toneRoles[index]}）`).join('、')
}

export function formatStaffPitchText(chord: GuitarChord): string {
  return chord.staffPitches.map(formatPitch).join('、')
}

function createGuitarChord(id: GuitarChordId): GuitarChord {
  const root = getChordRoot(id)
  const quality = getChordQuality(id)
  const qualityConfig = GUITAR_CHORD_QUALITIES[quality]
  const toneData = TONE_DATA[id]

  return {
    id,
    symbol: id,
    aliases: createAliases(root, quality, id),
    chineseName: `${root} ${qualityConfig.label}`,
    quality,
    qualityLabel: qualityConfig.label,
    formula: qualityConfig.formula,
    tones: toneData.tones,
    toneRoles: qualityConfig.toneRoles,
    staffPitches: toneData.staffPitches.map(([step, octave, accidental]) => createPitch(step, octave, accidental ?? null)),
    fingerings: createFingerings(root, quality, id),
  }
}

function createAliases(root: GuitarChordRoot, quality: GuitarChordQualityId, id: GuitarChordId): readonly string[] {
  const qualityConfig = GUITAR_CHORD_QUALITIES[quality]
  const aliases = [
    id,
    `${root}${qualityConfig.suffix}`,
    `${root} ${qualityConfig.label}`,
    ...qualityConfig.aliases.map((alias) => `${root}${alias}`),
    ...qualityConfig.aliases.map((alias) => `${root} ${alias}`),
  ]

  return Array.from(new Set(aliases))
}

function getChordRoot(id: GuitarChordId): GuitarChordRoot {
  if (id.endsWith('maj7')) return id.slice(0, -4) as GuitarChordRoot
  if (id.endsWith('7') || id.endsWith('m')) return id.slice(0, -1) as GuitarChordRoot
  return id as GuitarChordRoot
}

function getChordQuality(id: GuitarChordId): GuitarChordQualityId {
  if (id.endsWith('maj7')) return 'major7'
  if (id.endsWith('7')) return 'dominant7'
  if (id.endsWith('m')) return 'minor'
  return 'major'
}

function createFingerings(root: GuitarChordRoot, quality: GuitarChordQualityId, id: GuitarChordId): readonly GuitarFingering[] {
  const fingerings: GuitarFingering[] = []
  const openFingering = COMMON_OPEN_FINGERINGS[id]

  if (openFingering) {
    fingerings.push(openFingering)
  }

  const shapeCandidates = [createEShapeFingering(root, quality), createAShapeFingering(root, quality)]
    .filter((fingering) => !fingerings.some((existingFingering) => hasSameFrets(existingFingering, fingering)))
    .sort((firstFingering, secondFingering) => getLowestFrettedPosition(firstFingering) - getLowestFrettedPosition(secondFingering))

  for (const fingering of shapeCandidates) {
    if (fingerings.length >= 2) break
    fingerings.push(fingering)
  }

  return fingerings
}

function createEShapeFingering(root: GuitarChordRoot, quality: GuitarChordQualityId): GuitarFingering {
  const fret = E_STRING_ROOT_FRETS[root]
  const qualityConfig = GUITAR_CHORD_QUALITIES[quality]
  const shapeName = fret === 0 ? '开放 E 型' : 'E 型横按'
  const fretsByQuality: Record<GuitarChordQualityId, SixStringFrets> = {
    major: [fret, fret + 2, fret + 2, fret + 1, fret, fret],
    minor: [fret, fret + 2, fret + 2, fret, fret, fret],
    dominant7: [fret, fret + 2, fret, fret + 1, fret, fret],
    major7: [fret, fret + 2, fret + 1, fret + 1, fret, fret],
  }
  const fingersByQuality: Record<GuitarChordQualityId, SixStringFingers> = {
    major: [1, 3, 4, 2, 1, 1],
    minor: [1, 3, 4, 1, 1, 1],
    dominant7: [1, 3, 1, 2, 1, 1],
    major7: [1, 3, 2, 2, 1, 1],
  }

  return createFingering(
    `${root}-${quality}-e-shape`,
    `${shapeName} ${root}${qualityConfig.suffix || ''}`,
    fretsByQuality[quality],
    fret === 0
      ? `以 6 弦空弦为根音的 E 型${qualityConfig.label}，低音开放，适合第一把位。`
      : `以 6 弦 ${fret} 品为根音的 E 型移动${qualityConfig.label}，适合需要厚实低音的扫弦。`,
    {
      fingers: fret === 0 ? normalizeOpenShapeFingers(fingersByQuality[quality]) : fingersByQuality[quality],
      baseFret: fret > 1 ? fret : undefined,
      barres: fret > 0 ? [{ fret, fromString: 6, toString: 1, finger: 1 }] : undefined,
    },
  )
}

function createAShapeFingering(root: GuitarChordRoot, quality: GuitarChordQualityId): GuitarFingering {
  const fret = A_STRING_ROOT_FRETS[root]
  const qualityConfig = GUITAR_CHORD_QUALITIES[quality]
  const shapeName = fret === 0 ? '开放 A 型' : 'A 型横按'
  const fretsByQuality: Record<GuitarChordQualityId, SixStringFrets> = {
    major: ['x', fret, fret + 2, fret + 2, fret + 2, fret],
    minor: ['x', fret, fret + 2, fret + 2, fret + 1, fret],
    dominant7: ['x', fret, fret + 2, fret, fret + 2, fret],
    major7: ['x', fret, fret + 2, fret + 1, fret + 2, fret],
  }
  const fingersByQuality: Record<GuitarChordQualityId, SixStringFingers> = {
    major: [null, 1, 3, 3, 3, 1],
    minor: [null, 1, 3, 4, 2, 1],
    dominant7: [null, 1, 3, 1, 4, 1],
    major7: [null, 1, 3, 2, 4, 1],
  }

  return createFingering(
    `${root}-${quality}-a-shape`,
    `${shapeName} ${root}${qualityConfig.suffix || ''}`,
    fretsByQuality[quality],
    fret === 0
      ? `以 5 弦空弦为根音的 A 型${qualityConfig.label}，注意避开 6 弦。`
      : `以 5 弦 ${fret} 品为根音的 A 型移动${qualityConfig.label}，音区较高，适合切分和分解和弦。`,
    {
      fingers: fret === 0 ? normalizeOpenShapeFingers(fingersByQuality[quality]) : fingersByQuality[quality],
      baseFret: fret > 1 ? fret : undefined,
      barres: fret > 0 ? [{ fret, fromString: 5, toString: 1, finger: 1 }] : undefined,
    },
  )
}

function createFingering(
  id: string,
  name: string,
  frets: SixStringFrets,
  description: string,
  options: {
    fingers?: SixStringFingers
    baseFret?: number
    barres?: readonly GuitarFingeringBarre[]
  } = {},
): GuitarFingering {
  return {
    id,
    name,
    frets,
    description,
    ...options,
  }
}

function normalizeOpenShapeFingers(fingers: SixStringFingers): SixStringFingers {
  return fingers.map((finger) => (finger === 1 ? null : finger)) as unknown as SixStringFingers
}

function hasSameFrets(firstFingering: GuitarFingering, secondFingering: GuitarFingering): boolean {
  return formatFretPattern(firstFingering) === formatFretPattern(secondFingering)
}

function getLowestFrettedPosition(fingering: GuitarFingering): number {
  const frettedPositions = fingering.frets.filter((fret): fret is number => typeof fret === 'number' && fret > 0)

  return Math.min(...frettedPositions)
}

function getSearchTokens(chord: GuitarChord): string[] {
  return [
    chord.symbol,
    chord.chineseName,
    chord.qualityLabel,
    chord.formula,
    ...chord.tones,
    ...chord.aliases,
  ].map(normalizeGuitarChordQuery)
}

function getMatchRank(chord: GuitarChord, normalizedQuery: string): number {
  const symbol = normalizeGuitarChordQuery(chord.symbol)
  const aliases = chord.aliases.map(normalizeGuitarChordQuery)

  if (symbol === normalizedQuery) return 0
  if (aliases.some((alias) => alias === normalizedQuery)) return 1
  if (symbol.startsWith(normalizedQuery)) return 2
  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) return 3
  return 4
}
