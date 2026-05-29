import { useRef } from 'react'
import { parseCSV } from '../utils/csvParser'

const SAMPLE_ROWS = [
  { id: crypto.randomUUID(), item: 'Cappuccino',  sold: 42, price: 120, cost: 45  },
  { id: crypto.randomUUID(), item: 'Cold Brew',   sold: 8,  price: 150, cost: 70  },
  { id: crypto.randomUUID(), item: 'Mango Shake', sold: 3,  price: 100, cost: 90  },
  { id: crypto.randomUUID(), item: 'Croissant',   sold: 31, price: 80,  cost: 30  },
  { id: crypto.randomUUID(), item: 'Sandwich',    sold: 6,  price: 160, cost: 110 },
  { id: crypto.randomUUID(), item: 'Latte',       sold: 28, price: 130, cost: 50  },
  { id: crypto.randomUUID(), item: 'Chai',        sold: 19, price: 60,  cost: 15  },
  { id: crypto.randomUUID(), item: 'Brownie',     sold: 5,  price: 90,  cost: 75  },
]

export default function HomeScreen({ onDataReady }) {
  const fileRef = useRef(null)

  function handleManual() {
    onDataReady(SAMPLE_ROWS.map(r => ({ ...r, id: crypto.randomUUID() })))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const rows = parseCSV(evt.target.result)
      if (rows.length === 0) {
        alert('No valid rows found. Check your CSV format: item,sold,price,cost')
        return
      }
      onDataReady(rows)
    }
    reader.readAsText(file)
  }

  return (
    <div className="home-screen">
      <div className="home-hero">
        <h1 className="home-title">Know what's making you money.</h1>
        <p className="home-subtitle">
          Upload your weekly sales data or use our sample café menu to get AI-powered revenue insights in seconds.
        </p>
      </div>

      <div className="home-cards">
        <button className="home-card home-card--primary" onClick={handleManual}>
          <div className="home-card-icon">⌨</div>
          <div className="home-card-body">
            <span className="home-card-title">Enter manually</span>
            <span className="home-card-desc">Start with sample café data — edit to match your menu</span>
          </div>
        </button>

        <button
          className="home-card home-card--secondary"
          onClick={() => fileRef.current?.click()}
        >
          <div className="home-card-icon">↑</div>
          <div className="home-card-body">
            <span className="home-card-title">Upload CSV</span>
            <span className="home-card-desc">Columns: item, sold, price, cost</span>
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="home-csv-hint">
        <span className="home-csv-hint-label">CSV format</span>
        <code>item,sold,price,cost</code>
        <code>Cappuccino,42,120,45</code>
      </div>
    </div>
  )
}
