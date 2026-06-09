import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate } from '../utils/dateUtils.js'
import { EVAL_ACCOUNT_STATUSES, FIRM_PRESETS, accountSizeDefaults } from '../data/initialData.js'

const INSTRUMENTS = ['ES (S&P 500)', 'NQ (Nasdaq)', 'YM (Dow)', 'CL (Crude Oil)', 'GC (Gold)', 'Other']
const SETUPS = ['Trend pullback', 'Breakout with volume', 'Opening range break', 'Support/Resistance', 'Other']
const FIRMS = Object.keys(FIRM_PRESETS)
const ACCOUNT_SIZES = [25000, 50000, 100000]

function fmt(n, dec = 2) { return n != null ? n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—' }

function statusBadgeClass(s) {
  return s === 'passed' ? 'badge-green' : s === 'in_progress' ? 'badge-blue' : s === 'failed' ? 'badge-red' : s === 'reset' ? 'badge-amber' : 'badge-grey'
}
function statusLabel(s) {
  return s === 'not_started' ? 'Not Started' : s === 'in_progress' ? 'In Progress' : s === 'passed' ? '✓ Passed' : s === 'failed' ? 'Failed' : s === 'reset' ? 'Reset' : s
}

// ── Blank account form helper ─────────────────────────────────────────────────
function blankAccount(firm = 'Lucid Trading', size = 50000) {
  const defaults = accountSizeDefaults(size)
  return {
    firm, label: '', accountSize: size, status: 'not_started',
    startDate: '', targetPassDate: '2026-07-31',
    profitTarget: defaults.profitTarget,
    dailyLossLimit: defaults.dailyLossLimit,
    totalDrawdownLimit: defaults.totalDrawdownLimit,
    currentProfit: 0, daysTraded: 0, minTradingDays: 5, notes: ''
  }
}

// ── Per-account stats derived from trade logs ─────────────────────────────────
function useAccountStats(accountId, trades) {
  return useMemo(() => {
    const accountTrades = trades.filter(t => t.accountId === accountId)
    const currentProfit = accountTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    const daysTraded    = new Set(accountTrades.map(t => t.date)).size
    const tradeCount    = accountTrades.length
    const wins          = accountTrades.filter(t => t.pnl > 0).length
    const losses        = accountTrades.filter(t => t.pnl < 0).length
    return { currentProfit, daysTraded, tradeCount, wins, losses }
  }, [accountId, trades])
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, trades, onEdit, onDelete }) {
  const stats      = useAccountStats(account.id, trades)
  const profitPct  = account.profitTarget ? Math.min(100, Math.round((stats.currentProfit / account.profitTarget) * 100)) : 0
  const daysPct    = account.minTradingDays ? Math.min(100, Math.round((stats.daysTraded / account.minTradingDays) * 100)) : 0
  const riskPerTrade = (account.accountSize * 0.01).toLocaleString(undefined, { maximumFractionDigits: 0 })
  const firmColor  = account.firm === 'Lucid Trading' ? 'var(--blue)' : account.firm === 'TradeIfy' ? 'var(--green)' : account.firm === 'TopStep' ? 'var(--purple)' : 'var(--amber)'
  const winRate    = stats.tradeCount > 0 ? Math.round((stats.wins / stats.tradeCount) * 100) : null

  return (
    <div className="card" style={{ borderTop: `3px solid ${firmColor}` }}>
      <div className="card-header">
        <div>
          <div style={{ fontSize: '.7rem', fontWeight: 700, color: firmColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>{account.firm}</div>
          <div className="font-bold">{account.label || account.firm + ' #?'}</div>
          <div className="text-xs text-muted">${(account.accountSize / 1000).toFixed(0)}k account</div>
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'flex-start' }}>
          <span className={`badge ${statusBadgeClass(account.status)}`}>{statusLabel(account.status)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(account)} title="Edit">✏️</button>
          <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete ${account.label || account.firm}? This cannot be undone.`) && onDelete(account.id)} title="Delete">✕</button>
        </div>
      </div>

      {/* Profit progress — live from trade logs */}
      <div style={{ marginTop: '.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.15rem' }}>
          <span className="text-muted">Profit (from logs)</span>
          <span className={stats.currentProfit >= account.profitTarget ? 'text-green font-bold' : stats.currentProfit < 0 ? 'text-red' : ''}>
            {stats.currentProfit >= 0 ? '+' : ''}${fmt(stats.currentProfit, 2)} / ${fmt(account.profitTarget, 0)}
          </span>
        </div>
        <div className="progress-bar">
          <div className={`progress-fill ${stats.currentProfit < 0 ? 'progress-fill-red' : 'progress-fill-green'}`} style={{ width: `${Math.abs(profitPct)}%` }} />
        </div>
      </div>

      {/* Days traded — live from trade logs */}
      <div style={{ marginTop: '.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.15rem' }}>
          <span className="text-muted">Days traded (from logs)</span>
          <span className={stats.daysTraded >= account.minTradingDays ? 'text-green' : ''}>{stats.daysTraded} / {account.minTradingDays} min</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill progress-fill-blue" style={{ width: `${daysPct}%` }} />
        </div>
      </div>

      {/* Trade stats */}
      {stats.tradeCount > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem', fontSize: '.75rem' }}>
          <span className="text-muted">{stats.tradeCount} trades</span>
          <span className="text-green">{stats.wins}W</span>
          <span className="text-red">{stats.losses}L</span>
          {winRate !== null && <span className={winRate >= 50 ? 'text-green' : 'text-amber'}>{winRate}% win rate</span>}
        </div>
      )}
      {stats.tradeCount === 0 && (
        <div className="text-xs text-muted" style={{ marginTop: '.4rem' }}>No trades logged yet — log trades and tag this account</div>
      )}

      {/* Risk rules summary */}
      <div style={{ display: 'flex', gap: '.4rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
        <span className="badge badge-red" title="Max daily loss">DD ${fmt(account.dailyLossLimit, 0)}/day</span>
        <span className="badge badge-amber" title="Max risk per trade">Risk ${riskPerTrade}/trade</span>
        {account.targetPassDate && <span className="badge badge-grey" title="Target pass date">By {formatDate(account.targetPassDate)}</span>}
      </div>

      {account.notes && <div className="text-xs text-muted" style={{ marginTop: '.4rem' }}>{account.notes}</div>}
    </div>
  )
}

// ── Account Form Modal ────────────────────────────────────────────────────────
function AccountModal({ initial, onSave, onClose, title }) {
  const [form, setForm] = useState(initial)

  function handleFirmChange(firm) {
    const preset = FIRM_PRESETS[firm]?.[0]
    if (preset) {
      setForm(f => ({
        ...f, firm,
        accountSize: preset.accountSize,
        profitTarget: preset.profitTarget,
        dailyLossLimit: preset.dailyLossLimit,
        totalDrawdownLimit: preset.totalDrawdownLimit,
      }))
    } else {
      setForm(f => ({ ...f, firm }))
    }
  }

  function handleSizeChange(size) {
    const defaults = accountSizeDefaults(+size)
    setForm(f => ({
      ...f, accountSize: +size,
      profitTarget: defaults.profitTarget,
      dailyLossLimit: defaults.dailyLossLimit,
      totalDrawdownLimit: defaults.totalDrawdownLimit,
    }))
  }

  function submit(ev) {
    ev.preventDefault()
    onSave({
      ...form,
      accountSize: +form.accountSize,
      profitTarget: +form.profitTarget,
      dailyLossLimit: +form.dailyLossLimit,
      totalDrawdownLimit: +form.totalDrawdownLimit,
      minTradingDays: +form.minTradingDays || 5,
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <form onSubmit={submit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Firm</label>
              <select className="form-select" value={form.firm} onChange={e => handleFirmChange(e.target.value)}>
                {FIRMS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Label (e.g. "Lucid #2")<span>*</span></label>
              <input className="form-input" type="text" required placeholder="e.g. Lucid #1" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Size</label>
              <select className="form-select" value={form.accountSize} onChange={e => handleSizeChange(e.target.value)}>
                {ACCOUNT_SIZES.map(s => <option key={s} value={s}>${(s/1000).toFixed(0)}k</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {EVAL_ACCOUNT_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Profit Target ($)</label>
              <input className="form-input" type="number" min="0" value={form.profitTarget} onChange={e => setForm(f => ({ ...f, profitTarget: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Daily Loss Limit ($)</label>
              <input className="form-input" type="number" min="0" value={form.dailyLossLimit} onChange={e => setForm(f => ({ ...f, dailyLossLimit: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Drawdown Limit ($)</label>
              <input className="form-input" type="number" min="0" value={form.totalDrawdownLimit} onChange={e => setForm(f => ({ ...f, totalDrawdownLimit: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Trading Days</label>
              <input className="form-input" type="number" min="1" max="30" value={form.minTradingDays} onChange={e => setForm(f => ({ ...f, minTradingDays: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.startDate || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Pass Date</label>
              <input className="form-input" type="date" value={form.targetPassDate || ''} onChange={e => setForm(f => ({ ...f, targetPassDate: e.target.value }))} />
            </div>
          </div>

          <div className="alert alert-info" style={{ fontSize: '.8rem' }}>
            <span>📊</span>
            <div>Profit and days traded are calculated automatically from your trade journal entries tagged to this account.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" type="text" placeholder="Optional notes about this account" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Account</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Eval Accounts Section ─────────────────────────────────────────────────────
function EvalStatus() {
  const { state, dispatch } = useApp()
  const accounts = state.evalAccounts || []
  const trades   = state.trades || []
  const [modalMode, setModalMode] = useState(null)
  const [showRoadmap, setShowRoadmap] = useState(false)

  const totalAccounts = accounts.length
  const passed = accounts.filter(a => a.status === 'passed').length
  const active  = accounts.filter(a => a.status === 'in_progress').length
  // Compute combined profit from ALL trades that are tagged to any eval account
  const totalProfit = useMemo(() =>
    trades.reduce((s, t) => s + (t.pnl || 0), 0)
  , [trades])

  function handleSave(formData) {
    if (modalMode === 'add') {
      dispatch({ type: 'ADD_EVAL_ACCOUNT', payload: formData })
    } else {
      dispatch({ type: 'UPDATE_EVAL_ACCOUNT', payload: { id: modalMode.id, ...formData } })
    }
    setModalMode(null)
  }

  // Group by firm for display
  const byFirm = accounts.reduce((acc, a) => {
    acc[a.firm] = acc[a.firm] || []
    acc[a.firm].push(a)
    return acc
  }, {})

  return (
    <div>
      {/* Summary strip */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Accounts', value: totalAccounts, color: 'var(--text-1)' },
              { label: 'Active',         value: active,        color: 'var(--blue)'  },
              { label: 'Passed',         value: passed,        color: 'var(--green)' },
              { label: 'Combined Profit',value: `$${fmt(totalProfit)}`, color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(m => (
              <div key={m.label}>
                <div className="text-xs text-muted">{m.label}</div>
                <div className="font-bold" style={{ color: m.color, fontSize: '1.1rem' }}>{m.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRoadmap(v => !v)}>
              {showRoadmap ? 'Hide Roadmap' : '📅 2028 Roadmap'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setModalMode('add')}>+ Add Account</button>
          </div>
        </div>

        {showRoadmap && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="text-xs text-muted" style={{ marginBottom: '.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Account Roadmap (Target by 2028)</div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              {[
                { firm: 'Lucid Trading', target: 5, size: '$50k', color: 'var(--blue)',   current: accounts.filter(a => a.firm === 'Lucid Trading').length },
                { firm: 'TradeIfy',      target: 3, size: '$25k', color: 'var(--green)',  current: accounts.filter(a => a.firm === 'TradeIfy').length },
                { firm: 'TopStep',       target: 3, size: '$50k', color: 'var(--purple)', current: accounts.filter(a => a.firm === 'TopStep').length },
              ].map(r => (
                <div key={r.firm} style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '.6rem 1rem', minWidth: 160 }}>
                  <div style={{ color: r.color, fontWeight: 700, fontSize: '.8rem' }}>{r.firm}</div>
                  <div className="text-xs text-muted">{r.size} accounts</div>
                  <div style={{ display: 'flex', gap: '.25rem', marginTop: '.35rem', flexWrap: 'wrap' }}>
                    {Array.from({ length: r.target }, (_, i) => (
                      <div key={i} style={{ width: 20, height: 20, borderRadius: 3, background: i < r.current ? r.color : 'var(--bg-3)', border: `1px solid ${r.color}`, opacity: i < r.current ? 1 : 0.4 }} title={i < r.current ? 'Active' : 'Future'} />
                    ))}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: '.25rem' }}>{r.current}/{r.target} opened</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account cards grouped by firm */}
      {accounts.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No evaluation accounts yet. Click "+ Add Account" to add your first.</div>
        </div>
      ) : (
        Object.entries(byFirm).map(([firm, firmAccounts]) => (
          <div key={firm} style={{ marginBottom: '1rem' }}>
            <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.5rem' }}>{firm}</div>
            <div className="grid-3">
              {firmAccounts.map(a => (
                <AccountCard
                  key={a.id}
                  account={a}
                  trades={trades}
                  onEdit={setModalMode}
                  onDelete={id => dispatch({ type: 'DELETE_EVAL_ACCOUNT', payload: id })}
                />
              ))}
            </div>
          </div>
        ))
      )}

      <div className="alert alert-info" style={{ marginTop: '.5rem' }}>
        <span>📋</span>
        <div>Rules (all accounts): Max 1% risk per trade. Stop at daily loss limit. No revenge trading. No news-event trading. Target $200–$500/day per account.</div>
      </div>

      {/* Add / Edit modal */}
      {modalMode && (
        <AccountModal
          title={modalMode === 'add' ? 'Add New Eval Account' : `Edit — ${modalMode.label || modalMode.firm}`}
          initial={modalMode === 'add' ? blankAccount() : { ...modalMode }}
          onSave={handleSave}
          onClose={() => setModalMode(null)}
        />
      )}
    </div>
  )
}

// ── Daily Summary ─────────────────────────────────────────────────────────────
const BLANK_SUMMARY = { date: todayISO(), totalPnl: '', wins: '', losses: '', maxDrawdown: '', emotionalState: '7', notes: '' }

function DailySummarySection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState(BLANK_SUMMARY)
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (form.totalPnl === '' || isNaN(+form.totalPnl)) e.totalPnl = 'Enter P&L'
    return e
  }

  function submit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    const payload = {
      date: form.date, totalPnl: +form.totalPnl,
      wins: +form.wins || 0, losses: +form.losses || 0,
      maxDrawdown: +form.maxDrawdown || 0,
      emotionalState: +form.emotionalState || 7,
      notes: form.notes
    }
    if (editId) {
      dispatch({ type: 'UPSERT_DAILY_TRADING_SUMMARY', payload: { ...payload, id: editId } })
      setEditId(null)
    } else {
      dispatch({ type: 'UPSERT_DAILY_TRADING_SUMMARY', payload })
    }
    setForm(BLANK_SUMMARY)
    setErrors({})
  }

  function startEdit(s) {
    setEditId(s.id)
    setForm({ date: s.date, totalPnl: s.totalPnl, wins: s.wins, losses: s.losses, maxDrawdown: s.maxDrawdown, emotionalState: s.emotionalState, notes: s.notes || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(BLANK_SUMMARY)
    setErrors({})
  }

  const summaries = [...state.tradingDailySummaries].sort((a, b) => b.date.localeCompare(a.date))
  const last30 = summaries.slice(0, 30)
  const totalPnl = last30.reduce((s, d) => s + d.totalPnl, 0)
  const winDays  = last30.filter(d => d.totalPnl > 0).length
  const lossDays = last30.filter(d => d.totalPnl < 0).length
  const dayWinRate = last30.length > 0 ? Math.round((winDays / last30.length) * 100) : 0

  const chartData = last30.slice(0, 20).reverse()
  const pnls = chartData.map(d => d.totalPnl)
  const running = pnls.reduce((acc, v, i) => { acc.push((acc[i - 1] || 0) + v); return acc }, [])

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Daily P&L Summary</div>
        <div style={{ display: 'flex', gap: '.75rem', fontSize: '.8rem' }}>
          <span>30d P&L: <strong className={totalPnl >= 0 ? 'text-green' : 'text-red'}>{totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)}</strong></span>
          <span>Win days: <strong className="text-blue">{dayWinRate}%</strong></span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ borderColor: editId ? 'var(--amber)' : undefined }}>
          <div className="card-header">
            <div className="card-title" style={{ marginBottom: 0 }}>
              {editId ? `✏️ Editing — ${formatDate(form.date)}` : 'Log Daily Summary (after market close)'}
            </div>
            {editId && <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>}
          </div>
          <form onSubmit={submit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} disabled={!!editId} />
              </div>
              <div className="form-group">
                <label className="form-label">Total P&L ($)<span>*</span></label>
                <input className={`form-input ${errors.totalPnl ? 'error' : ''}`} type="number" step="0.01" placeholder="+350 or -800" value={form.totalPnl} onChange={e => setForm(f => ({ ...f, totalPnl: e.target.value }))} />
                {errors.totalPnl && <div className="form-error">{errors.totalPnl}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Wins</label>
                <input className="form-input" type="number" min="0" value={form.wins} onChange={e => setForm(f => ({ ...f, wins: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Losses</label>
                <input className="form-input" type="number" min="0" value={form.losses} onChange={e => setForm(f => ({ ...f, losses: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Max Drawdown ($)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.maxDrawdown} onChange={e => setForm(f => ({ ...f, maxDrawdown: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Emotional State (1–10)</label>
                <input className="form-input" type="number" min="1" max="10" value={form.emotionalState} onChange={e => setForm(f => ({ ...f, emotionalState: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lesson learned today</label>
              <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className={`btn ${editId ? 'btn-green' : 'btn-primary'}`}>
              {editId ? '✓ Save Changes' : 'Log Day'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Cumulative P&L (last 20 days)</div>
          {running.length >= 2 ? (
            <div className="chart-wrap">
              {(() => {
                const w = 380, h = 90, pad = { l: 40, r: 10, t: 10, b: 20 }
                const allVals = [...running, 0]
                const minV = Math.min(...allVals)
                const maxV = Math.max(...allVals)
                const range = maxV - minV || 1
                const scaleX = i => pad.l + (i / (running.length - 1)) * (w - pad.l - pad.r)
                const scaleY = v => pad.t + (1 - (v - minV) / range) * (h - pad.t - pad.b)
                const path = running.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`).join(' ')
                const zeroY = scaleY(0)
                const lastColor = running[running.length - 1] >= 0 ? 'var(--green)' : 'var(--red)'
                return (
                  <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 90 }}>
                    <line x1={pad.l} y1={zeroY} x2={w - pad.r} y2={zeroY} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={pad.l - 3} y={zeroY + 4} textAnchor="end" style={{ fill: 'var(--text-3)', fontSize: 9 }}>0</text>
                    <path d={path} fill="none" stroke={lastColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={scaleX(running.length - 1)} cy={scaleY(running[running.length - 1])} r="3" fill={lastColor} />
                  </svg>
                )
              })()}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-text">Log daily summaries to see P&L chart</div></div>
          )}
          <div className="grid-4" style={{ marginTop: '.5rem' }}>
            {[
              { label: 'Total P&L', value: `$${fmt(totalPnl)}`, color: totalPnl >= 0 ? 'text-green' : 'text-red' },
              { label: 'Win Days',  value: `${winDays}`,        color: 'text-green' },
              { label: 'Loss Days', value: `${lossDays}`,       color: 'text-red' },
              { label: 'Day Win%',  value: `${dayWinRate}%`,    color: dayWinRate >= 50 ? 'text-green' : 'text-amber' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div className="text-xs text-muted">{m.label}</div>
                <div className={`font-bold ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {summaries.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>P&L</th><th>W/L</th><th>Max DD</th><th>Emotion</th><th>Lesson</th><th></th></tr></thead>
            <tbody>
              {summaries.slice(0, 20).map(s => (
                <tr key={s.id} style={{ background: editId === s.id ? 'var(--amber-dim)' : undefined }}>
                  <td>{formatDate(s.date)}</td>
                  <td className={s.totalPnl >= 200 ? 'text-green font-bold' : s.totalPnl < 0 ? 'text-red' : ''}>{s.totalPnl >= 0 ? '+' : ''}${fmt(s.totalPnl)}</td>
                  <td>{s.wins}W / {s.losses}L</td>
                  <td className={s.maxDrawdown > 1500 ? 'text-red' : 'text-muted'}>${fmt(s.maxDrawdown)}</td>
                  <td><span style={{ color: s.emotionalState >= 7 ? 'var(--green)' : s.emotionalState >= 5 ? 'var(--amber)' : 'var(--red)' }}>{s.emotionalState}/10</span></td>
                  <td className="text-muted truncate" style={{ maxWidth: 180 }}>{s.notes || '—'}</td>
                  <td>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this summary?') && dispatch({ type: 'DELETE_DAILY_TRADING_SUMMARY', payload: s.id })}>✕</button>
                    </div>
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

// ── Shared trade form fields ──────────────────────────────────────────────────
function TradeFormFields({ form, setForm, errors, accounts = [] }) {
  return (
    <>
      {/* Account selector — always first */}
      <div className="form-group">
        <label className="form-label">Account<span>*</span></label>
        <select
          className={`form-select ${errors.accountId ? 'error' : ''}`}
          value={form.accountId || ''}
          onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
        >
          <option value="">— Select account —</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>
              {a.label || a.firm} · {a.firm} · ${(a.accountSize / 1000).toFixed(0)}k
            </option>
          ))}
          <option value="__unassigned__">Unassigned / Other</option>
        </select>
        {errors.accountId && <div className="form-error">{errors.accountId}</div>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Instrument</label>
          <select className="form-select" value={form.instrument} onChange={e => setForm(f => ({ ...f, instrument: e.target.value }))}>
            {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Direction</label>
          <select className="form-select" value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
            <option>Long</option><option>Short</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input className="form-input" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Entry<span>*</span></label>
          <input className={`form-input ${errors.entry ? 'error' : ''}`} type="number" step="0.01" placeholder="e.g. 5200.00" value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))} />
          {errors.entry && <div className="form-error">{errors.entry}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Stop Loss<span>*</span></label>
          <input className={`form-input ${errors.stop ? 'error' : ''}`} type="number" step="0.01" placeholder="e.g. 5195.00" value={form.stop} onChange={e => setForm(f => ({ ...f, stop: e.target.value }))} />
          {errors.stop && <div className="form-error">{errors.stop}</div>}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Exit<span>*</span></label>
          <input className={`form-input ${errors.exit ? 'error' : ''}`} type="number" step="0.01" placeholder="e.g. 5210.00" value={form.exit} onChange={e => setForm(f => ({ ...f, exit: e.target.value }))} />
          {errors.exit && <div className="form-error">{errors.exit}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">P&L ($)<span>*</span></label>
          <input className={`form-input ${errors.pnl ? 'error' : ''}`} type="number" step="0.01" placeholder="+500 or -300" value={form.pnl} onChange={e => setForm(f => ({ ...f, pnl: e.target.value }))} />
          {errors.pnl && <div className="form-error">{errors.pnl}</div>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Setup Type</label>
        <select className="form-select" value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))}>
          {SETUPS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label className="form-checkbox-row">
          <input type="checkbox" checked={form.setupFollowed} onChange={e => setForm(f => ({ ...f, setupFollowed: e.target.checked }))} />
          <span>Pre-planned setup</span>
        </label>
        <label className="form-checkbox-row">
          <input type="checkbox" checked={form.ruleViolation} onChange={e => setForm(f => ({ ...f, ruleViolation: e.target.checked }))} />
          <span className="text-red">Rule violation</span>
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">Lesson learned</label>
        <input className="form-input" type="text" placeholder="Today I learned..." value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))} />
      </div>
    </>
  )
}

const BLANK_TRADE = { accountId: '', date: todayISO(), instrument: 'ES (S&P 500)', direction: 'Long', entry: '', exit: '', stop: '', quantity: '1', pnl: '', setup: 'Trend pullback', setupFollowed: true, ruleViolation: false, lesson: '' }

// ── Trade Journal ─────────────────────────────────────────────────────────────
function TradeJournalSection() {
  const { state, dispatch } = useApp()
  const accounts = state.evalAccounts || []
  // Default accountId to the first in_progress account (or first account overall)
  const defaultAccountId = (accounts.find(a => a.status === 'in_progress') || accounts[0])?.id || ''
  const [form, setForm] = useState({ ...BLANK_TRADE, accountId: defaultAccountId })
  const [errors, setErrors] = useState({})
  const [editTrade, setEditTrade] = useState(null)
  const [filterAccountId, setFilterAccountId] = useState('all')

  function validate(f) {
    const e = {}
    if (!f.accountId) e.accountId = 'Select an account'
    if (!f.entry || isNaN(+f.entry)) e.entry = 'Required'
    if (!f.exit  || isNaN(+f.exit))  e.exit  = 'Required'
    if (!f.stop  || isNaN(+f.stop))  e.stop  = 'Required'
    if (!f.pnl   || isNaN(+f.pnl))   e.pnl   = 'Required'
    return e
  }

  function buildPayload(f) {
    return {
      accountId: f.accountId,
      date: f.date, instrument: f.instrument, direction: f.direction,
      entry: +f.entry, exit: +f.exit, stop: +f.stop, quantity: +f.quantity || 1,
      pnl: +f.pnl, setup: f.setup, setupFollowed: f.setupFollowed,
      ruleViolation: f.ruleViolation, lesson: f.lesson
    }
  }

  function submitNew(ev) {
    ev.preventDefault()
    const e = validate(form)
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'ADD_TRADE', payload: buildPayload(form) })
    // Keep accountId sticky — user is probably logging more trades for the same account
    setForm(f => ({ ...BLANK_TRADE, accountId: f.accountId, date: f.date }))
    setErrors({})
  }

  function openEdit(t) {
    setEditTrade({ ...t, entry: String(t.entry), exit: String(t.exit), stop: String(t.stop), quantity: String(t.quantity), pnl: String(t.pnl) })
  }

  function submitEdit(ev) {
    ev.preventDefault()
    const e = validate(editTrade)
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'UPDATE_TRADE', payload: { id: editTrade.id, ...buildPayload(editTrade) } })
    setEditTrade(null)
    setErrors({})
  }

  // Helper: resolve account label from id
  function accountLabel(id) {
    if (!id || id === '__unassigned__') return <span className="badge badge-grey">—</span>
    const acc = accounts.find(a => a.id === id)
    if (!acc) return <span className="badge badge-grey text-xs">{id.slice(0, 8)}</span>
    const color = acc.firm === 'Lucid Trading' ? 'badge-blue' : acc.firm === 'TradeIfy' ? 'badge-green' : acc.firm === 'TopStep' ? 'badge-purple' : 'badge-grey'
    return <span className={`badge ${color}`}>{acc.label || acc.firm}</span>
  }

  const allTrades = [...state.trades].sort((a, b) => b.date.localeCompare(a.date))
  const trades = filterAccountId === 'all' ? allTrades : allTrades.filter(t => t.accountId === filterAccountId)
  const violations = allTrades.filter(t => t.ruleViolation).length

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Trade Journal</div>
        {violations > 0 && <span className="badge badge-red">⚠️ {violations} rule violation{violations > 1 ? 's' : ''}</span>}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Trade</div>
          {accounts.length === 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '.75rem' }}>
              <span>⚠️</span><div>No accounts added yet. Go to the <strong>Eval Accounts</strong> tab and add one first.</div>
            </div>
          )}
          <form onSubmit={submitNew} className="form">
            <TradeFormFields form={form} setForm={setForm} errors={errors} accounts={accounts} />
            <button type="submit" className="btn btn-primary">Log Trade</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Trading Rules (Non-Negotiable)</div>
          <div className="checklist">
            {[
              '✓ Max loss per trade: 1% of account ($500)',
              '✓ Max daily loss: 2% ($1,000) — stop immediately',
              '✓ After 3 consecutive losses: stop 2 hours',
              '✓ No revenge trading — never add to losing position',
              '✓ No trading during high-impact news (red folders)',
              '✓ Daily profit target: $200–$500 — then stop or scale down',
              '✓ Journal every trade within 1 hour of close',
              '✓ Position size: calculated every single time',
            ].map(rule => (
              <div key={rule} className="check-item" style={{ cursor: 'default' }}>
                <span className="text-green">●</span>
                <span className="check-label text-sm">{rule}</span>
              </div>
            ))}
          </div>
          {violations > 0 && (
            <div className="alert alert-danger" style={{ marginTop: '.75rem' }}>
              <span>⚠️</span>
              <div>{violations} rule violation(s) logged. Review and log in Decision Log if strategy change needed.</div>
            </div>
          )}
        </div>
      </div>

      {allTrades.length > 0 && (
        <>
          {/* Account filter */}
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            <span className="text-xs text-muted">Filter by account:</span>
            <button className={`btn btn-sm ${filterAccountId === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterAccountId('all')}>
              All ({allTrades.length})
            </button>
            {accounts.map(a => {
              const count = allTrades.filter(t => t.accountId === a.id).length
              return (
                <button key={a.id} className={`btn btn-sm ${filterAccountId === a.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterAccountId(a.id)}>
                  {a.label || a.firm} ({count})
                </button>
              )
            })}
            {allTrades.some(t => !t.accountId || t.accountId === '__unassigned__') && (
              <button className={`btn btn-sm ${filterAccountId === '__unassigned__' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterAccountId('__unassigned__')}>
                Unassigned ({allTrades.filter(t => !t.accountId || t.accountId === '__unassigned__').length})
              </button>
            )}
          </div>

          <div className="table-wrap" style={{ marginTop: '.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Account</th><th>Date</th><th>Instrument</th><th>Dir</th><th>Entry</th>
                  <th>Exit</th><th>Stop</th><th>Qty</th><th>P&L</th>
                  <th>Setup</th><th>Violation</th><th>Lesson</th><th></th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 50).map(t => (
                  <tr key={t.id}>
                    <td>{accountLabel(t.accountId)}</td>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.instrument}</td>
                    <td><span className={`badge ${t.direction === 'Long' ? 'badge-green' : 'badge-red'}`}>{t.direction}</span></td>
                    <td>{t.entry}</td>
                    <td>{t.exit}</td>
                    <td>{t.stop}</td>
                    <td>{t.quantity}</td>
                    <td className={t.pnl >= 0 ? 'text-green font-bold' : 'text-red font-bold'}>{t.pnl >= 0 ? '+' : ''}${fmt(t.pnl)}</td>
                    <td className="text-muted text-sm">{t.setup}</td>
                    <td>{t.ruleViolation ? <span className="badge badge-red">⚠️ Yes</span> : <span className="badge badge-grey">No</span>}</td>
                    <td className="text-muted truncate" style={{ maxWidth: 120 }}>{t.lesson || '—'}</td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this trade?') && dispatch({ type: 'DELETE_TRADE', payload: t.id })}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit Trade Modal */}
      {editTrade && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">✏️ Edit Trade — {formatDate(editTrade.date)}</div>
            <form onSubmit={submitEdit} className="form">
              <TradeFormFields form={editTrade} setForm={setEditTrade} errors={errors} accounts={accounts} />
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => { setEditTrade(null); setErrors({}) }}>Cancel</button>
                <button type="submit" className="btn btn-green">✓ Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Trading() {
  const [tab, setTab] = useState('eval')
  return (
    <div>
      <div className="page-header">
        <div className="page-title">📈 Trading Desk</div>
        <div className="page-subtitle">Lucid Trading $50k Eval · Max 2% daily loss · Max 1% per trade · Target $200–$500/day</div>
      </div>
      <div className="section"><EvalStatus /></div>
      <div className="tabs">
        {[['summary','Daily Summary'], ['journal','Trade Journal']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'summary' && <DailySummarySection />}
      {tab === 'journal' && <TradeJournalSection />}
    </div>
  )
}
