import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate, daysUntil } from '../utils/dateUtils.js'

const SPRINT_STATUSES = ['upcoming', 'active', 'completed', 'cancelled']
const STATUS_BADGE = { upcoming: 'badge-grey', active: 'badge-blue', completed: 'badge-green', cancelled: 'badge-red' }
const STATUS_LABEL = { upcoming: 'Upcoming', active: '▶ Active', completed: '✓ Done', cancelled: 'Cancelled' }

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i - 1)

// ── Blank sprint ──────────────────────────────────────────────────────────────
function blankSprint(year = CURRENT_YEAR) {
  return {
    name: '', year, dates: '', reviewDueDate: '', status: 'upcoming',
    milestones: ['']
  }
}

// ── Sprint modal (add / edit) ─────────────────────────────────────────────────
function SprintModal({ initial, title, onSave, onClose }) {
  const [form, setForm] = useState({ ...initial, milestones: [...(initial.milestones || [''])] })

  function setMilestone(i, val) {
    setForm(f => { const m = [...f.milestones]; m[i] = val; return { ...f, milestones: m } })
  }
  function addMilestone() {
    setForm(f => ({ ...f, milestones: [...f.milestones, ''] }))
  }
  function removeMilestone(i) {
    setForm(f => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }))
  }

  function submit(ev) {
    ev.preventDefault()
    onSave({ ...form, milestones: form.milestones.filter(m => m.trim()) })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-title">{title}</div>
        <form onSubmit={submit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sprint Name<span>*</span></label>
              <input className="form-input" type="text" required placeholder="e.g. Sprint 1, Q1 2027, Annual Review" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select className="form-select" value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <input className="form-input" type="text" placeholder="e.g. Jan–Apr 2027" value={form.dates} onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Review Due Date</label>
              <input className="form-input" type="date" value={form.reviewDueDate || ''} onChange={e => setForm(f => ({ ...f, reviewDueDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {SPRINT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Milestones</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestone}>+ Add</button>
            </div>
            {form.milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '.4rem', marginBottom: '.35rem' }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder={`Milestone ${i + 1}`}
                  value={m}
                  onChange={e => setMilestone(i, e.target.value)}
                />
                {form.milestones.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMilestone(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Sprint</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── QBR fill form ─────────────────────────────────────────────────────────────
const BLANK_QBR = {
  sprintId: '', sprintLabel: '', date: todayISO(),
  wentWell: '', wentPoorly: '', biggestLesson: '', adjustments: '',
  kpiRows: [{ dept: '', kpi: '', target: '', actual: '' }]
}

function QBRForm({ sprints, existingQBR, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    if (existingQBR) {
      return {
        ...BLANK_QBR,
        ...existingQBR,
        kpiRows: existingQBR.kpiRows?.length ? existingQBR.kpiRows : [{ dept: '', kpi: '', target: '', actual: '' }]
      }
    }
    return { ...BLANK_QBR, date: todayISO() }
  })

  function setKpiRow(i, key, val) {
    setForm(f => { const rows = [...f.kpiRows]; rows[i] = { ...rows[i], [key]: val }; return { ...f, kpiRows: rows } })
  }
  function addKpiRow() {
    setForm(f => ({ ...f, kpiRows: [...f.kpiRows, { dept: '', kpi: '', target: '', actual: '' }] }))
  }
  function removeKpiRow(i) {
    setForm(f => ({ ...f, kpiRows: f.kpiRows.filter((_, idx) => idx !== i) }))
  }

  // When sprint is selected, pre-fill KPI rows from sprint milestones
  function selectSprint(sprintId) {
    const sprint = sprints.find(s => s.id === sprintId)
    if (!sprint) { setForm(f => ({ ...f, sprintId, sprintLabel: '' })); return }
    const kpiRows = sprint.milestones.map(m => ({ dept: '', kpi: m, target: '', actual: '' }))
    setForm(f => ({
      ...f,
      sprintId,
      sprintLabel: `${sprint.name} (${sprint.dates})`,
      kpiRows: kpiRows.length ? kpiRows : [{ dept: '', kpi: '', target: '', actual: '' }]
    }))
  }

  function submit(ev) {
    ev.preventDefault()
    onSave({ ...form, kpiRows: form.kpiRows.filter(r => r.kpi.trim()) })
  }

  return (
    <form onSubmit={submit} className="form">
      <div className="grid-2" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Sprint<span>*</span></label>
          <select className="form-select" required value={form.sprintId} onChange={e => selectSprint(e.target.value)}>
            <option value="">— Select sprint —</option>
            {sprints.map(s => (
              <option key={s.id} value={s.id}>{s.name} · {s.dates}</option>
            ))}
          </select>
          <div className="form-hint">Selecting a sprint pre-fills KPI rows from its milestones</div>
        </div>
        <div className="form-group">
          <label className="form-label">Review Date</label>
          <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">Executive Summary</div>
        <div className="form-group">
          <label className="form-label">What went well?</label>
          <textarea className="form-textarea" rows={3} value={form.wentWell} onChange={e => setForm(f => ({ ...f, wentWell: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">What went poorly?</label>
          <textarea className="form-textarea" rows={3} value={form.wentPoorly} onChange={e => setForm(f => ({ ...f, wentPoorly: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Biggest lesson learned?</label>
          <textarea className="form-textarea" rows={2} value={form.biggestLesson} onChange={e => setForm(f => ({ ...f, biggestLesson: e.target.value }))} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>KPI Actuals vs. Targets</div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addKpiRow}>+ Add Row</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Dept</th><th>KPI / Milestone</th><th>Target</th><th>Actual</th><th></th></tr>
            </thead>
            <tbody>
              {form.kpiRows.map((row, i) => (
                <tr key={i}>
                  <td style={{ width: 100 }}>
                    <input className="form-input" type="text" placeholder="e.g. Body" value={row.dept} onChange={e => setKpiRow(i, 'dept', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-input" type="text" placeholder="KPI or milestone" value={row.kpi} onChange={e => setKpiRow(i, 'kpi', e.target.value)} />
                  </td>
                  <td style={{ width: 130 }}>
                    <input className="form-input" type="text" placeholder="Target" value={row.target} onChange={e => setKpiRow(i, 'target', e.target.value)} />
                  </td>
                  <td style={{ width: 130 }}>
                    <input className="form-input" type="text" placeholder="Actual result" value={row.actual} onChange={e => setKpiRow(i, 'actual', e.target.value)} />
                  </td>
                  <td>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeKpiRow(i)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-title">Next Sprint Adjustments</div>
        <div className="form-group">
          <label className="form-label">What changes for the next sprint?</label>
          <textarea className="form-textarea" rows={4} placeholder="What will you do differently? What needs to be added or removed from the plan?" value={form.adjustments} onChange={e => setForm(f => ({ ...f, adjustments: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button type="submit" className="btn btn-primary">{existingQBR ? '✓ Save Changes' : 'Save QBR'}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

// ── Sprint 1 live scorecard (auto from state) ─────────────────────────────────
function Sprint1LiveScorecard() {
  const { state } = useApp()
  const latestWeight = state.weightLog.slice(-1)[0]?.weight ?? '—'
  const langHours    = state.languageSessions.reduce((x, l) => x + (l.durationMinutes || 30) / 60, 0).toFixed(1)
  const ai900        = state.certifications.find(c => c.id === 'ai900')
  const sc300        = state.certifications.find(c => c.id === 'sc300')
  const smallLoans   = state.debts.filter(d => d.id !== 'scotiabank').reduce((x, d) => x + d.balance, 0)
  const evalAccounts = state.evalAccounts || []
  const anyPassed    = evalAccounts.some(a => a.status === 'passed')
  const optionsVal   = state.optionsAccount.currentValue

  const rows = [
    { dept: 'Body',    kpi: 'Weight',              target: '197 lb',           current: `${latestWeight} lb`,             ok: +latestWeight <= 197 },
    { dept: 'Body',    kpi: 'Workout compliance',   target: '≥85%',             current: '—',                              ok: null },
    { dept: 'Mind',    kpi: 'English study hours',  target: '≥60 hrs',          current: `${langHours} hrs`,               ok: +langHours >= 60 },
    { dept: 'Certs',   kpi: 'AI-900',               target: 'Pass by Jun 30',   current: ai900?.status ?? '—',             ok: ai900?.status === 'passed' },
    { dept: 'Certs',   kpi: 'SC-300',               target: 'Pass by Jul 31',   current: sc300?.status ?? '—',             ok: sc300?.status === 'passed' },
    { dept: 'Trading', kpi: 'Funded eval',          target: 'Pass by Jul 31',   current: anyPassed ? 'passed' : 'pending', ok: anyPassed },
    { dept: 'Finance', kpi: 'BHD+Banesco+Popular',  target: '$0 DOP by Jun 15', current: `${(smallLoans/1000).toFixed(0)}k DOP`, ok: smallLoans === 0 },
    { dept: 'Options', kpi: 'Account value',        target: '$6,000',           current: `$${optionsVal}`,                 ok: optionsVal >= 6000 },
  ]
  const onTrack = rows.filter(r => r.ok === true).length
  const total   = rows.filter(r => r.ok !== null).length

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0 }}>Sprint 1 Live Scorecard (May–Jul 2026)</div>
        <span className={`badge ${onTrack === total ? 'badge-green' : onTrack >= total / 2 ? 'badge-amber' : 'badge-red'}`}>{onTrack}/{total} on track</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Dept</th><th>KPI</th><th>Target</th><th>Current</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.kpi}>
                <td><span className="badge badge-grey">{r.dept}</span></td>
                <td>{r.kpi}</td>
                <td className="text-muted">{r.target}</td>
                <td className="font-bold">{r.current}</td>
                <td>
                  {r.ok === null
                    ? <span className="badge badge-grey">Manual</span>
                    : <span className={`badge ${r.ok ? 'badge-green' : 'badge-amber'}`}>{r.ok ? '✓ Done' : 'Pending'}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main QBR page ─────────────────────────────────────────────────────────────
export default function QBR() {
  const { state, dispatch } = useApp()
  const [tab, setTab]         = useState('roadmap')
  const [sprintModal, setSprintModal] = useState(null)   // null | 'add' | sprint-object
  const [qbrMode, setQbrMode] = useState(null)           // null | 'new' | qbr-object (edit)
  const [expandedQBR, setExpandedQBR] = useState(null)

  const sprints = state.sprints || []
  const reviews = [...state.quarterlyReviews].sort((a, b) => b.savedAt.localeCompare(a.savedAt))

  // Group sprints by year for roadmap display
  const byYear = useMemo(() => {
    const map = {}
    sprints.forEach(s => {
      map[s.year] = map[s.year] || []
      map[s.year].push(s)
    })
    return Object.entries(map)
      .sort(([a], [b]) => +a - +b)
      .map(([year, list]) => ({ year: +year, sprints: list }))
  }, [sprints])

  function saveSprint(data) {
    if (sprintModal === 'add') {
      dispatch({ type: 'ADD_SPRINT', payload: data })
    } else {
      dispatch({ type: 'UPDATE_SPRINT', payload: { id: sprintModal.id, ...data } })
    }
    setSprintModal(null)
  }

  function saveQBR(data) {
    const sprint = sprints.find(s => s.id === data.sprintId)
    const sprintLabel = sprint ? `${sprint.name} (${sprint.dates})` : data.sprintLabel || data.sprintId
    if (qbrMode === 'new') {
      dispatch({ type: 'SAVE_QBR', payload: { ...data, sprintLabel } })
    } else {
      dispatch({ type: 'UPDATE_QBR', payload: { id: qbrMode.id, ...data, sprintLabel } })
    }
    setQbrMode(null)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">📊 Quarterly Business Review</div>
            <div className="page-subtitle">{sprints.filter(s => s.status === 'active').map(s => s.name).join(', ') || 'No active sprint'} · {sprints.length} sprints across {byYear.length} year{byYear.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setSprintModal('add')}>+ Sprint</button>
            <button className="btn btn-primary" onClick={() => setQbrMode('new')}>+ New QBR</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'roadmap' ? 'active' : ''}`} onClick={() => setTab('roadmap')}>🗺 Roadmap</button>
        <button className={`tab-btn ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>⚡ Sprint 1 Live</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 Reviews ({reviews.length})</button>
      </div>

      {/* ── ROADMAP ── */}
      {tab === 'roadmap' && (
        <div className="section">
          {byYear.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">🗓️</div>
              <div className="empty-state-text">No sprints yet. Click "+ Sprint" to add your first.</div>
            </div>
          ) : (
            byYear.map(({ year, sprints: yearSprints }) => (
              <div key={year} style={{ marginBottom: '1.75rem' }}>
                {/* Year header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--blue)' }}>{year}</div>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span className="text-xs text-muted">
                    {yearSprints.filter(s => s.status === 'completed').length}/{yearSprints.length} completed
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {yearSprints.map((sprint, idx) => {
                    const qbrsForSprint = reviews.filter(r => r.sprintId === sprint.id)
                    const daysLeft = sprint.reviewDueDate ? daysUntil(sprint.reviewDueDate) : null
                    return (
                      <div key={sprint.id} style={{ display: 'flex', gap: 0 }}>
                        {/* Timeline line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: sprint.status === 'completed' ? 'var(--green)' : sprint.status === 'active' ? 'var(--blue)' : 'var(--border)', border: `2px solid ${sprint.status === 'active' ? 'var(--blue)' : 'transparent'}`, marginTop: 14 }} />
                          {idx < yearSprints.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 20, marginTop: 4 }} />}
                        </div>

                        {/* Sprint card */}
                        <div className="card" style={{ flex: 1, borderLeft: `3px solid ${sprint.status === 'active' ? 'var(--blue)' : sprint.status === 'completed' ? 'var(--green)' : 'var(--border)'}`, marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="font-bold">{sprint.name}</span>
                                <span className={`badge ${STATUS_BADGE[sprint.status]}`}>{STATUS_LABEL[sprint.status]}</span>
                                {qbrsForSprint.length > 0 && <span className="badge badge-green text-xs">📋 {qbrsForSprint.length} review{qbrsForSprint.length > 1 ? 's' : ''}</span>}
                              </div>
                              <div className="text-sm text-muted" style={{ marginTop: '.15rem' }}>
                                {sprint.dates}
                                {sprint.reviewDueDate && (
                                  <span style={{ marginLeft: '.6rem' }}>
                                    · Review due: {formatDate(sprint.reviewDueDate)}
                                    {daysLeft !== null && <span className={` ${daysLeft < 0 ? 'text-red' : daysLeft <= 14 ? 'text-amber' : 'text-muted'}`}> ({daysLeft < 0 ? `${-daysLeft}d overdue` : `in ${daysLeft}d`})</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '.35rem' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => setQbrMode('new')} title="Fill QBR for this sprint">📝 QBR</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setSprintModal(sprint)}>✏️</button>
                              <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete sprint "${sprint.name}"?`) && dispatch({ type: 'DELETE_SPRINT', payload: sprint.id })}>✕</button>
                            </div>
                          </div>

                          {sprint.milestones?.length > 0 && (
                            <div style={{ marginTop: '.6rem', display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                              {sprint.milestones.map((m, i) => (
                                <span key={i} className="badge badge-grey" style={{ fontWeight: 400, fontSize: '.72rem' }}>✦ {m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SPRINT 1 LIVE ── */}
      {tab === 'live' && (
        <div className="section">
          <Sprint1LiveScorecard />
        </div>
      )}

      {/* ── REVIEW HISTORY ── */}
      {tab === 'history' && (
        <div className="section">
          {reviews.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No QBR reviews saved yet. Click "+ New QBR" to add your first.</div>
            </div>
          ) : (
            reviews.map(q => {
              const isExpanded = expandedQBR === q.id
              const sprint = sprints.find(s => s.id === q.sprintId)
              return (
                <div key={q.id} className="card" style={{ marginBottom: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpandedQBR(isExpanded ? null : q.id)}>
                    <div>
                      <div className="font-bold">{q.sprintLabel || q.sprint || q.sprintId}</div>
                      <div className="text-xs text-muted">Saved: {formatDate(q.savedAt)} · {q.kpiRows?.filter(r => r.actual).length ?? 0} KPIs filled</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                      <span className="text-muted text-sm">{isExpanded ? '▲' : '▼'}</span>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setQbrMode(q) }}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); window.confirm('Delete this QBR review?') && dispatch({ type: 'DELETE_QBR', payload: q.id }) }}>✕</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      {q.wentWell    && <div className="text-sm" style={{ marginBottom: '.4rem' }}><strong className="text-green">✓ Went well:</strong> {q.wentWell}</div>}
                      {q.wentPoorly  && <div className="text-sm" style={{ marginBottom: '.4rem' }}><strong className="text-red">✗ Went poorly:</strong> {q.wentPoorly}</div>}
                      {q.biggestLesson && <div className="text-sm" style={{ marginBottom: '.4rem' }}><strong className="text-blue">📝 Lesson:</strong> {q.biggestLesson}</div>}
                      {q.adjustments && <div className="text-sm" style={{ marginBottom: '.75rem' }}><strong className="text-amber">➜ Next sprint:</strong> {q.adjustments}</div>}

                      {q.kpiRows?.some(r => r.kpi) && (
                        <div className="table-wrap">
                          <table>
                            <thead><tr><th>Dept</th><th>KPI</th><th>Target</th><th>Actual</th></tr></thead>
                            <tbody>
                              {q.kpiRows.filter(r => r.kpi).map((r, i) => (
                                <tr key={i}>
                                  <td><span className="badge badge-grey">{r.dept || '—'}</span></td>
                                  <td className="text-sm">{r.kpi}</td>
                                  <td className="text-muted text-sm">{r.target || '—'}</td>
                                  <td className="font-bold text-sm">{r.actual || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── QBR FORM (new / edit) ── */}
      {qbrMode && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-title">{qbrMode === 'new' ? '+ New QBR Review' : `✏️ Edit QBR — ${qbrMode.sprintLabel || qbrMode.sprint}`}</div>
            <QBRForm
              sprints={sprints}
              existingQBR={qbrMode !== 'new' ? qbrMode : null}
              onSave={saveQBR}
              onCancel={() => setQbrMode(null)}
            />
          </div>
        </div>
      )}

      {/* ── SPRINT MODAL ── */}
      {sprintModal && (
        <SprintModal
          title={sprintModal === 'add' ? 'Add New Sprint' : `Edit — ${sprintModal.name}`}
          initial={sprintModal === 'add' ? blankSprint() : { ...sprintModal, milestones: [...(sprintModal.milestones || [''])] }}
          onSave={saveSprint}
          onClose={() => setSprintModal(null)}
        />
      )}
    </div>
  )
}
