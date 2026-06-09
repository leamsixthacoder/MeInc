import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { loadData, saveData } from '../utils/storage.js'
import { todayISO } from '../utils/dateUtils.js'

const AppContext = createContext(null)

// ── Helpers ──────────────────────────────────────────────────────────────────
function newId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function getTodayLog(state) {
  const today = todayISO()
  return state.dailyLogs.find(l => l.date === today) || null
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // DAILY CHECKLIST
    case 'UPSERT_DAILY_LOG': {
      const today = todayISO()
      const existing = state.dailyLogs.findIndex(l => l.date === today)
      const base = existing >= 0 ? state.dailyLogs[existing] : {
        id: newId('dl'), date: today,
        morning: { wake5am: false, prayer: false, meditation: false, bible: false, exercise: false, water: false, shower: false, kpiReview: false, marketPrep: false, gym: false },
        evening: { shower: false, dinner: false, taskReview: false, languageStudy: false, certStudy: false, priorities: false, prayer: false, noScreens: false, bed1030: false },
        kpis: { workout: false, englishStudy: false, certStudy: false, tradingTarget: false, debtPayment: false },
        nutrition: { calories: null, protein: null, water: null, tracked: false },
        tradingPnl: null, weight: null, notes: ''
      }
      const updated = { ...base, ...action.payload }
      const logs = existing >= 0
        ? state.dailyLogs.map((l, i) => i === existing ? updated : l)
        : [...state.dailyLogs, updated]
      return { ...state, dailyLogs: logs }
    }

    // HEALTH
    case 'LOG_WEIGHT': {
      const entry = { id: newId('w'), date: action.payload.date, weight: action.payload.weight, notes: action.payload.notes || '' }
      const filtered = state.weightLog.filter(w => w.date !== entry.date)
      return { ...state, weightLog: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) }
    }
    case 'DELETE_WEIGHT': {
      return { ...state, weightLog: state.weightLog.filter(w => w.id !== action.payload) }
    }
    case 'LOG_WORKOUT': {
      const entry = { id: newId('wo'), ...action.payload }
      const filtered = state.workoutLog.filter(w => w.date !== entry.date)
      return { ...state, workoutLog: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) }
    }
    case 'DELETE_WORKOUT': {
      return { ...state, workoutLog: state.workoutLog.filter(w => w.id !== action.payload) }
    }
    case 'LOG_NUTRITION': {
      const entry = { id: newId('nt'), ...action.payload }
      const filtered = state.nutritionLog.filter(n => n.date !== entry.date)
      return { ...state, nutritionLog: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) }
    }
    case 'DELETE_NUTRITION': {
      return { ...state, nutritionLog: state.nutritionLog.filter(n => n.id !== action.payload) }
    }

    // LANGUAGE
    case 'LOG_LANGUAGE_SESSION': {
      const entry = { id: newId('ls'), ...action.payload }
      return { ...state, languageSessions: [...state.languageSessions, entry] }
    }
    case 'DELETE_LANGUAGE_SESSION': {
      return { ...state, languageSessions: state.languageSessions.filter(s => s.id !== action.payload) }
    }
    case 'LOG_TUTOR_SESSION': {
      const entry = { id: newId('ts'), ...action.payload }
      return { ...state, tutorSessions: [...state.tutorSessions, entry] }
    }
    case 'DELETE_TUTOR_SESSION': {
      return { ...state, tutorSessions: state.tutorSessions.filter(s => s.id !== action.payload) }
    }

    // CERTIFICATIONS
    case 'LOG_CERT_STUDY': {
      const entry = { id: newId('cs'), ...action.payload }
      const cert = state.certifications.find(c => c.id === entry.certId)
      const updatedCerts = cert
        ? state.certifications.map(c => c.id === entry.certId
            ? { ...c, studyHoursLogged: (c.studyHoursLogged || 0) + (entry.durationMinutes / 60) }
            : c)
        : state.certifications
      return { ...state, certStudySessions: [...state.certStudySessions, entry], certifications: updatedCerts }
    }
    case 'DELETE_CERT_STUDY': {
      const session = state.certStudySessions.find(s => s.id === action.payload)
      const updatedCerts = session
        ? state.certifications.map(c => c.id === session.certId
            ? { ...c, studyHoursLogged: Math.max(0, (c.studyHoursLogged || 0) - (session.durationMinutes / 60)) }
            : c)
        : state.certifications
      return { ...state, certStudySessions: state.certStudySessions.filter(s => s.id !== action.payload), certifications: updatedCerts }
    }
    case 'UPDATE_CERT': {
      return { ...state, certifications: state.certifications.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) }
    }

    // FINANCE
    case 'UPDATE_DEBT_BALANCE': {
      return { ...state, debts: state.debts.map(d => d.id === action.payload.id ? { ...d, balance: action.payload.balance, status: action.payload.balance <= 0 ? 'paid' : 'active' } : d) }
    }
    case 'ADD_DEBT_PAYMENT': {
      const entry = { id: newId('dp'), ...action.payload }
      const debt = state.debts.find(d => d.id === entry.debtId)
      const updatedDebts = debt
        ? state.debts.map(d => d.id === entry.debtId
            ? { ...d, balance: Math.max(0, d.balance - entry.amount), status: Math.max(0, d.balance - entry.amount) <= 0 ? 'paid' : 'active' }
            : d)
        : state.debts
      return { ...state, debtPayments: [...state.debtPayments, entry], debts: updatedDebts }
    }
    case 'DELETE_DEBT_PAYMENT': {
      const entry = state.debtPayments.find(p => p.id === action.payload)
      const updatedDebts = entry
        ? state.debts.map(d => d.id === entry.debtId ? { ...d, balance: d.balance + entry.amount, status: 'active' } : d)
        : state.debts
      return { ...state, debtPayments: state.debtPayments.filter(p => p.id !== action.payload), debts: updatedDebts }
    }
    case 'LOG_INCOME': {
      const entry = { id: newId('inc'), ...action.payload }
      return { ...state, incomeLog: [...state.incomeLog, entry] }
    }
    case 'DELETE_INCOME': {
      return { ...state, incomeLog: state.incomeLog.filter(i => i.id !== action.payload) }
    }
    case 'UPDATE_OPTIONS_ACCOUNT': {
      const histEntry = { date: todayISO(), value: action.payload.currentValue }
      return {
        ...state,
        optionsAccount: { ...state.optionsAccount, ...action.payload, history: [...(state.optionsAccount.history || []), histEntry] }
      }
    }
    case 'LOG_GIVING': {
      return {
        ...state,
        givingAccount: {
          ...state.givingAccount,
          currentBalance: state.givingAccount.currentBalance + action.payload.amount,
          history: [...(state.givingAccount.history || []), { id: newId('gv'), ...action.payload }]
        }
      }
    }

    // TRADING — eval accounts
    case 'ADD_EVAL_ACCOUNT': {
      const entry = { id: newId('ea'), ...action.payload }
      return { ...state, evalAccounts: [...(state.evalAccounts || []), entry] }
    }
    case 'UPDATE_EVAL_ACCOUNT': {
      return { ...state, evalAccounts: (state.evalAccounts || []).map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a) }
    }
    case 'DELETE_EVAL_ACCOUNT': {
      return { ...state, evalAccounts: (state.evalAccounts || []).filter(a => a.id !== action.payload) }
    }
    case 'ADD_TRADE': {
      const entry = { id: newId('tr'), ...action.payload }
      return { ...state, trades: [...state.trades, entry] }
    }
    case 'UPDATE_TRADE': {
      return { ...state, trades: state.trades.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    }
    case 'DELETE_TRADE': {
      return { ...state, trades: state.trades.filter(t => t.id !== action.payload) }
    }
    case 'UPSERT_DAILY_TRADING_SUMMARY': {
      const { date } = action.payload
      const existing = state.tradingDailySummaries.findIndex(s => s.date === date)
      const updated = existing >= 0
        ? state.tradingDailySummaries.map((s, i) => i === existing ? { ...s, ...action.payload } : s)
        : [...state.tradingDailySummaries, { id: newId('tds'), ...action.payload }]
      return { ...state, tradingDailySummaries: updated }
    }
    case 'DELETE_DAILY_TRADING_SUMMARY': {
      return { ...state, tradingDailySummaries: state.tradingDailySummaries.filter(s => s.id !== action.payload) }
    }

    // DECISIONS
    case 'ADD_DECISION': {
      const nextNum = state.decisions.length + 1
      const id = `D${String(nextNum).padStart(3, '0')}`
      const entry = { id, ...action.payload }
      return { ...state, decisions: [...state.decisions, entry] }
    }
    case 'UPDATE_DECISION': {
      return { ...state, decisions: state.decisions.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) }
    }
    case 'DELETE_DECISION': {
      return { ...state, decisions: state.decisions.filter(d => d.id !== action.payload) }
    }

    // WEEKLY OPS
    case 'SAVE_WEEKLY_OPS': {
      const weekStart = action.payload.weekStart
      const existing = state.weeklyOpsReviews.findIndex(r => r.weekStart === weekStart)
      const entry = { id: newId('wor'), ...action.payload }
      const updated = existing >= 0
        ? state.weeklyOpsReviews.map((r, i) => i === existing ? entry : r)
        : [...state.weeklyOpsReviews, entry]
      return { ...state, weeklyOpsReviews: updated }
    }

    // SPENDING
    case 'ADD_SPENDING': {
      const entry = { id: newId('sp'), ...action.payload }
      return { ...state, spendingEntries: [...(state.spendingEntries || []), entry] }
    }
    case 'UPDATE_SPENDING': {
      return { ...state, spendingEntries: (state.spendingEntries || []).map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
    }
    case 'DELETE_SPENDING': {
      return { ...state, spendingEntries: (state.spendingEntries || []).filter(e => e.id !== action.payload) }
    }
    case 'UPSERT_SPENDING_BUDGET': {
      const { category, monthlyBudget } = action.payload
      const existing = (state.spendingBudgets || []).findIndex(b => b.category === category)
      const budgets = existing >= 0
        ? (state.spendingBudgets || []).map((b, i) => i === existing ? { ...b, monthlyBudget } : b)
        : [...(state.spendingBudgets || []), { id: newId('sb'), category, monthlyBudget }]
      return { ...state, spendingBudgets: budgets }
    }

    // SPRINTS
    case 'ADD_SPRINT': {
      const entry = { id: newId('sp'), ...action.payload }
      return { ...state, sprints: [...(state.sprints || []), entry] }
    }
    case 'UPDATE_SPRINT': {
      return { ...state, sprints: (state.sprints || []).map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) }
    }
    case 'DELETE_SPRINT': {
      return { ...state, sprints: (state.sprints || []).filter(s => s.id !== action.payload) }
    }

    // QBR
    case 'SAVE_QBR': {
      const entry = { id: newId('qbr'), savedAt: todayISO(), ...action.payload }
      return { ...state, quarterlyReviews: [...state.quarterlyReviews, entry] }
    }
    case 'UPDATE_QBR': {
      return { ...state, quarterlyReviews: state.quarterlyReviews.map(q => q.id === action.payload.id ? { ...q, ...action.payload } : q) }
    }
    case 'DELETE_QBR': {
      return { ...state, quarterlyReviews: state.quarterlyReviews.filter(q => q.id !== action.payload) }
    }

    // IMPORT / RESET
    case 'IMPORT_DATA':
      return { ...action.payload }
    case 'RESET_DATA':
      return structuredClone(loadData())

    default:
      return state
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadData())

  useEffect(() => {
    saveData(state)
  }, [state])

  const getTodayLogMemo = useCallback(() => getTodayLog(state), [state])

  return (
    <AppContext.Provider value={{ state, dispatch, getTodayLog: getTodayLogMemo }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
