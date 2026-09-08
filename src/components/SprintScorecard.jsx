import React, { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'

// One objective row with an inline-editable "current" value and a done toggle.
// Edited here via UPDATE_SPRINT_OBJECTIVE so it's a quick update without opening
// the full sprint edit modal (which is where objectives are added/removed/relabeled).
function ObjectiveRow({ sprintId, obj }) {
  const { dispatch } = useApp()
  const [current, setCurrent] = useState(obj.current || '')

  useEffect(() => { setCurrent(obj.current || '') }, [obj.current])

  function commit() {
    if (current !== (obj.current || '')) {
      dispatch({ type: 'UPDATE_SPRINT_OBJECTIVE', payload: { sprintId, objectiveId: obj.id, patch: { current } } })
    }
  }
  function toggleDone() {
    dispatch({ type: 'UPDATE_SPRINT_OBJECTIVE', payload: { sprintId, objectiveId: obj.id, patch: { done: !obj.done } } })
  }

  return (
    <tr>
      <td className="font-bold">{obj.label}</td>
      <td className="text-muted">{obj.target || '—'}</td>
      <td style={{ width: 140 }}>
        <input
          className="form-input"
          style={{ padding: '.3rem .5rem', fontSize: '.8rem' }}
          value={current}
          placeholder="—"
          onChange={e => setCurrent(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        />
      </td>
      <td>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!obj.done} onChange={toggleDone} />
          <span className={`badge ${obj.done ? 'badge-green' : 'badge-grey'}`}>{obj.done ? '✓ Done' : 'Pending'}</span>
        </label>
      </td>
    </tr>
  )
}

// Generic live scorecard for a sprint's objectives. Replaces what used to be a
// hardcoded "Sprint 1" table — works for any sprint, including ones created later.
export default function SprintScorecard({ sprint, title }) {
  if (!sprint) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-text">No active sprint. Create or mark one active in QBR → Roadmap.</div>
        </div>
      </div>
    )
  }

  const objectives = sprint.objectives || []
  const done = objectives.filter(o => o.done).length

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0 }}>{title || `${sprint.name} Scorecard`}{sprint.dates ? ` (${sprint.dates})` : ''}</div>
        {objectives.length > 0 && (
          <span className={`badge ${done === objectives.length ? 'badge-green' : done > 0 ? 'badge-amber' : 'badge-grey'}`}>{done}/{objectives.length} complete</span>
        )}
      </div>
      {objectives.length === 0 ? (
        <div className="text-xs text-muted">No objectives yet — add some by editing this sprint in QBR → Roadmap.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Objective</th><th>Target</th><th>Current</th><th>Status</th></tr></thead>
            <tbody>
              {objectives.map(o => <ObjectiveRow key={o.id} sprintId={sprint.id} obj={o} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
