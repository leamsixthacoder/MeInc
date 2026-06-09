import React, { useRef, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { exportJSON, importJSON, clearData } from '../utils/storage.js'
import { todayISO, formatDateTime } from '../utils/dateUtils.js'

export default function Settings() {
  const { state, dispatch } = useApp()
  const fileRef = useRef(null)
  const [importStatus, setImportStatus] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleExport() {
    const exportData = { ...state, meta: { ...state.meta, lastExport: new Date().toISOString() } }
    exportJSON(exportData)
    dispatch({ type: 'UPSERT_DAILY_LOG', payload: {} }) // force save meta timestamp
  }

  async function handleImport(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    setImportStatus({ type: 'loading', msg: 'Reading file...' })
    try {
      const data = await importJSON(file)
      if (window.confirm(`Import backup from ${data.meta?.createdAt ? new Date(data.meta.createdAt).toLocaleDateString() : 'unknown date'}?\n\nThis will OVERWRITE all current data.`)) {
        dispatch({ type: 'IMPORT_DATA', payload: data })
        setImportStatus({ type: 'success', msg: 'Import successful! All data restored.' })
      } else {
        setImportStatus(null)
      }
    } catch (err) {
      setImportStatus({ type: 'error', msg: `Import failed: ${err.message}` })
    }
    ev.target.value = ''
  }

  function handleReset() {
    if (confirmReset) {
      clearData()
      window.location.reload()
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 5000)
    }
  }

  // Data stats
  const stats = [
    { label: 'Weight entries',     value: state.weightLog.length },
    { label: 'Workout logs',       value: state.workoutLog.length },
    { label: 'Nutrition logs',     value: state.nutritionLog.length },
    { label: 'Language sessions',  value: state.languageSessions.length },
    { label: 'Tutor sessions',     value: state.tutorSessions.length },
    { label: 'Cert study sessions',value: state.certStudySessions.length },
    { label: 'Trades logged',      value: state.trades.length },
    { label: 'Trading summaries',  value: state.tradingDailySummaries.length },
    { label: 'Debt payments',      value: state.debtPayments.length },
    { label: 'Income entries',     value: state.incomeLog.length },
    { label: 'Daily logs',         value: state.dailyLogs.length },
    { label: 'Decisions',          value: state.decisions.length },
    { label: 'Weekly ops reviews', value: state.weeklyOpsReviews.length },
    { label: 'QBRs',               value: state.quarterlyReviews.length },
  ]

  const totalRecords = stats.reduce((s, r) => s + r.value, 0)
  const storageSize = (() => {
    try { const raw = localStorage.getItem('me_inc_v1') || ''; return `${(raw.length / 1024).toFixed(1)} KB` }
    catch { return 'Unknown' }
  })()

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ Settings & Data</div>
        <div className="page-subtitle">Export / import backup · All data stored client-side in localStorage · No server required</div>
      </div>

      <div className="grid-2 section">
        {/* Export */}
        <div className="card">
          <div className="card-title">Export Backup</div>
          <p style={{ fontSize: '.875rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
            Download all your Me, Inc. data as a JSON file. Store it safely — this is your only backup.
          </p>
          <div style={{ fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
            <div>Total records: <strong>{totalRecords}</strong></div>
            <div>Storage used: <strong>{storageSize}</strong></div>
            {state.meta?.lastExport && <div>Last export: <strong>{formatDateTime(state.meta.lastExport)}</strong></div>}
          </div>
          <button className="btn btn-primary" onClick={handleExport}>⬇ Download Backup (JSON)</button>
          <div className="form-hint" style={{ marginTop: '.5rem' }}>File name: me-inc-backup-{todayISO()}.json</div>
        </div>

        {/* Import */}
        <div className="card">
          <div className="card-title">Import Backup</div>
          <p style={{ fontSize: '.875rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
            Restore data from a previously exported JSON file. <strong>This will overwrite all current data.</strong>
          </p>
          {importStatus && (
            <div className={`alert ${importStatus.type === 'success' ? 'alert-success' : importStatus.type === 'error' ? 'alert-danger' : 'alert-info'}`} style={{ marginBottom: '1rem' }}>
              <span>{importStatus.type === 'success' ? '✓' : importStatus.type === 'error' ? '✗' : '⏳'}</span>
              <div>{importStatus.msg}</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>⬆ Choose Backup File</button>
          <div className="form-hint" style={{ marginTop: '.5rem' }}>Accepts: me-inc-backup-*.json</div>
        </div>
      </div>

      {/* Data Stats */}
      <div className="card section">
        <div className="card-title">Data Overview</div>
        <div className="grid-4">
          {stats.map(s => (
            <div key={s.label} style={{ padding: '.5rem', background: 'var(--bg-2)', borderRadius: 4 }}>
              <div className="text-xs text-muted">{s.label}</div>
              <div className="font-bold text-blue">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="card section">
        <div className="card-title">About Me, Inc.</div>
        <div style={{ fontSize: '.875rem', color: 'var(--text-2)' }}>
          <p style={{ marginBottom: '.5rem' }}>Personal life management system for Jose Vasquez, CEO of Me, Inc.</p>
          <p style={{ marginBottom: '.5rem' }}>Version 1.0 · Built May 2026 · All data stored locally</p>
          <p>Vision: By 5/26/2031, Me, Inc. is a balanced, debt-free enterprise operating at peak human performance, generating $12,000–$25,000/month from investments and futures trading, giving 10% to meaningful causes.</p>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap', fontSize: '.8rem' }}>
          {[
            ['Body', '188–195 lb lean · <12% body fat'],
            ['Mind', 'B2 English → C1 in 2 languages'],
            ['Career', '3 active technical certifications'],
            ['Finance', 'Zero debt · $12k–$25k/month passive'],
            ['Impact', '10% giving automated'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg-2)', padding: '.3rem .7rem', borderRadius: 4 }}>
              <span className="font-bold text-blue">{k}: </span>{v}
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card section" style={{ borderColor: 'var(--red)', borderWidth: 1 }}>
        <div className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
        <p style={{ fontSize: '.875rem', color: 'var(--text-2)', marginBottom: '1rem' }}>
          Reset all data back to initial state. This cannot be undone. Export a backup first.
        </p>
        <button
          className={`btn ${confirmReset ? 'btn-danger' : 'btn-ghost'}`}
          onClick={handleReset}
          style={{ borderColor: confirmReset ? undefined : 'var(--red)', color: confirmReset ? undefined : 'var(--red)' }}
        >
          {confirmReset ? '⚠️ Click again to confirm — ALL DATA WILL BE DELETED' : '🗑 Reset All Data'}
        </button>
        {confirmReset && <div className="form-hint" style={{ color: 'var(--red)', marginTop: '.5rem' }}>This prompt will expire in 5 seconds</div>}
      </div>
    </div>
  )
}
