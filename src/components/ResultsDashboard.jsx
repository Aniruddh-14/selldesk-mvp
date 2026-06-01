import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts'
import { marginPct } from '../utils/ruleEngine'

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const stagger = { animate: { transition: { staggerChildren: 0.08 } } }
const staggerSlow = { animate: { transition: { staggerChildren: 0.12 } } }

const TYPE_LABEL = {
  pricing:   'Pricing',
  removal:   'Removal',
  combo:     'Combo',
  promotion: 'Promotion',
}

const IMPACT_COLOR = {
  high:   'success',
  medium: 'warning',
  low:    'text-muted',
}

function marginColor(pct) {
  if (pct < 25) return '#ff5e6c'
  if (pct < 45) return '#feb300'
  return '#2dbe7a'
}

// Custom tooltip for the revenue chart
function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{d.name}</div>
      <div className="chart-tooltip-row">
        <span style={{ color: '#4F8EF7' }}>Revenue</span>
        <span>₹{d.revenue.toLocaleString('en-IN')}</span>
      </div>
      <div className="chart-tooltip-row">
        <span style={{ color: '#3DD68C' }}>Profit</span>
        <span>₹{d.profit.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

function MarginTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{d.name}</div>
      <div className="chart-tooltip-row">
        <span style={{ color: marginColor(d.margin) }}>Margin</span>
        <span>{d.margin}%</span>
      </div>
      <div className="chart-tooltip-row">
        <span style={{ color: 'var(--text-muted)' }}>Units/wk</span>
        <span>{d.sold}</span>
      </div>
    </div>
  )
}

function AnimatedNumber({ value }) {
  const ref = useRef(null)
  const numericMatch = String(value).match(/[\d,]+/)
  const prefix = numericMatch ? String(value).slice(0, String(value).indexOf(numericMatch[0])) : ''
  const suffix = numericMatch ? String(value).slice(String(value).indexOf(numericMatch[0]) + numericMatch[0].length) : ''
  const target  = numericMatch ? parseInt(numericMatch[0].replace(/,/g, ''), 10) : null

  useEffect(() => {
    if (target === null || !ref.current) return
    let start = 0
    const duration = 900
    const startTime = performance.now()
    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      if (ref.current) {
        ref.current.textContent = prefix + current.toLocaleString('en-IN') + suffix
      }
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, prefix, suffix])

  return <span ref={ref}>{value}</span>
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <motion.div
      className="metric-card"
      variants={fadeUp}
      transition={{ duration: 0.4 }}
      style={accent ? { borderColor: 'rgba(79,142,247,0.3)' } : {}}
    >
      <span className="metric-value" style={accent ? { color: 'var(--accent)' } : {}}>
        <AnimatedNumber value={value} />
      </span>
      <span className="metric-label">{label}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </motion.div>
  )
}

function FlagItem({ flag, tone }) {
  return (
    <motion.div
      className={`flag-item flag-item--${tone}`}
      variants={{ initial: { opacity: 0, x: -12 }, animate: { opacity: 1, x: 0 } }}
      transition={{ duration: 0.3 }}
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
    >
      <span className="flag-dot" />
      <div className="flag-body">
        <span className="flag-item-name">{flag.row.item}</span>
        <span className="flag-item-reason">{flag.reason}</span>
      </div>
    </motion.div>
  )
}

function RecommendationCard({ rec }) {
  return (
    <motion.div
      className="rec-card"
      variants={fadeUp}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.1)', transition: { duration: 0.2 } }}
    >
      <div className="rec-card-top">
        <span className="rec-type-badge">{TYPE_LABEL[rec.type] ?? rec.type}</span>
        <span className={`rec-impact impact--${IMPACT_COLOR[rec.impact] ?? 'text-muted'}`}>
          {rec.impact} impact
        </span>
      </div>
      <h3 className="rec-title">{rec.title}</h3>
      <p className="rec-detail">{rec.detail}</p>
    </motion.div>
  )
}

export default function ResultsDashboard({ results, onBack, onReset }) {
  const { rows, flags, recommendations } = results

  const weeklyRevenue = rows.reduce((s, r) => s + r.price * r.sold, 0)
  const weeklyProfit  = rows.reduce((s, r) => s + (r.price - r.cost) * r.sold, 0)
  const avgMargin     = rows.length
    ? Math.round(rows.reduce((s, r) => s + marginPct(r), 0) / rows.length)
    : 0
  const totalFlags = flags.danger.length + flags.warning.length + flags.success.length

  // Chart data — sorted by revenue descending
  const revenueData = [...rows]
    .sort((a, b) => (b.price * b.sold) - (a.price * a.sold))
    .map(r => ({
      name: r.item,
      revenue: r.price * r.sold,
      profit: (r.price - r.cost) * r.sold,
    }))

  const marginData = [...rows]
    .sort((a, b) => marginPct(b) - marginPct(a))
    .map(r => ({
      name: r.item,
      margin: marginPct(r),
      sold: r.sold,
    }))

  return (
    <div className="results-screen">
      <div className="results-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Edit data</button>
        <h2 className="results-title">Analysis results</h2>
        <button className="btn btn--ghost btn--sm" onClick={onReset}>Start over</button>
      </div>

      {/* Metric cards */}
      <motion.section className="metrics-row" variants={stagger} initial="initial" animate="animate">
        <MetricCard label="Weekly revenue" value={`₹${weeklyRevenue.toLocaleString('en-IN')}`} />
        <MetricCard label="Weekly profit"  value={`₹${weeklyProfit.toLocaleString('en-IN')}`} accent />
        <MetricCard label="Avg margin"     value={`${avgMargin}%`} />
        <MetricCard
          label="Flags raised"
          value={totalFlags}
          sub={`${flags.danger.length} danger · ${flags.warning.length} warning · ${flags.success.length} star`}
        />
      </motion.section>

      {/* Charts row */}
      <motion.section className="charts-row" variants={stagger} initial="initial" animate="animate">
        <motion.div className="chart-card" variants={fadeUp} transition={{ duration: 0.4 }}>
          <div className="chart-card-header">
            <span className="chart-card-title">Revenue vs Profit by item</span>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#3b7eff' }} />Revenue
              <span className="legend-dot" style={{ background: '#feb300' }} />Profit
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barGap={3} barCategoryGap="28%">
              <XAxis
                dataKey="name"
                tick={{ fill: '#A0A8B5', fontSize: 11, fontFamily: 'Space Grotesk' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#A0A8B5', fontSize: 11, fontFamily: 'Space Grotesk' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v}`}
                width={52}
              />
              <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="revenue" fill="#3b7eff" radius={[4,4,0,0]} />
              <Bar dataKey="profit"  fill="#feb300" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="chart-card" variants={fadeUp} transition={{ duration: 0.4 }}>
          <div className="chart-card-header">
            <span className="chart-card-title">Margin % by item</span>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#2dbe7a' }} />≥45%
              <span className="legend-dot" style={{ background: '#feb300' }} />25–45%
              <span className="legend-dot" style={{ background: '#ff5e6c' }} />&lt;25%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={marginData} barCategoryGap="28%" layout="vertical">
              <XAxis
                type="number" domain={[0, 100]}
                tick={{ fill: '#A0A8B5', fontSize: 11, fontFamily: 'Space Grotesk' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <YAxis
                type="category" dataKey="name" width={80}
                tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Space Grotesk' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<MarginTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="margin" radius={[0,4,4,0]}>
                {marginData.map((d, i) => (
                  <Cell key={i} fill={marginColor(d.margin)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.section>

      <div className="results-body">
        {/* Rule flags */}
        <section className="flags-section">
          <h3 className="section-title">Rule flags</h3>
          {totalFlags === 0 && (
            <p className="empty-state">No flags — your menu looks healthy.</p>
          )}
          <motion.div className="flags-list" variants={stagger} initial="initial" animate="animate">
            {flags.danger.map((f, i)  => <FlagItem key={`d${i}`} flag={f} tone="danger"  />)}
            {flags.warning.map((f, i) => <FlagItem key={`w${i}`} flag={f} tone="warning" />)}
            {flags.success.map((f, i) => <FlagItem key={`s${i}`} flag={f} tone="success" />)}
          </motion.div>
        </section>

        {/* AI recommendations */}
        <section className="recs-section">
          <h3 className="section-title">
            AI recommendations
            <span className="section-title-badge">AI</span>
          </h3>
          {recommendations?.length ? (
            <motion.div className="recs-grid" variants={staggerSlow} initial="initial" animate="animate">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </motion.div>
          ) : (
            <p className="empty-state">No recommendations returned.</p>
          )}
        </section>
      </div>
    </div>
  )
}
