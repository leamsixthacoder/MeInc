import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'

function newSectionId() { return 'sec_' + Math.random().toString(36).slice(2, 8) }
function newItemId()    { return 'itm_' + Math.random().toString(36).slice(2, 8) }

// ── Section renderer ──────────────────────────────────────────────────────────
function SectionView({ section, sopColor, editMode, onUpdateSection, onDeleteSection }) {
  const [newItem, setNewItem] = useState(null)
  const [editItem, setEditItem] = useState(null)

  function addItem(item) {
    const updated = { ...section, items: [...section.items, { id: newItemId(), ...item }] }
    onUpdateSection(updated)
    setNewItem(null)
  }
  function saveEditItem(item) {
    const updated = { ...section, items: section.items.map(i => i.id === item.id ? item : i) }
    onUpdateSection(updated)
    setEditItem(null)
  }
  function deleteItem(id) {
    const updated = { ...section, items: section.items.filter(i => i.id !== id) }
    onUpdateSection(updated)
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', flex: 1, margin: 0 }}>{section.title}</h2>
        {editMode && (
          <div style={{ display: 'flex', gap: '.35rem' }}>
            <button className="btn btn-primary btn-xs"
              onClick={() => setNewItem(section.type === 'steps' ? { time: '', title: '', detail: '' } : section.type === 'grid' ? { primary: '', secondary: '', meta: '' } : { text: '' })}>
              + Item
            </button>
            <button className="btn btn-danger btn-xs" onClick={() => window.confirm('Delete this section?') && onDeleteSection(section.id)}>✕ Section</button>
          </div>
        )}
      </div>

      {section.type === 'steps' && (
        <div>
          {section.items.map(item => (
            <div key={item.id}>
              {editItem?.id === item.id ? (
                <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '.75rem', marginBottom: '.4rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <div className="form-row">
                    <input className="form-input" placeholder="Time (e.g. 5:00–5:15)" value={editItem.time} onChange={e => setEditItem(v => ({ ...v, time: e.target.value }))} />
                    <input className="form-input" placeholder="Title" value={editItem.title} onChange={e => setEditItem(v => ({ ...v, title: e.target.value }))} />
                  </div>
                  <input className="form-input" placeholder="Detail (optional)" value={editItem.detail || ''} onChange={e => setEditItem(v => ({ ...v, detail: e.target.value }))} />
                  <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => saveEditItem(editItem)}>Save</button>
                  </div>
                </div>
              ) : (
                <div className="sop-step" style={{ borderLeftColor: sopColor || 'var(--blue)' }}>
                  <div className="sop-step-time" style={{ color: sopColor || 'var(--blue)' }}>{item.time}</div>
                  <div className="sop-step-content" style={{ flex: 1 }}>
                    <div className="sop-step-title">{item.title}</div>
                    {item.detail && <div className="sop-step-detail">{item.detail}</div>}
                  </div>
                  {editMode && (
                    <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditItem({ ...item })}>✏️</button>
                      <button className="btn btn-danger btn-xs" onClick={() => deleteItem(item.id)}>✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section.type === 'list' && (
        <ul style={{ paddingLeft: '1.2rem' }}>
          {section.items.map(item => (
            <li key={item.id} style={{ marginBottom: '.3rem', color: 'var(--text-2)', fontSize: '.875rem', display: 'flex', alignItems: 'flex-start', gap: '.4rem', paddingLeft: editMode ? 0 : undefined, listStyle: editMode ? 'none' : undefined }}>
              {editMode ? (
                editItem?.id === item.id ? (
                  <div style={{ display: 'flex', gap: '.35rem', flex: 1, alignItems: 'center' }}>
                    <input className="form-input" style={{ flex: 1 }} value={editItem.text} onChange={e => setEditItem(v => ({ ...v, text: e.target.value }))} />
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditItem(null)}>✕</button>
                    <button className="btn btn-primary btn-xs" onClick={() => saveEditItem(editItem)}>✓</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '.35rem', flex: 1, alignItems: 'center' }}>
                    <span style={{ flex: 1 }}>• {item.text}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditItem({ ...item })}>✏️</button>
                    <button className="btn btn-danger btn-xs" onClick={() => deleteItem(item.id)}>✕</button>
                  </div>
                )
              ) : item.text}
            </li>
          ))}
        </ul>
      )}

      {section.type === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
          {section.items.map(item => (
            <div key={item.id} className="data-grid-card" style={{ position: 'relative' }}>
              <div className="dgc-primary">{item.primary}</div>
              <div className="dgc-secondary">{item.secondary}</div>
              <div className="dgc-meta">{item.meta}</div>
              {editMode && (
                <div style={{ position: 'absolute', top: '.35rem', right: '.35rem', display: 'flex', gap: '.25rem' }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditItem({ ...item })}>✏️</button>
                  <button className="btn btn-danger btn-xs" onClick={() => deleteItem(item.id)}>✕</button>
                </div>
              )}
              {editMode && editItem?.id === item.id && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                  <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: 400, maxWidth: '100%' }}>
                    <div className="modal-title">Edit Card</div>
                    <div className="form">
                      <div className="form-group"><label className="form-label">Day / Primary</label><input className="form-input" value={editItem.primary} onChange={e => setEditItem(v => ({ ...v, primary: e.target.value }))} /></div>
                      <div className="form-group"><label className="form-label">Focus / Secondary</label><input className="form-input" value={editItem.secondary} onChange={e => setEditItem(v => ({ ...v, secondary: e.target.value }))} /></div>
                      <div className="form-group"><label className="form-label">Details / Meta</label><textarea className="form-textarea" rows={2} value={editItem.meta} onChange={e => setEditItem(v => ({ ...v, meta: e.target.value }))} /></div>
                    </div>
                    <div className="modal-actions">
                      <button className="btn btn-ghost" onClick={() => setEditItem(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => saveEditItem(editItem)}>Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New item inline form */}
      {editMode && newItem && (
        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '.75rem', marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.4rem', border: '1px solid var(--border)' }}>
          {section.type === 'steps' && (
            <>
              <div className="form-row">
                <input className="form-input" placeholder="Time (e.g. 6:00–6:10)" value={newItem.time} onChange={e => setNewItem(v => ({ ...v, time: e.target.value }))} />
                <input className="form-input" placeholder="Title *" value={newItem.title} onChange={e => setNewItem(v => ({ ...v, title: e.target.value }))} />
              </div>
              <input className="form-input" placeholder="Detail (optional)" value={newItem.detail} onChange={e => setNewItem(v => ({ ...v, detail: e.target.value }))} />
            </>
          )}
          {section.type === 'list' && (
            <input className="form-input" placeholder="Item text *" value={newItem.text || ''} onChange={e => setNewItem(v => ({ ...v, text: e.target.value }))} />
          )}
          {section.type === 'grid' && (
            <>
              <div className="form-row">
                <input className="form-input" placeholder="Day / Primary *" value={newItem.primary} onChange={e => setNewItem(v => ({ ...v, primary: e.target.value }))} />
                <input className="form-input" placeholder="Focus / Secondary" value={newItem.secondary} onChange={e => setNewItem(v => ({ ...v, secondary: e.target.value }))} />
              </div>
              <input className="form-input" placeholder="Exercises / Details" value={newItem.meta} onChange={e => setNewItem(v => ({ ...v, meta: e.target.value }))} />
            </>
          )}
          <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setNewItem(null)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const valid = section.type === 'steps' ? newItem.title?.trim() : section.type === 'grid' ? newItem.primary?.trim() : newItem.text?.trim()
              if (!valid) return
              addItem(newItem)
            }}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

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
