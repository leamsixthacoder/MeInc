import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'

const SECTIONS = [
  { key: 'morning', label: '☀️ Morning Routine', color: 'var(--blue)' },
  { key: 'evening', label: '🌙 Evening Routine', color: 'var(--purple)' },
  { key: 'kpis',    label: '📊 Daily KPIs',      color: 'var(--green)' },
]

function ItemRow({ item, sectionKey, dispatch, onEdit }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.6rem',
      padding: '.5rem .75rem', borderRadius: 'var(--radius-xs)',
      background: 'rgba(255,255,255,.025)', border: '1px solid var(--border-sub)',
      marginBottom: '.35rem',
    }}>
      <span style={{ fontSize: '1rem', color: 'var(--text-3)', cursor: 'grab' }}>⠿</span>
      <span style={{ flex: 1, fontSize: '.875rem' }}>{item.label}</span>
      <span className="tag" style={{ fontFamily: 'monospace', fontSize: '.65rem' }}>{item.key}</span>
      <button className="btn btn-ghost btn-xs" onClick={() => onEdit(item)}>✏️</button>
      <button className="btn btn-danger btn-xs"
        onClick={() => window.confirm('Remove this item?') && dispatch({ type: 'DELETE_CHECKLIST_ITEM', payload: { section: sectionKey, id: item.id } })}>
        ✕
      </button>
    </div>
  )
}

function SectionEditor({ section, items, dispatch }) {
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editItem, setEditItem] = useState(null)

  function addItem() {
    if (!newLabel.trim()) return
    dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { section: section.key, item: { label: newLabel.trim() } } })
    setNewLabel('')
    setAdding(false)
  }

  function saveEdit() {
    if (!editItem.label.trim()) return
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: { section: section.key, item: editItem } })
    setEditItem(null)
  }

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: 0, color: section.color }}>
          {section.label}
          <span className="badge badge-grey" style={{ marginLeft: '.5rem', fontWeight: 400 }}>{items.length} items</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(v => !v)}>
          {adding ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <input
            className="form-input"
            placeholder="Item label (e.g. Read 10 pages)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={addItem}>Add</button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '1.25rem' }}>
          <div className="empty-state-text">No items yet — add your first one</div>
        </div>
      ) : (
        <div>
          {items.map(item => (
            editItem?.id === item.id ? (
              <div key={item.id} style={{ display: 'flex', gap: '.5rem', marginBottom: '.35rem', alignItems: 'center' }}>
                <input
                  className="form-input"
                  value={editItem.label}
                  onChange={e => setEditItem(v => ({ ...v, label: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              </div>
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                sectionKey={section.key}
                dispatch={dispatch}
                onEdit={setEditItem}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChecklistSettings() {
  const { state, dispatch } = useApp()
  const checklistItems = state.checklistItems || { morning: [], evening: [], kpis: [] }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <div className="page-title">✅ Checklist Settings</div>
          <div className="page-subtitle">Manage your daily non-negotiables — add, edit, or remove items in any section</div>
        </div>
        <Link to="/" className="btn btn-ghost">← Back to Dashboard</Link>
      </div>

      <div className="alert alert-info section">
        <span>💡</span>
        <div>
          Items you add here will appear in your daily checklist on the Dashboard. The <code style={{ fontSize: '.8rem', background: 'rgba(255,255,255,.08)', padding: '.1rem .3rem', borderRadius: 3 }}>key</code> field is the internal tracker for daily log data — it's auto-generated and stable once set.
        </div>
      </div>

      {SECTIONS.map(section => (
        <SectionEditor
          key={section.key}
          section={section}
          items={checklistItems[section.key] || []}
          dispatch={dispatch}
        />
      ))}
    </div>
  )
}
