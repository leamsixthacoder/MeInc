import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate, daysUntil, isMonday } from '../utils/dateUtils.js'

// Default fallback items in case state hasn't loaded yet
const DEFAULT_MORNING = [
  { id: 'cm_wake', key: 'wake5am', label: 'Wake at 5:00 AM (no snooze)' },
  { id: 'cm_pray', key: 'prayer', label: 'Prayer — 15 min' },
  { id: 'cm_med', key: 'meditation', label: 'Meditation + breathing — 10 min' },
  { id: 'cm_bible', key: 'bible', label: 'Bible / words of knowledge — 10 min' },
  { id: 'cm_ex', key: 'exercise', label: '20 pushups + 20 situps + stretch' },
  { id: 'cm_water', key: 'water', label: '500 ml water' },
  { id: 'cm_shower', key: 'shower', label: 'Shower & dress' },
  { id: 'cm_kpi', key: 'kpiReview', label: 'Review tasks & Daily KPI dashboard' },
  { id: 'cm_gym', key: 'gym', label: 'Gym workout (Road to Dunk Again)' },
]
const DEFAULT_EVENING = [
  { id: 'ce_shower', key: 'shower', label: 'Shower & dress' },
  { id: 'ce_dinner', key: 'dinner', label: 'Dinner — tracked' },
  { id: 'ce_task', key: 'taskReview', label: 'Review tasks completed / pending' },
  { id: 'ce_lang', key: 'languageStudy', label: 'Language study (30 min weekdays)' },
  { id: 'ce_cert', key: 'certStudy', label: 'Certification study (90 min)' },
  { id: 'ce_pri', key: 'priorities', label: "Set tomorrow's priorities" },
  { id: 'ce_pray', key: 'prayer', label: 'Prayer / meditation' },
  { id: 'ce_ns', key: 'noScreens', label: 'No screens 15 min before bed' },
  { id: 'ce_bed', key: 'bed1030', label: 'In bed by 10:30 PM' },
]
const DEFAULT_KPIS = [
  { id: 'ck_wo', key: 'workout', label: 'Workout completed' },
  { id: 'ck_en', key: 'englishStudy', label: 'English study (30 min)' },
  { id: 'ck_cs', key: 'certStudy', label: 'Certification study (90 min)' },
  { id: 'ck_dp', key: 'debtPayment', label: 'Debt payment made' },
]

// ── Compliance Ring ───────────────────────────────────────────────────────────
function ComplianceRing({ pct, color = '#3fb950' }) {
  const r = 34, circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const stroke = pct >= 85 ? '#3fb950' : pct >= 70 ? '#d29922' : '#f85149'
  return (
    <div className="compliance-circle">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle className="bg" cx="40" cy="40" r={r} />
        <circle className="fg" cx="40" cy="40" r={r} stroke={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="compliance-pct" style={{ color: stroke }}>{pct}%</div>
    </div>
  )
}

// ── Mini Line Chart ───────────────────────────────────────────────────────────
function MiniLineChart({ data, color = '#58a6ff', target, w = 200, h = 60 }) {
  if (!data || data.length < 2) return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '.75rem' }}>No data yet</div>
  const vals = data.map(d => d.value)
  const allVals = target ? [...vals, target] : vals
  const min = Math.min(...allVals) * 0.98
  const max = Math.max(...allVals) * 1.02
  const px = (v) => ((v - min) / (max - min)) * (h - 10) + 5
  const py = (i) => (i / (data.length - 1)) * (w - 20) + 10
  const points = data.map((d, i) => `${py(i)},${h - px(d.value)}`).join(' ')
  const targetY = h - px(target)
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h }}>
      {target && <line x1="10" y1={targetY} x2={w - 10} y2={targetY} className="target-line" />}
      <polyline points={points} className="data-line" stroke={color} />
      {data.slice(-1).map((d, _) => (
        <circle key="last" cx={py(data.length - 1)} cy={h - px(d.value)} r="3" fill={color} />
      ))}
    </svg>
  )
}

// ── KPI Status ────────────────────────────────────────────────────────────────
function statusClass(pct) {
  if (pct >= 85) return 'badge-green'
  if (pct >= 60) return 'badge-amber'
  return 'badge-red'
}
function statusLabel(pct) {
  if (pct >= 85) return 'On Track'
  if (pct >= 60) return 'At Risk'
  return 'Off Track'
}

// ── Daily Checklist ───────────────────────────────────────────────────────────
function DailyChecklist() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const log = state.dailyLogs.find(l => l.date === today)

  const ci = state.checklistItems || {}
  const MORNING_ITEMS = ci.morning?.length ? ci.morning : DEFAULT_MORNING
  const EVENING_ITEMS = ci.evening?.length ? ci.evening : DEFAULT_EVENING
  const KPI_ITEMS     = ci.kpis?.length    ? ci.kpis    : DEFAULT_KPIS

  const morning = log?.morning || {}
  const evening = log?.evening || {}
  const kpis    = log?.kpis    || {}

  function toggle(section, key) {
    const current = section === 'morning' ? morning : section === 'evening' ? evening : kpis
    dispatch({ type: 'UPSERT_DAILY_LOG', payload: { [section]: { ...current, [key]: !current[key] } } })
  }

  const morningCount = MORNING_ITEMS.filter(i => morning[i.key]).length
  const eveningCount = EVENING_ITEMS.filter(i => evening[i.key]).length
  const kpiCount     = KPI_ITEMS.filter(i => kpis[i.key]).length
  const totalItems   = MORNING_ITEMS.length + EVENING_ITEMS.length + KPI_ITEMS.length
  const totalDone    = morningCount + eveningCount + kpiCount
  const pct = Math.round((totalDone / totalItems) * 100)

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title" style={{ marginBottom: 0 }}>Today's Non-Negotiables · {formatDate(today)}</div>
          <div style={{ marginTop: '.25rem' }}>
            <span className={`badge ${pct >= 85 ? 'badge-green' : pct >= 60 ? 'badge-amber' : 'badge-grey'}`}>
              {totalDone}/{totalItems} completed
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Link to="/checklist-settings" className="btn btn-ghost btn-sm" title="Edit checklist items">⚙️ Edit</Link>
          <ComplianceRing pct={pct} />
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.25rem' }}>
        <div>
          <div className="check-section-title">☀️ Morning Routine</div>
          <div className="checklist">
            {MORNING_ITEMS.map(item => (
              <label key={item.id || item.key} className={`check-item ${morning[item.key] ? 'checked' : ''}`}>
                <input type="checkbox" checked={!!morning[item.key]} onChange={() => toggle('morning', item.key)} />
                <span className="check-label">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="check-section-title">🌙 Evening Routine</div>
          <div className="checklist">
            {EVENING_ITEMS.map(item => (
              <label key={item.id || item.key} className={`check-item ${evening[item.key] ? 'checked' : ''}`}>
                <input type="checkbox" checked={!!evening[item.key]} onChange={() => toggle('evening', item.key)} />
                <span className="check-label">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="check-section-title" style={{ marginTop: '.75rem' }}>📊 Daily KPIs</div>
          <div className="checklist">
            {KPI_ITEMS.map(item => (
              <label key={item.id || item.key} className={`check-item ${kpis[item.key] ? 'checked' : ''}`}>
                <input type="checkbox" checked={!!kpis[item.key]} onChange={() => toggle('kpis', item.key)} />
                <span className="check-label">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Quick KPI Cards ───────────────────────────────────────────────────────────
function QuickMetrics() {
  const { state } = useApp()

  // Weight
  const latestWeight = state.weightLog.length
    ? state.weightLog[state.weightLog.length - 1]
    : null
  const weightTarget = 197 // Sprint 1 target

  // Debt
  const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0)
  const smallLoans = state.debts.filter(d => d.id !== 'scotiabank').reduce((s, d) => s + d.balance, 0)

  // Language hours
  const langHours = state.languageSessions.reduce((s, l) => s + (l.durationMinutes || 30) / 60, 0)
  const langTarget = 60

  // Cert progress
  const ai900 = state.certifications.find(c => c.id === 'ai900')
  const sc300 = state.certifications.find(c => c.id === 'sc300')

  // Days until key deadlines
  const daysAI900 = daysUntil('2026-06-30')
  const daysSC300 = daysUntil('2026-07-31')
  const daysDebt  = daysUntil('2026-06-15')

  return (
    <div className="grid-4">
      {/* Weight */}
      <div className="kpi-card">
        <div className="kpi-label">💪 Weight</div>
        <div className="kpi-value" style={{ color: latestWeight && latestWeight.weight <= weightTarget ? 'var(--green)' : 'var(--text-1)' }}>
          {latestWeight ? `${latestWeight.weight} lb` : '— lb'}
        </div>
        <div className="kpi-sub">Target: {weightTarget} lb by Jul 31</div>
        <div className="progress-bar" style={{ marginTop: '.4rem' }}>
          <div className="progress-fill progress-fill-green" style={{ width: latestWeight ? `${Math.min(100, Math.max(0, ((203 - latestWeight.weight) / (203 - weightTarget)) * 100))}%` : '0%' }} />
        </div>
      </div>

      {/* Small Debt */}
      <div className="kpi-card">
        <div className="kpi-label">💳 Small Loans</div>
        <div className="kpi-value" style={{ color: smallLoans === 0 ? 'var(--green)' : 'var(--text-1)' }}>
          {smallLoans === 0 ? '✓ PAID' : `${(smallLoans / 1000).toFixed(0)}k DOP`}
        </div>
        <div className="kpi-sub">{daysDebt > 0 ? `${daysDebt}d to Jun 15 target` : 'Deadline passed'}</div>
        <div className="progress-bar" style={{ marginTop: '.4rem' }}>
          <div className="progress-fill progress-fill-green" style={{ width: `${Math.round(((265703 - smallLoans) / 265703) * 100)}%` }} />
        </div>
      </div>

      {/* Language */}
      <div className="kpi-card">
        <div className="kpi-label">🗣️ English Study</div>
        <div className="kpi-value">{langHours.toFixed(1)} hrs</div>
        <div className="kpi-sub">Target: {langTarget} hrs by Jul 31</div>
        <div className="progress-bar" style={{ marginTop: '.4rem' }}>
          <div className="progress-fill progress-fill-blue" style={{ width: `${Math.min(100, (langHours / langTarget) * 100)}%` }} />
        </div>
      </div>

      {/* AI-900 */}
      <div className="kpi-card">
        <div className="kpi-label">🎓 AI-900</div>
        <div className="kpi-value" style={{ fontSize: '1rem', color: ai900?.status === 'passed' ? 'var(--green)' : 'var(--text-1)' }}>
          {ai900?.status === 'passed' ? '✓ PASSED' : `${(ai900?.studyHoursLogged || 0).toFixed(1)} hrs`}
        </div>
        <div className="kpi-sub">{daysAI900 > 0 ? `${daysAI900} days until Jun 30` : 'Deadline passed'}</div>
        <span className={`badge ${ai900?.status === 'passed' ? 'badge-green' : 'badge-amber'}`}>
          {ai900?.status === 'passed' ? 'Passed' : 'In Progress'}
        </span>
      </div>

      {/* SC-300 */}
      <div className="kpi-card">
        <div className="kpi-label">🎓 SC-300</div>
        <div className="kpi-value" style={{ fontSize: '1rem', color: sc300?.status === 'passed' ? 'var(--green)' : 'var(--text-1)' }}>
          {sc300?.status === 'passed' ? '✓ PASSED' : `${(sc300?.studyHoursLogged || 0).toFixed(1)} hrs`}
        </div>
        <div className="kpi-sub">{daysSC300 > 0 ? `${daysSC300} days until Jul 31` : 'Deadline passed'}</div>
        <span className={`badge ${sc300?.status === 'passed' ? 'badge-green' : 'badge-grey'}`}>
          {sc300?.status === 'passed' ? 'Passed' : 'Not Started'}
        </span>
      </div>

      {/* Total Debt */}
      <div className="kpi-card">
        <div className="kpi-label">🏦 Total Debt</div>
        <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{(totalDebt / 1000000).toFixed(2)}M DOP</div>
        <div className="kpi-sub">Scotiabank: {(state.debts.find(d => d.id === 'scotiabank')?.balance / 1000).toFixed(0)}k DOP</div>
        <div className="progress-bar" style={{ marginTop: '.4rem' }}>
          <div className="progress-fill progress-fill-amber" style={{ width: `${Math.round((1 - totalDebt / 2976703) * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Compliance History ────────────────────────────────────────────────────────
function ComplianceHistory() {
  const { state } = useApp()
  const ci = state.checklistItems || {}
  const totalItems = (ci.morning?.length || DEFAULT_MORNING.length) + (ci.evening?.length || DEFAULT_EVENING.length) + (ci.kpis?.length || DEFAULT_KPIS.length)

  const last14 = state.dailyLogs
    .slice(-14)
    .map(log => {
      const m = Object.values(log.morning || {}).filter(Boolean).length
      const e = Object.values(log.evening || {}).filter(Boolean).length
      const k = Object.values(log.kpis    || {}).filter(Boolean).length
      const pct = Math.round(((m + e + k) / totalItems) * 100)
      return { date: log.date, pct }
    })

  if (last14.length === 0) return (
    <div className="card">
      <div className="card-title">Daily Compliance (14 days)</div>
      <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Start checking off daily items to see your compliance trend</div></div>
    </div>
  )

  const w = 400, h = 80
  const barW = Math.floor((w - 20) / last14.length) - 2
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0 }}>Daily Compliance (last 14 days)</div>
        <span className="text-sm text-muted">Target ≥85%</span>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
          <line x1="10" y1={h - (0.85 * (h-10))} x2={w-10} y2={h - (0.85 * (h-10))} className="target-line" />
          {last14.map((d, i) => {
            const x = 10 + i * (barW + 2)
            const barH = Math.round((d.pct / 100) * (h - 10))
            const fill = d.pct >= 85 ? 'var(--green)' : d.pct >= 70 ? 'var(--amber)' : 'var(--red)'
            return (
              <g key={d.date}>
                <rect x={x} y={h - barH} width={barW} height={barH} fill={fill} rx="2" opacity=".85" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Weight Trend ──────────────────────────────────────────────────────────────
function WeightTrend() {
  const { state } = useApp()
  const last12 = state.weightLog.slice(-12).map(w => ({ date: w.date, value: w.weight }))

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0 }}>Weight Trend</div>
        <span className="text-sm text-muted">Target: 195 lb</span>
      </div>
      <MiniLineChart data={last12} color="var(--blue)" target={195} w={380} h={80} />
      <div className="progress-labels" style={{ marginTop: '.3rem' }}>
        <span>Start: 203 lb</span>
        <span style={{ color: 'var(--amber)' }}>— 197 lb Sprint 1</span>
        <span>Goal: 195 lb</span>
      </div>
    </div>
  )
}

// ── Upcoming Deadlines ────────────────────────────────────────────────────────
function UpcomingDeadlines() {
  const deadlines = [
    { label: 'BHD Paid Off',         date: '2026-05-30', dept: 'Finance',  color: 'var(--amber)' },
    { label: 'Banesco + Popular Paid',date: '2026-06-15', dept: 'Finance',  color: 'var(--amber)' },
    { label: 'Giving Account Setup',  date: '2026-06-15', dept: 'Impact',   color: 'var(--purple)'},
    { label: 'AI-900 Exam',           date: '2026-06-30', dept: 'Cert',     color: 'var(--green)' },
    { label: 'SC-300 Exam',           date: '2026-07-31', dept: 'Cert',     color: 'var(--green)' },
    { label: 'Sprint 1 QBR',          date: '2026-08-01', dept: 'Ops',      color: 'var(--blue)'  },
  ]
  const today = todayISO()
  const upcoming = deadlines
    .map(d => ({ ...d, days: daysUntil(d.date) }))
    .filter(d => d.days >= -3)
    .slice(0, 6)

  return (
    <div className="card">
      <div className="card-title">Upcoming Deadlines</div>
      <div className="checklist">
        {upcoming.map(d => (
          <div key={d.label} className="check-item" style={{ cursor: 'default' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span className="check-label" style={{ flex: 1 }}>{d.label}</span>
            <span className="text-xs text-muted">{d.days < 0 ? `${-d.days}d ago` : d.days === 0 ? 'Today' : `in ${d.days}d`}</span>
            <span className="text-xs text-muted">{formatDate(d.date)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Quick Log (weight, P&L) ───────────────────────────────────────────────────
function QuickLog() {
  const { dispatch } = useApp()
  const today = todayISO()
  const [weight, setWeight] = React.useState('')

  function saveWeight(e) {
    e.preventDefault()
    if (!weight || isNaN(+weight)) return
    dispatch({ type: 'LOG_WEIGHT', payload: { date: today, weight: +weight } })
    setWeight('')
  }

  if (!isMonday()) return null

  return (
    <div className="card">
      <div className="card-title">Quick Log</div>
      <form onSubmit={saveWeight} style={{ display: 'flex', gap: '.4rem' }}>
        <input className="form-input" type="number" step="0.1" placeholder="Weight (lb)" value={weight} onChange={e => setWeight(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-sm">Log</button>
      </form>
    </div>
  )
}

// ── Sprint 1 Scoreboard ───────────────────────────────────────────────────────
function Sprint1Scoreboard() {
  const { state } = useApp()
  const ai900 = state.certifications.find(c => c.id === 'ai900')
  const sc300 = state.certifications.find(c => c.id === 'sc300')
  const smallLoans = state.debts.filter(d => d.id !== 'scotiabank').reduce((s, d) => s + d.balance, 0)
  const langHours = state.languageSessions.reduce((s, l) => s + (l.durationMinutes || 30) / 60, 0)
  const latestWeight = state.weightLog[state.weightLog.length - 1]?.weight ?? 203

  const rows = [
    { label: 'Weight → 197 lb',       current: `${latestWeight} lb`,         target: '197 lb',  done: latestWeight <= 197 },
    { label: 'English study → 60 hrs', current: `${langHours.toFixed(1)} hrs`,target: '60 hrs',  done: langHours >= 60 },
    { label: 'AI-900 pass',            current: ai900?.status,               target: 'Pass',     done: ai900?.status === 'passed' },
    { label: 'SC-300 pass',            current: sc300?.status,               target: 'Pass',     done: sc300?.status === 'passed' },
    { label: 'BHD/Banesco/Popular = 0',current: `${(smallLoans/1000).toFixed(0)}k DOP`, target: '0', done: smallLoans === 0 },
  ]
  const done = rows.filter(r => r.done).length

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0 }}>Sprint 1 Scoreboard (May–Jul 2026)</div>
        <span className={`badge ${done === rows.length ? 'badge-green' : done >= 4 ? 'badge-amber' : 'badge-grey'}`}>{done}/{rows.length} complete</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Objective</th><th>Current</th><th>Target</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.current}</td>
                <td>{r.target}</td>
                <td><span className={`badge ${r.done ? 'badge-green' : 'badge-grey'}`}>{r.done ? '✓ Done' : 'Pending'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Good morning, Jose ✦</div>
        <div className="page-subtitle">Me, Inc. · CEO Dashboard · Sprint 1: May–July 2026</div>
      </div>

      <div className="section">
        <QuickMetrics />
      </div>

      <div className="section">
        <DailyChecklist />
      </div>

      <div className="grid-2 section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <WeightTrend />
          <ComplianceHistory />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <UpcomingDeadlines />
          <QuickLog />
        </div>
      </div>

      <div className="section">
        <Sprint1Scoreboard />
      </div>
    </div>
  )
}
