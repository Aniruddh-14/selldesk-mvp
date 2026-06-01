import { useRef } from 'react'
import { motion } from 'framer-motion'
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

const PAIN_POINTS = [
  {
    stat: '60%',
    headline: 'of your menu is dead weight',
    body: 'Most cafés carry items that sell poorly and barely cover their cost. Every unsold plate is money already spent.',
  },
  {
    stat: '₹12k',
    headline: 'lost weekly to mispriced items',
    body: 'Pricing by gut feel leaves margin on the table. A ₹10 increase on the right item can add lakhs annually.',
  },
  {
    stat: '0',
    headline: 'data used in most pricing decisions',
    body: 'Most owners rely on memory and intuition. The cafés that grow are the ones that treat their menu like a spreadsheet.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Add your menu data',
    body: 'Enter item names, weekly units sold, price, and cost. Takes under 2 minutes — or upload a CSV.',
  },
  {
    n: '02',
    title: 'Run the analysis',
    body: 'Our rule engine flags low-margin items, slow movers, and star performers instantly.',
  },
  {
    n: '03',
    title: 'Get AI recommendations',
    body: 'Receive 4 specific, actionable steps — pricing adjustments, combos, removals — tailored to your numbers.',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const staggerFast = {
  animate: { transition: { staggerChildren: 0.07 } },
}

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
    <div className="landing">

      {/* ── Hero ───────────────────────────────────────── */}
      <motion.section
        className="landing-hero"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div className="landing-eyebrow" variants={fadeUp} transition={{ duration: 0.4 }}>
          ✦ Built for Indian café owners
        </motion.div>
        <motion.h1 className="landing-title" variants={fadeUp} transition={{ duration: 0.45 }}>
          Your café is busy.<br />
          But is it <em>profitable?</em>
        </motion.h1>
        <motion.p className="landing-subtitle" variants={fadeUp} transition={{ duration: 0.45 }}>
          Most café owners work 12-hour days and still can't explain why margins are thin.
          Selldesk turns your sales data into clear, actionable revenue decisions — in under 3 minutes.
        </motion.p>
        <motion.div className="landing-hero-cta" variants={fadeUp} transition={{ duration: 0.4 }}>
          <button className="btn btn--primary btn--lg" onClick={handleManual}>
            Try with sample data →
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => fileRef.current?.click()}>
            Upload my CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv"
            style={{ display: 'none' }} onChange={handleFileChange} />
        </motion.div>
        <motion.p className="landing-hero-note" variants={fadeUp} transition={{ duration: 0.4 }}>
          No account needed. Free to use.
        </motion.p>
      </motion.section>

      <div className="landing-divider" />

      {/* ── Problem ────────────────────────────────────── */}
      <motion.section
        className="landing-section"
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="landing-section-label" variants={fadeUp} transition={{ duration: 0.4 }}>
          The problem
        </motion.div>
        <motion.h2 className="landing-section-title" variants={fadeUp} transition={{ duration: 0.4 }}>
          Running on instinct is costing you money.
        </motion.h2>
        <motion.p className="landing-section-sub" variants={fadeUp} transition={{ duration: 0.4 }}>
          Café owners are operators, not analysts. Without clear data, every menu decision is a guess.
        </motion.p>

        <motion.div className="pain-grid" variants={staggerFast} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}>
          {PAIN_POINTS.map((p, i) => (
            <motion.div
              className="pain-card"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="pain-stat">{p.stat}</div>
              <div className="pain-headline">{p.headline}</div>
              <p className="pain-body">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <div className="landing-divider" />

      {/* ── How it works ───────────────────────────────── */}
      <motion.section
        className="landing-section"
        variants={stagger}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="landing-section-label" variants={fadeUp} transition={{ duration: 0.4 }}>
          How it works
        </motion.div>
        <motion.h2 className="landing-section-title" variants={fadeUp} transition={{ duration: 0.4 }}>
          From raw data to a clear action plan.
        </motion.h2>

        <motion.div className="steps-grid" variants={staggerFast} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}>
          {STEPS.map((s, i) => (
            <motion.div
              className="step-card"
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <div className="step-number">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-body">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <div className="landing-divider" />

      {/* ── Final CTA ──────────────────────────────────── */}
      <motion.section
        className="landing-final-cta"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="landing-cta-title">Know your numbers in 3 minutes.</h2>
        <p className="landing-cta-sub">
          Start with our sample café data or drop in your own. No signup, no setup.
        </p>
        <div className="landing-hero-cta">
          <button className="btn btn--primary btn--lg" onClick={handleManual}>
            Analyse sample menu →
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => fileRef.current?.click()}>
            Upload my CSV
          </button>
        </div>
        <div className="landing-csv-hint">
          <span>CSV format:</span>
          <code>item,sold,price,cost</code>
        </div>
      </motion.section>

    </div>
  )
}
