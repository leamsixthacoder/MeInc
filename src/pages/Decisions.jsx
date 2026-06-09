import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate } from '../utils/dateUtils.js'
import { DECISION_CATEGORIES, DECISION_STATUSES } from '../data/initialData.js'

const STATUS_BADGE = {
  Proposed:  'badge-grey',
  Active:    'badge-blue',
  Completed: 'badge-green',
  Abandoned: 'badge-red',
}

export default function Decisions() {
  const { state, dispatch } = useApp()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ date: todayISO(), category: 'Strategy', decision: '', rationale: '', expectedOutcome: '', status: 'Proposed', actualOutcome: '' })
  const [errors, setErrors] = useState({})

  const decisions = [...state.decisions].sort((a, b) => b.date.localeCompare(a.date))

  const filtered = decisions.filter(d => {
    const matchCat = filter === 'All' || d.category === filter || d.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || d.decision.toLowerCase().includes(q) || d.rationale.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function validate() {
    const e = {}
    if (!form.decision.trim()) e.decision = 'Required'
    if (!form.rationale.trim()) e.rationale = 'Required'
    if (!form.date) e.date = 'Required'
    return e
  }

  function openNew() {
    setForm({ date: todayISO(), category: 'Strategy', decision: '', rationale: '', expectedOutcome: '', status: 'Proposed', actualOutcome: '' })
    setEditId(null)
    setErrors({})
    setShowForm(true)
  }

  function openEdit(d) {
    setForm({ date: d.date, category: d.category, decision: d.decision, rationale: d.rationale, expectedOutcome: d.expectedOutcome, status: d.status, actualOutcome: d.actualOutcome || '' })
    setEditId(d.id)
    setErrors({})
    setShowForm(true)
  }

  function submit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (editId) {
      dispatch({ type: 'UPDATE_DECISION', payload: { id: editId, ...form } })
    } else {
      dispatch({ type: 'ADD_DECISION', payload: form })
    }
    setShowForm(false)
    setEditId(null)
  }

  const categories = ['All', ...DECISION_CATEGORIES]
  const statusFilters = ['All', ...DECISION_STATUSES]
  const activeCount = decisions.filter(d => d.status === 'Active').length

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">📋 Decision Log</div>
            <div className="page-subtitle">Log every major decision within 24 hours. Active: {activeCount} decisions.</div>
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ New Decision</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4 section">
        {DECISION_STATUSES.map(s => {
          const count = decisions.filter(d => d.status === s).length
          return (
            <div key={s} className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(s)}>
              <div className="kpi-label">{s}</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <input className="form-input" type="text" placeholder="Search decisions..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
          {['All', ...DECISION_CATEGORIES].map(c => (
            <button key={c} className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Decision Cards */}
      {filtered.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No decisions match your filter</div></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {filtered.map(d => (
              <div key={d.id} className="card" style={{ borderLeft: `3px solid ${d.status === 'Active' ? 'var(--blue)' : d.status === 'Completed' ? 'var(--green)' : d.status === 'Abandoned' ? 'var(--red)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.4rem', flexWrap: 'wrap' }}>
                      <span className="text-xs font-bold text-muted">{d.id}</span>
                      <span className={`badge ${STATUS_BADGE[d.status] || 'badge-grey'}`}>{d.status}</span>
                      <span className="badge badge-grey">{d.category}</span>
                      <span className="text-xs text-muted">{formatDate(d.date)}</span>
                    </div>
                    <div className="font-bold" style={{ marginBottom: '.3rem' }}>{d.decision}</div>
                    <div className="text-sm text-muted" style={{ marginBottom: '.2rem' }}><strong>Why:</strong> {d.rationale}</div>
                    {d.expectedOutcome && <div className="text-sm text-muted"><strong>Expected:</strong> {d.expectedOutcome}</div>}
                    {d.actualOutcome && (
                      <div className="alert alert-success" style={{ marginTop: '.5rem' }}>
                        <span>📝</span><div className="text-sm"><strong>Post-mortem:</strong> {d.actualOutcome}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete decision ${d.id}?`) && dispatch({ type: 'DELETE_DECISION', payload: d.id })}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">{editId ? `Edit ${editId}` : 'New Decision'}</div>
            <form onSubmit={submit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date<span>*</span></label>
                  <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {DECISION_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {DECISION_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Decision<span>*</span></label>
                <textarea className={`form-textarea ${errors.decision ? 'error' : ''}`} rows={2} placeholder="What was decided?" value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} />
                {errors.decision && <div className="form-error">{errors.decision}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Rationale (Why)<span>*</span></label>
                <textarea className={`form-textarea ${errors.rationale ? 'error' : ''}`} rows={2} placeholder="Why was this decided?" value={form.rationale} onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))} />
                {errors.rationale && <div className="form-error">{errors.rationale}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Expected Outcome</label>
                <textarea className="form-textarea" rows={2} placeholder="What do you expect to happen?" value={form.expectedOutcome} onChange={e => setForm(f => ({ ...f, expectedOutcome: e.target.value }))} />
              </div>
              {(form.status === 'Completed' || form.status === 'Abandoned') && (
                <div className="form-group">
                  <label className="form-label">Actual Outcome (Post-mortem)</label>
                  <textarea className="form-textarea" rows={2} placeholder="What actually happened?" value={form.actualOutcome} onChange={e => setForm(f => ({ ...f, actualOutcome: e.target.value }))} />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Decision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
