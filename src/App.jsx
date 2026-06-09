import React, { useState } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AppProvider } from './store/AppContext.jsx'

import Dashboard      from './pages/Dashboard.jsx'
import Health         from './pages/Health.jsx'
import Finance        from './pages/Finance.jsx'
import Trading        from './pages/Trading.jsx'
import Language       from './pages/Language.jsx'
import Certifications from './pages/Certifications.jsx'
import Decisions      from './pages/Decisions.jsx'
import WeeklyOps      from './pages/WeeklyOps.jsx'
import QBR            from './pages/QBR.jsx'
import SOPs           from './pages/SOPs.jsx'
import Settings       from './pages/Settings.jsx'

const NAV_ITEMS = [
  { path: '/',              label: 'Dashboard',        icon: '⚡' },
  { path: '/health',        label: 'Body & Health',    icon: '💪' },
  { path: '/language',      label: 'Mind & Language',  icon: '🗣️' },
  { path: '/certifications',label: 'Certifications',   icon: '🎓' },
  { path: '/finance',       label: 'Finance',          icon: '💰' },
  { path: '/trading',       label: 'Trading Desk',     icon: '📈' },
]

const TOOL_ITEMS = [
  { path: '/decisions',  label: 'Decision Log',    icon: '📋' },
  { path: '/weekly-ops', label: 'Weekly Ops',      icon: '🔍' },
  { path: '/qbr',        label: 'QBR',             icon: '📊' },
  { path: '/sops',       label: 'SOPs',            icon: '📖' },
  { path: '/settings',   label: 'Settings',        icon: '⚙️' },
]

function Sidebar({ open, onClose }) {
  const location = useLocation()
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <nav className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🏢</span>
          <div>
            <div className="sidebar-brand-name">Me, Inc.</div>
            <div className="sidebar-brand-sub">CEO Dashboard</div>
          </div>
        </div>

        <div className="sidebar-section-label">DEPARTMENTS</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: '1rem' }}>TOOLS</div>
        {TOOL_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">Me, Inc. v1.0</div>
          <div className="sidebar-footer-text">Sprint 1 · May–Jul 2026</div>
        </div>
      </nav>
    </>
  )
}

function Header({ onMenuClick }) {
  const location = useLocation()
  const all = [...NAV_ITEMS, ...TOOL_ITEMS]
  const current = all.find(item =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  )
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <div className="topbar-title">{current?.icon} {current?.label ?? 'Me, Inc.'}</div>
    </header>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AppProvider>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-body">
          <Header onMenuClick={() => setSidebarOpen(v => !v)} />
          <main className="app-main">
            <Routes>
              <Route path="/"               element={<Dashboard />} />
              <Route path="/health"         element={<Health />} />
              <Route path="/language"       element={<Language />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/finance"        element={<Finance />} />
              <Route path="/trading"        element={<Trading />} />
              <Route path="/decisions"      element={<Decisions />} />
              <Route path="/weekly-ops"     element={<WeeklyOps />} />
              <Route path="/qbr"            element={<QBR />} />
              <Route path="/sops"           element={<SOPs />} />
              <Route path="/sops/:slug"     element={<SOPs />} />
              <Route path="/settings"       element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </AppProvider>
  )
}
