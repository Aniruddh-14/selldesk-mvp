import { useState } from 'react'
import { marginPct } from '../utils/ruleEngine'
import { runRules } from '../utils/ruleEngine'
import { getRecommendations } from '../utils/claudeApi'

const DEMO_MODE = !import.meta.env.VITE_OPENROUTER_API_KEY

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
  const [error, setError] = useState(null)

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function addRow() {
    setRows(prev => [...prev, newRow()])
  }

  function deleteRow(id) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function coerce(row) {
    return {
      ...row,
      sold: parseFloat(row.sold) || 0,
      price: parseFloat(row.price) || 0,
      cost: parseFloat(row.cost) || 0,
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
      const recommendations = await getRecommendations(coerced, flags)
      onAnalysisComplete({ rows: coerced, flags, recommendations })
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
        <button
          className="btn btn--primary"
          onClick={handleAnalyse}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner" /> Analysing…</>
          ) : 'Analyse →'}
        </button>
      </div>

      {DEMO_MODE && (
        <div className="table-demo-banner">
          Demo mode — AI recommendations are simulated. Add <code>VITE_OPENROUTER_API_KEY</code> to <code>.env</code> for real AI output.
        </div>
      )}

      {error && <div className="table-error">{error}</div>}

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
                <tr key={row.id}>
                  <td>
                    <input
                      className="cell-input cell-input--item"
                      value={row.item}
                      placeholder="Item name"
                      onChange={e => updateRow(row.id, 'item', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input cell-input--num"
                      value={row.sold}
                      placeholder="0"
                      type="number"
                      min="0"
                      onChange={e => updateRow(row.id, 'sold', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input cell-input--num"
                      value={row.price}
                      placeholder="0"
                      type="number"
                      min="0"
                      onChange={e => updateRow(row.id, 'price', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input cell-input--num"
                      value={row.cost}
                      placeholder="0"
                      type="number"
                      min="0"
                      onChange={e => updateRow(row.id, 'cost', e.target.value)}
                    />
                  </td>
                  <td>
                    {pct !== null ? (
                      <span className={`margin-badge ${colorClass}`}>{pct}%</span>
                    ) : (
                      <span className="margin-badge margin--empty">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => deleteRow(row.id)}
                      title="Delete row"
                    >✕</button>
                  </td>
                </tr>
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
