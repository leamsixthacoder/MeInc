import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { SectionView } from '../components/SopSection.jsx'

function newSectionId() { return 'sec_' + Math.random().toString(36).slice(2, 8) }

// ── SOP detail view ──────────────────────────────────────────────────────────
function SopDetail({ sop, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false)
  const [editMeta, setEditMeta] = useState(null)
  const [addSectionForm, setAddSectionForm] = useState(false)
  const [newSec, setNewSec] = useState({ title: '', type: 'steps' })

  function handleUpdateSection(updatedSection) {
    onUpdate({ ...sop, sections: sop.sections.map(s => s.id === updatedSection.id ? updatedSection : s) })
  }
  function handleDeleteSection(secId) {
    onUpdate({ ...sop, sections: sop.sections.filter(s => s.id !== secId) })
  }
  function addSection() {
    if (!newSec.title.trim()) return
    const sec = { id: newSectionId(), type: newSec.type, title: newSec.title, items: [] }
    onUpdate({ ...sop, sections: [...sop.sections, sec] })
    setNewSec({ title: '', type: 'steps' })
    setAddSectionForm(false)
  }
  function saveMeta(e) {
    e.preventDefault()
    onUpdate({ ...sop, ...editMeta })
    setEditMeta(null)
  }

  const alertType = sop.alertType || 'info'

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1 }}>
          <span style={{ fontSize: '1.8rem' }}>{sop.icon}</span>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sop.title}</div>
            <div className="text-sm text-muted">{sop.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
          <button className={`btn btn-sm ${editMode ? 'btn-amber' : 'btn-ghost'}`} onClick={() => setEditMode(v => !v)}>
            {editMode ? '✓ Done Editing' : '✏️ Edit'}
          </button>
          {editMode && <button className="btn btn-ghost btn-sm" onClick={() => setEditMeta({ icon: sop.icon, title: sop.title, description: sop.description, color: sop.color || '#4fa3f7', alertType: sop.alertType || 'info' })}>⚙️ Info</button>}
          {editMode && <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete "${sop.title}"?`) && onDelete(sop.id)}>🗑️ Delete SOP</button>}
        </div>
      </div>

      {sop.description && (
        <div className={`alert alert-${alertType} section`}>
          <span>{sop.icon}</span>
          <div>{sop.description}</div>
        </div>
      )}

      <div className="sop-content">
        {sop.sections.map(sec => (
          <SectionView
            key={sec.id}
            section={sec}
            sopColor={sop.color}
            editMode={editMode}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
          />
        ))}
      </div>

      {editMode && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          {addSectionForm ? (
            <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border)' }}>
              <div className="modal-title" style={{ fontSize: '.95rem', marginBottom: '.75rem' }}>New Section</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section Title *</label>
                  <input className="form-input" value={newSec.title} onChange={e => setNewSec(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Success Criteria" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={newSec.type} onChange={e => setNewSec(v => ({ ...v, type: e.target.value }))}>
                    <option value="steps">Steps (time + title + detail)</option>
                    <option value="list">List (bullet points)</option>
                    <option value="grid">Grid (day / focus / notes)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddSectionForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={addSection}>Add Section</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={() => setAddSectionForm(true)}>+ Add Section</button>
          )}
        </div>
      )}

      {/* Edit meta modal */}
      {editMeta && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Edit SOP Info</div>
            <form onSubmit={saveMeta} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon (emoji)</label>
                  <input className="form-input" value={editMeta.icon} onChange={e => setEditMeta(v => ({ ...v, icon: e.target.value }))} placeholder="🌅" />
                </div>
                <div className="form-group">
                  <label className="form-label">Accent Color</label>
                  <input className="form-input" value={editMeta.color} onChange={e => setEditMeta(v => ({ ...v, color: e.target.value }))} placeholder="#4fa3f7" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" required value={editMeta.title} onChange={e => setEditMeta(v => ({ ...v, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Alert text</label>
                <input className="form-input" value={editMeta.description || ''} onChange={e => setEditMeta(v => ({ ...v, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Alert Type</label>
                <select className="form-select" value={editMeta.alertType || 'info'} onChange={e => setEditMeta(v => ({ ...v, alertType: e.target.value }))}>
                  <option value="info">Info (blue)</option>
                  <option value="warning">Warning (amber)</option>
                  <option value="success">Success (green)</option>
                  <option value="">None</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditMeta(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── New SOP modal ─────────────────────────────────────────────────────────────
function NewSopModal({ onSave, onClose }) {
  const [form, setForm] = useState({ icon: '📋', title: '', description: '', color: '#4fa3f7', alertType: 'info' })
  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
    onClose()
  }
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-title">Create New SOP</div>
        <form onSubmit={submit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-input" value={form.icon} onChange={e => setForm(v => ({ ...v, icon: e.target.value }))} placeholder="📋" />
            </div>
            <div className="form-group">
              <label className="form-label">Accent Color</label>
              <input className="form-input" value={form.color} onChange={e => setForm(v => ({ ...v, color: e.target.value }))} placeholder="#4fa3f7" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} placeholder="e.g. Pre-Market Routine" />
          </div>
          <div className="form-group">
            <label className="form-label">Description / Alert text</label>
            <input className="form-input" value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} placeholder="Brief overview or key rule" />
          </div>
          <div className="form-group">
            <label className="form-label">Alert Style</label>
            <select className="form-select" value={form.alertType} onChange={e => setForm(v => ({ ...v, alertType: e.target.value }))}>
              <option value="info">Info (blue)</option>
              <option value="warning">Warning (amber)</option>
              <option value="success">Success (green)</option>
              <option value="">None</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create SOP</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main SOPs page ─────────────────────────────────────────────────────────────
export default function SOPs() {
  const { state, dispatch } = useApp()
  const sops = state.sops || []
  const [active, setActive] = useState(sops[0]?.id || null)
  const [showNew, setShowNew] = useState(false)

  const activeSop = sops.find(s => s.id === active)

  function handleUpdate(updated) {
    dispatch({ type: 'UPDATE_SOP', payload: updated })
  }
  function handleDelete(id) {
    dispatch({ type: 'DELETE_SOP', payload: id })
    setActive(sops.find(s => s.id !== id)?.id || null)
  }
  function handleCreate(data) {
    dispatch({ type: 'ADD_SOP', payload: data })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <div className="page-title">📖 Standard Operating Procedures</div>
          <div className="page-subtitle">Reference workflows and execution playbooks — fully editable</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New SOP</button>
      </div>

      {sops.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <div className="empty-state-text">No SOPs yet — create your first one</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left nav */}
          <div className="card" style={{ padding: '.75rem', position: 'sticky', top: '70px' }}>
            {sops.map(sop => (
              <button
                key={sop.id}
                onClick={() => setActive(sop.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  width: '100%', padding: '.5rem .75rem',
                  borderRadius: 'var(--radius-xs)', cursor: 'pointer',
                  textAlign: 'left', fontSize: '.875rem', fontWeight: active === sop.id ? 600 : 400,
                  background: active === sop.id ? `${sop.color}18` : 'transparent',
                  color: active === sop.id ? sop.color || 'var(--blue)' : 'var(--text-2)',
                  borderLeft: active === sop.id ? `3px solid ${sop.color || 'var(--blue)'}` : '3px solid transparent',
                  transition: 'all var(--transition)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{sop.icon}</span>
                <span>{sop.title}</span>
              </button>
            ))}
          </div>

          {/* SOP content */}
          <div className="card" style={{ minHeight: 400 }}>
            {activeSop
              ? <SopDetail sop={activeSop} onUpdate={handleUpdate} onDelete={handleDelete} />
              : <div className="empty-state"><div className="empty-state-text">Select a SOP to view</div></div>
            }
          </div>
        </div>
      )}

      {showNew && <NewSopModal onSave={handleCreate} onClose={() => setShowNew(false)} />}
    </div>
  )
}
