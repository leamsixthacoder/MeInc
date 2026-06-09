import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { todayISO, formatDate, daysUntil } from '../utils/dateUtils.js'

export default function Certifications() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('study')
  const [form, setForm] = useState({ certId: 'ai900', date: todayISO(), durationMinutes: 90, topics: '', practiceScore: '', pomodoros: 3, notes: '' })
  const [editCert, setEditCert] = useState(null)
  const [certForm, setCertForm] = useState({})
  const [errors, setErrors] = useState({})

  const sessions = [...state.certStudySessions].sort((a, b) => b.date.localeCompare(a.date))

  function validateStudy() {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.durationMinutes || +form.durationMinutes <= 0) e.dur = 'Required'
    if (form.practiceScore && (isNaN(+form.practiceScore) || +form.practiceScore < 0 || +form.practiceScore > 100)) e.score = '0–100'
    return e
  }

  function submitStudy(ev) {
    ev.preventDefault()
    const e = validateStudy()
    if (Object.keys(e).length) { setErrors(e); return }
    dispatch({ type: 'LOG_CERT_STUDY', payload: {
      certId: form.certId, date: form.date, durationMinutes: +form.durationMinutes,
      topics: form.topics, practiceScore: form.practiceScore ? +form.practiceScore : null,
      pomodoros: +form.pomodoros || 3, notes: form.notes
    }})
    setForm(f => ({ ...f, date: todayISO(), topics: '', practiceScore: '', notes: '' }))
    setErrors({})
  }

  function openEditCert(cert) {
    setEditCert(cert.id)
    setCertForm({ status: cert.status, score: cert.score || '', attempts: cert.attempts || 0, examDate: cert.examDate || '' })
  }

  function saveCert(ev) {
    ev.preventDefault()
    dispatch({ type: 'UPDATE_CERT', payload: {
      id: editCert, status: certForm.status,
      score: certForm.score ? +certForm.score : null,
      attempts: +certForm.attempts || 0,
      examDate: certForm.examDate || null,
      practiceExamScores: state.certifications.find(c => c.id === editCert)?.practiceExamScores || []
    }})
    setEditCert(null)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎓 Certifications</div>
        <div className="page-subtitle">AI-900 by Jun 30 · SC-300 by Jul 31 · Pass score: 700/1000 · Retake within 30 days if failed</div>
      </div>

      {/* Cert Status Cards */}
      <div className="grid-2 section">
        {state.certifications.map(cert => {
          const days = daysUntil(cert.targetDate)
          const sessForCert = sessions.filter(s => s.certId === cert.id)
          const practiceScores = sessForCert.filter(s => s.practiceScore != null).map(s => s.practiceScore)
          const latestScore = practiceScores.length ? practiceScores[practiceScores.length - 1] : null
          const avgScore = practiceScores.length ? (practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length).toFixed(0) : null
          const ready = latestScore >= 80 && practiceScores.length >= 3

          return (
            <div key={cert.id} className="card" style={{ borderTop: `3px solid ${cert.status === 'passed' ? 'var(--green)' : cert.status === 'in_progress' ? 'var(--blue)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cert.code}</div>
                  <div className="text-sm text-muted">{cert.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                  <span className={`badge ${cert.status === 'passed' ? 'badge-green' : cert.status === 'in_progress' ? 'badge-blue' : 'badge-grey'}`}>
                    {cert.status === 'not_started' ? 'Not Started' : cert.status === 'in_progress' ? 'In Progress' : cert.status === 'passed' ? '✓ Passed' : cert.status === 'failed' ? 'Failed' : cert.status}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditCert(cert)}>✏️</button>
                </div>
              </div>

              <div className="grid-4" style={{ marginTop: '.75rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="text-xs text-muted">Study Hours</div>
                  <div className="font-bold text-blue">{(cert.studyHoursLogged || 0).toFixed(1)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="text-xs text-muted">Sessions</div>
                  <div className="font-bold">{sessForCert.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="text-xs text-muted">Avg Score</div>
                  <div className={`font-bold ${avgScore >= 80 ? 'text-green' : avgScore >= 70 ? 'text-amber' : 'text-muted'}`}>{avgScore ? `${avgScore}%` : '—'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="text-xs text-muted">Days Left</div>
                  <div className={`font-bold ${days <= 7 ? 'text-red' : days <= 21 ? 'text-amber' : 'text-green'}`}>{days >= 0 ? days : `${-days}d late`}</div>
                </div>
              </div>

              {cert.status !== 'passed' && (
                <>
                  <div style={{ marginTop: '.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.2rem' }}>
                      <span>Readiness to exam</span>
                      {latestScore && <span className={latestScore >= 80 ? 'text-green' : 'text-amber'}>{latestScore}% latest score</span>}
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${ready ? 'progress-fill-green' : latestScore >= 70 ? 'progress-fill-amber' : 'progress-fill-red'}`}
                        style={{ width: `${latestScore ? Math.min(100, latestScore) : 0}%` }} />
                    </div>
                  </div>
                  {ready
                    ? <div className="alert alert-success" style={{ marginTop: '.5rem' }}><span>✓</span><div>Ready to book exam! 3+ practice tests ≥80%.</div></div>
                    : <div className="alert alert-warning" style={{ marginTop: '.5rem' }}><span>⚠️</span><div>Need 3 practice tests ≥80% before exam. {practiceScores.length < 3 ? `${3 - practiceScores.length} more needed.` : 'Score up to ≥80%.'}</div></div>
                  }
                </>
              )}
              {cert.status === 'passed' && cert.score && (
                <div className="alert alert-success" style={{ marginTop: '.5rem' }}>
                  <span>🎉</span><div>Passed with score {cert.score}/1000!</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Update Cert Modal */}
      {editCert && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Update — {state.certifications.find(c => c.id === editCert)?.code}</div>
            <form onSubmit={saveCert} className="form">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={certForm.status} onChange={e => setCertForm(f => ({ ...f, status: e.target.value }))}>
                  {['not_started', 'in_progress', 'passed', 'failed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input className="form-input" type="date" value={certForm.examDate || ''} onChange={e => setCertForm(f => ({ ...f, examDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Actual Score (if taken)</label>
                  <input className="form-input" type="number" min="0" max="1000" placeholder="e.g. 780" value={certForm.score} onChange={e => setCertForm(f => ({ ...f, score: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Attempt #</label>
                <input className="form-input" type="number" min="0" max="5" value={certForm.attempts} onChange={e => setCertForm(f => ({ ...f, attempts: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditCert(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'study' ? 'active' : ''}`} onClick={() => setTab('study')}>Log Study Session</button>
        <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Session History</button>
        <button className={`tab-btn ${tab === 'guide' ? 'active' : ''}`} onClick={() => setTab('guide')}>Exam Guide</button>
      </div>

      {tab === 'study' && (
        <div className="section">
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Log Study Session (90 min / 3 Pomodoros)</div>
              <form onSubmit={submitStudy} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Certification</label>
                    <select className="form-select" value={form.certId} onChange={e => setForm(f => ({ ...f, certId: e.target.value }))}>
                      {state.certifications.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date<span>*</span></label>
                    <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration (min)<span>*</span></label>
                    <input className={`form-input ${errors.dur ? 'error' : ''}`} type="number" min="15" max="300" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
                    {errors.dur && <div className="form-error">{errors.dur}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pomodoros Completed</label>
                    <select className="form-select" value={form.pomodoros} onChange={e => setForm(f => ({ ...f, pomodoros: e.target.value }))}>
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} ({n * 25} min)</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Topics Covered (Module / Objective)</label>
                  <input className="form-input" type="text" placeholder="e.g. AI Fundamentals Module 2: Computer Vision" value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Practice Exam Score (%) — leave blank if none taken</label>
                  <input className={`form-input ${errors.score ? 'error' : ''}`} type="number" min="0" max="100" placeholder="e.g. 76" value={form.practiceScore} onChange={e => setForm(f => ({ ...f, practiceScore: e.target.value }))} />
                  {errors.score && <div className="form-error">{errors.score}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Weak Areas</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary">Log Session</button>
              </form>
            </div>

            <div className="card">
              <div className="card-title">90-min Pomodoro Block Structure</div>
              {[
                { time: '0:00–0:27', label: 'Pomodoro 1', desc: 'Learn new content — watch video or read Microsoft Learn module for one exam objective. Take notes in your own words.' },
                { time: '0:27–0:32', label: 'Break (5 min)', desc: 'Stand, stretch, drink water. NO social media.' },
                { time: '0:32–0:57', label: 'Pomodoro 2', desc: 'Hands-on practice — Azure free account for AI-900, or Azure AD tenant for SC-300.' },
                { time: '0:57–1:02', label: 'Break (5 min)', desc: 'Stand, stretch, drink water.' },
                { time: '1:02–1:27', label: 'Pomodoro 3', desc: 'Practice questions — 10–15 questions on today\'s objective. Review every answer. Add missed concepts to flashcards.' },
                { time: '1:27–1:30', label: 'Review (3 min)', desc: 'Summarize key takeaways. Log session. Plan tomorrow\'s objective.' },
              ].map(s => (
                <div key={s.time} className="sop-step" style={{ marginBottom: '.3rem' }}>
                  <div className="sop-step-time">{s.time}</div>
                  <div className="sop-step-content">
                    <div className="sop-step-title">{s.label}</div>
                    <div className="sop-step-detail">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="section">
          {sessions.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📚</div><div className="empty-state-text">No study sessions logged yet</div></div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Cert</th><th>Duration</th><th>Pomodoros</th><th>Topics</th><th>Practice %</th><th>Notes</th><th></th></tr></thead>
                  <tbody>
                    {sessions.slice(0, 30).map(s => (
                      <tr key={s.id}>
                        <td>{formatDate(s.date)}</td>
                        <td><span className="badge badge-blue">{state.certifications.find(c => c.id === s.certId)?.code ?? s.certId}</span></td>
                        <td>{s.durationMinutes} min</td>
                        <td>{s.pomodoros || '—'}</td>
                        <td className="truncate" style={{ maxWidth: 180 }}>{s.topics || '—'}</td>
                        <td className={s.practiceScore != null ? (s.practiceScore >= 80 ? 'text-green' : s.practiceScore >= 70 ? 'text-amber' : 'text-red') : 'text-muted'}>
                          {s.practiceScore != null ? `${s.practiceScore}%` : '—'}
                        </td>
                        <td className="text-muted truncate" style={{ maxWidth: 160 }}>{s.notes || '—'}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete?') && dispatch({ type: 'DELETE_CERT_STUDY', payload: s.id })}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {tab === 'guide' && (
        <div className="section">
          <div className="grid-2">
            {[
              {
                code: 'AI-900', name: 'Azure AI Fundamentals', date: 'Jun 30, 2026', questions: '40–60', time: '60 min', pass: '700/1000',
                topics: ['AI workloads & considerations (20–25%)', 'Computer vision workloads (15–20%)', 'NLP workloads (25–30%)', 'Document intelligence & knowledge mining (10–15%)', 'Generative AI workloads (20–25%)'],
                resources: ['Microsoft Learn: AI-900 Study Guide (free)', 'John Savill YouTube (free)', 'Whizlabs practice exams (~$30)'],
                tip: 'Focus on USE CASES, not deep implementation. Know when to use Computer Vision vs Custom Vision, Language Service vs Translator.'
              },
              {
                code: 'SC-300', name: 'Identity & Access Administrator', date: 'Jul 31, 2026', questions: '40–60 + case studies', time: '120 min', pass: '700/1000',
                topics: ['Design identity solution (10–15%)', 'Implement authentication & access management (25–30%)', 'Implement access management for apps (25–30%)', 'Manage identity governance (20–25%)'],
                resources: ['Microsoft Learn: SC-300 Study Guide (free)', 'John Savill SC-300 cram video (YouTube)', 'Azure free trial tenant for hands-on'],
                tip: 'Harder than AI-900. Budget 40–50 hours. Create a free Azure AD tenant and practice: users, groups, MFA, Conditional Access policies.'
              }
            ].map(exam => (
              <div key={exam.code} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{exam.code}</div>
                    <div className="text-sm text-muted">{exam.name}</div>
                  </div>
                  <span className="badge badge-amber">{exam.date}</span>
                </div>
                <div className="grid-3" style={{ marginBottom: '.75rem', gap: '.5rem' }}>
                  {[['Questions', exam.questions], ['Time', exam.time], ['Pass Score', exam.pass]].map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--bg-2)', borderRadius: 4, padding: '.4rem .6rem', textAlign: 'center' }}>
                      <div className="text-xs text-muted">{l}</div>
                      <div className="font-bold text-sm">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="card-title">Topics</div>
                <ul style={{ paddingLeft: '1.1rem', marginBottom: '.75rem' }}>
                  {exam.topics.map(t => <li key={t} className="text-sm text-muted" style={{ marginBottom: '.2rem' }}>{t}</li>)}
                </ul>
                <div className="card-title">Free Resources</div>
                <ul style={{ paddingLeft: '1.1rem', marginBottom: '.75rem' }}>
                  {exam.resources.map(r => <li key={r} className="text-sm text-muted" style={{ marginBottom: '.2rem' }}>{r}</li>)}
                </ul>
                <div className="alert alert-info"><span>💡</span><div className="text-sm">{exam.tip}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
