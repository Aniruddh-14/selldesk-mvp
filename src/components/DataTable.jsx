import { useState } from 'react'
import { motion } from 'framer-motion'
import { marginPct } from '../utils/ruleEngine'
import { runRules } from '../utils/ruleEngine'
import { getRecommendations } from '../utils/claudeApi'

const DEMO_MODE = !import.meta.env.VITE_OPENROUTER_API_KEY

const WEATHER_OPTIONS = [
  { value: 'sunny',  label: '☀️ Sunny'  },
  { value: 'cloudy', label: '☁️ Cloudy' },
  { value: 'rainy',  label: '🌧️ Rainy'  },
  { value: 'cold',   label: '🥶 Cold'   },
  { value: 'humid',  label: '🌫️ Humid'  },
]

const TIME_OPTIONS = [
  { value: 'morning',   label: '🌅 Morning'   },
  { value: 'afternoon', label: '☀️ Afternoon' },
  { value: 'evening',   label: '🌆 Evening'   },
  { value: 'night',     label: '🌙 Night'     },
]

const BUSY_OPTIONS = [
  { value: 'quiet',    label: 'Quiet'    },
  { value: 'moderate', label: 'Moderate' },
  { value: 'busy',     label: 'Busy'     },
  { value: 'packed',   label: 'Packed'   },
]

function detectTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

function PillGroup({ options, value, onChange }) {
  return (
    <div className="pill-group">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          className={`pill ${value === o.value ? 'pill--active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function marginColor(pct) {
  if (pct < 25) return 'danger'
  if (pct < 45) return 'warning'
  return 'success'
}

function newRow() {
  return { id: crypto.randomUUID(), item: '', sold: '', price: '', cost: '' }
}

export default function DataTable({ rows, setRows, onAnalysisComplete, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const [weather,   setWeather]   = useState('sunny')
  const [timeOfDay, setTimeOfDay] = useState(detectTimeOfDay())
  const [busyness,  setBusyness]  = useState('moderate')
  const [occasion,  setOccasion]  = useState('')

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function addRow()         { setRows(prev => [...prev, newRow()]) }
  function deleteRow(id)    { setRows(prev => prev.filter(r => r.id !== id)) }

  function coerce(row) {
    return {
      ...row,
      sold:  parseFloat(row.sold)  || 0,
      price: parseFloat(row.price) || 0,
      cost:  parseFloat(row.cost)  || 0,
    }
  }

  async function handleAnalyse() {
    const coerced = rows.map(coerce).filter(r => r.item.trim())
    if (coerced.length === 0) {
      setError('Add at least one item before analysing.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const flags = runRules(coerced)
      const context = { weather, timeOfDay, busyness, occasion: occasion.trim() || null }
      const recommendations = await getRecommendations(coerced, flags, context)
      onAnalysisComplete({ rows: coerced, flags, recommendations, context })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="table-screen">
      <div className="table-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Back</button>
        <h2 className="table-title">Your menu</h2>
        <button className="btn btn--primary" onClick={handleAnalyse} disabled={loading}>
          {loading ? <><span className="spinner" /> Analysing…</> : 'Analyse →'}
        </button>
      </div>

      {DEMO_MODE && (
        <div className="table-demo-banner">
          Demo mode — AI recommendations are simulated. Add <code>VITE_OPENROUTER_API_KEY</code> to <code>.env</code> for real AI output.
        </div>
      )}

      {error && <div className="table-error">{error}</div>}

      {/* Context panel */}
      <div className="context-panel">
        <div className="context-panel-title">Right now at your café</div>
        <div className="context-grid">
          <div className="context-field">
            <span className="context-label">Weather</span>
            <PillGroup options={WEATHER_OPTIONS} value={weather} onChange={setWeather} />
          </div>
          <div className="context-field">
            <span className="context-label">Time of day</span>
            <PillGroup options={TIME_OPTIONS} value={timeOfDay} onChange={setTimeOfDay} />
          </div>
          <div className="context-field">
            <span className="context-label">How busy</span>
            <PillGroup options={BUSY_OPTIONS} value={busyness} onChange={setBusyness} />
          </div>
          <div className="context-field">
            <span className="context-label">Festival / occasion <span className="context-label-hint">(optional)</span></span>
            <input
              className="cell-input context-occasion-input"
              placeholder="e.g. Diwali, IPL finals, Valentine's Day…"
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Sold / wk</th>
              <th>Price ₹</th>
              <th>Cost ₹</th>
              <th>Margin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const c = coerce(row)
              const pct = c.price > 0 && c.item ? marginPct(c) : null
              const colorClass = pct !== null ? `margin--${marginColor(pct)}` : ''

              return (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  layout
                >
                  <td>
                    <input className="cell-input cell-input--item" value={row.item}
                      placeholder="Item name" onChange={e => updateRow(row.id, 'item', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-input cell-input--num" value={row.sold}
                      placeholder="0" type="number" min="0" onChange={e => updateRow(row.id, 'sold', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-input cell-input--num" value={row.price}
                      placeholder="0" type="number" min="0" onChange={e => updateRow(row.id, 'price', e.target.value)} />
                  </td>
                  <td>
                    <input className="cell-input cell-input--num" value={row.cost}
                      placeholder="0" type="number" min="0" onChange={e => updateRow(row.id, 'cost', e.target.value)} />
                  </td>
                  <td>
                    {pct !== null
                      ? <span className={`margin-badge ${colorClass}`}>{pct}%</span>
                      : <span className="margin-badge margin--empty">—</span>}
                  </td>
                  <td>
                    <button className="btn-delete" onClick={() => deleteRow(row.id)} title="Delete row">✕</button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button className="btn btn--ghost btn--sm table-add-row" onClick={addRow}>
        + Add item
      </button>
    </div>
  )
}
