import { createPitch, formatPitch, type Accidental, type NoteStep, type Pitch } from './pitch'

export type GuitarChordRoot = 'C' | 'C#' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'Ab' | 'A' | 'Bb' | 'B'
export type GuitarChordQualityId = 'major' | 'minor' | 'dominant7' | 'major7' | 'minor7' | 'sus4' | 'sus2'
export type GuitarChordSuffix = '' | 'm' | '7' | 'maj7' | 'm7' | 'sus4' | 'sus2'
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

interface ChordIntervalSpec {
  degreeOffset: number
  semitones: number
}

interface ChordToneData {
  tones: readonly string[]
  staffPitches: readonly Pitch[]
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
    aliases: ['major7', 'maj7', 'M7', '△7', 'Δ7', '大七', '大七和弦'],
    toneRoles: ['根音', '大三音', '纯五音', '大七音'],
  },
  minor7: {
    id: 'minor7',
    label: '小七和弦',
    formula: '1 · b3 · 5 · b7',
    suffix: 'm7',
    aliases: ['minor7', 'min7', 'm7', '小七', '小七和弦'],
    toneRoles: ['根音', '小三音', '纯五音', '小七音'],
  },
  sus4: {
    id: 'sus4',
    label: '挂四和弦',
    formula: '1 · 4 · 5',
    suffix: 'sus4',
    aliases: ['sus4', 'sus', '挂四', '挂四和弦'],
    toneRoles: ['根音', '纯四音', '纯五音'],
  },
  sus2: {
    id: 'sus2',
    label: '挂二和弦',
    formula: '1 · 2 · 5',
    suffix: 'sus2',
    aliases: ['sus2', '挂二', '挂二和弦'],
    toneRoles: ['根音', '大二音', '纯五音'],
  },
}

const ROOTS: readonly GuitarChordRoot[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'Ab', 'A', 'Bb', 'B']
const QUALITY_ORDER: readonly GuitarChordQualityId[] = ['major', 'minor', 'dominant7', 'major7', 'minor7', 'sus4', 'sus2']
const COMMON_CHORD_ORDER: readonly GuitarChordId[] = [
  'C',
  'Am',
  'G',
  'G7',
  'Cmaj7',
  'Am7',
  'D',
  'Dm',
  'Dm7',
  'Em',
  'Em7',
  'A',
  'A7',
  'Asus2',
  'Asus4',
  'E',
  'E7',
  'Esus4',
  'F',
  'Fmaj7',
  'Dsus2',
  'Dsus4',
  'F#m',
  'C#m',
  'Bb',
  'Eb',
  'Ab',
]

const ROOT_PITCH_SPECS: Record<GuitarChordRoot, PitchSpec> = {
  C: ['C', 4],
  'C#': ['C', 4, 'sharp'],
  D: ['D', 4],
  Eb: ['E', 4, 'flat'],
  E: ['E', 4],
  F: ['F', 4],
  'F#': ['F', 4, 'sharp'],
  G: ['G', 4],
  'G#': ['G', 3, 'sharp'],
  Ab: ['A', 3, 'flat'],
  A: ['A', 3],
  Bb: ['B', 3, 'flat'],
  B: ['B', 3],
}

const ROOT_ALIASES: Partial<Record<GuitarChordRoot, readonly string[]>> = {
  'C#': ['Db'],
  Eb: ['D#'],
  'F#': ['Gb'],
  'G#': ['Ab'],
  Ab: ['G#'],
  Bb: ['A#'],
}

const STEP_ORDER: readonly NoteStep[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const QUALITY_INTERVALS: Record<GuitarChordQualityId, readonly ChordIntervalSpec[]> = {
  major: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 2, semitones: 4 },
    { degreeOffset: 4, semitones: 7 },
  ],
  minor: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 2, semitones: 3 },
    { degreeOffset: 4, semitones: 7 },
  ],
  dominant7: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 2, semitones: 4 },
    { degreeOffset: 4, semitones: 7 },
    { degreeOffset: 6, semitones: 10 },
  ],
  major7: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 2, semitones: 4 },
    { degreeOffset: 4, semitones: 7 },
    { degreeOffset: 6, semitones: 11 },
  ],
  minor7: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 2, semitones: 3 },
    { degreeOffset: 4, semitones: 7 },
    { degreeOffset: 6, semitones: 10 },
  ],
  sus4: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 3, semitones: 5 },
    { degreeOffset: 4, semitones: 7 },
  ],
  sus2: [
    { degreeOffset: 0, semitones: 0 },
    { degreeOffset: 1, semitones: 2 },
    { degreeOffset: 4, semitones: 7 },
  ],
}

const E_STRING_ROOT_FRETS: Record<GuitarChordRoot, number> = {
  E: 0,
  F: 1,
  'F#': 2,
  G: 3,
  'G#': 4,
  Ab: 4,
  A: 5,
  Bb: 6,
  B: 7,
  C: 8,
  'C#': 9,
  D: 10,
  Eb: 11,
}

const A_STRING_ROOT_FRETS: Record<GuitarChordRoot, number> = {
  A: 0,
  Bb: 1,
  B: 2,
  C: 3,
  'C#': 4,
  D: 5,
  Eb: 6,
  E: 7,
  F: 8,
  'F#': 9,
  G: 10,
  'G#': 11,
  Ab: 11,
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
  Am7: createFingering('Am7-open', '开放式 Am7', ['x', 0, 2, 0, 1, 0], '从开放 Am 抬起 3 弦 2 品即可得到 Am7，常用于民谣和流行伴奏。', {
    fingers: [null, null, 2, null, 1, null],
  }),
  Dm7: createFingering('Dm7-open', '开放式 Dm7', ['x', 'x', 0, 2, 1, 1], '开放 Dm7 保留 Dm 的小三色彩，并在高音加入小七音，适合柔和的下属功能。', {
    fingers: [null, null, null, 2, 1, 1],
    barres: [{ fret: 1, fromString: 2, toString: 1, finger: 1 }],
  }),
  Em7: createFingering('Em7-open', '开放式 Em7', [0, 2, 0, 0, 0, 0], '开放 Em7 只需按住 5 弦 2 品，声音比 Em 更松弛通透。', {
    fingers: [null, 2, null, null, null, null],
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
  Dsus4: createFingering('Dsus4-open', '开放式 Dsus4', ['x', 'x', 0, 2, 3, 3], '开放 Dsus4 在 1 弦加入 G 音，常和 D、Dsus2 来回装饰。', {
    fingers: [null, null, null, 1, 3, 4],
  }),
  Asus4: createFingering('Asus4-open', '开放式 Asus4', ['x', 0, 2, 2, 3, 0], '开放 Asus4 在 2 弦加入 D 音，适合与 A 和弦制造悬挂解决。', {
    fingers: [null, null, 1, 2, 3, null],
  }),
  Esus4: createFingering('Esus4-open', '开放式 Esus4', [0, 2, 2, 2, 0, 0], '开放 Esus4 在 3 弦加入 A 音，常用于 E 调的扫弦装饰。', {
    fingers: [null, 1, 2, 3, null, null],
  }),
  Dsus2: createFingering('Dsus2-open', '开放式 Dsus2', ['x', 'x', 0, 2, 3, 0], '开放 Dsus2 保留 1 弦空弦作为 E 音，声音清亮开放。', {
    fingers: [null, null, null, 1, 3, null],
  }),
  Asus2: createFingering('Asus2-open', '开放式 Asus2', ['x', 0, 2, 2, 0, 0], '开放 Asus2 使用 2 弦空弦作为 B 音，适合流行伴奏中的明亮色彩。', {
    fingers: [null, null, 1, 2, null, null],
  }),
  Esus2: createFingering('Esus2-open', '开放式 Esus2', [0, 2, 2, 4, 0, 0], '开放 Esus2 在 3 弦加入 F# 音，保留低音 E 的稳定感。', {
    fingers: [null, 1, 2, 4, null, null],
  }),
}

const EXCLUDED_CHORD_IDS: readonly GuitarChordId[] = ['G#maj7']
const ALL_CHORD_IDS = ROOTS.flatMap((root) => QUALITY_ORDER.map((quality) => `${root}${GUITAR_CHORD_QUALITIES[quality].suffix}` as GuitarChordId)).filter(
  (id) => !EXCLUDED_CHORD_IDS.includes(id),
)
const GUITAR_CHORD_IDS = [...COMMON_CHORD_ORDER, ...ALL_CHORD_IDS.filter((id) => !COMMON_CHORD_ORDER.includes(id))]

export const GUITAR_CHORDS: readonly GuitarChord[] = GUITAR_CHORD_IDS.map(createGuitarChord)

const GUITAR_CHORDS_BY_ID = new Map<GuitarChordId, GuitarChord>(GUITAR_CHORDS.map((chord) => [chord.id, chord]))

export function normalizeGuitarChordQuery(query: string): string {
  const compactQuery = query
    .normalize('NFKC')
    .trim()
    .replace(/[△Δ]/g, 'maj')
    .replace(/[\s_\-]+/g, '')
    .replace(/^([A-Ga-g](?:#|b)?)(M7)$/u, '$1maj7')

  return compactQuery.toLowerCase()
}

export function searchGuitarChords(query: string): GuitarChord[] {
  const normalizedQuery = normalizeGuitarChordQuery(query)

  if (!normalizedQuery) {
    return [...GUITAR_CHORDS]
  }

  return GUITAR_CHORDS.filter((chord) => getChordNameSearchTokens(chord).some((token) => token.includes(normalizedQuery))).sort(
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
  const toneData = createChordToneData(root, quality)

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
    staffPitches: toneData.staffPitches,
    fingerings: createFingerings(root, quality, id),
  }
}

function createChordToneData(root: GuitarChordRoot, quality: GuitarChordQualityId): ChordToneData {
  const rootPitch = createPitchFromSpec(ROOT_PITCH_SPECS[root])
  const intervals = QUALITY_INTERVALS[quality]
  const staffPitches = intervals.map((interval) => createIntervalPitch(rootPitch, interval))

  return {
    tones: staffPitches.map(formatToneName),
    staffPitches,
  }
}

function createPitchFromSpec([step, octave, accidental]: PitchSpec): Pitch {
  return createPitch(step, octave, accidental ?? null)
}

function createIntervalPitch(rootPitch: Pitch, interval: ChordIntervalSpec): Pitch {
  const rootStepIndex = STEP_ORDER.indexOf(rootPitch.step)
  const targetStepIndex = rootStepIndex + interval.degreeOffset
  const targetStep = STEP_ORDER[targetStepIndex % STEP_ORDER.length]
  const targetOctave = rootPitch.octave + Math.floor(targetStepIndex / STEP_ORDER.length)
  const targetMidiNumber = rootPitch.midiNumber + interval.semitones
  const naturalPitch = createPitch(targetStep, targetOctave)
  const accidental = semitoneDifferenceToAccidental(targetMidiNumber - naturalPitch.midiNumber)

  return createPitch(targetStep, targetOctave, accidental)
}

function semitoneDifferenceToAccidental(difference: number): Accidental {
  if (difference === -1) return 'flat'
  if (difference === 0) return null
  if (difference === 1) return 'sharp'

  throw new Error(`无法用单升降号拼写和弦音: ${difference}`)
}

function formatToneName(pitch: Pitch): string {
  return formatPitch(pitch).replace(/\d+$/u, '')
}

function createAliases(root: GuitarChordRoot, quality: GuitarChordQualityId, id: GuitarChordId): readonly string[] {
  const qualityConfig = GUITAR_CHORD_QUALITIES[quality]
  const rootNames = [root, ...(ROOT_ALIASES[root] ?? [])]
  const aliases = rootNames.flatMap((rootName) => [
    `${rootName}${qualityConfig.suffix}`,
    `${rootName} ${qualityConfig.label}`,
    ...qualityConfig.aliases.map((alias) => `${rootName}${alias}`),
    ...qualityConfig.aliases.map((alias) => `${rootName} ${alias}`),
  ])

  aliases.unshift(id)

  return Array.from(new Set(aliases))
}

function getChordRoot(id: GuitarChordId): GuitarChordRoot {
  const quality = getChordQuality(id)
  const suffix = GUITAR_CHORD_QUALITIES[quality].suffix

  return (suffix ? id.slice(0, -suffix.length) : id) as GuitarChordRoot
}

function getChordQuality(id: GuitarChordId): GuitarChordQualityId {
  const suffixMatch = getSuffixMatchCandidates().find((quality) => id.endsWith(quality.suffix))

  return suffixMatch?.id ?? 'major'
}

function getSuffixMatchCandidates(): GuitarChordQuality[] {
  return Object.values(GUITAR_CHORD_QUALITIES)
    .filter((quality) => quality.suffix.length > 0)
    .sort((firstQuality, secondQuality) => secondQuality.suffix.length - firstQuality.suffix.length)
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
    minor7: [fret, fret + 2, fret, fret, fret, fret],
    sus4: [fret, fret + 2, fret + 2, fret + 2, fret, fret],
    sus2: [fret, fret + 2, fret + 2, fret + 4, fret, fret],
  }
  const fingersByQuality: Record<GuitarChordQualityId, SixStringFingers> = {
    major: [1, 3, 4, 2, 1, 1],
    minor: [1, 3, 4, 1, 1, 1],
    dominant7: [1, 3, 1, 2, 1, 1],
    major7: [1, 3, 2, 2, 1, 1],
    minor7: [1, 3, 1, 1, 1, 1],
    sus4: [1, 3, 4, 2, 1, 1],
    sus2: [1, 2, 3, 4, 1, 1],
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
    minor7: ['x', fret, fret + 2, fret, fret + 1, fret],
    sus4: ['x', fret, fret + 2, fret + 2, fret + 3, fret],
    sus2: ['x', fret, fret + 2, fret + 2, fret, fret],
  }
  const fingersByQuality: Record<GuitarChordQualityId, SixStringFingers> = {
    major: [null, 1, 3, 3, 3, 1],
    minor: [null, 1, 3, 4, 2, 1],
    dominant7: [null, 1, 3, 1, 4, 1],
    major7: [null, 1, 3, 2, 4, 1],
    minor7: [null, 1, 3, 1, 2, 1],
    sus4: [null, 1, 2, 3, 4, 1],
    sus2: [null, 1, 2, 3, 1, 1],
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

function getChordNameSearchTokens(chord: GuitarChord): string[] {
  return [chord.symbol, ...chord.aliases].map(normalizeGuitarChordQuery)
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
