import { marginPct } from '../utils/ruleEngine'

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

function MetricCard({ label, value, sub }) {
  return (
    <div className="metric-card">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  )
}

function FlagItem({ flag, tone }) {
  return (
    <div className={`flag-item flag-item--${tone}`}>
      <span className="flag-dot" />
      <div className="flag-body">
        <span className="flag-item-name">{flag.row.item}</span>
        <span className="flag-item-reason">{flag.reason}</span>
      </div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <span className="rec-type-badge">{TYPE_LABEL[rec.type] ?? rec.type}</span>
        <span className={`rec-impact impact--${IMPACT_COLOR[rec.impact] ?? 'text-muted'}`}>
          {rec.impact} impact
        </span>
      </div>
      <h3 className="rec-title">{rec.title}</h3>
      <p className="rec-detail">{rec.detail}</p>
    </div>
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

  return (
    <div className="results-screen">
      <div className="results-toolbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Edit data</button>
        <h2 className="results-title">Analysis results</h2>
        <button className="btn btn--ghost btn--sm" onClick={onReset}>Start over</button>
      </div>

      {/* Metric cards */}
      <section className="metrics-row">
        <MetricCard
          label="Weekly revenue"
          value={`₹${weeklyRevenue.toLocaleString('en-IN')}`}
        />
        <MetricCard
          label="Weekly profit"
          value={`₹${weeklyProfit.toLocaleString('en-IN')}`}
        />
        <MetricCard
          label="Avg margin"
          value={`${avgMargin}%`}
        />
        <MetricCard
          label="Flags raised"
          value={totalFlags}
          sub={`${flags.danger.length} danger · ${flags.warning.length} warning · ${flags.success.length} star`}
        />
      </section>

      <div className="results-body">
        {/* Rule flags */}
        <section className="flags-section">
          <h3 className="section-title">Rule flags</h3>
          {totalFlags === 0 && (
            <p className="empty-state">No flags — your menu looks healthy.</p>
          )}
          <div className="flags-list">
            {flags.danger.map((f, i) => (
              <FlagItem key={`d${i}`} flag={f} tone="danger" />
            ))}
            {flags.warning.map((f, i) => (
              <FlagItem key={`w${i}`} flag={f} tone="warning" />
            ))}
            {flags.success.map((f, i) => (
              <FlagItem key={`s${i}`} flag={f} tone="success" />
            ))}
          </div>
        </section>

        {/* AI recommendations */}
        <section className="recs-section">
          <h3 className="section-title">
            AI recommendations
            <span className="section-title-badge">Claude</span>
          </h3>
          {recommendations?.length ? (
            <div className="recs-grid">
              {recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))}
            </div>
          ) : (
            <p className="empty-state">No recommendations returned.</p>
          )}
        </section>
      </div>
    </div>
  )
}
