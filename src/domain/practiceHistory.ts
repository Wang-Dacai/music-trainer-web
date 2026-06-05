export type PracticeModuleId = 'ear-training' | 'interval-trainer' | 'rhythm-trainer'

export interface PracticeSessionInput {
  module: PracticeModuleId
  completedItems: number
  correctItems: number
  detail: string
  streak?: number
}

export interface PracticeSessionRecord extends PracticeSessionInput {
  id: string
  createdAt: string
}

export interface PracticeHistory {
  sessions: PracticeSessionRecord[]
}

export interface PracticeHistorySummary {
  totalSessions: number
  totalItems: number
  correctItems: number
  accuracy: number
  latestSession: PracticeSessionRecord | null
}

const STORAGE_KEY = 'music-trainer-web:practice-history:v1'
const MAX_SESSION_RECORDS = 30

export const EMPTY_PRACTICE_HISTORY: PracticeHistory = {
  sessions: [],
}

export function createPracticeSessionRecord(
  input: PracticeSessionInput,
  now: Date = new Date(),
  random: () => number = Math.random,
): PracticeSessionRecord {
  return {
    ...input,
    id: `${now.getTime()}-${Math.floor(random() * 1_000_000)}`,
    createdAt: now.toISOString(),
    streak: input.streak ?? 0,
  }
}

export function addPracticeSession(history: PracticeHistory, session: PracticeSessionRecord): PracticeHistory {
  return {
    sessions: [session, ...history.sessions].slice(0, MAX_SESSION_RECORDS),
  }
}

export function removePracticeSession(history: PracticeHistory, sessionId: string): PracticeHistory {
  return {
    sessions: history.sessions.filter((session) => session.id !== sessionId),
  }
}

export function summarizePracticeHistory(history: PracticeHistory): PracticeHistorySummary {
  const totalItems = history.sessions.reduce((sum, session) => sum + session.completedItems, 0)
  const correctItems = history.sessions.reduce((sum, session) => sum + session.correctItems, 0)

  return {
    totalSessions: history.sessions.length,
    totalItems,
    correctItems,
    accuracy: totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0,
    latestSession: history.sessions[0] ?? null,
  }
}

const PRACTICE_MODULE_LABELS: Record<PracticeModuleId, string> = {
  'ear-training': '单音听辨',
  'interval-trainer': '五线谱练习',
  'rhythm-trainer': '节奏训练',
}

export function getModuleLabel(module: PracticeModuleId): string {
  return PRACTICE_MODULE_LABELS[module]
}

export function loadPracticeHistory(): PracticeHistory {
  if (typeof window === 'undefined') {
    return EMPTY_PRACTICE_HISTORY
  }

  try {
    const rawHistory = window.localStorage.getItem(STORAGE_KEY)

    if (!rawHistory) {
      return EMPTY_PRACTICE_HISTORY
    }

    return parsePracticeHistory(JSON.parse(rawHistory))
  } catch {
    return EMPTY_PRACTICE_HISTORY
  }
}

export function savePracticeHistory(history: PracticeHistory): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

function parsePracticeHistory(value: unknown): PracticeHistory {
  if (!value || typeof value !== 'object' || !('sessions' in value) || !Array.isArray(value.sessions)) {
    return EMPTY_PRACTICE_HISTORY
  }

  return {
    sessions: value.sessions.filter(isPracticeSessionRecord).slice(0, MAX_SESSION_RECORDS),
  }
}

function isPracticeSessionRecord(value: unknown): value is PracticeSessionRecord {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as PracticeSessionRecord
  return (
    (candidate.module === 'ear-training' || candidate.module === 'interval-trainer' || candidate.module === 'rhythm-trainer') &&
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.completedItems === 'number' &&
    typeof candidate.correctItems === 'number' &&
    typeof candidate.detail === 'string'
  )
}
