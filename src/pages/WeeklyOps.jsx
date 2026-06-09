import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate, getWeekStart, isWednesday } from '../utils/dateUtils.js'

const DAILY_ITEMS = ['Morning routine', 'Gym (if scheduled)', 'Trading prep & journal', 'Language study (30 min)', 'Certification study (90 min)', 'Nutrition tracked', 'Evening routine / bed by 10:30']

function CompliancePct({ pct }) {
  const color = pct >= 85 ? 'var(--green)' : pct >= 70 ? 'var(--amber)' : 'var(--red)'
  const r = 28, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: 68, height: 68 }}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle className="bg" cx="34" cy="34" r={r} transform="rotate(-90 34 34)" style={{ fill: 'none', stroke: 'var(--bg-3)', strokeWidth: 7 }} />
        <circle cx="34" cy="34" r={r} transform="rotate(-90 34 34)" style={{ fill: 'none', stroke: color, strokeWidth: 7, strokeDasharray: circ, strokeDashoffset: offset, strokeLinecap: 'round', transition: 'stroke-dashoffset .5s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, color }}>{pct}%</div>
    </div>
  )
}

export default function WeeklyOps() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const weekStart = getWeekStart(today)

  // Auto-populate Mon/Tue compliance from dailyLogs
  const TOTAL_ITEMS = DAILY_ITEMS.length
  const monDate = weekStart
  const tueDate = (() => { const d = new Date(weekStart + 'T12:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()
  const monLog = state.dailyLogs.find(l => l.date === monDate)
  const tueLog = state.dailyLogs.find(l => l.date === tueDate)

  function calcDayPct(log) {
    if (!log) return 0
    const m = Object.values(log.morning || {}).filter(Boolean).length
    const e = Object.values(log.evening || {}).filter(Boolean).length
    const k = Object.values(log.kpis    || {}).filter(Boolean).length
    const total = Object.keys(log.morning || {}).length + Object.keys(log.evening || {}).length + Object.keys(log.kpis || {}).length || 1
    return Math.round(((m + e + k) / total) * 100)
  }

  const monPct = calcDayPct(monLog)
  const tuePct = calcDayPct(tueLog)
  const autoPct = Math.round((monPct + tuePct) / 2)

  // Existing review for this week
  const existingReview = state.weeklyOpsReviews.find(r => r.weekStart === weekStart)

  const [form, setForm] = useState({
    weekStart,
    monPct: existingReview?.monPct ?? monPct,
    tuePct: existingReview?.tuePct ?? tuePct,
    priority1: existingReview?.priority1 ?? '',
    priority1Status: existingReview?.priority1Status ?? 'In progress',
    priority2: existingReview?.priority2 ?? '',
    priority2Status: existingReview?.priority2Status ?? 'In progress',
    priority3: existingReview?.priority3 ?? '',
    priority3Status: existingReview?.priority3Status ?? 'In progress',
    biggestDrift: existingReview?.biggestDrift ?? '',
    correctiveAction: existingReview?.correctiveAction ?? '',
    thurFriObstacle: existingReview?.thurFriObstacle ?? '',
    thurFriAdjustment: existingReview?.thurFriAdjustment ?? '',
  })
  const [saved, setSaved] = useState(false)

  const avgCompliance = Math.round((form.monPct + form.tuePct) / 2)
  const escalate = avgCompliance < 70

  function save(ev) {
    ev.preventDefault()
    dispatch({ type: 'SAVE_WEEKLY_OPS', payload: { ...form, savedAt: today } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const pastReviews = [...state.weeklyOpsReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, 8)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔍 Weekly Ops Review</div>
        <div className="page-subtitle">15-minute mid-week check · Every Wednesday at 12:30 PM · Do not skip</div>
      </div>

      {isWednesday() && (
        <div className="alert alert-info section"><span>📅</span><div><strong>Today is Wednesday</strong> — time for your 15-minute ops review. Set a 15-minute timer and complete the form below.</div></div>
      )}

      <form onSubmit={save}>
        <div className="grid-2 section">
          {/* Compliance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ marginBottom: 0 }}>Mon/Tue Compliance</div>
              <CompliancePct pct={avgCompliance} />
            </div>
            {monPct > 0 && <div className="alert alert-info" style={{ marginBottom: '.5rem' }}><span>🔄</span><div>Auto-populated from daily logs: Mon {monPct}%, Tue {tuePct}%</div></div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monday compliance (%)</label>
                <input className="form-input" type="number" min="0" max="100" value={form.monPct} onChange={e => setForm(f => ({ ...f, monPct: +e.target.value }))} />
                <div className="form-hint">{formatDate(monDate)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Tuesday compliance (%)</label>
                <input className="form-input" type="number" min="0" max="100" value={form.tuePct} onChange={e => setForm(f => ({ ...f, tuePct: +e.target.value }))} />
                <div className="form-hint">{formatDate(tueDate)}</div>
              </div>
            </div>
            {escalate && (
              <div className="alert alert-danger" style={{ marginTop: '.5rem' }}>
                <span>⚠️</span>
                <div>Compliance &lt;70% — if this happens 2 weeks in a row, log a decision in the Decision Log with root cause.</div>
              </div>
            )}
          </div>

          {/* Priorities */}
          <div className="card">
            <div className="card-title">Weekly Priorities Status</div>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ marginBottom: '.75rem' }}>
                <div className="form-group" style={{ marginBottom: '.3rem' }}>
                  <label className="form-label">Priority {n}</label>
                  <input className="form-input" type="text" placeholder={`Priority ${n} description`} value={form[`priority${n}`]} onChange={e => setForm(f => ({ ...f, [`priority${n}`]: e.target.value }))} />
                </div>
                <select className="form-select" value={form[`priority${n}Status`]} onChange={e => setForm(f => ({ ...f, [`priority${n}Status`]: e.target.value }))}>
                  {['Done', 'In progress', 'Stalled', 'Not started'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2 section">
          {/* Drift + Corrective Action */}
          <div className="card">
            <div className="card-title">Identify Drift & Corrective Action</div>
            <div className="form-group">
              <label className="form-label">Biggest drift (what went off track?)</label>
              <textarea className="form-textarea" rows={2} placeholder="e.g. Missed trading prep 2 days, skipped gym Tuesday" value={form.biggestDrift} onChange={e => setForm(f => ({ ...f, biggestDrift: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">One corrective action for today</label>
              <textarea className="form-textarea" rows={2} placeholder="e.g. Do 30 min certification study tonight at 6 PM instead of 8 PM" value={form.correctiveAction} onChange={e => setForm(f => ({ ...f, correctiveAction: e.target.value }))} />
            </div>
          </div>

          {/* Thu/Fri Preview */}
          <div className="card">
            <div className="card-title">Thu–Fri Preview</div>
            <div className="form-group">
              <label className="form-label">Potential obstacle</label>
              <textarea className="form-textarea" rows={2} placeholder="e.g. Late meeting Thursday, feeling fatigued" value={form.thurFriObstacle} onChange={e => setForm(f => ({ ...f, thurFriObstacle: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Adjustment plan</label>
              <textarea className="form-textarea" rows={2} placeholder="e.g. Swap gym to morning on Thursday" value={form.thurFriAdjustment} onChange={e => setForm(f => ({ ...f, thurFriAdjustment: e.target.value }))} />
            </div>
            <div className="alert alert-info" style={{ marginTop: '.5rem' }}>
              <span>⏱️</span>
              <div>You have been in this review for your allotted 15 minutes. Wrap up and commit.</div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">{saved ? '✓ Saved' : 'Save Ops Review'}</button>
      </form>

      {/* Escalation Triggers */}
      <div className="card section" style={{ marginTop: '1.5rem' }}>
        <div className="card-title">Escalation Triggers → Decision Log</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {[
            'Compliance < 70% for two consecutive Wednesdays',
            'Same priority stalled both weeks in a row',
            'Any trading rule violation (even once)',
            'Language or certification study missed 2+ days per week',
          ].map(t => (
            <div key={t} className="check-item" style={{ cursor: 'default' }}>
              <span className="text-red">⚠️</span>
              <span className="text-sm">{t} → open Decision Log, log root cause + mitigation</span>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {pastReviews.length > 0 && (
        <div className="section">
          <div className="section-title" style={{ marginBottom: '.75rem' }}>Past Reviews</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Week of</th><th>Mon%</th><th>Tue%</th><th>Avg</th><th>Drift</th><th>P1 Status</th><th>P2 Status</th><th>P3 Status</th></tr></thead>
              <tbody>
                {pastReviews.map(r => {
                  const avg = Math.round((r.monPct + r.tuePct) / 2)
                  return (
                    <tr key={r.id}>
                      <td>{formatDate(r.weekStart)}</td>
                      <td className={r.monPct >= 85 ? 'text-green' : r.monPct >= 70 ? 'text-amber' : 'text-red'}>{r.monPct}%</td>
                      <td className={r.tuePct >= 85 ? 'text-green' : r.tuePct >= 70 ? 'text-amber' : 'text-red'}>{r.tuePct}%</td>
                      <td className={avg >= 85 ? 'text-green' : avg >= 70 ? 'text-amber' : 'text-red'}>{avg}%</td>
                      <td className="text-muted truncate" style={{ maxWidth: 160 }}>{r.biggestDrift || '—'}</td>
                      <td><span className={`badge ${r.priority1Status === 'Done' ? 'badge-green' : r.priority1Status === 'Stalled' ? 'badge-red' : 'badge-grey'}`}>{r.priority1Status || '—'}</span></td>
                      <td><span className={`badge ${r.priority2Status === 'Done' ? 'badge-green' : r.priority2Status === 'Stalled' ? 'badge-red' : 'badge-grey'}`}>{r.priority2Status || '—'}</span></td>
                      <td><span className={`badge ${r.priority3Status === 'Done' ? 'badge-green' : r.priority3Status === 'Stalled' ? 'badge-red' : 'badge-grey'}`}>{r.priority3Status || '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
