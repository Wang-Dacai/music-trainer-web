import { useMemo, useState } from 'react'
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

export function GuitarChordReadingPage({ isActive = true }: GuitarChordReadingPageProps) {
  const [query, setQuery] = useState('')
  const [selectedChordId, setSelectedChordId] = useState(DEFAULT_CHORD_ID)
  const results = useMemo(() => searchGuitarChords(query), [query])
  const selectedChord = getSelectedChord(results, selectedChordId)

  function handleSelectChord(chord: GuitarChord) {
    setSelectedChordId(chord.id)
  }

  return (
    <section className="module-panel" aria-label="Guitar Chords：吉他和弦识读" aria-hidden={!isActive}>
      <header className="module-header compact guitar-chord-header">
        <div>
          <p className="module-kicker">guitar chord reference</p>
          <h1>吉他和弦识读</h1>
          <p>
            搜索常见吉他和弦，查看中文名称、组成音、五线谱写法，以及多个常用按法。这里只做识读和查阅，不包含听辨、答题、计分或练习记录。
          </p>
        </div>
      </header>

      <div className="chord-browser-layout">
        <aside className="chord-browser-sidebar" aria-label="和弦搜索和结果">
          <label className="chord-search-field">
            <span>搜索和弦名称</span>
            <input
              type="search"
              value={query}
              placeholder="C、Am、G7、Cmaj7"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="status-line chord-result-status" role="status">
            {results.length > 0
              ? `找到 ${results.length} 个和弦。${query.trim() ? '可继续输入以缩小范围。' : '默认显示常见和弦库。'}`
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

        <ChordDetail chord={selectedChord} />
      </div>
    </section>
  )
}

function ChordDetail({ chord }: { chord: GuitarChord }) {
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
    </article>
  )
}

function getSelectedChord(results: readonly GuitarChord[], selectedChordId: GuitarChordId): GuitarChord {
  const currentSelection = results.find((chord) => chord.id === selectedChordId) ?? getGuitarChordById(selectedChordId)

  return currentSelection ?? results[0] ?? GUITAR_CHORDS[0]
}

export default GuitarChordReadingPage
