import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import DataTable from './components/DataTable'
import ResultsDashboard from './components/ResultsDashboard'
import './App.css'

// screen: 'home' | 'table' | 'results'
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
        <span className="app-logo">Selldesk</span>
        <span className="app-tagline">Revenue intelligence for café owners</span>
      </header>

      <main className="app-main">
        {screen === 'home' && (
          <HomeScreen onDataReady={handleDataReady} />
        )}
        {screen === 'table' && (
          <DataTable
            rows={rows}
            setRows={setRows}
            onAnalysisComplete={handleAnalysisComplete}
            onBack={handleReset}
          />
        )}
        {screen === 'results' && (
          <ResultsDashboard
            results={results}
            onBack={() => setScreen('table')}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}
