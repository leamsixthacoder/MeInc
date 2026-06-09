import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate } from '../utils/dateUtils.js'

const SESSION_TYPES = ['Listening', 'Speaking / Shadowing', 'Vocabulary', 'Reading + Writing', 'Mixed Review', 'BBC 6 Minute English', 'Podcast']

export default function Language() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('sessions')
  const [form, setForm] = useState({ date: todayISO(), type: 'Listening', durationMinutes: 30, newWords: '', notes: '' })
  const [tutorForm, setTutorForm] = useState({ date: todayISO(), tutor: '', feedback: '', corrections: '', notes: '' })
  const [errors, setErrors] = useState({})

  const sessions = [...state.languageSessions].sort((a, b) => b.date.localeCompare(a.date))
  const tutorSessions = [...state.tutorSessions].sort((a, b) => b.date.localeCompare(a.date))

  const totalHours = sessions.reduce((s, l) => s + (l.durationMinutes || 30) / 60, 0)
  const targetHours = 60
  const pct = Math.min(100, Math.round((totalHours / targetHours) * 100))
  const totalWords = sessions.reduce((s, l) => s + (+l.newWords || 0), 0)

  // Last 7 days compliance
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10)
  }).reverse()
  const sessionsByDate = Object.fromEntries(sessions.map(s => [s.date, s]))
  const last7Compliance = last7Dates.filter(d => sessionsByDate[d]).length

  function validateSession() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.durationMinutes || isNaN(+form.durationMinutes) || +form.durationMinutes <= 0) e.dur = 'Enter duration'
    return e
  }

  function submitSession(ev) {
    ev.preventDefault()
    const e = validateSession()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'LOG_LANGUAGE_SESSION', payload: { date: form.date, type: form.type, durationMinutes: +form.durationMinutes, newWords: +form.newWords || 0, notes: form.notes } })
    setForm(f => ({ ...f, date: todayISO(), newWords: '', notes: '' }))
    setErrors({})
  }

  function submitTutor(ev) {
    ev.preventDefault()
    dispatch({ type: 'LOG_TUTOR_SESSION', payload: { ...tutorForm } })
    setTutorForm({ date: todayISO(), tutor: '', feedback: '', corrections: '', notes: '' })
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🗣️ Mind & Language</div>
        <div className="page-subtitle">Target: B2 English by Dec 2026 · 60 hours study by Jul 31 · 1 tutor/week</div>
      </div>

      {/* KPI Row */}
      <div className="grid-4 section">
        <div className="kpi-card">
          <div className="kpi-label">Total Study Hours</div>
          <div className="kpi-value" style={{ color: totalHours >= targetHours ? 'var(--green)' : 'var(--text-1)' }}>{totalHours.toFixed(1)}</div>
          <div className="kpi-sub">Target: {targetHours} hrs by Jul 31</div>
          <div className="progress-bar" style={{ marginTop: '.3rem' }}><div className="progress-fill progress-fill-blue" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Words Learned</div>
          <div className="kpi-value">{totalWords}</div>
          <div className="kpi-sub">Target: ≥20/week</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Last 7d Sessions</div>
          <div className="kpi-value" style={{ color: last7Compliance >= 5 ? 'var(--green)' : last7Compliance >= 3 ? 'var(--amber)' : 'var(--red)' }}>{last7Compliance}/7</div>
          <div className="kpi-sub">Target: 5/week (weekdays)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tutor Sessions</div>
          <div className="kpi-value">{tutorSessions.length}</div>
          <div className="kpi-sub">Target: 1/week minimum</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>Study Sessions</button>
        <button className={`tab-btn ${tab === 'tutor' ? 'active' : ''}`} onClick={() => setTab('tutor')}>Tutor Sessions</button>
        <button className={`tab-btn ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>Weekly Plan</button>
      </div>

      {tab === 'sessions' && (
        <div className="section">
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Log Study Session</div>
              <form onSubmit={submitSession} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date<span>*</span></label>
                    <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration (min)<span>*</span></label>
                    <input className={`form-input ${errors.dur ? 'error' : ''}`} type="number" min="5" max="180" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
                    {errors.dur && <div className="form-error">{errors.dur}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Words Learned</label>
                    <input className="form-input" type="number" min="0" value={form.newWords} onChange={e => setForm(f => ({ ...f, newWords: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Difficulties</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary">Log Session</button>
              </form>
            </div>

            <div className="card">
              <div className="card-title">7-Day Compliance Streak</div>
              <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem' }}>
                {last7Dates.map(d => {
                  const done = !!sessionsByDate[d]
                  const isToday = d === todayISO()
                  return (
                    <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ width: '100%', height: 40, background: done ? 'var(--green)' : 'var(--bg-3)', borderRadius: 4, border: isToday ? '2px solid var(--blue)' : 'none' }} />
                      <div className="text-xs text-muted" style={{ marginTop: '.2rem' }}>{new Date(d + 'T12:00').toLocaleString('default', { weekday: 'narrow' })}</div>
                    </div>
                  )
                })}
              </div>

              <div className="card-title" style={{ marginTop: '.5rem' }}>Progress to 60 Hours</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: '.3rem' }}>
                <span>{totalHours.toFixed(1)} hrs done</span>
                <span className="text-muted">{Math.max(0, targetHours - totalHours).toFixed(1)} hrs remaining</span>
              </div>
              <div className="progress-bar" style={{ height: 12 }}>
                <div className="progress-fill progress-fill-blue" style={{ width: `${pct}%`, height: 12 }} />
              </div>
              <div className="form-hint" style={{ marginTop: '.3rem' }}>30 min/day × 5 days = 2.5 hrs/week → 60 hrs in 24 weeks</div>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Duration</th><th>New Words</th><th>Notes</th><th></th></tr></thead>
                <tbody>
                  {sessions.slice(0, 20).map(s => (
                    <tr key={s.id}>
                      <td>{formatDate(s.date)}</td>
                      <td>{s.type}</td>
                      <td>{s.durationMinutes} min</td>
                      <td>{s.newWords || '—'}</td>
                      <td className="text-muted truncate" style={{ maxWidth: 200 }}>{s.notes || '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && dispatch({ type: 'DELETE_LANGUAGE_SESSION', payload: s.id })}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'tutor' && (
        <div className="section">
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Log Tutor Session</div>
              <form onSubmit={submitTutor} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={tutorForm.date} onChange={e => setTutorForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tutor Name</label>
                    <input className="form-input" type="text" placeholder="e.g. Maria (Cambly)" value={tutorForm.tutor} onChange={e => setTutorForm(f => ({ ...f, tutor: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Topics Discussed</label>
                  <textarea className="form-textarea" rows={2} placeholder="What did you talk about?" value={tutorForm.feedback} onChange={e => setTutorForm(f => ({ ...f, feedback: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Grammar / Pronunciation Corrections</label>
                  <textarea className="form-textarea" rows={2} placeholder="e.g. Incorrect use of past perfect, pronunciation of 'thought'" value={tutorForm.corrections} onChange={e => setTutorForm(f => ({ ...f, corrections: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Key Takeaways</label>
                  <input className="form-input" type="text" value={tutorForm.notes} onChange={e => setTutorForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary">Log Tutor Session</button>
              </form>
            </div>

            <div className="card">
              <div className="card-title">Tutor Platforms</div>
              {[['Cambly', 'cambly.com', '$10–15/session', 'Native speakers, flexible schedule'],
                ['iTalki', 'italki.com', '$8–20/session', 'Community & professional tutors'],
                ['Preply', 'preply.com', '$15–25/session', 'Structured curriculum available']
              ].map(([name, url, price, note]) => (
                <div key={name} style={{ padding: '.5rem .7rem', background: 'var(--bg-2)', borderRadius: 4, marginBottom: '.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-bold text-sm">{name}</span>
                    <span className="text-xs text-green">{price}</span>
                  </div>
                  <div className="text-xs text-muted">{note}</div>
                </div>
              ))}
              <div className="alert alert-info" style={{ marginTop: '.75rem' }}>
                <span>💡</span>
                <div>Prepare 3 topics before each session. Ask tutor to correct grammar and pronunciation. Review corrections after.</div>
              </div>
            </div>
          </div>

          {tutorSessions.length > 0 && (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table>
                <thead><tr><th>Date</th><th>Tutor</th><th>Topics</th><th>Corrections</th><th></th></tr></thead>
                <tbody>
                  {tutorSessions.map(s => (
                    <tr key={s.id}>
                      <td>{formatDate(s.date)}</td>
                      <td>{s.tutor || '—'}</td>
                      <td className="text-muted truncate" style={{ maxWidth: 180 }}>{s.feedback || '—'}</td>
                      <td className="text-muted truncate" style={{ maxWidth: 180 }}>{s.corrections || '—'}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && dispatch({ type: 'DELETE_TUTOR_SESSION', payload: s.id })}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'plan' && (
        <div className="section">
          <div className="card">
            <div className="card-title">Weekly Study Plan (Mon–Fri)</div>
            {[
              { day: 'Monday',    focus: 'Listening + Vocabulary', task: 'BBC 6 Minute English + 5 new words' },
              { day: 'Tuesday',   focus: 'Speaking (Shadowing)',   task: 'Repeat after YouTube teacher (English with Lucy)' },
              { day: 'Wednesday', focus: 'Reading + Writing',      task: 'Read short article (VOA Learning English), write a summary' },
              { day: 'Thursday',  focus: 'Listening + Pronunciation', task: 'Podcast (All Ears English) — listen twice, repeat phrases' },
              { day: 'Friday',    focus: 'Mixed Review',           task: 'Review week\'s vocabulary (Anki) + free conversation with AI voice mode' },
              { day: 'Weekend',   focus: 'Tutor Session',          task: '30 min conversation + grammar correction feedback' },
            ].map(r => (
              <div key={r.day} className="sop-step" style={{ marginBottom: '.4rem' }}>
                <div className="sop-step-time">{r.day}</div>
                <div className="sop-step-content">
                  <div className="sop-step-title">{r.focus}</div>
                  <div className="sop-step-detail">{r.task}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-title">CEFR Milestone Tracker</div>
            {[
              { level: 'B1', label: 'Current (assumed)', desc: 'Can handle everyday conversations with some hesitation', achieved: true },
              { level: 'B2', label: 'Dec 2026 target',   desc: 'Can speak fluently on familiar topics, understand technical texts', achieved: false },
              { level: 'C1', label: 'Year 3–5 vision',   desc: 'Professional/academic language use, flexible and spontaneous', achieved: false },
            ].map(m => (
              <div key={m.level} style={{ display: 'flex', gap: '1rem', padding: '.6rem', background: 'var(--bg-2)', borderRadius: 4, marginBottom: '.4rem' }}>
                <span className={`badge ${m.achieved ? 'badge-green' : 'badge-grey'}`} style={{ fontSize: '.9rem', padding: '.3rem .6rem' }}>{m.level}</span>
                <div>
                  <div className="font-bold text-sm">{m.label}</div>
                  <div className="text-xs text-muted">{m.desc}</div>
                </div>
                {m.achieved && <span className="text-green" style={{ marginLeft: 'auto' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
