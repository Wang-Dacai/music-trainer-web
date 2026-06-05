import { createPitch, formatPitch, type Accidental, type NoteStep, type Pitch } from './pitch'

export type RhythmTimeSignatureId = '4/4' | '3/4' | '2/4'
export type RhythmDifficultyId = 'beginner' | 'easy' | 'intermediate' | 'advanced'
export type RhythmPatternCategoryId = 'basic' | 'eighth' | 'sixteenth' | 'syncopation' | 'drummer'
export type RhythmMelodyPresetId = 'c-major-step' | 'c-major-arpeggio' | 'a-minor-pentatonic' | 'pop-motif'
export type RhythmNoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'dotted-quarter' | 'dotted-eighth'
export type RhythmEventKind = 'note' | 'rest'
export type RhythmTapMatchStatus = 'hit' | 'miss' | 'extra'

export interface RhythmTimeSignature {
  id: RhythmTimeSignatureId
  label: string
  beatsPerMeasure: number
  beatUnit: 4
  ticksPerBeat: number
  ticksPerMeasure: number
}

export interface RhythmDifficultyLevel {
  id: RhythmDifficultyId
  label: string
  summary: string
  toleranceMs: number
  passingScore: number
}

export interface RhythmPatternCategory {
  id: RhythmPatternCategoryId
  label: string
  summary: string
}

export interface RhythmTabPosition {
  string: 1 | 2 | 3 | 4 | 5 | 6
  fret: number
}

export interface RhythmMelodyNote {
  pitch: Pitch
  tab: RhythmTabPosition
  label: string
}

export interface RhythmMelodyPreset {
  id: RhythmMelodyPresetId
  label: string
  summary: string
  notes: readonly RhythmMelodyNote[]
}

export interface RhythmEvent {
  id: string
  kind: RhythmEventKind
  value: RhythmNoteValue
  ticks: number
  startTick: number
  label: string
  countLabel: string
  isAccent: boolean
}

export interface RhythmPattern {
  id: string
  title: string
  category: RhythmPatternCategoryId
  difficulty: RhythmDifficultyId
  timeSignature: RhythmTimeSignatureId
  events: RhythmEvent[]
  totalTicks: number
  expectedOnsets: number[]
  summary: string
  practiceTip: string
  countGuide: string
}

export interface RhythmMelodyEvent {
  event: RhythmEvent
  melodyNote: RhythmMelodyNote | null
  noteIndex: number | null
}

export interface RhythmExercise {
  id: string
  difficulty: RhythmDifficultyId
  timeSignature: RhythmTimeSignatureId
  bpm: number
  pattern: RhythmPattern
}

export interface GenerateRhythmExerciseOptions {
  difficulty?: RhythmDifficultyId
  timeSignature?: RhythmTimeSignatureId
  bpm?: number
  random?: () => number
  idFactory?: () => string
}

export interface RhythmPatternFilter {
  category?: RhythmPatternCategoryId | 'all'
  timeSignature?: RhythmTimeSignatureId | 'all'
  difficulty?: RhythmDifficultyId | 'all'
}

export interface RhythmTapMatch {
  status: RhythmTapMatchStatus
  expectedTick: number | null
  expectedMs: number | null
  tapMs: number | null
  errorMs: number | null
}

export interface RhythmJudgement {
  expectedCount: number
  hitCount: number
  missCount: number
  extraCount: number
  averageErrorMs: number
  score: number
  isCorrect: boolean
  matches: RhythmTapMatch[]
}

export interface RhythmPracticeStats {
  completedQuestions: number
  correctQuestions: number
  streak: number
  totalScore: number
  latestScore: number
}

interface RhythmEventTemplate {
  kind: RhythmEventKind
  value: RhythmNoteValue
  isAccent?: boolean
}

interface RhythmPatternTemplate {
  id: string
  title: string
  category: RhythmPatternCategoryId
  difficulty: RhythmDifficultyId
  timeSignature: RhythmTimeSignatureId
  summary: string
  practiceTip: string
  events: RhythmEventTemplate[]
}

export const RHYTHM_TICKS_PER_QUARTER = 4
export const DEFAULT_RHYTHM_TIME_SIGNATURE_ID: RhythmTimeSignatureId = '4/4'
export const DEFAULT_RHYTHM_DIFFICULTY_ID: RhythmDifficultyId = 'beginner'
export const DEFAULT_RHYTHM_CATEGORY_ID: RhythmPatternCategoryId = 'basic'
export const DEFAULT_RHYTHM_MELODY_PRESET_ID: RhythmMelodyPresetId = 'c-major-step'
export const DEFAULT_RHYTHM_BPM = 72
export const RHYTHM_BPM_OPTIONS = [60, 72, 84, 96, 108, 120] as const

export const RHYTHM_TIME_SIGNATURES: RhythmTimeSignature[] = [
  createTimeSignature('4/4', 4),
  createTimeSignature('3/4', 3),
  createTimeSignature('2/4', 2),
]

export const RHYTHM_DIFFICULTY_LEVELS: RhythmDifficultyLevel[] = [
  {
    id: 'beginner',
    label: '入门',
    summary: '四分、二分、全音符与基础休止；先建立稳定拍点。',
    toleranceMs: 180,
    passingScore: 75,
  },
  {
    id: 'easy',
    label: '基础',
    summary: '加入八分音符细分，练习 1 & 2 & 的稳定感。',
    toleranceMs: 140,
    passingScore: 80,
  },
  {
    id: 'intermediate',
    label: '进阶',
    summary: '加入十六分音符、附点和弱拍进入，训练更细的拍内位置。',
    toleranceMs: 110,
    passingScore: 85,
  },
  {
    id: 'advanced',
    label: '综合',
    summary: '常见切分、3-3-2、Clave 与鼓手常用骨架，适合作为真实乐器练习参考。',
    toleranceMs: 95,
    passingScore: 88,
  },
]

export const RHYTHM_PATTERN_CATEGORIES: RhythmPatternCategory[] = [
  {
    id: 'basic',
    label: '基础拍点',
    summary: '稳定四分、二分、全音符和基础休止。',
  },
  {
    id: 'eighth',
    label: '八分细分',
    summary: '常见八分音符组合与弱拍进入。',
  },
  {
    id: 'sixteenth',
    label: '十六分细分',
    summary: '前八后十六、前十六后八和连续十六分。',
  },
  {
    id: 'syncopation',
    label: '切分节奏',
    summary: '附点、Charleston、3-3-2 和提前进入。',
  },
  {
    id: 'drummer',
    label: '鼓手常用',
    summary: 'Backbeat、Funk 骨架、Clave 与 Bossa 参考型。',
  },
]

export const RHYTHM_MELODY_PRESETS: RhythmMelodyPreset[] = [
  {
    id: 'c-major-step',
    label: 'C 大调上行',
    summary: '用 C 大调音阶上行套入节奏，音高简单清楚。',
    notes: [
      createMelodyNote('C', 4, 2, 1),
      createMelodyNote('D', 4, 2, 3),
      createMelodyNote('E', 4, 1, 0),
      createMelodyNote('F', 4, 1, 1),
      createMelodyNote('G', 4, 1, 3),
      createMelodyNote('A', 4, 1, 5),
      createMelodyNote('B', 4, 1, 7),
      createMelodyNote('C', 5, 1, 8),
    ],
  },
  {
    id: 'c-major-arpeggio',
    label: 'C 和弦分解',
    summary: '用 C-E-G-C 的分解和弦听节奏，适合钢琴和吉他音色。',
    notes: [
      createMelodyNote('C', 4, 2, 1),
      createMelodyNote('E', 4, 1, 0),
      createMelodyNote('G', 4, 1, 3),
      createMelodyNote('C', 5, 1, 8),
      createMelodyNote('G', 4, 1, 3),
      createMelodyNote('E', 4, 1, 0),
    ],
  },
  {
    id: 'a-minor-pentatonic',
    label: 'A 小调五声',
    summary: '用 A 小调五声音阶套入节奏，适合鼓手听流行和摇滚语感。',
    notes: [
      createMelodyNote('A', 3, 3, 2),
      createMelodyNote('C', 4, 2, 1),
      createMelodyNote('D', 4, 2, 3),
      createMelodyNote('E', 4, 1, 0),
      createMelodyNote('G', 4, 1, 3),
      createMelodyNote('A', 4, 1, 5),
      createMelodyNote('C', 5, 1, 8),
    ],
  },
  {
    id: 'pop-motif',
    label: '流行短句',
    summary: '更像一句短旋律，适合听复杂切分时保持音乐感。',
    notes: [
      createMelodyNote('G', 4, 1, 3),
      createMelodyNote('E', 4, 1, 0),
      createMelodyNote('D', 4, 2, 3),
      createMelodyNote('C', 4, 2, 1),
      createMelodyNote('D', 4, 2, 3),
      createMelodyNote('E', 4, 1, 0),
      createMelodyNote('G', 4, 1, 3),
    ],
  },
]

const RHYTHM_NOTE_VALUE_TICKS: Record<RhythmNoteValue, number> = {
  whole: RHYTHM_TICKS_PER_QUARTER * 4,
  half: RHYTHM_TICKS_PER_QUARTER * 2,
  quarter: RHYTHM_TICKS_PER_QUARTER,
  eighth: RHYTHM_TICKS_PER_QUARTER / 2,
  sixteenth: RHYTHM_TICKS_PER_QUARTER / 4,
  'dotted-quarter': RHYTHM_TICKS_PER_QUARTER + RHYTHM_TICKS_PER_QUARTER / 2,
  'dotted-eighth': RHYTHM_TICKS_PER_QUARTER / 2 + RHYTHM_TICKS_PER_QUARTER / 4,
}

const RHYTHM_EVENT_LABELS: Record<RhythmNoteValue, { note: string; rest: string }> = {
  whole: { note: '𝅝', rest: '全休止' },
  half: { note: '𝅗𝅥', rest: '二分休止' },
  quarter: { note: '♩', rest: '𝄽' },
  eighth: { note: '♪', rest: '𝄾' },
  sixteenth: { note: '𝅘𝅥𝅯', rest: '十六分休止' },
  'dotted-quarter': { note: '♩.', rest: '附点四分休止' },
  'dotted-eighth': { note: '♪.', rest: '附点八分休止' },
}

const RHYTHM_PATTERN_TEMPLATES: RhythmPatternTemplate[] = [
  createTemplate('basic-4-4-quarters', '四分音符稳定拍', 'basic', 'beginner', '4/4', '四个稳定四分音符', '把每一拍落在同样的位置，先听重音再跟着数 1 2 3 4。', [
    ['note', 'quarter', true],
    ['note', 'quarter'],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('basic-4-4-half-quarters', '二分后接四分', 'basic', 'beginner', '4/4', '二分音符后接两个四分音符', '前两拍保持住，不要提前进入第三拍。', [
    ['note', 'half', true],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('basic-4-4-quarter-rest', '第二拍休止', 'basic', 'beginner', '4/4', '第二拍休止的四分节奏', '休止拍也要在心里数出来，第三拍再进入。', [
    ['note', 'quarter', true],
    ['rest', 'quarter'],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('basic-4-4-whole', '全音符保持', 'basic', 'beginner', '4/4', '一个全音符保持四拍', '重点是听见起点后稳定数满四拍。', [['note', 'whole', true]]),
  createTemplate('basic-3-4-waltz', '三拍稳定拍', 'basic', 'beginner', '3/4', '三拍稳定四分音符', '适合华尔兹或 3/4 基础律动，注意第一拍重音。', [
    ['note', 'quarter', true],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('basic-2-4-march', '二拍稳定拍', 'basic', 'beginner', '2/4', '两拍稳定四分音符', '短小明确的二拍型，适合进行曲式打底。', [
    ['note', 'quarter', true],
    ['note', 'quarter'],
  ]),
  createTemplate('eighth-4-4-even', '连续八分音符', 'eighth', 'easy', '4/4', '一小节连续八分音符', '稳定数 1 & 2 & 3 & 4 &，不要让 & 变轻或变急。', repeatEvents(8, ['note', 'eighth']).map(markFirstAccent)),
  createTemplate('eighth-4-4-first-beat', '首拍八分拆分', 'eighth', 'easy', '4/4', '第一拍拆成两个八分音符', '第一拍细分后，后面三拍回到四分音符。', [
    ['note', 'eighth', true],
    ['note', 'eighth'],
    ['note', 'quarter'],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('eighth-4-4-rest-entry', '八分休止弱拍进', 'eighth', 'easy', '4/4', '八分休止后的弱拍进入', '先空掉拍头，在 & 上准确进入。', [
    ['rest', 'eighth'],
    ['note', 'eighth', true],
    ['note', 'quarter'],
    ['note', 'eighth'],
    ['note', 'eighth'],
    ['note', 'quarter'],
  ]),
  createTemplate('eighth-3-4-subdivision', '三拍八分细分', 'eighth', 'easy', '3/4', '三拍中的八分细分', '三拍里保持八分细分，第一拍仍然最稳定。', [
    ['note', 'eighth', true],
    ['note', 'eighth'],
    ['note', 'quarter'],
    ['note', 'eighth'],
    ['note', 'eighth'],
  ]),
  createTemplate('eighth-2-4-pickup', '二拍弱拍进入', 'eighth', 'easy', '2/4', '两拍中的八分弱拍进入', '先空出第一个八分，再听弱拍的进入位置。', [
    ['rest', 'eighth'],
    ['note', 'eighth', true],
    ['note', 'quarter'],
  ]),
  createTemplate('sixteenth-4-4-even', '连续十六分音符', 'sixteenth', 'intermediate', '4/4', '一小节连续十六分音符', '稳定数 1 e & a，每一格都要均匀。', repeatEvents(16, ['note', 'sixteenth']).map(markFirstAccent)),
  createTemplate('sixteenth-4-4-eighth-two-sixteenth', '前八后十六', 'sixteenth', 'intermediate', '4/4', '每拍前八后两个十六分音符', '每拍的后半拍分成两个更小的十六分，常见于摇滚和流行填充。', repeatBeatEvents([
    ['note', 'eighth'],
    ['note', 'sixteenth'],
    ['note', 'sixteenth'],
  ])),
  createTemplate('sixteenth-4-4-two-sixteenth-eighth', '前十六后八', 'sixteenth', 'intermediate', '4/4', '每拍两个十六分后接八分音符', '每拍前半拍要清楚，后半拍留出八分长度。', repeatBeatEvents([
    ['note', 'sixteenth'],
    ['note', 'sixteenth'],
    ['note', 'eighth'],
  ])),
  createTemplate('sixteenth-4-4-sync-cell', '十六分弱位骨架', 'sixteenth', 'intermediate', '4/4', '十六分弱位进入组合', '弱位进入要靠内心细分定位，适合慢速反复听。', [
    ['note', 'sixteenth', true],
    ['rest', 'sixteenth'],
    ['note', 'eighth'],
    ['rest', 'sixteenth'],
    ['note', 'sixteenth'],
    ['rest', 'eighth'],
    ['note', 'eighth'],
    ['note', 'sixteenth'],
    ['note', 'sixteenth'],
    ['rest', 'quarter'],
  ]),
  createTemplate('sync-4-4-dotted-quarter', '附点四分切分', 'syncopation', 'intermediate', '4/4', '附点四分音符后接八分音符', '听清 1 到 2& 的距离，这是常见切分的入口。', [
    ['note', 'dotted-quarter', true],
    ['note', 'eighth'],
    ['note', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('sync-4-4-charleston', 'Charleston 节奏', 'syncopation', 'advanced', '4/4', 'Charleston 型：第一拍后接第二拍后半拍', '第二个音在 2&，不要落到第二拍正拍上。', [
    ['note', 'dotted-quarter', true],
    ['note', 'eighth'],
    ['rest', 'half'],
  ]),
  createTemplate('sync-4-4-tresillo', '3-3-2 / Tresillo', 'syncopation', 'advanced', '4/4', '3-3-2 切分骨架', '三个起点分别是 1、2&、4，常见于拉丁、流行和鼓组律动。', [
    ['note', 'dotted-quarter', true],
    ['note', 'dotted-quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('sync-4-4-anticipation', '提前进入切分', 'syncopation', 'advanced', '4/4', '弱拍提前进入后回到正拍', '弱拍进入以后不要被带跑，第四拍要回到稳的位置。', [
    ['note', 'quarter', true],
    ['rest', 'eighth'],
    ['note', 'eighth'],
    ['rest', 'eighth'],
    ['note', 'eighth'],
    ['note', 'quarter'],
  ]),
  createTemplate('sync-2-4-dotted-cell', '二拍附点骨架', 'syncopation', 'intermediate', '2/4', '两拍中的附点八分推进', '附点八分到十六分的距离很短，适合慢速听清。', [
    ['note', 'dotted-eighth', true],
    ['note', 'sixteenth'],
    ['note', 'quarter'],
  ]),
  createTemplate('drummer-4-4-backbeat', 'Backbeat 2 和 4', 'drummer', 'easy', '4/4', '只突出第二拍和第四拍的 Backbeat', '听第二拍和第四拍的位置，适合军鼓回拍练习。', [
    ['rest', 'quarter'],
    ['note', 'quarter', true],
    ['rest', 'quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('drummer-4-4-funk-ghost', 'Funk 十六分骨架', 'drummer', 'advanced', '4/4', 'Funk 常见十六分鬼音骨架', '密集音不等于变快，先把每个十六分位置听准。', [
    ['note', 'eighth', true],
    ['note', 'eighth'],
    ['note', 'sixteenth'],
    ['note', 'sixteenth'],
    ['note', 'eighth'],
    ['note', 'eighth'],
    ['note', 'sixteenth'],
    ['note', 'sixteenth'],
    ['note', 'quarter'],
  ]),
  createTemplate('drummer-4-4-bossa-cell', 'Bossa clave 单小节', 'drummer', 'advanced', '4/4', 'Bossa Nova 常见单小节骨架', '注意第三个音不是正拍平均分割，后半小节要保持松弛。', [
    ['note', 'dotted-eighth', true],
    ['note', 'dotted-eighth'],
    ['note', 'quarter'],
    ['note', 'eighth'],
    ['note', 'quarter'],
  ]),
  createTemplate('drummer-4-4-son-cell', 'Son clave 单小节', 'drummer', 'advanced', '4/4', 'Son Clave 3-2 的单小节骨架', '这是 3-3-2 的近亲，常作为拉丁律动定位参考。', [
    ['note', 'dotted-quarter', true],
    ['note', 'dotted-quarter'],
    ['note', 'quarter'],
  ]),
  createTemplate('drummer-3-4-backbeat', '三拍回拍参考', 'drummer', 'intermediate', '3/4', '三拍中突出第二拍的回拍参考', '三拍中第二拍的落点要独立，不要被第一拍重音吞掉。', [
    ['rest', 'quarter'],
    ['note', 'quarter', true],
    ['note', 'quarter'],
  ]),
]

export const RHYTHM_PATTERN_LIBRARY: RhythmPattern[] = RHYTHM_PATTERN_TEMPLATES.map(buildRhythmPattern)

export function getRhythmTimeSignature(timeSignatureId: RhythmTimeSignatureId): RhythmTimeSignature {
  const timeSignature = RHYTHM_TIME_SIGNATURES.find((candidate) => candidate.id === timeSignatureId)

  if (!timeSignature) {
    throw new Error(`不支持的节奏拍号: ${timeSignatureId}`)
  }

  return timeSignature
}

export function getRhythmDifficulty(difficultyId: RhythmDifficultyId): RhythmDifficultyLevel {
  const difficulty = RHYTHM_DIFFICULTY_LEVELS.find((candidate) => candidate.id === difficultyId)

  if (!difficulty) {
    throw new Error(`不支持的节奏难度: ${difficultyId}`)
  }

  return difficulty
}

export function getRhythmPatternCategory(categoryId: RhythmPatternCategoryId): RhythmPatternCategory {
  const category = RHYTHM_PATTERN_CATEGORIES.find((candidate) => candidate.id === categoryId)

  if (!category) {
    throw new Error(`不支持的节奏分类: ${categoryId}`)
  }

  return category
}

export function getRhythmMelodyPreset(melodyPresetId: RhythmMelodyPresetId): RhythmMelodyPreset {
  const melodyPreset = RHYTHM_MELODY_PRESETS.find((candidate) => candidate.id === melodyPresetId)

  if (!melodyPreset) {
    throw new Error(`不支持的节奏旋律: ${melodyPresetId}`)
  }

  return melodyPreset
}

export function getRhythmPatternMelodyEvents(
  pattern: RhythmPattern,
  melodyPresetId: RhythmMelodyPresetId = DEFAULT_RHYTHM_MELODY_PRESET_ID,
): RhythmMelodyEvent[] {
  const melodyPreset = getRhythmMelodyPreset(melodyPresetId)
  let noteIndex = 0

  return pattern.events.map((event) => {
    if (event.kind === 'rest') {
      return {
        event,
        melodyNote: null,
        noteIndex: null,
      }
    }

    const melodyNote = melodyPreset.notes[noteIndex % melodyPreset.notes.length]
    const currentNoteIndex = noteIndex
    noteIndex += 1

    return {
      event,
      melodyNote,
      noteIndex: currentNoteIndex,
    }
  })
}

export function getRhythmTicksForValue(value: RhythmNoteValue): number {
  return RHYTHM_NOTE_VALUE_TICKS[value]
}

export function getRhythmMillisecondsPerBeat(bpm: number): number {
  validateBpm(bpm)
  return 60_000 / bpm
}

export function getRhythmMillisecondsPerTick(bpm: number): number {
  return getRhythmMillisecondsPerBeat(bpm) / RHYTHM_TICKS_PER_QUARTER
}

export function getRhythmMeasureDurationMs(timeSignatureId: RhythmTimeSignatureId, bpm: number): number {
  return getRhythmTimeSignature(timeSignatureId).ticksPerMeasure * getRhythmMillisecondsPerTick(bpm)
}

export function getRhythmPatternDurationMs(pattern: RhythmPattern, bpm: number): number {
  return pattern.totalTicks * getRhythmMillisecondsPerTick(bpm)
}

export function getRhythmPatterns(filter: RhythmPatternFilter = {}): RhythmPattern[] {
  const category = filter.category ?? 'all'
  const timeSignature = filter.timeSignature ?? 'all'
  const difficulty = filter.difficulty ?? 'all'

  return RHYTHM_PATTERN_LIBRARY.filter((pattern) => {
    const matchesCategory = category === 'all' || pattern.category === category
    const matchesTimeSignature = timeSignature === 'all' || pattern.timeSignature === timeSignature
    const matchesDifficulty = difficulty === 'all' || pattern.difficulty === difficulty
    return matchesCategory && matchesTimeSignature && matchesDifficulty
  })
}

export function getRhythmPatternById(patternId: string): RhythmPattern {
  const pattern = RHYTHM_PATTERN_LIBRARY.find((candidate) => candidate.id === patternId)

  if (!pattern) {
    throw new Error(`不支持的节奏型: ${patternId}`)
  }

  return pattern
}

export function generateRhythmExercise({
  difficulty = DEFAULT_RHYTHM_DIFFICULTY_ID,
  timeSignature = DEFAULT_RHYTHM_TIME_SIGNATURE_ID,
  bpm = DEFAULT_RHYTHM_BPM,
  random = Math.random,
  idFactory,
}: GenerateRhythmExerciseOptions = {}): RhythmExercise {
  getRhythmDifficulty(difficulty)
  getRhythmTimeSignature(timeSignature)
  validateBpm(bpm)

  const patterns = RHYTHM_PATTERN_LIBRARY.filter((pattern) => pattern.difficulty === difficulty && pattern.timeSignature === timeSignature)

  if (patterns.length === 0) {
    throw new Error(`没有可用的${timeSignature} ${getRhythmDifficulty(difficulty).label}节奏模板`)
  }

  const pattern = patterns[getRandomIndex(patterns.length, random)]
  return {
    id: idFactory?.() ?? createDefaultRhythmExerciseId(),
    difficulty,
    timeSignature,
    bpm,
    pattern,
  }
}

export function createRhythmExerciseFromPattern(patternId: string, bpm: number, idFactory?: () => string): RhythmExercise {
  const pattern = getRhythmPatternById(patternId)
  validateBpm(bpm)

  return {
    id: idFactory?.() ?? createDefaultRhythmExerciseId(),
    difficulty: pattern.difficulty,
    timeSignature: pattern.timeSignature,
    bpm,
    pattern,
  }
}

export function judgeRhythmTaps(
  pattern: RhythmPattern,
  tapsMs: readonly number[],
  bpm: number,
  difficultyId: RhythmDifficultyId = DEFAULT_RHYTHM_DIFFICULTY_ID,
): RhythmJudgement {
  const difficulty = getRhythmDifficulty(difficultyId)
  const millisecondsPerTick = getRhythmMillisecondsPerTick(bpm)
  const expected = pattern.expectedOnsets.map((tick) => ({ tick, ms: tick * millisecondsPerTick }))
  const usedTapIndexes = new Set<number>()
  const matches: RhythmTapMatch[] = []
  const hitErrors: number[] = []

  expected.forEach(({ tick, ms }) => {
    let bestTapIndex: number | null = null
    let bestError = Number.POSITIVE_INFINITY

    tapsMs.forEach((tapMs, tapIndex) => {
      if (usedTapIndexes.has(tapIndex)) {
        return
      }

      const error = tapMs - ms
      const absoluteError = Math.abs(error)

      if (absoluteError <= difficulty.toleranceMs && absoluteError < Math.abs(bestError)) {
        bestTapIndex = tapIndex
        bestError = error
      }
    })

    if (bestTapIndex === null) {
      matches.push({
        status: 'miss',
        expectedTick: tick,
        expectedMs: roundMilliseconds(ms),
        tapMs: null,
        errorMs: null,
      })
      return
    }

    usedTapIndexes.add(bestTapIndex)
    hitErrors.push(Math.abs(bestError))
    matches.push({
      status: 'hit',
      expectedTick: tick,
      expectedMs: roundMilliseconds(ms),
      tapMs: roundMilliseconds(tapsMs[bestTapIndex]),
      errorMs: roundMilliseconds(bestError),
    })
  })

  tapsMs.forEach((tapMs, tapIndex) => {
    if (!usedTapIndexes.has(tapIndex)) {
      matches.push({
        status: 'extra',
        expectedTick: null,
        expectedMs: null,
        tapMs: roundMilliseconds(tapMs),
        errorMs: null,
      })
    }
  })

  const expectedCount = expected.length
  const hitCount = hitErrors.length
  const missCount = expectedCount - hitCount
  const extraCount = tapsMs.length - usedTapIndexes.size
  const averageErrorMs = hitErrors.length > 0 ? Math.round(hitErrors.reduce((sum, error) => sum + error, 0) / hitErrors.length) : 0
  const hitRatio = expectedCount > 0 ? hitCount / expectedCount : 0
  const timingRatio = hitErrors.length > 0 ? Math.max(0, 1 - averageErrorMs / difficulty.toleranceMs) : 0
  const score = Math.max(0, Math.round(hitRatio * 82 + timingRatio * 18 - extraCount * 10))

  return {
    expectedCount,
    hitCount,
    missCount,
    extraCount,
    averageErrorMs,
    score,
    isCorrect: hitCount === expectedCount && extraCount === 0 && score >= difficulty.passingScore,
    matches,
  }
}

export function createInitialRhythmStats(): RhythmPracticeStats {
  return {
    completedQuestions: 0,
    correctQuestions: 0,
    streak: 0,
    totalScore: 0,
    latestScore: 0,
  }
}

export function recordRhythmAnswer(stats: RhythmPracticeStats, judgement: RhythmJudgement): RhythmPracticeStats {
  return {
    completedQuestions: stats.completedQuestions + 1,
    correctQuestions: stats.correctQuestions + (judgement.isCorrect ? 1 : 0),
    streak: judgement.isCorrect ? stats.streak + 1 : 0,
    totalScore: stats.totalScore + judgement.score,
    latestScore: judgement.score,
  }
}

export function getRhythmAccuracy(stats: RhythmPracticeStats): number {
  if (stats.completedQuestions === 0) {
    return 0
  }

  return Math.round((stats.correctQuestions / stats.completedQuestions) * 100)
}

export function getRhythmAverageScore(stats: RhythmPracticeStats): number {
  if (stats.completedQuestions === 0) {
    return 0
  }

  return Math.round(stats.totalScore / stats.completedQuestions)
}

function createTimeSignature(id: RhythmTimeSignatureId, beatsPerMeasure: number): RhythmTimeSignature {
  return {
    id,
    label: id,
    beatsPerMeasure,
    beatUnit: 4,
    ticksPerBeat: RHYTHM_TICKS_PER_QUARTER,
    ticksPerMeasure: beatsPerMeasure * RHYTHM_TICKS_PER_QUARTER,
  }
}

function createTemplate(
  id: string,
  title: string,
  category: RhythmPatternCategoryId,
  difficulty: RhythmDifficultyId,
  timeSignature: RhythmTimeSignatureId,
  summary: string,
  practiceTip: string,
  events: Array<readonly [RhythmEventKind, RhythmNoteValue, boolean?]>,
): RhythmPatternTemplate {
  return {
    id,
    title,
    category,
    difficulty,
    timeSignature,
    summary,
    practiceTip,
    events: events.map(([kind, value, isAccent]) => ({ kind, value, isAccent })),
  }
}

function createMelodyNote(
  step: NoteStep,
  octave: number,
  string: RhythmTabPosition['string'],
  fret: number,
  accidental: Accidental = null,
): RhythmMelodyNote {
  const pitch = createPitch(step, octave, accidental)

  return {
    pitch,
    tab: { string, fret },
    label: formatPitch(pitch),
  }
}

function repeatEvents(count: number, event: readonly [RhythmEventKind, RhythmNoteValue]): Array<readonly [RhythmEventKind, RhythmNoteValue, boolean?]> {
  return Array.from({ length: count }, () => event)
}

function repeatBeatEvents(events: Array<readonly [RhythmEventKind, RhythmNoteValue]>): Array<readonly [RhythmEventKind, RhythmNoteValue, boolean?]> {
  return Array.from({ length: 4 }, (_, beatIndex) => events.map(([kind, value], eventIndex) => [kind, value, beatIndex === 0 && eventIndex === 0] as const)).flat()
}

function markFirstAccent(event: readonly [RhythmEventKind, RhythmNoteValue, boolean?], index: number): readonly [RhythmEventKind, RhythmNoteValue, boolean?] {
  return [event[0], event[1], index === 0]
}

function buildRhythmPattern(template: RhythmPatternTemplate): RhythmPattern {
  const timeSignature = getRhythmTimeSignature(template.timeSignature)
  let startTick = 0
  const events = template.events.map((eventTemplate, index) => {
    const ticks = getRhythmTicksForValue(eventTemplate.value)
    const event: RhythmEvent = {
      id: `${template.id}-${index + 1}`,
      kind: eventTemplate.kind,
      value: eventTemplate.value,
      ticks,
      startTick,
      label: getRhythmEventLabel(eventTemplate.kind, eventTemplate.value),
      countLabel: getRhythmCountLabel(startTick),
      isAccent: eventTemplate.isAccent ?? (eventTemplate.kind === 'note' && startTick === 0),
    }
    startTick += ticks
    return event
  })

  if (startTick !== timeSignature.ticksPerMeasure) {
    throw new Error(`${template.id} 节奏模板总时值 ${startTick} ticks 不等于 ${template.timeSignature} 小节 ${timeSignature.ticksPerMeasure} ticks`)
  }

  const expectedOnsets = events.filter((event) => event.kind === 'note').map((event) => event.startTick)

  return {
    id: template.id,
    title: template.title,
    category: template.category,
    difficulty: template.difficulty,
    timeSignature: template.timeSignature,
    events,
    totalTicks: startTick,
    expectedOnsets,
    summary: template.summary,
    practiceTip: template.practiceTip,
    countGuide: expectedOnsets.map(getRhythmCountLabel).join(' · '),
  }
}

function getRhythmEventLabel(kind: RhythmEventKind, value: RhythmNoteValue): string {
  return RHYTHM_EVENT_LABELS[value][kind]
}

function getRhythmCountLabel(startTick: number): string {
  const beat = Math.floor(startTick / RHYTHM_TICKS_PER_QUARTER) + 1
  const subdivision = startTick % RHYTHM_TICKS_PER_QUARTER

  if (subdivision === 0) return String(beat)
  if (subdivision === 1) return `${beat} e`
  if (subdivision === 2) return `${beat} &`
  return `${beat} a`
}

function getRandomIndex(length: number, random: () => number): number {
  return Math.min(length - 1, Math.floor(random() * length))
}

function createDefaultRhythmExerciseId(): string {
  return `rhythm-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
}

function validateBpm(bpm: number): void {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    throw new Error(`BPM 必须是正数: ${bpm}`)
  }
}

function roundMilliseconds(milliseconds: number): number {
  return Math.round(milliseconds)
}
