import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_GUITAR_CHORD_PLAYBACK_MODE,
  GUITAR_CHORD_PLAYBACK_MODES,
  playGuitarChordSound,
  stopGuitarChordPlayback,
  type GuitarChordPlaybackMode,
} from '../../audio/guitarChordPlayback'
import {
  GUITAR_CHORDS,
  formatChordToneText,
  formatFretPattern,
  formatStaffPitchText,
  getGuitarChordById,
  searchGuitarChords,
  type GuitarChord,
  type GuitarChordId,
} from '../../domain/guitarChords'
import GuitarChordDiagram from '../components/GuitarChordDiagram'
import StaffNotation from '../components/StaffNotation'

export interface GuitarChordReadingPageProps {
  isActive?: boolean
}

const DEFAULT_CHORD_ID: GuitarChordId = 'C'
type PlaybackStatusTone = 'neutral' | 'success' | 'error'

export function GuitarChordReadingPage({ isActive = true }: GuitarChordReadingPageProps) {
  const [query, setQuery] = useState('')
  const [selectedChordId, setSelectedChordId] = useState(DEFAULT_CHORD_ID)
  const [playbackMode, setPlaybackMode] = useState<GuitarChordPlaybackMode>(DEFAULT_GUITAR_CHORD_PLAYBACK_MODE)
  const [isPlayingChord, setIsPlayingChord] = useState(false)
  const [playbackStatus, setPlaybackStatus] = useState('默认播放整和弦')
  const [playbackStatusTone, setPlaybackStatusTone] = useState<PlaybackStatusTone>('neutral')
  const playbackTokenRef = useRef(0)
  const isMountedRef = useRef(false)
  const results = useMemo(() => searchGuitarChords(query), [query])
  const selectedChord = getSelectedChord(results, selectedChordId)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      createPlaybackToken()
      stopGuitarChordPlayback()
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      createPlaybackToken()
      stopGuitarChordPlayback()
      setIsPlayingChord(false)
      setPlaybackStatus('已暂停')
      setPlaybackStatusTone('neutral')
    }
  }, [isActive])

  function handleSelectChord(chord: GuitarChord) {
    createPlaybackToken()
    stopGuitarChordPlayback()
    setIsPlayingChord(false)
    setSelectedChordId(chord.id)
    setPlaybackStatus(`已选择 ${chord.symbol}`)
    setPlaybackStatusTone('neutral')
  }

  function handlePlaybackModeChange(nextMode: GuitarChordPlaybackMode) {
    setPlaybackMode(nextMode)
    setPlaybackStatus(`已选择${getPlaybackModeLabel(nextMode)}`)
    setPlaybackStatusTone('neutral')
  }

  async function handlePlayChord() {
    if (isPlayingChord) {
      return
    }

    const token = createPlaybackToken()
    const modeLabel = getPlaybackModeLabel(playbackMode)
    setIsPlayingChord(true)
    setPlaybackStatus(`正在播放 ${selectedChord.symbol} ${modeLabel}`)
    setPlaybackStatusTone('neutral')

    try {
      await playGuitarChordSound(selectedChord.staffPitches, playbackMode)

      if (isCurrentPlayback(token)) {
        setPlaybackStatus(`已播放 ${selectedChord.symbol} ${modeLabel}`)
        setPlaybackStatusTone('success')
      }
    } catch (error) {
      console.error(error)

      if (isCurrentPlayback(token)) {
        setPlaybackStatus('音频播放失败，请确认浏览器允许播放声音')
        setPlaybackStatusTone('error')
      }
    } finally {
      if (isCurrentPlayback(token)) {
        setIsPlayingChord(false)
      }
    }
  }

  function handleStopChordPlayback() {
    createPlaybackToken()
    stopGuitarChordPlayback()
    setIsPlayingChord(false)
    setPlaybackStatus('已停止播放')
    setPlaybackStatusTone('neutral')
  }

  function createPlaybackToken(): number {
    playbackTokenRef.current += 1
    return playbackTokenRef.current
  }

  function isCurrentPlayback(token: number): boolean {
    return isMountedRef.current && playbackTokenRef.current === token
  }

  return (
    <section className="module-panel" aria-label="Guitar Chords：吉他和弦识读" aria-hidden={!isActive}>
      <header className="module-header compact guitar-chord-header">
        <div>
          <p className="module-kicker">guitar chord reference</p>
          <h1>吉他和弦识读</h1>
          <p>
            搜索常见吉他和弦，查看中文名称、组成音、五线谱写法、声音试听，以及多个常用按法。这里只做识读和查阅，不包含答题、计分或练习记录。
          </p>
        </div>
      </header>

      <div className="chord-browser-layout">
        <aside className="chord-browser-sidebar" aria-label="和弦搜索和结果">
          <div className="chord-sidebar-header">
            <p className="module-kicker">chord library</p>
            <h2>和弦目录</h2>
            <p>输入符号或名称筛选，也可以直接从常见和弦中选择。</p>
          </div>

          <label className="chord-search-field">
            <span>搜索和弦名称</span>
            <input
              type="search"
              value={query}
              placeholder="C、Am、G7、Cmaj7"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="status-line chord-result-status" role="status" aria-label="搜索结果状态">
            {results.length > 0
              ? query.trim()
                ? `搜索结果 · ${results.length} 个`
                : `常见和弦 · ${results.length} 个`
              : `没有找到“${query}”相关和弦。`}
          </div>

          {results.length > 0 ? (
            <div className="chord-result-grid" aria-label="和弦搜索结果">
              {results.map((chord) => (
                <button
                  key={chord.id}
                  type="button"
                  className={chord.id === selectedChord.id ? 'chord-result-button is-active' : 'chord-result-button'}
                  aria-label={`${chord.symbol} ${chord.chineseName}`}
                  aria-pressed={chord.id === selectedChord.id}
                  onClick={() => handleSelectChord(chord)}
                >
                  <strong>{chord.symbol}</strong>
                  <span>{chord.chineseName}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="chord-empty-state">请尝试输入 C、Am、G7、Cmaj7，或清空搜索查看全部常见和弦。</div>
          )}
        </aside>

        <ChordDetail
          chord={selectedChord}
          playbackMode={playbackMode}
          playbackStatus={playbackStatus}
          playbackStatusTone={playbackStatusTone}
          isPlayingChord={isPlayingChord}
          onPlaybackModeChange={handlePlaybackModeChange}
          onPlayChord={handlePlayChord}
          onStopChordPlayback={handleStopChordPlayback}
        />
      </div>
    </section>
  )
}

interface ChordDetailProps {
  chord: GuitarChord
  playbackMode: GuitarChordPlaybackMode
  playbackStatus: string
  playbackStatusTone: PlaybackStatusTone
  isPlayingChord: boolean
  onPlaybackModeChange: (mode: GuitarChordPlaybackMode) => void
  onPlayChord: () => void
  onStopChordPlayback: () => void
}

function ChordDetail({
  chord,
  playbackMode,
  playbackStatus,
  playbackStatusTone,
  isPlayingChord,
  onPlaybackModeChange,
  onPlayChord,
  onStopChordPlayback,
}: ChordDetailProps) {
  const playbackModeLabel = getPlaybackModeLabel(playbackMode)

  return (
    <article className="chord-detail-panel" aria-label={`${chord.symbol} 和弦详情`}>
      <div className="chord-detail-heading">
        <div>
          <p className="module-kicker">selected chord</p>
          <h2>
            {chord.symbol} <span>{chord.chineseName}</span>
          </h2>
        </div>
        <div className="chord-quality-badge">{chord.qualityLabel}</div>
      </div>

      <div className="chord-overview-grid">
        <div className="stat-tile chord-stat-tile">
          <strong>{chord.formula}</strong>
          <span>和弦公式</span>
        </div>
        <div className="stat-tile chord-stat-tile">
          <strong>{chord.tones.join('、')}</strong>
          <span>组成音</span>
        </div>
        <div className="stat-tile chord-stat-tile">
          <strong>{chord.fingerings.length} 种</strong>
          <span>常用指法</span>
        </div>
      </div>

      <section className="chord-playback-panel" aria-label="和弦声音试听">
        <div>
          <h3>声音试听</h3>
          <p>默认播放整和弦，也可以切换为逐音播放的分解和弦。</p>
        </div>

        <div className="chord-playback-controls">
          <div className="segmented-control chord-playback-mode-control" aria-label="播放方式">
            {GUITAR_CHORD_PLAYBACK_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={playbackMode === mode.id ? 'is-active' : ''}
                aria-pressed={playbackMode === mode.id}
                disabled={isPlayingChord}
                onClick={() => onPlaybackModeChange(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="toolbar chord-playback-actions">
            <button type="button" className="primary-action" disabled={isPlayingChord} onClick={onPlayChord}>
              {isPlayingChord ? '播放中' : `播放${playbackModeLabel}`}
            </button>
            <button type="button" className="secondary-action" disabled={!isPlayingChord} onClick={onStopChordPlayback}>
              停止
            </button>
          </div>
        </div>

        <div className={`status-line chord-playback-status${playbackStatusTone === 'neutral' ? '' : ` tone-${playbackStatusTone}`}`} role="status" aria-label="播放状态">
          {playbackStatus}
        </div>
      </section>

      <section className="chord-info-card" aria-label="和弦组成音">
        <h3>组成音</h3>
        <p>{formatChordToneText(chord)}</p>
        <ul className="chord-tone-list">
          {chord.tones.map((tone, index) => (
            <li key={`${tone}-${chord.toneRoles[index]}`}>
              <strong>{tone}</strong>
              <span>{chord.toneRoles[index]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="常用吉他指法">
        <div className="fingering-section-heading">
          <h3>常用吉他指法</h3>
          <p>所有数字均按 6 弦 → 1 弦顺序书写；x 表示不弹，0 表示空弦。</p>
        </div>

        <div className="fingering-grid">
          {chord.fingerings.map((fingering) => (
            <article key={fingering.id} className="fingering-card">
              <div className="fingering-card-header">
                <h4>{fingering.name}</h4>
                <div>
                  <span>6弦 → 1弦</span>
                  <strong className="fret-pattern">{formatFretPattern(fingering)}</strong>
                </div>
              </div>

              <GuitarChordDiagram chordSymbol={chord.symbol} fingering={fingering} />
              <p>{fingering.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="staff-info-panel" aria-label="五线谱信息">
        <div>
          <h3>五线谱信息</h3>
          <p>高音谱号：{formatStaffPitchText(chord)}</p>
        </div>
        <div className="staff-stage chord-staff-stage">
          <StaffNotation
            clef="treble"
            pitches={chord.staffPitches}
            notationMode="chord"
            ariaLabel="和弦构成音五线谱"
          />
        </div>
      </section>
    </article>
  )
}

function getSelectedChord(results: readonly GuitarChord[], selectedChordId: GuitarChordId): GuitarChord {
  const currentSelection = results.find((chord) => chord.id === selectedChordId) ?? getGuitarChordById(selectedChordId)

  return currentSelection ?? results[0] ?? GUITAR_CHORDS[0]
}

function getPlaybackModeLabel(mode: GuitarChordPlaybackMode): string {
  return GUITAR_CHORD_PLAYBACK_MODES.find((option) => option.id === mode)?.label ?? '整和弦'
}

export default GuitarChordReadingPage
