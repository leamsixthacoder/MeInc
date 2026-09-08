import React, { useState } from 'react'

function newItemId() { return 'itm_' + Math.random().toString(36).slice(2, 8) }

// ── Section renderer ──────────────────────────────────────────────────────────
// Renders one SOP section (steps / list / grid) with full inline CRUD on its
// items. Shared by the SOPs page and any other page that needs to edit a
// section live (e.g. Health's gym schedule, which is the 'mg' grid section
// on the Morning Routine SOP) so both stay in sync automatically.
export function SectionView({ section, sopColor, editMode, onUpdateSection, onDeleteSection, allowDeleteSection = true }) {
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
            {allowDeleteSection && onDeleteSection && (
              <button className="btn btn-danger btn-xs" onClick={() => window.confirm('Delete this section?') && onDeleteSection(section.id)}>✕ Section</button>
            )}
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
