import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate, isMonday } from '../utils/dateUtils.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
function confirm(msg) { return window.confirm(msg) }

function useModal() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  return {
    open, data,
    show: (d = null) => { setData(d); setOpen(true) },
    hide: () => { setOpen(false); setData(null) }
  }
}

// ── Weight Chart ──────────────────────────────────────────────────────────────
function WeightChart({ log }) {
  const recent = log.slice(-20)
  if (recent.length < 2) return null
  const w = 500, h = 100, pad = { l: 30, r: 10, t: 10, b: 20 }
  const vals = recent.map(e => e.weight)
  const all = [...vals, 188, 197, 203]
  const minV = Math.min(...all) - 2
  const maxV = Math.max(...all) + 2
  const scaleX = (i) => pad.l + (i / (recent.length - 1)) * (w - pad.l - pad.r)
  const scaleY = (v) => pad.t + (1 - (v - minV) / (maxV - minV)) * (h - pad.t - pad.b)
  const path = recent.map((e, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(e.weight).toFixed(1)}`).join(' ')

  return (
    <div className="chart-wrap" style={{ marginTop: '.5rem' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 100 }}>
        {/* Target bands */}
        <rect x={pad.l} y={scaleY(195)} width={w - pad.l - pad.r} height={scaleY(188) - scaleY(195)} fill="#3fb95015" />
        <line x1={pad.l} y1={scaleY(197)} x2={w - pad.r} y2={scaleY(197)} stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="5,4" />
        <line x1={pad.l} y1={scaleY(188)} x2={w - pad.r} y2={scaleY(188)} stroke="var(--green)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1={pad.l} y1={scaleY(195)} x2={w - pad.r} y2={scaleY(195)} stroke="var(--green)" strokeWidth="1" strokeDasharray="3,3" />
        {/* Axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} className="axis-line" />
        {[188, 193, 197, 203].map(v => (
          <text key={v} x={pad.l - 3} y={scaleY(v) + 3} textAnchor="end" style={{ fill: 'var(--text-3)', fontSize: 10 }}>{v}</text>
        ))}
        {/* Line */}
        <path d={path} fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {recent.map((e, i) => (
          <circle key={e.id} cx={scaleX(i)} cy={scaleY(e.weight)} r="3" fill="var(--blue)" />
        ))}
        {/* Labels */}
        <text x={w - pad.r} y={scaleY(197) - 3} textAnchor="end" style={{ fill: 'var(--amber)', fontSize: 9 }}>197 Sprint1</text>
        <text x={w - pad.r} y={scaleY(188) - 3} textAnchor="end" style={{ fill: 'var(--green)', fontSize: 9 }}>188 Min</text>
      </svg>
    </div>
  )
}

// ── Weight Log ────────────────────────────────────────────────────────────────
function WeightSection() {
  const { state, dispatch } = useApp()
  const modal = useModal()
  const [form, setForm] = useState({ date: todayISO(), weight: '', notes: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.weight || isNaN(+form.weight) || +form.weight < 50 || +form.weight > 500) e.weight = '50–500 lb'
    return e
  }

  function submit(e) {
    e.preventDefault()
    const e_ = validate()
    if (Object.keys(e_).length) { setErrors(e_); return }
    dispatch({ type: 'LOG_WEIGHT', payload: { date: form.date, weight: +form.weight, notes: form.notes } })
    setForm({ date: todayISO(), weight: '', notes: '' })
    setErrors({})
  }

  const sorted = [...state.weightLog].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Weight Log</div>
        {latest && <span className="text-sm text-muted">Latest: <strong className="text-blue">{latest.weight} lb</strong> on {formatDate(latest.date)}</span>}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Weight (Mondays preferred)</div>
          <form onSubmit={submit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Weight (lb)<span>*</span></label>
                <input className={`form-input ${errors.weight ? 'error' : ''}`} type="number" step="0.1" placeholder="e.g. 201.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                {errors.weight && <div className="form-error">{errors.weight}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" type="text" placeholder="Optional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Weight</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Trend (last 20 weigh-ins)</div>
          <WeightChart log={state.weightLog} />
          <div className="progress-labels" style={{ marginTop: '.5rem' }}>
            <span className="text-xs">Goal: 188–195 lb lean</span>
            <span className="text-xs text-amber">Sprint 1: ≤197 lb</span>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Weight (lb)</th><th>Change</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {sorted.slice(0, 20).map((entry, i) => {
                const prev = sorted[i + 1]
                const delta = prev ? entry.weight - prev.weight : null
                return (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td className="font-bold">{entry.weight}</td>
                    <td className={delta === null ? '' : delta < 0 ? 'text-green' : delta > 0 ? 'text-red' : 'text-muted'}>
                      {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
                    </td>
                    <td className="text-muted">{entry.notes || '—'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => confirm('Delete this weight entry?') && dispatch({ type: 'DELETE_WEIGHT', payload: entry.id })}>✕</button></td>
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

// ── Workout Log ────────────────────────────────────────────────────────────────
const WORKOUT_TYPES = ['Upper Strength', 'Lower Strength', 'Upper Hypertrophy', 'Lower Hypertrophy + Core', 'Full Body', 'Cardio', 'Active Recovery', 'Other']

function WorkoutSection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({ date: todayISO(), type: 'Upper Strength', completed: true, duration: 60, exercises: '', cardio: '', notes: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.type) e.type = 'Required'
    return e
  }

  function submit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'LOG_WORKOUT', payload: { ...form, duration: +form.duration || 0, completed: !!form.completed } })
    setForm(f => ({ ...f, date: todayISO(), duration: 60, exercises: '', cardio: '', notes: '' }))
    setErrors({})
  }

  const sorted = [...state.workoutLog].sort((a, b) => b.date.localeCompare(a.date))
  const last28 = state.workoutLog.filter(w => w.date >= new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10))
  const gymDays = last28.filter(w => w.completed && !['Active Recovery', 'Other'].includes(w.type)).length
  const compliancePct = Math.round((gymDays / (28 / 7 * 5)) * 100)

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Workout Log</div>
        <span className={`badge ${compliancePct >= 85 ? 'badge-green' : compliancePct >= 70 ? 'badge-amber' : 'badge-red'}`}>
          28d compliance: {compliancePct}%
        </span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Workout</div>
          <form onSubmit={submit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date<span>*</span></label>
                <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Type<span>*</span></label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (min)</label>
                <input className="form-input" type="number" min="0" max="300" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-checkbox-row" style={{ marginTop: '1.5rem' }}>
                  <input type="checkbox" checked={form.completed} onChange={e => setForm(f => ({ ...f, completed: e.target.checked }))} />
                  <span>Completed ✓</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Exercises (comma separated)</label>
              <input className="form-input" type="text" placeholder="Bench 185lb 3x8, Pullups BW 3x6, ..." value={form.exercises} onChange={e => setForm(f => ({ ...f, exercises: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cardio</label>
              <input className="form-input" type="text" placeholder="e.g. 15min incline walk" value={form.cardio} onChange={e => setForm(f => ({ ...f, cardio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Workout</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Gym Schedule (Wed–Sun)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {[
              ['Wednesday', 'Upper Strength', 'Bench, Pullups, OHP, Rows, Dips'],
              ['Thursday', 'Lower Strength', 'Squat, Deadlift, Leg Press, Curls, Calves'],
              ['Friday', 'Upper Hypertrophy', 'Incline DB, Lat Pulldown, Laterals, Triceps, Biceps'],
              ['Saturday', 'Lower Hypertrophy + Core', 'Goblet Squat, RDL, Lunges, Extensions, Leg Raises'],
              ['Sunday', 'Full Body / Cardio', '5–6 compound + 30min steady state'],
              ['Monday', 'Active Recovery', '30 min walk + stretching'],
              ['Tuesday', 'Active Recovery', 'Mobility / yoga'],
            ].map(([day, type, notes]) => (
              <div key={day} style={{ padding: '.4rem .6rem', background: 'var(--bg-2)', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="font-bold text-sm">{day}</span>
                  <span className="text-xs text-blue">{type}</span>
                </div>
                <div className="text-xs text-muted">{notes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>Status</th><th>Exercises</th><th></th></tr></thead>
            <tbody>
              {sorted.slice(0, 20).map(w => (
                <tr key={w.id}>
                  <td>{formatDate(w.date)}</td>
                  <td>{w.type}</td>
                  <td>{w.duration ? `${w.duration} min` : '—'}</td>
                  <td><span className={`badge ${w.completed ? 'badge-green' : 'badge-red'}`}>{w.completed ? '✓ Done' : 'Skipped'}</span></td>
                  <td className="text-muted truncate" style={{ maxWidth: 220 }}>{w.exercises || w.notes || '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => confirm('Delete workout?') && dispatch({ type: 'DELETE_WORKOUT', payload: w.id })}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Nutrition Log ─────────────────────────────────────────────────────────────
function NutritionSection() {
  const { state, dispatch } = useApp()
  const [form, setForm] = useState({ date: todayISO(), calories: '', protein: '', carbs: '', fats: '', water: '', tracked: true, notes: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (form.calories && (isNaN(+form.calories) || +form.calories < 0)) e.calories = 'Must be ≥ 0'
    if (form.protein  && (isNaN(+form.protein)  || +form.protein  < 0)) e.protein  = 'Must be ≥ 0'
    return e
  }

  function submit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'LOG_NUTRITION', payload: { date: form.date, calories: +form.calories || null, protein: +form.protein || null, carbs: +form.carbs || null, fats: +form.fats || null, water: +form.water || null, tracked: form.tracked, notes: form.notes } })
    setForm(f => ({ ...f, date: todayISO(), calories: '', protein: '', carbs: '', fats: '', water: '', notes: '' }))
    setErrors({})
  }

  const sorted = [...state.nutritionLog].sort((a, b) => b.date.localeCompare(a.date))
  const last7 = sorted.slice(0, 7)
  const avgProtein = last7.filter(n => n.protein).length ? (last7.filter(n => n.protein).reduce((s, n) => s + n.protein, 0) / last7.filter(n => n.protein).length).toFixed(0) : null
  const avgCal = last7.filter(n => n.calories).length ? (last7.filter(n => n.calories).reduce((s, n) => s + n.calories, 0) / last7.filter(n => n.calories).length).toFixed(0) : null

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Nutrition Tracking</div>
        <div style={{ display: 'flex', gap: '.75rem', fontSize: '.8rem' }}>
          {avgProtein && <span>7d avg protein: <strong className={+avgProtein >= 170 ? 'text-green' : 'text-amber'}>{avgProtein}g</strong></span>}
          {avgCal     && <span>7d avg cals: <strong className="text-blue">{avgCal}</strong></span>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Log Daily Nutrition</div>
          <form onSubmit={submit} className="form">
            <div className="form-group">
              <label className="form-label">Date<span>*</span></label>
              <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <div className="form-error">{errors.date}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Calories <span className="text-muted">(target: 2,200–2,400)</span></label>
                <input className={`form-input ${errors.calories ? 'error' : ''}`} type="number" min="0" placeholder="e.g. 2300" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
                {errors.calories && <div className="form-error">{errors.calories}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Protein (g) <span className="text-muted">(target: ≥170g)</span></label>
                <input className={`form-input ${errors.protein ? 'error' : ''}`} type="number" min="0" placeholder="e.g. 180" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
                {errors.protein && <div className="form-error">{errors.protein}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Carbs (g)</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 220" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fats (g)</label>
                <input className="form-input" type="number" min="0" placeholder="e.g. 65" value={form.fats} onChange={e => setForm(f => ({ ...f, fats: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Water (L) <span className="text-muted">(target: ≥3L)</span></label>
                <input className="form-input" type="number" min="0" step="0.1" placeholder="e.g. 3.0" value={form.water} onChange={e => setForm(f => ({ ...f, water: e.target.value }))} />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-checkbox-row" style={{ marginTop: '1.5rem' }}>
                  <input type="checkbox" checked={form.tracked} onChange={e => setForm(f => ({ ...f, tracked: e.target.checked }))} />
                  <span>All meals tracked</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" type="text" placeholder="Cheat meal, travel, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary">Log Nutrition</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Daily Targets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {[
              { label: 'Calories', target: '2,200–2,400', unit: 'kcal', value: sorted[0]?.calories, min: 2200, max: 2400 },
              { label: 'Protein',  target: '≥170g',       unit: 'g',    value: sorted[0]?.protein, min: 170, max: 250 },
              { label: 'Carbs',    target: '200–250g',    unit: 'g',    value: sorted[0]?.carbs,   min: 200, max: 250 },
              { label: 'Fats',     target: '50–70g',      unit: 'g',    value: sorted[0]?.fats,    min: 50,  max: 70  },
              { label: 'Water',    target: '≥3L',         unit: 'L',    value: sorted[0]?.water,   min: 3,   max: 5   },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.2rem' }}>
                  <span>{item.label}</span>
                  <span className="text-muted">Target: {item.target}</span>
                  {item.value != null && <span className={item.value >= item.min ? 'text-green' : 'text-amber'}>{item.value}{item.unit}</span>}
                </div>
                {item.value != null && (
                  <div className="progress-bar">
                    <div className={`progress-fill ${item.value >= item.min ? 'progress-fill-green' : 'progress-fill-amber'}`}
                      style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <span>📌</span>
            <div>Priority: Calories → Protein → Carbs/Fats</div>
          </div>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table>
            <thead><tr><th>Date</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fats</th><th>Water</th><th>Tracked</th><th></th></tr></thead>
            <tbody>
              {sorted.slice(0, 14).map(n => (
                <tr key={n.id}>
                  <td>{formatDate(n.date)}</td>
                  <td className={n.calories ? (n.calories >= 2200 && n.calories <= 2400 ? 'text-green' : 'text-amber') : 'text-muted'}>{n.calories ?? '—'}</td>
                  <td className={n.protein ? (n.protein >= 170 ? 'text-green' : 'text-amber') : 'text-muted'}>{n.protein ? `${n.protein}g` : '—'}</td>
                  <td className="text-muted">{n.carbs  ? `${n.carbs}g`  : '—'}</td>
                  <td className="text-muted">{n.fats   ? `${n.fats}g`   : '—'}</td>
                  <td className={n.water ? (n.water >= 3 ? 'text-green' : 'text-amber') : 'text-muted'}>{n.water ? `${n.water}L` : '—'}</td>
                  <td><span className={`badge ${n.tracked ? 'badge-green' : 'badge-grey'}`}>{n.tracked ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => confirm('Delete?') && dispatch({ type: 'DELETE_NUTRITION', payload: n.id })}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Health Page ──────────────────────────────────────────────────────────
export default function Health() {
  const [tab, setTab] = useState('weight')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💪 Body & Health</div>
        <div className="page-subtitle">Target: 188–195 lb lean · &lt;12% body fat · ≥85% workout compliance · ≥170g protein/day</div>
      </div>

      <div className="tabs">
        {[['weight', 'Weight Log'], ['workout', 'Workout Log'], ['nutrition', 'Nutrition']].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'weight'    && <WeightSection />}
      {tab === 'workout'   && <WorkoutSection />}
      {tab === 'nutrition' && <NutritionSection />}
    </div>
  )
}
