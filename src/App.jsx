import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HomeScreen from './components/HomeScreen'
import DataTable from './components/DataTable'
import ResultsDashboard from './components/ResultsDashboard'
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

  function handleDataReady(initialRows) {
    setRows(initialRows)
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
        <a href="mailto:hello@selldesk.in" className="btn btn--primary btn--sm header-demo-btn">
          Book a Demo
        </a>
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

      <footer className="app-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-logo">Sell<span>desk</span></span>
            <p className="footer-tagline">Revenue intelligence for independent café owners in India.</p>
          </div>

          <div className="footer-contact">
            <div className="footer-section-label">Contact us</div>
            <a href="mailto:hello@selldesk.in" className="footer-contact-item">
              <span className="footer-contact-icon">✉</span>
              hello@selldesk.in
            </a>
            <a href="tel:+919999999999" className="footer-contact-item">
              <span className="footer-contact-icon">☎</span>
              +91 99999 99999
            </a>
          </div>

          <div className="footer-links-col">
            <div className="footer-section-label">Legal</div>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Selldesk. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
