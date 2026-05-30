import { Suspense, lazy, useState } from 'react'
import EarTrainingPage from './ui/pages/EarTrainingPage'

type ModuleKey = 'ear-training' | 'interval-trainer'

const IntervalTrainerPage = lazy(() => import('./ui/pages/IntervalTrainerPage'))

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
]

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('ear-training')

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
              onClick={() => setActiveModule(module.key)}
            >
              <strong>{module.label}</strong>
              <span>{module.subtitle}</span>
            </button>
          ))}
        </nav>
      </header>

      {activeModule === 'ear-training' ? (
        <EarTrainingPage />
      ) : (
        <Suspense fallback={<section className="module-panel module-loading">正在加载五线谱练习...</section>}>
          <IntervalTrainerPage />
        </Suspense>
      )}
    </main>
  )
}

export default App
