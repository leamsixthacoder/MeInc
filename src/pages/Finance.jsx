import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate } from '../utils/dateUtils.js'
import { SPENDING_CATEGORIES } from '../data/initialData.js'

function fmt(n, dec = 0) { return n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? '—' }

// ── Date helpers ──────────────────────────────────────────────────────────────
function isoWeek(iso) {
  // returns YYYY-Www
  const d = new Date(iso + 'T12:00:00')
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const week = Math.ceil(((d - jan4) / 86400000 + jan4.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
function isoMonth(iso) { return iso.slice(0, 7) }
function isoYear(iso)  { return iso.slice(0, 4) }
function monthLabel(ym) {
  const [y, m] = ym.split('-')
  return new Date(+y, +m - 1).toLocaleString('default', { month: 'short', year: '2-digit' })
}

// ── Horizontal bar chart by category ─────────────────────────────────────────
function CategoryBars({ data, budgets = {} }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {data.map(d => {
        const budget = budgets[d.category] || 0
        const overBudget = budget > 0 && d.total > budget
        const pct = Math.min(100, Math.round((d.total / max) * 100))
        const budgetPct = budget > 0 ? Math.min(100, Math.round((budget / max) * 100)) : 0
        return (
          <div key={d.category}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.2rem' }}>
              <span>{d.category}</span>
              <span style={{ display: 'flex', gap: '.5rem' }}>
                {budget > 0 && <span className={overBudget ? 'text-red' : 'text-muted'}>{overBudget ? '⚠' : ''} Budget: {fmt(budget)}</span>}
                <strong className={overBudget ? 'text-red' : ''}>{fmt(d.total)} DOP</strong>
              </span>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'var(--bg-3)', borderRadius: 5 }}>
              <div style={{ height: 10, width: `${pct}%`, background: overBudget ? 'var(--red)' : 'var(--blue)', borderRadius: 5, transition: 'width .3s' }} />
              {budgetPct > 0 && (
                <div style={{ position: 'absolute', top: 0, left: `${budgetPct}%`, width: 2, height: 10, background: 'var(--amber)', borderRadius: 1 }} title={`Budget: ${fmt(budget)}`} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Monthly mini-chart ────────────────────────────────────────────────────────
function MonthlyBarsChart({ data }) {
  if (data.length < 2) return null
  const max = Math.max(...data.map(d => d.total), 1)
  const w = 400, h = 80, barW = Math.max(8, Math.floor((w - 20) / data.length) - 2)
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
        {data.map((d, i) => {
          const barH = Math.round((d.total / max) * (h - 20))
          const x = 10 + i * (barW + 2)
          return (
            <g key={d.month}>
              <rect x={x} y={h - 15 - barH} width={barW} height={barH} fill="var(--blue)" rx="2" opacity=".85" />
              <text x={x + barW / 2} y={h - 2} textAnchor="middle" style={{ fill: 'var(--text-3)', fontSize: 9 }}>
                {monthLabel(d.month).split(' ')[0]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Spending Section ──────────────────────────────────────────────────────────
function SpendingSection() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const [period, setPeriod] = useState('month')  // week | month | year
  const [viewYear, setViewYear] = useState(today.slice(0, 4))
  const [viewMonth, setViewMonth] = useState(today.slice(0, 7))
  const [showBudgetEdit, setShowBudgetEdit] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState({})
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState({ date: today, category: 'Groceries', amount: '', description: '', notes: '' })
  const [errors, setErrors] = useState({})

  const entries = state.spendingEntries || []
  const budgets = Object.fromEntries((state.spendingBudgets || []).map(b => [b.category, b.monthlyBudget]))

  // ── Filter entries by selected period ──
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (period === 'week')  return isoWeek(e.date)  === isoWeek(today)
      if (period === 'month') return isoMonth(e.date) === viewMonth
      if (period === 'year')  return isoYear(e.date)  === viewYear
      return true
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, period, viewMonth, viewYear, today])

  const total = filtered.reduce((s, e) => s + e.amount, 0)

  // ── Category breakdown ──
  const byCategory = useMemo(() => {
    const map = {}
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  // ── Monthly totals (for year view chart) ──
  const monthlyTotals = useMemo(() => {
    if (period !== 'year') return []
    const map = {}
    entries.filter(e => isoYear(e.date) === viewYear).forEach(e => {
      const m = isoMonth(e.date)
      map[m] = (map[m] || 0) + e.amount
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
  }, [entries, period, viewYear])

  // ── Budget totals (monthly only) ──
  const monthBudgetTotal = (state.spendingBudgets || []).reduce((s, b) => s + (b.monthlyBudget || 0), 0)
  const overBudgetCats   = byCategory.filter(d => budgets[d.category] > 0 && d.total > budgets[d.category])

  // ── Available months for selector ──
  const allMonths = useMemo(() => {
    const set = new Set(entries.map(e => isoMonth(e.date)))
    set.add(today.slice(0, 7))
    return [...set].sort().reverse()
  }, [entries, today])
  const allYears = useMemo(() => {
    const set = new Set(entries.map(e => isoYear(e.date)))
    set.add(today.slice(0, 4))
    return [...set].sort().reverse()
  }, [entries, today])

  function validateForm(f) {
    const e = {}
    if (!f.amount || isNaN(+f.amount) || +f.amount <= 0) e.amount = 'Enter a positive amount'
    if (!f.date) e.date = 'Required'
    if (!f.category) e.category = 'Required'
    return e
  }

  function submitNew(ev) {
    ev.preventDefault()
    const e = validateForm(form)
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'ADD_SPENDING', payload: { date: form.date, category: form.category, amount: +form.amount, description: form.description, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', description: '', notes: '' }))
    setErrors({})
  }

  function submitEdit(ev) {
    ev.preventDefault()
    const e = validateForm(editEntry)
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'UPDATE_SPENDING', payload: { id: editEntry.id, date: editEntry.date, category: editEntry.category, amount: +editEntry.amount, description: editEntry.description, notes: editEntry.notes } })
    setEditEntry(null)
    setErrors({})
  }

  function saveBudgets() {
    Object.entries(budgetDraft).forEach(([category, val]) => {
      const amount = +val || 0
      dispatch({ type: 'UPSERT_SPENDING_BUDGET', payload: { category, monthlyBudget: amount } })
    })
    setShowBudgetEdit(false)
    setBudgetDraft({})
  }

  function openBudgetEdit() {
    setBudgetDraft(Object.fromEntries((state.spendingBudgets || []).map(b => [b.category, b.monthlyBudget || ''])))
    setShowBudgetEdit(true)
  }

  // ── Period label ──
  const periodLabel = period === 'week' ? `Week of ${isoWeek(today)}` : period === 'month' ? monthLabel(viewMonth) + ' ' + viewMonth.slice(0, 4) : `Year ${viewYear}`

  return (
    <div className="section">
      {/* ── Controls strip ── */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '.25rem' }}>
          {['week', 'month', 'year'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {period === 'month' && (
          <select className="form-select" style={{ width: 'auto', fontSize: '.8rem' }} value={viewMonth} onChange={e => setViewMonth(e.target.value)}>
            {allMonths.map(m => <option key={m} value={m}>{monthLabel(m)} {m.slice(0, 4)}</option>)}
          </select>
        )}
        {period === 'year' && (
          <select className="form-select" style={{ width: 'auto', fontSize: '.8rem' }} value={viewYear} onChange={e => setViewYear(e.target.value)}>
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <button className="btn btn-ghost btn-sm" onClick={openBudgetEdit}>⚙ Budgets</button>
      </div>

      {/* ── Summary KPI strip ── */}
      <div className="grid-4" style={{ marginBottom: '1rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Spent</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{fmt(total)} DOP</div>
          <div className="kpi-sub">{periodLabel}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Transactions</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{filtered.length}</div>
          <div className="kpi-sub">{byCategory.length} categories</div>
        </div>
        {period === 'month' && monthBudgetTotal > 0 && (
          <div className="kpi-card">
            <div className="kpi-label">Monthly Budget</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem', color: total > monthBudgetTotal ? 'var(--red)' : 'var(--green)' }}>
              {fmt(total)} / {fmt(monthBudgetTotal)}
            </div>
            <div className="progress-bar" style={{ marginTop: '.3rem' }}>
              <div className={`progress-fill ${total > monthBudgetTotal ? 'progress-fill-red' : 'progress-fill-green'}`} style={{ width: `${Math.min(100, Math.round((total / monthBudgetTotal) * 100))}%` }} />
            </div>
          </div>
        )}
        {overBudgetCats.length > 0 && (
          <div className="kpi-card" style={{ borderLeft: '3px solid var(--red)' }}>
            <div className="kpi-label">Over Budget</div>
            <div className="kpi-value text-red" style={{ fontSize: '1.3rem' }}>{overBudgetCats.length}</div>
            <div className="kpi-sub">{overBudgetCats.map(c => c.category).join(', ')}</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* ── Log form ── */}
        <div className="card">
          <div className="card-title">Log Spending</div>
          <form onSubmit={submitNew} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category<span>*</span></label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {SPENDING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (DOP)<span>*</span></label>
              <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" step="0.01" placeholder="e.g. 1,500" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" type="text" placeholder="What was this for?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" type="text" placeholder="Optional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Spending</button>
          </form>
        </div>

        {/* ── Category breakdown ── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>By Category — {periodLabel}</div>
            {period !== 'month' && <span className="text-xs text-muted">Set budgets in ⚙ Budgets</span>}
          </div>
          {byCategory.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No spending logged for this period</div></div>
            : <CategoryBars data={byCategory} budgets={period === 'month' ? budgets : {}} />
          }
          {period === 'year' && monthlyTotals.length > 0 && (
            <>
              <div className="card-title" style={{ marginTop: '1rem' }}>Monthly Totals — {viewYear}</div>
              <MonthlyBarsChart data={monthlyTotals} />
            </>
          )}
        </div>
      </div>

      {/* ── Entry table ── */}
      {filtered.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Amount (DOP)</th><th>Description</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td><span className="badge badge-grey">{e.category}</span></td>
                  <td className="font-bold text-red">−{fmt(e.amount)}</td>
                  <td className="truncate" style={{ maxWidth: 200 }}>{e.description || '—'}</td>
                  <td className="text-muted truncate" style={{ maxWidth: 140 }}>{e.notes || '—'}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditEntry({ ...e, amount: String(e.amount) }); setErrors({}) }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this entry?') && dispatch({ type: 'DELETE_SPENDING', payload: e.id })}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-2)', fontWeight: 700 }}>
                <td colSpan={2}>Total</td>
                <td className="text-red">−{fmt(total)} DOP</td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editEntry && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">✏️ Edit Spending — {formatDate(editEntry.date)}</div>
            <form onSubmit={submitEdit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={editEntry.date} onChange={e => setEditEntry(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={editEntry.category} onChange={e => setEditEntry(f => ({ ...f, category: e.target.value }))}>
                    {SPENDING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (DOP)<span>*</span></label>
                <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" step="0.01" value={editEntry.amount} onChange={e => setEditEntry(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" type="text" value={editEntry.description || ''} onChange={e => setEditEntry(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" type="text" value={editEntry.notes || ''} onChange={e => setEditEntry(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditEntry(null)}>Cancel</button>
                <button type="submit" className="btn btn-green">✓ Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Budget settings modal ── */}
      {showBudgetEdit && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-title">⚙ Monthly Budgets (DOP)</div>
            <div className="form-hint" style={{ marginBottom: '1rem' }}>Set a budget of 0 to disable tracking for a category. The amber marker on the bar shows your budget limit.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {SPENDING_CATEGORIES.map(cat => (
                <div key={cat} className="form-row" style={{ alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0, minWidth: 160, fontSize: '.8rem' }}>{cat}</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0 = no limit"
                    value={budgetDraft[cat] ?? budgets[cat] ?? ''}
                    onChange={e => setBudgetDraft(d => ({ ...d, [cat]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowBudgetEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBudgets}>Save Budgets</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Debt Snowball ─────────────────────────────────────────────────────────────
function DebtSection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({ debtId: 'bhd', amount: '', date: todayISO(), notes: '' })
  const [errors, setErrors] = useState({})
  const [editDebt, setEditDebt] = useState(null)
  const [newBalance, setNewBalance] = useState('')

  const activeDebts = state.debts.filter(d => d.balance > 0)
  const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0)
  const smallLoans = state.debts.filter(d => d.id !== 'scotiabank').reduce((s, d) => s + d.balance, 0)

  function validate() {
    const e = {}
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a positive amount'
    if (!form.date) e.date = 'Required'
    return e
  }

  function submitPayment(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'ADD_DEBT_PAYMENT', payload: { debtId: form.debtId, amount: +form.amount, date: form.date, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', notes: '' }))
    setErrors({})
  }

  function updateBalance() {
    if (!newBalance || isNaN(+newBalance)) return
    dispatch({ type: 'UPDATE_DEBT_BALANCE', payload: { id: editDebt, balance: +newBalance } })
    setEditDebt(null)
    setNewBalance('')
  }

  const payments = [...state.debtPayments].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Debt Snowball</div>
        <div style={{ display: 'flex', gap: '.75rem', fontSize: '.8rem' }}>
          <span>Small loans: <strong className={smallLoans === 0 ? 'text-green' : 'text-amber'}>{smallLoans === 0 ? '✓ PAID' : `${fmt(smallLoans)} DOP`}</strong></span>
          <span>Total: <strong>{fmt(totalDebt)} DOP</strong></span>
        </div>
      </div>

      {/* Debt Cards */}
      <div className="grid-4" style={{ marginBottom: '1rem' }}>
        {state.debts.map(d => {
          const pct = Math.round(((d.initialBalance - d.balance) / d.initialBalance) * 100)
          return (
            <div key={d.id} className="kpi-card" style={{ borderLeft: `3px solid ${d.balance === 0 ? 'var(--green)' : d.priority <= 3 ? 'var(--amber)' : 'var(--blue)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="kpi-label">{d.name} <span className="text-xs">Priority {d.priority}</span></div>
                  <div className="kpi-value" style={{ fontSize: '1.2rem', color: d.balance === 0 ? 'var(--green)' : 'var(--text-1)' }}>
                    {d.balance === 0 ? '✓ PAID' : `${fmt(d.balance)} DOP`}
                  </div>
                  <div className="kpi-sub">{d.interestRate}% APR · Min {fmt(d.minimumPayment)}/mo</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditDebt(d.id); setNewBalance(d.balance) }} title="Correct balance">✏️</button>
              </div>
              <div className="progress-bar" style={{ marginTop: '.4rem' }}>
                <div className="progress-fill progress-fill-green" style={{ width: `${pct}%` }} />
              </div>
              <div className="progress-labels"><span>{pct}% paid off</span><span>Initial: {fmt(d.initialBalance)}</span></div>
            </div>
          )
        })}
      </div>

      {/* Correct Balance Modal */}
      {editDebt && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Correct Balance — {state.debts.find(d => d.id === editDebt)?.name}</div>
            <div className="form-group">
              <label className="form-label">New Current Balance (DOP)</label>
              <input className="form-input" type="number" min="0" value={newBalance} onChange={e => setNewBalance(e.target.value)} autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditDebt(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={updateBalance}>Update Balance</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Payment</div>
          <form onSubmit={submitPayment} className="form">
            <div className="form-group">
              <label className="form-label">Debt Account<span>*</span></label>
              <select className="form-select" value={form.debtId} onChange={e => setForm(f => ({ ...f, debtId: e.target.value }))}>
                {state.debts.map(d => <option key={d.id} value={d.id}>{d.name} — {d.balance > 0 ? fmt(d.balance) + ' DOP' : 'PAID'}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (DOP)<span>*</span></label>
                <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" placeholder="e.g. 48154" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" type="text" placeholder="e.g. Full payoff" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Payment</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Snowball Schedule</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.85rem' }}>
            {[
              { step: 1, name: 'BHD',      target: 'May 30',  amount: '48,154 DOP' },
              { step: 2, name: 'Banesco',   target: 'Jun 13',  amount: '70,744 DOP' },
              { step: 3, name: 'Popular',   target: 'Jul 25',  amount: '146,805 DOP' },
              { step: 4, name: 'Scotiabank',target: 'Feb 2028 (no trading) / Oct 2026 (with trading)', amount: '2,711,000 DOP' },
            ].map(s => {
              const debt = state.debts.find(d => d.name === s.name)
              const done = debt?.balance === 0
              return (
                <div key={s.step} style={{ padding: '.5rem .7rem', background: 'var(--bg-2)', borderRadius: 4, borderLeft: `3px solid ${done ? 'var(--green)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className={done ? 'text-green' : 'font-bold'}>{done ? '✓' : s.step + '.'} {s.name}</span>
                    <span className="text-xs text-muted">{s.target}</span>
                  </div>
                  <div className="text-xs text-muted">{s.amount}</div>
                </div>
              )
            })}
          </div>
          <div className="alert alert-info" style={{ marginTop: '.75rem' }}>
            <span>📊</span>
            <div>Monthly surplus: ~142,207 DOP after small loans gone. With trading: Scotiabank done by Oct 2026.</div>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Account</th><th>Amount (DOP)</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {payments.slice(0, 20).map(p => (
                <tr key={p.id}>
                  <td>{formatDate(p.date)}</td>
                  <td>{state.debts.find(d => d.id === p.debtId)?.name ?? p.debtId}</td>
                  <td className="text-green font-bold">{fmt(p.amount)}</td>
                  <td className="text-muted">{p.notes || '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Undo this payment? Balance will be restored.') && dispatch({ type: 'DELETE_DEBT_PAYMENT', payload: p.id })}>↩</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Income Tracker ─────────────────────────────────────────────────────────────
function IncomeSection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({ sourceId: 'phibro', amount: '', date: todayISO(), notes: '' })
  const [errors, setErrors] = useState({})

  const totalMonthly = state.incomeSources.reduce((s, src) => s + src.monthlyAmount, 0)
  const incomeLog = [...state.incomeLog].sort((a, b) => b.date.localeCompare(a.date))

  function validate() {
    const e = {}
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a positive amount'
    return e
  }

  function submit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'LOG_INCOME', payload: { sourceId: form.sourceId, amount: +form.amount, date: form.date, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', notes: '' }))
    setErrors({})
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Income Sources</div>
        <span className="text-sm">Total monthly: <strong className="text-green">{fmt(totalMonthly)} DOP</strong></span>
      </div>

      <div className="grid-3" style={{ marginBottom: '1rem' }}>
        {state.incomeSources.map(src => (
          <div key={src.id} className="kpi-card">
            <div className="kpi-label">{src.name} {src.isAPEC && <span className="badge badge-amber" style={{ marginLeft: '.25rem' }}>APEC</span>}</div>
            <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{fmt(src.monthlyAmount)} DOP</div>
            <div className="kpi-sub">{src.type} · after-tax/month</div>
            <div className="progress-wrap" style={{ marginTop: '.4rem' }}>
              <div className="progress-bar">
                <div className="progress-fill progress-fill-blue" style={{ width: `${Math.round((src.monthlyAmount / totalMonthly) * 100)}%` }} />
              </div>
              <div className="progress-labels"><span>{Math.round((src.monthlyAmount / totalMonthly) * 100)}% of total</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Income Received</div>
          <form onSubmit={submit} className="form">
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-select" value={form.sourceId} onChange={e => setForm(f => ({ ...f, sourceId: e.target.value }))}>
                {state.incomeSources.map(src => <option key={src.id} value={src.id}>{src.name}</option>)}
                <option value="trading">Funded Trading Payout</option>
                <option value="options">Options Trading Gain</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (DOP)<span>*</span></label>
                <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Income</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">APEC Replacement Goal</div>
          <div style={{ fontSize: '.875rem', color: 'var(--text-2)', marginBottom: '.75rem' }}>
            APEC contributes <strong className="text-amber">48,000 DOP/month</strong> (17% of total). Replace with non-APEC income by Dec 2026.
          </div>
          {[
            { period: 'Sprint 1 (Aug 1 QBR)', pct: 20,  amount: '9,600 DOP/mo',  from: 'Funded trading' },
            { period: 'Sprint 2 (Oct)',        pct: 50,  amount: '24,000 DOP/mo', from: 'Trading + options' },
            { period: 'Wrap-up (Dec)',         pct: 100, amount: '48,000+ DOP/mo',from: 'All non-APEC' },
          ].map(r => (
            <div key={r.period} style={{ marginBottom: '.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.15rem' }}>
                <span>{r.period}: {r.pct}% of APEC</span>
                <span className="text-muted">{r.amount}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill progress-fill-amber" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {incomeLog.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Source</th><th>Amount (DOP)</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {incomeLog.slice(0, 20).map(i => (
                <tr key={i.id}>
                  <td>{formatDate(i.date)}</td>
                  <td>{state.incomeSources.find(s => s.id === i.sourceId)?.name ?? i.sourceId}</td>
                  <td className="text-green font-bold">{fmt(i.amount)}</td>
                  <td className="text-muted">{i.notes || '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && dispatch({ type: 'DELETE_INCOME', payload: i.id })}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Options Account ────────────────────────────────────────────────────────────
function OptionsSection() {
  const { state, dispatch } = useApp()
  const opts = state.optionsAccount
  const [form, setForm] = useState({ currentValue: opts.currentValue, paperTradesCompleted: opts.paperTradesCompleted, paperTradeWins: opts.paperTradeWins })
  const [saved, setSaved] = useState(false)

  function save(ev) {
    ev.preventDefault()
    dispatch({ type: 'UPDATE_OPTIONS_ACCOUNT', payload: {
      currentValue: +form.currentValue,
      paperTradesCompleted: +form.paperTradesCompleted,
      paperTradeWins: +form.paperTradeWins,
      liveTradingEnabled: +form.paperTradesCompleted >= opts.paperTradeTarget && (+form.paperTradeWins / +form.paperTradesCompleted) >= 0.70
    }})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const winRate = opts.paperTradesCompleted > 0 ? ((opts.paperTradeWins / opts.paperTradesCompleted) * 100).toFixed(0) : 0
  const liveOk = opts.paperTradesCompleted >= opts.paperTradeTarget && winRate >= 70

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Options Account</div>
        <span className={`badge ${liveOk ? 'badge-green' : 'badge-amber'}`}>{liveOk ? '✓ Live Trading Unlocked' : 'Paper Trading Phase'}</span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Account Status</div>
          <form onSubmit={save} className="form">
            <div className="form-group">
              <label className="form-label">Current Account Value (USD)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paper Trades Done</label>
                <input className="form-input" type="number" min="0" max="200" value={form.paperTradesCompleted} onChange={e => setForm(f => ({ ...f, paperTradesCompleted: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Paper Trade Wins</label>
                <input className="form-input" type="number" min="0" value={form.paperTradeWins} onChange={e => setForm(f => ({ ...f, paperTradeWins: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{saved ? '✓ Saved' : 'Update'}</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Progress to Live Trading</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.2rem' }}>
                <span>Account value</span>
                <span className={opts.currentValue >= opts.sprint1Target ? 'text-green' : 'text-amber'}>${opts.currentValue} / ${opts.sprint1Target}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill progress-fill-blue" style={{ width: `${Math.min(100, (opts.currentValue / opts.sprint1Target) * 100)}%` }} />
              </div>
              <div className="form-hint">Sprint 1 target: $6,000 · Year target: $15,000</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.2rem' }}>
                <span>Paper trades ({opts.paperTradesCompleted}/{opts.paperTradeTarget} required)</span>
                <span className={opts.paperTradesCompleted >= opts.paperTradeTarget ? 'text-green' : 'text-amber'}>{opts.paperTradesCompleted}/{opts.paperTradeTarget}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill progress-fill-green" style={{ width: `${Math.min(100, (opts.paperTradesCompleted / opts.paperTradeTarget) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.2rem' }}>
                <span>Win rate (need ≥70%)</span>
                <span className={winRate >= 70 ? 'text-green' : 'text-red'}>{winRate}%</span>
              </div>
              <div className="progress-bar">
                <div className={`progress-fill ${winRate >= 70 ? 'progress-fill-green' : 'progress-fill-red'}`} style={{ width: `${Math.min(100, winRate)}%` }} />
              </div>
            </div>
            {liveOk
              ? <div className="alert alert-success"><span>✓</span><div>Ready for live options trading! Keep risk ≤2% per trade.</div></div>
              : <div className="alert alert-warning"><span>⚠️</span><div>Complete {opts.paperTradeTarget - opts.paperTradesCompleted} more paper trades with ≥70% win rate before going live.</div></div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Giving Account ────────────────────────────────────────────────────────────
function GivingSection() {
  const { state, dispatch } = useApp()
  const giving = state.givingAccount
  const [form, setForm] = useState({ amount: '', date: todayISO(), notes: '' })

  function submit(ev) {
    ev.preventDefault()
    if (!form.amount || isNaN(+form.amount)) return
    dispatch({ type: 'LOG_GIVING', payload: { amount: +form.amount, date: form.date, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', notes: '' }))
  }

  const history = [...(giving.history || [])].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Giving Account</div>
        <span className="text-sm">Balance: <strong className="text-green">{fmt(giving.currentBalance)} DOP</strong></span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Giving</div>
          <div className="alert alert-info" style={{ marginBottom: '.75rem' }}>
            <span>💡</span>
            <div>Automate <strong>5,620 DOP/month</strong> (2% of 281k DOP) to this account. Ramp to 5% in August, 10% by Year 5.</div>
          </div>
          <form onSubmit={submit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (DOP)</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 5620" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (cause / recipient)</label>
              <input className="form-input" type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Giving</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Giving Ramp Schedule</div>
          {[
            { period: 'May–Jul 2026',  pct: 2,  note: 'Building habit' },
            { period: 'Aug–Dec 2026',  pct: 5,  note: 'Ramp up' },
            { period: 'Year 2 (2027)', pct: 7,  note: 'Growing' },
            { period: 'Year 3 (2028)', pct: 8,  note: '' },
            { period: 'Year 4 (2029)', pct: 9,  note: '' },
            { period: 'Year 5 (2030)', pct: 10, note: 'Vision target' },
          ].map(r => (
            <div key={r.period} style={{ marginBottom: '.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.1rem' }}>
                <span>{r.period}</span>
                <span className={r.pct >= giving.targetPercent ? 'text-green' : 'text-muted'}>{r.pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill progress-fill-purple" style={{ width: `${r.pct * 10}%`, background: 'var(--purple)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Amount (DOP)</th><th>Notes</th></tr></thead>
            <tbody>
              {history.slice(0, 20).map(g => (
                <tr key={g.id || g.date}>
                  <td>{formatDate(g.date)}</td>
                  <td className="text-green font-bold">{fmt(g.amount)}</td>
                  <td className="text-muted">{g.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Finance Page ─────────────────────────────────────────────────────────
export default function Finance() {
  const [tab, setTab] = useState('debt')
  return (
    <div>
      <div className="page-header">
        <div className="page-title">💰 Financial Sovereignty</div>
        <div className="page-subtitle">Goal: Debt-free · $12k–$25k/month passive income · 10% giving automated</div>
      </div>
      <div className="tabs">
        {[['spending','💸 Spending'], ['debt','Debt Snowball'], ['income','Income'], ['options','Options Acct'], ['giving','Giving']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'spending' && <SpendingSection />}
      {tab === 'debt'     && <DebtSection />}
      {tab === 'income'   && <IncomeSection />}
      {tab === 'options'  && <OptionsSection />}
      {tab === 'giving'   && <GivingSection />}
    </div>
  )
}
