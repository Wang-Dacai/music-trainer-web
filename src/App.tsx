import { Suspense, lazy, useState } from 'react'
import {
  addPracticeSession,
  createPracticeSessionRecord,
  getModuleLabel,
  loadPracticeHistory,
  removePracticeSession,
  savePracticeHistory,
  type PracticeHistory,
  type PracticeSessionInput,
} from './domain/practiceHistory'
import EarTrainingPage from './ui/pages/EarTrainingPage'

type ModuleKey = 'ear-training' | 'interval-trainer' | 'rhythm-trainer' | 'guitar-chord-reading'

const IntervalTrainerPage = lazy(() => import('./ui/pages/IntervalTrainerPage'))
const RhythmTrainerPage = lazy(() => import('./ui/pages/RhythmTrainerPage'))
const GuitarChordReadingPage = lazy(() => import('./ui/pages/GuitarChordReadingPage'))

const MODULES: Array<{
  key: ModuleKey
  label: string
  subtitle: string
}> = [
  {
    key: 'ear-training',
    label: 'Ear Training',
    subtitle: '听单音并判断音高',
  },
  {
    key: 'interval-trainer',
    label: 'Interval Trainer',
    subtitle: '看五线谱并判断音符和音程',
  },
  {
    key: 'rhythm-trainer',
    label: 'Rhythm Trainer',
    subtitle: '听常用节奏参考',
  },
  {
    key: 'guitar-chord-reading',
    label: 'Guitar Chords',
    subtitle: '吉他和弦识读',
  },
]

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('ear-training')
  const [isIntervalTrainerMounted, setIsIntervalTrainerMounted] = useState(false)
  const [isRhythmTrainerMounted, setIsRhythmTrainerMounted] = useState(false)
  const [isGuitarChordReadingMounted, setIsGuitarChordReadingMounted] = useState(false)
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory>(() => loadPracticeHistory())

  function handleSelectModule(module: ModuleKey) {
    if (module === 'interval-trainer') {
      setIsIntervalTrainerMounted(true)
    }

    if (module === 'rhythm-trainer') {
      setIsRhythmTrainerMounted(true)
    }

    if (module === 'guitar-chord-reading') {
      setIsGuitarChordReadingMounted(true)
    }

    setActiveModule(module)
  }

  function handleSessionComplete(sessionInput: PracticeSessionInput) {
    setPracticeHistory((currentHistory) => {
      const nextHistory = addPracticeSession(currentHistory, createPracticeSessionRecord(sessionInput))
      savePracticeHistory(nextHistory)
      return nextHistory
    })
  }

  function handleDeleteSession(sessionId: string) {
    setPracticeHistory((currentHistory) => {
      const nextHistory = removePracticeSession(currentHistory, sessionId)
      savePracticeHistory(nextHistory)
      return nextHistory
    })
  }

  return (
    <main className="app-layout">
      <header className="app-topbar">
        <div>
          <p className="app-kicker">music-trainer-web</p>
          <h1>音乐训练</h1>
        </div>
        <nav className="module-tabs" aria-label="训练模块">
          {MODULES.map((module) => (
            <button
              key={module.key}
              type="button"
              className={activeModule === module.key ? 'is-active' : ''}
              aria-pressed={activeModule === module.key}
              onClick={() => handleSelectModule(module.key)}
            >
              <strong>{module.label}</strong>
              <span>{module.subtitle}</span>
            </button>
          ))}
        </nav>
      </header>

      <div hidden={activeModule !== 'ear-training'}>
        <EarTrainingPage isActive={activeModule === 'ear-training'} onSessionComplete={handleSessionComplete} />
      </div>

      {(isIntervalTrainerMounted || activeModule === 'interval-trainer') && (
        <div hidden={activeModule !== 'interval-trainer'}>
          <Suspense fallback={<section className="module-panel module-loading">正在加载五线谱练习...</section>}>
            <IntervalTrainerPage isActive={activeModule === 'interval-trainer'} onSessionComplete={handleSessionComplete} />
          </Suspense>
        </div>
      )}

      {(isRhythmTrainerMounted || activeModule === 'rhythm-trainer') && (
        <div hidden={activeModule !== 'rhythm-trainer'}>
          <Suspense fallback={<section className="module-panel module-loading">正在加载节奏参考...</section>}>
            <RhythmTrainerPage isActive={activeModule === 'rhythm-trainer'} onSessionComplete={handleSessionComplete} />
          </Suspense>
        </div>
      )}

      {(isGuitarChordReadingMounted || activeModule === 'guitar-chord-reading') && (
        <div hidden={activeModule !== 'guitar-chord-reading'}>
          <Suspense fallback={<section className="module-panel module-loading">正在加载吉他和弦识读...</section>}>
            <GuitarChordReadingPage isActive={activeModule === 'guitar-chord-reading'} />
          </Suspense>
        </div>
      )}

      {activeModule !== 'guitar-chord-reading' && activeModule !== 'rhythm-trainer' && (
        <PracticeRecordsPanel history={practiceHistory} onDeleteSession={handleDeleteSession} />
      )}
    </main>
  )
}

interface PracticeRecordsPanelProps {
  history: PracticeHistory
  onDeleteSession: (sessionId: string) => void
}

function PracticeRecordsPanel({ history, onDeleteSession }: PracticeRecordsPanelProps) {
  const recentSessions = history.sessions

  return (
    <section className="dashboard-panel" aria-label="练习记录">
      <div className="dashboard-header">
        <div>
          <p className="module-kicker">practice records</p>
          <h2>练习记录</h2>
        </div>
      </div>

      <div className="recent-session-list" aria-label="逐条练习记录">
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <div key={session.id} className="recent-session-item">
              <strong>{getModuleLabel(session.module)}</strong>
              <span>{session.detail}</span>
              <span>
                {session.correctItems}/{session.completedItems} · {formatSessionDate(session.createdAt)}
              </span>
              <button type="button" className="session-delete-button" onClick={() => onDeleteSession(session.id)}>
                删除
              </button>
            </div>
          ))
        ) : (
          <div className="recent-session-empty">还没有练习记录</div>
        )}
      </div>
    </section>
  )
}

function formatSessionDate(createdAt: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export default App
