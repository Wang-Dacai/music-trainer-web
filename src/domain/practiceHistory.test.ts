import { describe, expect, it } from 'vitest'
import {
  addPracticeSession,
  createPracticeSessionRecord,
  EMPTY_PRACTICE_HISTORY,
  getModuleLabel,
  removePracticeSession,
  summarizePracticeHistory,
} from './practiceHistory'

describe('practiceHistory', () => {
  it('creates stable practice session records from session input', () => {
    const record = createPracticeSessionRecord(
      {
        module: 'ear-training',
        completedItems: 7,
        correctItems: 5,
        detail: '小字一组 C4-B4',
        streak: 3,
      },
      new Date('2026-05-31T12:00:00.000Z'),
      () => 0.123456,
    )

    expect(record).toEqual({
      id: '1780228800000-123456',
      module: 'ear-training',
      completedItems: 7,
      correctItems: 5,
      detail: '小字一组 C4-B4',
      streak: 3,
      createdAt: '2026-05-31T12:00:00.000Z',
    })
  })

  it('adds new sessions first and summarizes total practice history', () => {
    const first = createPracticeSessionRecord(
      {
        module: 'ear-training',
        completedItems: 4,
        correctItems: 3,
        detail: '小字一组 C4-B4',
      },
      new Date('2026-05-31T12:00:00.000Z'),
      () => 0.1,
    )
    const second = createPracticeSessionRecord(
      {
        module: 'interval-trainer',
        completedItems: 6,
        correctItems: 3,
        detail: '高音谱号 · 入门',
      },
      new Date('2026-05-31T12:05:00.000Z'),
      () => 0.2,
    )

    const history = addPracticeSession(addPracticeSession(EMPTY_PRACTICE_HISTORY, first), second)
    const summary = summarizePracticeHistory(history)

    expect(history.sessions[0]).toBe(second)
    expect(summary).toEqual({
      totalSessions: 2,
      totalItems: 10,
      correctItems: 6,
      accuracy: 60,
      latestSession: second,
    })
  })

  it('returns Chinese module labels', () => {
    expect(getModuleLabel('ear-training')).toBe('单音听辨')
    expect(getModuleLabel('interval-trainer')).toBe('五线谱练习')
  })

  it('removes a practice session by id', () => {
    const first = createPracticeSessionRecord(
      {
        module: 'ear-training',
        completedItems: 4,
        correctItems: 3,
        detail: '小字一组 C4-B4',
      },
      new Date('2026-05-31T12:00:00.000Z'),
      () => 0.1,
    )
    const second = createPracticeSessionRecord(
      {
        module: 'interval-trainer',
        completedItems: 6,
        correctItems: 3,
        detail: '高音谱号 · 入门',
      },
      new Date('2026-05-31T12:05:00.000Z'),
      () => 0.2,
    )

    const history = removePracticeSession({ sessions: [second, first] }, first.id)

    expect(history.sessions).toEqual([second])
  })
})
