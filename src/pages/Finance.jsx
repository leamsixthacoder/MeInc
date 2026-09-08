import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate } from '../utils/dateUtils.js'

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
                <strong className={overBudget ? 'text-red' : ''}>{fmt(d.total)} DOP eq.</strong>
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
  const [newCategory, setNewCategory] = useState('')
  const [showRateEdit, setShowRateEdit] = useState(false)
  const [rateDraft, setRateDraft] = useState('')
  const [editEntry, setEditEntry] = useState(null)
  const [form, setForm] = useState({ date: today, category: 'Groceries', amount: '', currency: 'DOP', description: '', notes: '' })
  const [errors, setErrors] = useState({})

  const categories = state.spendingCategories || []
  const rate = state.financeSettings?.usdToDopRate || 60
  const toDOP = (e) => e.currency === 'USD' ? e.amount * rate : e.amount
  const toUSD = (e) => e.currency === 'USD' ? e.amount : e.amount / rate

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

  const totalDOP = filtered.reduce((s, e) => s + toDOP(e), 0)
  const totalUSD = filtered.reduce((s, e) => s + toUSD(e), 0)
  const total = totalDOP // DOP-equivalent grand total, used for budget comparisons

  // ── Category breakdown (amounts converted to DOP-equivalent) ──
  const byCategory = useMemo(() => {
    const map = {}
    filtered.forEach(e => { map[e.category] = (map[e.category] || 0) + toDOP(e) })
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtered, rate])

  // ── Monthly totals (for year view chart) ──
  const monthlyTotals = useMemo(() => {
    if (period !== 'year') return []
    const map = {}
    entries.filter(e => isoYear(e.date) === viewYear).forEach(e => {
      const m = isoMonth(e.date)
      map[m] = (map[m] || 0) + toDOP(e)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
  }, [entries, period, viewYear, rate])

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
    dispatch({ type: 'ADD_SPENDING', payload: { date: form.date, category: form.category, amount: +form.amount, currency: form.currency, description: form.description, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', description: '', notes: '' }))
    setErrors({})
  }

  function submitEdit(ev) {
    ev.preventDefault()
    const e = validateForm(editEntry)
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'UPDATE_SPENDING', payload: { id: editEntry.id, date: editEntry.date, category: editEntry.category, amount: +editEntry.amount, currency: editEntry.currency, description: editEntry.description, notes: editEntry.notes } })
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

  function addCategory() {
    const cat = newCategory.trim()
    if (!cat) return
    dispatch({ type: 'ADD_SPENDING_CATEGORY', payload: cat })
    setNewCategory('')
  }

  function openRateEdit() {
    setRateDraft(String(rate))
    setShowRateEdit(true)
  }

  function saveRate() {
    const val = +rateDraft
    if (!val || val <= 0) return
    dispatch({ type: 'UPDATE_FINANCE_SETTINGS', payload: { usdToDopRate: val } })
    setShowRateEdit(false)
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
        <button className="btn btn-ghost btn-sm" onClick={openRateEdit}>💱 1 USD = {fmt(rate)} DOP</button>
      </div>

      {/* ── Summary KPI strip ── */}
      <div className="grid-4" style={{ marginBottom: '1rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Spent</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{fmt(totalDOP)} DOP</div>
          <div className="kpi-sub">≈ ${fmt(totalUSD, 2)} USD · {periodLabel}</div>
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
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount<span>*</span></label>
                <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" step="0.01" placeholder="e.g. 1,500" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
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
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td><span className="badge badge-grey">{e.category}</span></td>
                  <td className="font-bold text-red">−{fmt(e.amount, e.currency === 'USD' ? 2 : 0)} {e.currency || 'DOP'}</td>
                  <td className="truncate" style={{ maxWidth: 200 }}>{e.description || '—'}</td>
                  <td className="text-muted truncate" style={{ maxWidth: 140 }}>{e.notes || '—'}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditEntry({ ...e, amount: String(e.amount), currency: e.currency || 'DOP' }); setErrors({}) }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this entry?') && dispatch({ type: 'DELETE_SPENDING', payload: e.id })}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-2)', fontWeight: 700 }}>
                <td colSpan={2}>Total</td>
                <td className="text-red">−{fmt(totalDOP)} DOP <span className="text-muted" style={{ fontWeight: 400 }}>(≈ ${fmt(totalUSD, 2)} USD)</span></td>
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
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount<span>*</span></label>
                  <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="1" step="0.01" value={editEntry.amount} onChange={e => setEditEntry(f => ({ ...f, amount: e.target.value }))} />
                  {errors.amount && <div className="form-error">{errors.amount}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={editEntry.currency} onChange={e => setEditEntry(f => ({ ...f, currency: e.target.value }))}>
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
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
              {categories.map(cat => (
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
            <div className="form-row" style={{ marginTop: '.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input className="form-input" type="text" placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCategory}>+ Add Category</button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowBudgetEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBudgets}>Save Budgets</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exchange rate modal ── */}
      {showRateEdit && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">💱 USD → DOP Exchange Rate</div>
            <div className="form-hint" style={{ marginBottom: '1rem' }}>Used to convert between USD and DOP spending totals. Update it whenever the dollar rate changes.</div>
            <div className="form-group">
              <label className="form-label">1 USD = ? DOP</label>
              <input className="form-input" type="number" min="1" step="0.01" autoFocus value={rateDraft} onChange={e => setRateDraft(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowRateEdit(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRate}>Save Rate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Debt Snowball ─────────────────────────────────────────────────────────────
const BLANK_DEBT_FORM = { name: '', currency: 'DOP', initialBalance: '', balance: '', interestRate: '', minimumPayment: '' }

// ── Add / Edit Loan Modal ──────────────────────────────────────────────────────
function LoanModal({ initial, title, onSave, onClose }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')

  function submit(ev) {
    ev.preventDefault()
    if (!form.name.trim()) { setError('Loan name is required'); return }
    if (form.initialBalance === '' || isNaN(+form.initialBalance) || +form.initialBalance < 0) { setError('Enter a valid initial balance'); return }
    onSave({
      ...form,
      initialBalance: +form.initialBalance,
      balance: form.balance === '' ? +form.initialBalance : +form.balance,
      interestRate: +form.interestRate || 0,
      minimumPayment: +form.minimumPayment || 0,
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <form onSubmit={submit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Loan Name<span>*</span></label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. BHD" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Initial Balance<span>*</span></label>
              <input className="form-input" type="number" min="0" value={form.initialBalance} onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Balance</label>
              <input className="form-input" type="number" min="0" placeholder="Same as initial" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Interest Rate (% APR)</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Payment / mo</label>
              <input className="form-input" type="number" min="0" value={form.minimumPayment} onChange={e => setForm(f => ({ ...f, minimumPayment: e.target.value }))} />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Loan</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Reset Loan Modal ───────────────────────────────────────────────────────────
function ResetLoanModal({ debt, onSave, onClose }) {
  const [form, setForm] = useState({ name: debt.name, currency: debt.currency, initialBalance: '', interestRate: debt.interestRate, minimumPayment: debt.minimumPayment })
  const [error, setError] = useState('')

  function submit(ev) {
    ev.preventDefault()
    if (form.initialBalance === '' || isNaN(+form.initialBalance) || +form.initialBalance <= 0) { setError('Enter the new loan balance'); return }
    onSave({ id: debt.id, name: form.name, currency: form.currency, initialBalance: +form.initialBalance, interestRate: +form.interestRate || 0, minimumPayment: +form.minimumPayment || 0 })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-title">Reset Loan — {debt.name}</div>
        <div className="alert alert-info" style={{ marginBottom: '.75rem' }}>
          <span>ℹ️</span>
          <div>"{debt.name}" will be archived as paid/closed (its payment history stays intact) and a brand new loan cycle starts below.</div>
        </div>
        <form onSubmit={submit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New Balance<span>*</span></label>
            <input className="form-input" type="number" min="0" value={form.initialBalance} onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))} autoFocus />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Interest Rate (% APR)</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Payment / mo</label>
              <input className="form-input" type="number" min="0" value={form.minimumPayment} onChange={e => setForm(f => ({ ...f, minimumPayment: e.target.value }))} />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Reset Loan</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DebtSection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({ debtId: '', amount: '', date: todayISO(), notes: '' })
  const [errors, setErrors] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [editDebt, setEditDebt] = useState(null)
  const [resetDebt, setResetDebt] = useState(null)
  const [showPaidOff, setShowPaidOff] = useState(false)

  const activeDebts = [...state.debts.filter(d => d.status === 'active')].sort((a, b) => a.priority - b.priority)
  const completedDebts = state.debts.filter(d => d.status === 'completed')
  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0)
  const payDebtId = form.debtId || activeDebts[0]?.id || ''

  function validate() {
    const e = {}
    if (!payDebtId) e.debtId = 'Add a loan first'
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a positive amount'
    if (!form.date) e.date = 'Required'
    return e
  }

  function submitPayment(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'ADD_DEBT_PAYMENT', payload: { debtId: payDebtId, amount: +form.amount, date: form.date, notes: form.notes } })
    setForm(f => ({ ...f, amount: '', notes: '' }))
    setErrors({})
  }

  function addLoan(data) {
    dispatch({ type: 'ADD_DEBT', payload: data })
    setShowAdd(false)
  }
  function saveLoanEdit(data) {
    dispatch({ type: 'UPDATE_DEBT', payload: { id: editDebt.id, ...data } })
    setEditDebt(null)
  }
  function saveReset(data) {
    dispatch({ type: 'RESET_DEBT', payload: data })
    setResetDebt(null)
  }
  function completeLoan(id, name) {
    if (window.confirm(`Mark "${name}" as paid off / complete?`)) dispatch({ type: 'COMPLETE_DEBT', payload: id })
  }
  function deleteLoan(id, name) {
    if (window.confirm(`Permanently delete "${name}" and its payment history? This can't be undone.`)) dispatch({ type: 'DELETE_DEBT', payload: id })
  }
  function reorder(id, direction) {
    dispatch({ type: 'REORDER_DEBT', payload: { id, direction } })
  }

  const payments = [...state.debtPayments].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Debt Snowball</div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', fontSize: '.8rem' }}>
          <span>Active total: <strong>{totalDebt === 0 && activeDebts.length === 0 ? '—' : `${fmt(totalDebt)} DOP eq.`}</strong></span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Loan</button>
        </div>
      </div>

      {/* Debt Cards, in priority (snowball) order */}
      {activeDebts.length === 0 ? (
        <div className="card empty-state" style={{ marginBottom: '1rem' }}>
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text">No active loans. Click "+ Add Loan" to track one.</div>
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          {activeDebts.map((d, i) => {
            const pct = d.initialBalance > 0 ? Math.round(((d.initialBalance - d.balance) / d.initialBalance) * 100) : 0
            return (
              <div key={d.id} className="kpi-card" style={{ borderLeft: `3px solid ${i === 0 ? 'var(--amber)' : 'var(--blue)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="kpi-label">{d.name} <span className="text-xs">Priority {i + 1}</span></div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem' }}>{fmt(d.balance)} {d.currency}</div>
                    <div className="kpi-sub">{d.interestRate}% APR · Min {fmt(d.minimumPayment)}/mo</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-xs" disabled={i === 0} onClick={() => reorder(d.id, 'up')} title="Higher priority">▲</button>
                    <button className="btn btn-ghost btn-xs" disabled={i === activeDebts.length - 1} onClick={() => reorder(d.id, 'down')} title="Lower priority">▼</button>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: '.4rem' }}>
                  <div className="progress-fill progress-fill-green" style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-labels"><span>{pct}% paid off</span><span>Initial: {fmt(d.initialBalance)}</span></div>
                <div style={{ display: 'flex', gap: '.3rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditDebt(d)} title="Edit loan">✏️ Edit</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setResetDebt(d)} title="Archive and start a new cycle">↻ Reset</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => completeLoan(d.id, d.name)} title="Mark paid off">✓ Complete</button>
                  <button className="btn btn-danger btn-xs" onClick={() => deleteLoan(d.id, d.name)} title="Delete permanently">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paid Off / Closed trophy case */}
      {completedDebts.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowPaidOff(v => !v)}>
            <div className="card-title" style={{ marginBottom: 0 }}>🏆 Paid Off / Closed ({completedDebts.length})</div>
            <span className="btn btn-ghost btn-xs">{showPaidOff ? '▲ Hide' : '▼ Show'}</span>
          </div>
          {showPaidOff && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginTop: '.5rem' }}>
              {completedDebts.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem .6rem', background: 'var(--bg-2)', borderRadius: 4 }}>
                  <span><span className="text-green">✓</span> <strong>{d.name}</strong> <span className="text-xs text-muted">Initial: {fmt(d.initialBalance)} {d.currency}</span></span>
                  <button className="btn btn-danger btn-xs" onClick={() => deleteLoan(d.id, d.name)} title="Delete permanently">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAdd && <LoanModal initial={BLANK_DEBT_FORM} title="Add Loan" onSave={addLoan} onClose={() => setShowAdd(false)} />}
      {editDebt && (
        <LoanModal
          initial={{ name: editDebt.name, currency: editDebt.currency, initialBalance: editDebt.initialBalance, balance: editDebt.balance, interestRate: editDebt.interestRate, minimumPayment: editDebt.minimumPayment }}
          title={`Edit Loan — ${editDebt.name}`}
          onSave={saveLoanEdit}
          onClose={() => setEditDebt(null)}
        />
      )}
      {resetDebt && <ResetLoanModal debt={resetDebt} onSave={saveReset} onClose={() => setResetDebt(null)} />}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Payment</div>
          {activeDebts.length === 0 ? (
            <div className="text-xs text-muted">Add a loan above to log a payment against it.</div>
          ) : (
            <form onSubmit={submitPayment} className="form">
              <div className="form-group">
                <label className="form-label">Loan<span>*</span></label>
                <select className="form-select" value={payDebtId} onChange={e => setForm(f => ({ ...f, debtId: e.target.value }))}>
                  {activeDebts.map(d => <option key={d.id} value={d.id}>{d.name} — {fmt(d.balance)} {d.currency}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount<span>*</span></label>
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
          )}
        </div>

        <div className="card">
          <div className="card-title">Snowball Order</div>
          {activeDebts.length === 0 ? (
            <div className="text-xs text-muted">No active loans to order.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', fontSize: '.85rem' }}>
              {activeDebts.map((d, i) => (
                <div key={d.id} style={{ padding: '.5rem .7rem', background: 'var(--bg-2)', borderRadius: 4, borderLeft: `3px solid ${i === 0 ? 'var(--amber)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-bold">{i + 1}. {d.name}</span>
                    <span className="text-xs text-muted">Min {fmt(d.minimumPayment)}/mo</span>
                  </div>
                  <div className="text-xs text-muted">{fmt(d.balance)} {d.currency} remaining</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Loan</th><th>Amount</th><th>Notes</th><th></th></tr></thead>
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
            { period: 'Sprint 1 (Aug 1 QBR)', pct: 20,  amount: '9,600 DOP/mo',  from: 'Side income' },
            { period: 'Sprint 2 (Oct)',        pct: 50,  amount: '24,000 DOP/mo', from: 'Side income' },
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

// ── Simple horizontal bar list (generic, for Investing / Prop Firms charts) ────
function SimpleBars({ data, formatValue = fmt }) {
  if (!data.length) return <div className="text-xs text-muted">No data yet.</div>
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {data.map(d => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.2rem' }}>
            <span>{d.label}</span>
            <strong className={d.value < 0 ? 'text-red' : ''}>{formatValue(d.value)}</strong>
          </div>
          <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 5 }}>
            <div style={{ height: 10, width: `${Math.round((Math.abs(d.value) / max) * 100)}%`, background: d.color || 'var(--blue)', borderRadius: 5, transition: 'width .3s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Investing (self-investment: courses, certifications, etc.) ────────────────
const INVESTMENT_CATEGORIES = ['Certification', 'Course', 'Book', 'Coaching / Mentorship', 'Software / Tool', 'Other']
const INVESTMENT_STATUSES = ['planned', 'in_progress', 'completed']
const INVESTMENT_STATUS_LABEL = { planned: 'Planned', in_progress: 'In Progress', completed: 'Completed' }
const INVESTMENT_STATUS_BADGE = { planned: 'badge-grey', in_progress: 'badge-amber', completed: 'badge-green' }

const BLANK_INVESTMENT = { date: '', item: '', provider: '', category: INVESTMENT_CATEGORIES[0], amount: '', currency: 'DOP', status: 'in_progress', notes: '' }

function InvestingSection() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const [form, setForm] = useState({ ...BLANK_INVESTMENT, date: today })
  const [editEntry, setEditEntry] = useState(null)
  const [error, setError] = useState('')

  const rate = state.financeSettings?.usdToDopRate || 60
  const toDOP = (e) => e.currency === 'USD' ? e.amount * rate : e.amount

  const investments = [...(state.investments || [])].sort((a, b) => b.date.localeCompare(a.date))
  const totalSpent = investments.reduce((s, i) => s + toDOP(i), 0)
  const completedCount = investments.filter(i => i.status === 'completed').length

  const byCategory = useMemo(() => {
    const map = {}
    investments.forEach(i => { map[i.category] = (map[i.category] || 0) + toDOP(i) })
    return Object.entries(map).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)
  }, [investments, rate])

  function validate(f) {
    if (!f.item.trim()) return 'Item name is required'
    if (!f.date) return 'Date is required'
    if (!f.amount || isNaN(+f.amount) || +f.amount <= 0) return 'Enter a positive amount'
    return ''
  }

  function submitNew(ev) {
    ev.preventDefault()
    const err = validate(form)
    if (err) { setError(err); return }
    dispatch({ type: 'ADD_INVESTMENT', payload: { ...form, amount: +form.amount } })
    setForm({ ...BLANK_INVESTMENT, date: today })
    setError('')
  }

  function submitEdit(ev) {
    ev.preventDefault()
    const err = validate(editEntry)
    if (err) { setError(err); return }
    dispatch({ type: 'UPDATE_INVESTMENT', payload: { ...editEntry, amount: +editEntry.amount } })
    setEditEntry(null)
    setError('')
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Investing in Yourself</div>
        <span className="text-sm">Total: <strong className="text-amber">{fmt(totalSpent)} DOP eq.</strong> · {completedCount}/{investments.length} completed</span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">{editEntry ? `Edit — ${editEntry.item}` : 'Log an Investment'}</div>
          <form onSubmit={editEntry ? submitEdit : submitNew} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Item<span>*</span></label>
                <input className="form-input" placeholder="e.g. AZ-104 exam voucher" value={editEntry ? editEntry.item : form.item} onChange={e => editEntry ? setEditEntry(v => ({ ...v, item: e.target.value })) : setForm(f => ({ ...f, item: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className="form-input" type="date" value={editEntry ? editEntry.date : form.date} onChange={e => editEntry ? setEditEntry(v => ({ ...v, date: e.target.value })) : setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Provider / Platform</label>
                <input className="form-input" placeholder="e.g. Microsoft Learn, Udemy" value={editEntry ? editEntry.provider : form.provider} onChange={e => editEntry ? setEditEntry(v => ({ ...v, provider: e.target.value })) : setForm(f => ({ ...f, provider: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={editEntry ? editEntry.category : form.category} onChange={e => editEntry ? setEditEntry(v => ({ ...v, category: e.target.value })) : setForm(f => ({ ...f, category: e.target.value }))}>
                  {INVESTMENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount<span>*</span></label>
                <input className="form-input" type="number" min="0" value={editEntry ? editEntry.amount : form.amount} onChange={e => editEntry ? setEditEntry(v => ({ ...v, amount: e.target.value })) : setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={editEntry ? editEntry.currency : form.currency} onChange={e => editEntry ? setEditEntry(v => ({ ...v, currency: e.target.value })) : setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editEntry ? editEntry.status : form.status} onChange={e => editEntry ? setEditEntry(v => ({ ...v, status: e.target.value })) : setForm(f => ({ ...f, status: e.target.value }))}>
                {INVESTMENT_STATUSES.map(s => <option key={s} value={s}>{INVESTMENT_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={editEntry ? editEntry.notes : form.notes} onChange={e => editEntry ? setEditEntry(v => ({ ...v, notes: e.target.value })) : setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="submit" className="btn btn-primary">{editEntry ? 'Save Changes' : 'Log Investment'}</button>
              {editEntry && <button type="button" className="btn btn-ghost" onClick={() => { setEditEntry(null); setError('') }}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Spend by Category</div>
          <SimpleBars data={byCategory.map(c => ({ label: c.category, value: c.total, color: 'var(--amber)' }))} formatValue={v => `${fmt(v)} DOP eq.`} />
        </div>
      </div>

      {investments.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Item</th><th>Provider</th><th>Category</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {investments.map(i => (
                <tr key={i.id}>
                  <td>{formatDate(i.date)}</td>
                  <td className="font-bold">{i.item}</td>
                  <td className="text-muted">{i.provider || '—'}</td>
                  <td>{i.category}</td>
                  <td>{fmt(i.amount)} {i.currency}</td>
                  <td><span className={`badge ${INVESTMENT_STATUS_BADGE[i.status]}`}>{INVESTMENT_STATUS_LABEL[i.status]}</span></td>
                  <td style={{ display: 'flex', gap: '.3rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditEntry(i); setError('') }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete "${i.item}"?`) && dispatch({ type: 'DELETE_INVESTMENT', payload: i.id })}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Prop Firms ─────────────────────────────────────────────────────────────────
const PROP_FIRM_STATUSES = ['evaluating', 'passed', 'funded', 'blown']
const PROP_FIRM_STATUS_LABEL = { evaluating: 'Evaluating', passed: 'Passed Eval', funded: 'Funded', blown: 'Blown' }
const PROP_FIRM_STATUS_BADGE = { evaluating: 'badge-grey', passed: 'badge-blue', funded: 'badge-green', blown: 'badge-red' }

const BLANK_PROP_FIRM = { firm: '', accountSize: '', cost: '', currency: 'USD', dateBought: '', status: 'evaluating', payout: '', payoutDate: '', notes: '' }

function PropFirmsSection() {
  const { state, dispatch } = useApp()
  const today = todayISO()
  const [form, setForm] = useState({ ...BLANK_PROP_FIRM, dateBought: today })
  const [editEntry, setEditEntry] = useState(null)
  const [error, setError] = useState('')

  const rate = state.financeSettings?.usdToDopRate || 60
  const toDOP = (currency, amount) => currency === 'USD' ? amount * rate : amount

  const accounts = [...(state.propFirmAccounts || [])].sort((a, b) => b.dateBought.localeCompare(a.dateBought))
  const totalSpent = accounts.reduce((s, a) => s + toDOP(a.currency, a.cost), 0)
  const totalPayout = accounts.reduce((s, a) => s + toDOP(a.currency, a.payout || 0), 0)
  const netPL = totalPayout - totalSpent
  const decided = accounts.filter(a => a.status === 'passed' || a.status === 'funded' || a.status === 'blown')
  const winRate = decided.length ? Math.round((accounts.filter(a => a.status === 'passed' || a.status === 'funded').length / decided.length) * 100) : null

  const byFirm = useMemo(() => {
    const map = {}
    accounts.forEach(a => {
      map[a.firm] = map[a.firm] || { spent: 0, payout: 0 }
      map[a.firm].spent += toDOP(a.currency, a.cost)
      map[a.firm].payout += toDOP(a.currency, a.payout || 0)
    })
    return Object.entries(map).map(([firm, v]) => ({ firm, ...v })).sort((a, b) => b.spent - a.spent)
  }, [accounts, rate])

  function validate(f) {
    if (!f.firm.trim()) return 'Firm name is required'
    if (!f.dateBought) return 'Purchase date is required'
    if (!f.cost || isNaN(+f.cost) || +f.cost < 0) return 'Enter a valid cost'
    return ''
  }

  function submitNew(ev) {
    ev.preventDefault()
    const err = validate(form)
    if (err) { setError(err); return }
    dispatch({ type: 'ADD_PROP_FIRM', payload: { ...form, cost: +form.cost, accountSize: +form.accountSize || 0, payout: +form.payout || 0 } })
    setForm({ ...BLANK_PROP_FIRM, dateBought: today })
    setError('')
  }

  function submitEdit(ev) {
    ev.preventDefault()
    const err = validate(editEntry)
    if (err) { setError(err); return }
    dispatch({ type: 'UPDATE_PROP_FIRM', payload: { ...editEntry, cost: +editEntry.cost, accountSize: +editEntry.accountSize || 0, payout: +editEntry.payout || 0 } })
    setEditEntry(null)
    setError('')
  }

  const f = editEntry || form
  const setF = (patch) => editEntry ? setEditEntry(v => ({ ...v, ...patch })) : setForm(v => ({ ...v, ...patch }))

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Prop Firms</div>
      </div>

      <div className="grid-4" style={{ marginBottom: '1rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">💸 Total Spent</div>
          <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{fmt(totalSpent)} DOP eq.</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">💰 Total Payout</div>
          <div className="kpi-value" style={{ fontSize: '1.1rem', color: 'var(--green)' }}>{fmt(totalPayout)} DOP eq.</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">📊 Net P/L</div>
          <div className="kpi-value" style={{ fontSize: '1.1rem', color: netPL >= 0 ? 'var(--green)' : 'var(--red)' }}>{netPL >= 0 ? '+' : ''}{fmt(netPL)} DOP eq.</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">🎯 Win Rate</div>
          <div className="kpi-value" style={{ fontSize: '1.1rem' }}>{winRate === null ? '—' : `${winRate}%`}</div>
          <div className="kpi-sub">{decided.length} decided / {accounts.length} total</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">{editEntry ? `Edit — ${editEntry.firm}` : 'Log a Prop Firm Account'}</div>
          <form onSubmit={editEntry ? submitEdit : submitNew} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Firm<span>*</span></label>
                <input className="form-input" placeholder="e.g. FTMO" value={f.firm} onChange={e => setF({ firm: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Size</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 100000" value={f.accountSize} onChange={e => setF({ accountSize: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cost Paid<span>*</span></label>
                <input className="form-input" type="number" min="0" value={f.cost} onChange={e => setF({ cost: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={f.currency} onChange={e => setF({ currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date Purchased<span>*</span></label>
                <input className="form-input" type="date" value={f.dateBought} onChange={e => setF({ dateBought: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={f.status} onChange={e => setF({ status: e.target.value })}>
                  {PROP_FIRM_STATUSES.map(s => <option key={s} value={s}>{PROP_FIRM_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Payout Received</label>
                <input className="form-input" type="number" min="0" placeholder="0" value={f.payout} onChange={e => setF({ payout: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payout Date</label>
                <input className="form-input" type="date" value={f.payoutDate} onChange={e => setF({ payoutDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={f.notes} onChange={e => setF({ notes: e.target.value })} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="submit" className="btn btn-primary">{editEntry ? 'Save Changes' : 'Log Account'}</button>
              {editEntry && <button type="button" className="btn btn-ghost" onClick={() => { setEditEntry(null); setError('') }}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Spend vs. Payout by Firm</div>
          {byFirm.length === 0 ? <div className="text-xs text-muted">No accounts logged yet.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {byFirm.map(row => (
                <div key={row.firm}>
                  <div className="font-bold text-sm" style={{ marginBottom: '.3rem' }}>{row.firm}</div>
                  <SimpleBars
                    data={[
                      { label: 'Spent', value: row.spent, color: 'var(--red)' },
                      { label: 'Payout', value: row.payout, color: 'var(--green)' },
                    ]}
                    formatValue={v => `${fmt(v)} DOP eq.`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Firm</th><th>Size</th><th>Cost</th><th>Status</th><th>Payout</th><th>Net</th><th></th></tr></thead>
            <tbody>
              {accounts.map(a => {
                const net = toDOP(a.currency, a.payout || 0) - toDOP(a.currency, a.cost)
                return (
                  <tr key={a.id}>
                    <td>{formatDate(a.dateBought)}</td>
                    <td className="font-bold">{a.firm}</td>
                    <td className="text-muted">{a.accountSize ? fmt(a.accountSize) : '—'}</td>
                    <td>{fmt(a.cost)} {a.currency}</td>
                    <td><span className={`badge ${PROP_FIRM_STATUS_BADGE[a.status]}`}>{PROP_FIRM_STATUS_LABEL[a.status]}</span></td>
                    <td className="text-green">{a.payout ? `${fmt(a.payout)} ${a.currency}` : '—'}</td>
                    <td className={net >= 0 ? 'text-green' : 'text-red'}>{net >= 0 ? '+' : ''}{fmt(net)}</td>
                    <td style={{ display: 'flex', gap: '.3rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditEntry(a); setError('') }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete "${a.firm}" account?`) && dispatch({ type: 'DELETE_PROP_FIRM', payload: a.id })}>✕</button>
                    </td>
                  </tr>
                )
              })}
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
        {[['spending','💸 Spending'], ['debt','Debt Snowball'], ['investing','📚 Investing'], ['propfirms','🎯 Prop Firms'], ['income','Income'], ['giving','Giving']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'spending'  && <SpendingSection />}
      {tab === 'debt'      && <DebtSection />}
      {tab === 'investing' && <InvestingSection />}
      {tab === 'propfirms' && <PropFirmsSection />}
      {tab === 'income'    && <IncomeSection />}
      {tab === 'giving'    && <GivingSection />}
    </div>
  )
}
