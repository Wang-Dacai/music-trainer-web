import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID,
  DEFAULT_RHYTHM_REPEAT_COUNT,
  playRhythmPatternDemo,
  RHYTHM_DEMO_INSTRUMENTS,
  RHYTHM_REPEAT_OPTIONS,
  stopRhythmPlayback,
  type RhythmDemoInstrumentId,
} from '../../audio/rhythmPlayback'
import type { PracticeSessionInput } from '../../domain/practiceHistory'
import {
  DEFAULT_RHYTHM_BPM,
  DEFAULT_RHYTHM_CATEGORY_ID,
  DEFAULT_RHYTHM_MELODY_PRESET_ID,
  DEFAULT_RHYTHM_TIME_SIGNATURE_ID,
  getRhythmDifficulty,
  getRhythmMelodyPreset,
  getRhythmPatternCategory,
  getRhythmPatterns,
  RHYTHM_BPM_OPTIONS,
  RHYTHM_DIFFICULTY_LEVELS,
  RHYTHM_MELODY_PRESETS,
  RHYTHM_PATTERN_CATEGORIES,
  RHYTHM_PATTERN_LIBRARY,
  RHYTHM_TIME_SIGNATURES,
  type RhythmDifficultyId,
  type RhythmMelodyPresetId,
  type RhythmPattern,
  type RhythmPatternCategoryId,
  type RhythmTimeSignatureId,
} from '../../domain/rhythmTrainer'
import RhythmPatternView from '../components/RhythmPatternView'

type RhythmStatusTone = 'neutral' | 'success' | 'error'
type RhythmFilterCategory = RhythmPatternCategoryId | 'all'
type RhythmFilterTimeSignature = RhythmTimeSignatureId | 'all'
type RhythmFilterDifficulty = RhythmDifficultyId | 'all'

interface RhythmTrainerPageProps {
  isActive?: boolean
  onSessionComplete?: (session: PracticeSessionInput) => void
}

export function RhythmTrainerPage({ isActive = true }: RhythmTrainerPageProps) {
  const [category, setCategory] = useState<RhythmFilterCategory>(DEFAULT_RHYTHM_CATEGORY_ID)
  const [timeSignatureId, setTimeSignatureId] = useState<RhythmFilterTimeSignature>(DEFAULT_RHYTHM_TIME_SIGNATURE_ID)
  const [difficulty, setDifficulty] = useState<RhythmFilterDifficulty>('all')
  const [bpm, setBpm] = useState<number>(DEFAULT_RHYTHM_BPM)
  const [instrumentId, setInstrumentId] = useState<RhythmDemoInstrumentId>(DEFAULT_RHYTHM_DEMO_INSTRUMENT_ID)
  const [melodyPresetId, setMelodyPresetId] = useState<RhythmMelodyPresetId>(DEFAULT_RHYTHM_MELODY_PRESET_ID)
  const [repeatCount, setRepeatCount] = useState(DEFAULT_RHYTHM_REPEAT_COUNT)
  const [keepCountIn, setKeepCountIn] = useState(true)
  const [selectedPatternId, setSelectedPatternId] = useState(RHYTHM_PATTERN_LIBRARY[0].id)
  const [isPlaying, setIsPlaying] = useState(false)
  const [status, setStatus] = useState('选择一个节奏型后点击“播放示范”')
  const [statusTone, setStatusTone] = useState<RhythmStatusTone>('neutral')
  const playbackTokenRef = useRef(0)
  const mountedRef = useRef(false)

  const filteredPatterns = useMemo(
    () =>
      getRhythmPatterns({
        category,
        timeSignature: timeSignatureId,
        difficulty,
      }),
    [category, difficulty, timeSignatureId],
  )
  const filteredPatternIds = useMemo(() => filteredPatterns.map((pattern) => pattern.id).join('|'), [filteredPatterns])
  const selectedPattern = getSelectedPattern(selectedPatternId, filteredPatterns)
  const selectedCategory = getRhythmPatternCategory(selectedPattern.category)
  const selectedDifficulty = getRhythmDifficulty(selectedPattern.difficulty)
  const selectedInstrument = RHYTHM_DEMO_INSTRUMENTS.find((instrument) => instrument.id === instrumentId) ?? RHYTHM_DEMO_INSTRUMENTS[0]
  const selectedMelodyPreset = getRhythmMelodyPreset(melodyPresetId)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      createPlaybackToken()
      stopRhythmPlayback()
    }
  }, [])

  useEffect(() => {
    if (!filteredPatterns.some((pattern) => pattern.id === selectedPatternId)) {
      setSelectedPatternId(filteredPatterns[0]?.id ?? RHYTHM_PATTERN_LIBRARY[0].id)
    }
  }, [filteredPatternIds, filteredPatterns, selectedPatternId])

  useEffect(() => {
    if (isActive) {
      return
    }

    createPlaybackToken()
    stopRhythmPlayback()
    setIsPlaying(false)
    setStatus('已暂停')
    setStatusTone('neutral')
  }, [isActive])

  function handleSelectPattern(pattern: RhythmPattern) {
    createPlaybackToken()
    stopRhythmPlayback()
    setIsPlaying(false)
    setSelectedPatternId(pattern.id)
    setStatus(`已选择 ${pattern.title}`)
    setStatusTone('neutral')
  }

  async function handlePlayPattern() {
    if (isPlaying) {
      return
    }

    const token = createPlaybackToken()
    setIsPlaying(true)
    setStatus(`正在播放 ${selectedPattern.title} · ${selectedInstrument.label} · ${selectedMelodyPreset.label}`)
    setStatusTone('neutral')

    try {
      await playRhythmPatternDemo(selectedPattern, bpm, {
        instrumentId,
        keepMetronome: keepCountIn,
        melodyPresetId,
        repeatCount,
      })

      if (isCurrentPlayback(token)) {
        setStatus(`已播放 ${selectedPattern.title}`)
        setStatusTone('success')
      }
    } catch (error) {
      console.error(error)

      if (isCurrentPlayback(token)) {
        setStatus('节奏示范播放失败，请确认浏览器允许播放声音')
        setStatusTone('error')
      }
    } finally {
      if (isCurrentPlayback(token)) {
        setIsPlaying(false)
      }
    }
  }

  function handleStopPlayback() {
    createPlaybackToken()
    stopRhythmPlayback()
    setIsPlaying(false)
    setStatus('已停止播放')
    setStatusTone('neutral')
  }

  function createPlaybackToken(): number {
    playbackTokenRef.current += 1
    return playbackTokenRef.current
  }

  function isCurrentPlayback(token: number): boolean {
    return mountedRef.current && playbackTokenRef.current === token
  }

  return (
    <section className="module-panel" aria-labelledby="rhythm-trainer-title" aria-hidden={!isActive}>
      <header className="module-header compact rhythm-header">
        <div>
          <p className="module-kicker">rhythm reference library</p>
          <h1 id="rhythm-trainer-title">Rhythm Trainer：节奏参考</h1>
          <p className="module-summary">
            选择常见节奏型，把节奏套入真实旋律，查看吉他扫弦六线谱和五线谱两种写法，并用钢琴、吉他等音色播放示范。
          </p>
        </div>
      </header>

      <div className="rhythm-control-panel">
        <div className="rhythm-control-groups">
          <section className="rhythm-control-group rhythm-filter-group" aria-label="节奏筛选">
            <div className="rhythm-control-group-heading">
              <strong>筛选</strong>
              <span>{filteredPatterns.length} 个谱例</span>
            </div>

            <div className="compact-select-grid rhythm-filter-grid" aria-label="节奏参考设置">
              <label className="compact-select-field">
                <span>分类</span>
                <select value={category} onChange={(event) => setCategory(event.currentTarget.value as RhythmFilterCategory)}>
                  <option value="all">全部分类</option>
                  {RHYTHM_PATTERN_CATEGORIES.map((patternCategory) => (
                    <option key={patternCategory.id} value={patternCategory.id}>
                      {patternCategory.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="compact-select-field">
                <span>拍号</span>
                <select value={timeSignatureId} onChange={(event) => setTimeSignatureId(event.currentTarget.value as RhythmFilterTimeSignature)}>
                  <option value="all">全部拍号</option>
                  {RHYTHM_TIME_SIGNATURES.map((timeSignature) => (
                    <option key={timeSignature.id} value={timeSignature.id}>
                      {timeSignature.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="compact-select-field">
                <span>难度</span>
                <select value={difficulty} onChange={(event) => setDifficulty(event.currentTarget.value as RhythmFilterDifficulty)}>
                  <option value="all">全部难度</option>
                  {RHYTHM_DIFFICULTY_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rhythm-control-group rhythm-demo-group" aria-label="示范设置">
            <div className="rhythm-control-group-heading">
              <strong>示范</strong>
              <span>
                {selectedInstrument.label} · {selectedMelodyPreset.label}
              </span>
            </div>

            <div className="rhythm-demo-controls">
              <div className="compact-select-grid rhythm-demo-grid">
                <label className="compact-select-field">
                  <span>BPM</span>
                  <select value={bpm} onChange={(event) => setBpm(Number(event.currentTarget.value))}>
                    {RHYTHM_BPM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="compact-select-field">
                  <span>音色</span>
                  <select value={instrumentId} onChange={(event) => setInstrumentId(event.currentTarget.value as RhythmDemoInstrumentId)}>
                    {RHYTHM_DEMO_INSTRUMENTS.map((instrument) => (
                      <option key={instrument.id} value={instrument.id}>
                        {instrument.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="compact-select-field">
                  <span>旋律</span>
                  <select value={melodyPresetId} onChange={(event) => setMelodyPresetId(event.currentTarget.value as RhythmMelodyPresetId)}>
                    {RHYTHM_MELODY_PRESETS.map((melodyPreset) => (
                      <option key={melodyPreset.id} value={melodyPreset.id}>
                        {melodyPreset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="compact-select-field">
                  <span>遍数</span>
                  <select value={repeatCount} onChange={(event) => setRepeatCount(Number(event.currentTarget.value))}>
                    {RHYTHM_REPEAT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="toolbar compact-toolbar rhythm-playback-toolbar" aria-label="节奏播放控制">
                <label className="switch-field">
                  <input type="checkbox" checked={keepCountIn} onChange={(event) => setKeepCountIn(event.currentTarget.checked)} />
                  <span>预备拍</span>
                </label>
                <button type="button" className="primary-action" disabled={isPlaying} onClick={() => void handlePlayPattern()}>
                  {isPlaying ? '播放中' : '播放示范'}
                </button>
                <button type="button" className="secondary-action" disabled={!isPlaying} onClick={handleStopPlayback}>
                  停止
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="rhythm-context">
          <p className="difficulty-note" aria-label="当前节奏参考说明">
            <strong>{selectedCategory.label}</strong>
            <span>
              {selectedPattern.title} · {selectedDifficulty.label} · {selectedPattern.timeSignature} · {bpm} BPM · {selectedInstrument.label} ·{' '}
              {selectedMelodyPreset.label}
            </span>
          </p>
          <div className={`status-line tone-${statusTone}`} role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </div>

      <div className="rhythm-reference-layout">
        <aside className="rhythm-pattern-sidebar" aria-label="节奏型目录">
          <div className="rhythm-sidebar-header">
            <p className="module-kicker">pattern library</p>
            <h2>节奏型目录</h2>
            <p>{filteredPatterns.length > 0 ? `当前筛选出 ${filteredPatterns.length} 个谱例。` : '当前筛选没有可用谱例。'}</p>
          </div>

          {filteredPatterns.length > 0 ? (
            <div className="rhythm-pattern-list">
              {filteredPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  className={pattern.id === selectedPattern.id ? 'rhythm-pattern-button is-active' : 'rhythm-pattern-button'}
                  aria-pressed={pattern.id === selectedPattern.id}
                  onClick={() => handleSelectPattern(pattern)}
                >
                  <strong>{pattern.title}</strong>
                  <span>{pattern.summary}</span>
                  <em>
                    {getRhythmPatternCategory(pattern.category).label} · {getRhythmDifficulty(pattern.difficulty).label} · {pattern.timeSignature}
                  </em>
                </button>
              ))}
            </div>
          ) : (
            <div className="rhythm-empty-state">请放宽分类、拍号或难度筛选。</div>
          )}
        </aside>

        <article className="rhythm-detail-panel" aria-label={`${selectedPattern.title} 节奏详情`}>
          <div className="rhythm-detail-heading">
            <div>
              <p className="module-kicker">selected rhythm</p>
              <h2>
                {selectedPattern.title}
                <span>{selectedPattern.summary}</span>
              </h2>
            </div>
            <div className="rhythm-tag-stack" aria-label="节奏型标签">
              <span>{selectedCategory.label}</span>
              <span>{selectedDifficulty.label}</span>
              <span>{selectedPattern.timeSignature}</span>
            </div>
          </div>

          <div className="rhythm-overview-grid">
            <div className="stat-tile">
              <strong>{selectedPattern.expectedOnsets.length}</strong>
              <span>发声点</span>
            </div>
            <div className="stat-tile">
              <strong>{bpm}</strong>
              <span>BPM</span>
            </div>
            <div className="stat-tile">
              <strong>{repeatCount}</strong>
              <span>播放遍数</span>
            </div>
            <div className="stat-tile">
              <strong>{selectedInstrument.label}</strong>
              <span>音色</span>
            </div>
          </div>

          <section className="rhythm-sound-note" aria-label="当前示范说明">
            <h3>声音参考</h3>
            <p>
              {selectedInstrument.summary} 当前旋律：{selectedMelodyPreset.label}，{selectedMelodyPreset.summary}
            </p>
          </section>

          <RhythmPatternView pattern={selectedPattern} melodyPresetId={melodyPresetId} />
        </article>
      </div>
    </section>
  )
}

function getSelectedPattern(selectedPatternId: string, filteredPatterns: RhythmPattern[]): RhythmPattern {
  return (
    filteredPatterns.find((pattern) => pattern.id === selectedPatternId) ??
    RHYTHM_PATTERN_LIBRARY.find((pattern) => pattern.id === selectedPatternId) ??
    filteredPatterns[0] ??
    RHYTHM_PATTERN_LIBRARY[0]
  )
}

export default RhythmTrainerPage
