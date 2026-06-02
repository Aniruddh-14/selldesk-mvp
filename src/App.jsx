import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HomeScreen from './components/HomeScreen'
import DataTable from './components/DataTable'
import ResultsDashboard from './components/ResultsDashboard'
import DemoModal from './components/DemoModal'
import './App.css'

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [rows, setRows] = useState([])
  const [results, setResults] = useState(null)
  const [showDemo, setShowDemo] = useState(false)
  const [csvWarning, setCsvWarning] = useState(null)

  function handleDataReady(initialRows, warning = null) {
    setRows(initialRows)
    setCsvWarning(warning)
    setScreen('table')
  }

  function handleAnalysisComplete(payload) {
    setResults(payload)
    setScreen('results')
  }

  function handleReset() {
    setRows([])
    setResults(null)
    setScreen('home')
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">Sell<span>desk</span></span>
        <span className="app-tagline">Revenue intelligence for café owners</span>
        <button className="btn btn--primary btn--sm" onClick={() => setShowDemo(true)}>
          Book a Demo
        </button>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div key="home" {...pageVariants}>
              <HomeScreen onDataReady={handleDataReady} />
            </motion.div>
          )}
          {screen === 'table' && (
            <motion.div key="table" {...pageVariants}>
              <DataTable
                rows={rows}
                setRows={setRows}
                onAnalysisComplete={handleAnalysisComplete}
                onBack={handleReset}
                csvWarning={csvWarning}
              />
            </motion.div>
          )}
          {screen === 'results' && (
            <motion.div key="results" {...pageVariants}>
              <ResultsDashboard
                results={results}
                onBack={() => setScreen('table')}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      <footer className="app-footer">
        <span className="app-footer-copy">© 2026 Selldesk. All rights reserved.</span>
        <nav className="app-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </nav>
      </footer>
    </div>
  )
}
