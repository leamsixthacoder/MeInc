export const INITIAL_DATA = {
  meta: {
    version: '1.0',
    createdAt: new Date().toISOString(),
    lastExport: null
  },

  // ── BODY & HEALTH ─────────────────────────────────────────────────────────
  weightLog: [
    { id: 'w0', date: '2026-05-27', weight: 203, notes: 'Baseline measurement' }
  ],
  workoutLog: [],
  nutritionLog: [],

  // ── LANGUAGE ──────────────────────────────────────────────────────────────
  languageSessions: [],
  tutorSessions: [],

  // ── CERTIFICATIONS ────────────────────────────────────────────────────────
  certifications: [
    {
      id: 'ai900',
      code: 'AI-900',
      name: 'Azure AI Fundamentals',
      targetDate: '2026-06-30',
      status: 'in_progress',
      score: null,
      attempts: 0,
      passingScore: 700,
      studyHoursLogged: 0,
      practiceExamScores: []
    },
    {
      id: 'sc300',
      code: 'SC-300',
      name: 'Identity & Access Administrator',
      targetDate: '2026-07-31',
      status: 'not_started',
      score: null,
      attempts: 0,
      passingScore: 700,
      studyHoursLogged: 0,
      practiceExamScores: []
    }
  ],
  certStudySessions: [],

  // ── FINANCE ───────────────────────────────────────────────────────────────
  debts: [
    { id: 'bhd',       name: 'BHD',        balance: 48154,    initialBalance: 48154,    interestRate: 23.70, minimumPayment: 4465,  priority: 1, status: 'active',  currency: 'DOP' },
    { id: 'banesco',   name: 'Banesco',     balance: 70744,    initialBalance: 70744,    interestRate: 19.25, minimumPayment: 5300,  priority: 2, status: 'active',  currency: 'DOP' },
    { id: 'popular',   name: 'Popular',     balance: 146805,   initialBalance: 146805,   interestRate: 23.50, minimumPayment: 6500,  priority: 3, status: 'active',  currency: 'DOP' },
    { id: 'scotiabank',name: 'Scotiabank',  balance: 2711000,  initialBalance: 2711000,  interestRate: 13.50, minimumPayment: 52600, priority: 4, status: 'active',  currency: 'DOP' }
  ],
  debtPayments: [],

  incomeSources: [
    { id: 'phibro', name: 'Phibro',  type: 'salary',  monthlyAmount: 119000, currency: 'DOP', isAPEC: false },
    { id: 'gfr',    name: 'GFR',     type: 'salary',  monthlyAmount: 114000, currency: 'DOP', isAPEC: false },
    { id: 'apec',   name: 'APEC',    type: 'salary',  monthlyAmount: 48000,  currency: 'DOP', isAPEC: true  }
  ],
  incomeLog: [],

  optionsAccount: {
    currentValue: 2000,
    currency: 'USD',
    sprint1Target: 6000,
    yearTarget: 15000,
    paperTradesCompleted: 0,
    paperTradeTarget: 50,
    paperTradeWins: 0,
    liveTradingEnabled: false,
    history: []
  },

  givingAccount: {
    currentBalance: 0,
    targetPercent: 2,
    automatedMonthly: 5620,
    currency: 'DOP',
    history: []
  },

  // ── TRADING ───────────────────────────────────────────────────────────────
  evalAccounts: [
    {
      id: 'lucid_1',
      firm: 'Lucid Trading',
      label: 'Lucid #1',
      accountSize: 50000,
      status: 'not_started',
      startDate: null,
      targetPassDate: '2026-07-31',
      profitTarget: 3000,
      dailyLossLimit: 2000,
      totalDrawdownLimit: 4000,
      currentProfit: 0,
      daysTraded: 0,
      minTradingDays: 5,
      notes: ''
    }
  ],
  trades: [],
  tradingDailySummaries: [],

  // ── SPENDING ──────────────────────────────────────────────────────────────
  spendingEntries: [],
  // Per-category monthly budget targets (DOP)
  spendingBudgets: [
    { id: 'sb_housing',     category: 'Housing / Rent',      monthlyBudget: 0     },
    { id: 'sb_utilities',   category: 'Utilities',           monthlyBudget: 0     },
    { id: 'sb_transport',   category: 'Transport',           monthlyBudget: 0     },
    { id: 'sb_groceries',   category: 'Groceries',           monthlyBudget: 0     },
    { id: 'sb_dining',      category: 'Dining Out',          monthlyBudget: 0     },
    { id: 'sb_phone',       category: 'Phone / Mobile',      monthlyBudget: 0     },
    { id: 'sb_gym',         category: 'Gym & Health',        monthlyBudget: 0     },
    { id: 'sb_entertain',   category: 'Entertainment',       monthlyBudget: 0     },
    { id: 'sb_clothing',    category: 'Clothing',            monthlyBudget: 0     },
    { id: 'sb_personal',    category: 'Personal Care',       monthlyBudget: 0     },
    { id: 'sb_education',   category: 'Education / Certs',   monthlyBudget: 0     },
    { id: 'sb_trading',     category: 'Trading Fees',        monthlyBudget: 0     },
    { id: 'sb_medical',     category: 'Medical',             monthlyBudget: 0     },
    { id: 'sb_subs',        category: 'Subscriptions',       monthlyBudget: 0     },
    { id: 'sb_other',       category: 'Other',               monthlyBudget: 0     },
  ],

  // ── DAILY LOGS (checklist + all daily metrics) ────────────────────────────
  dailyLogs: [],

  // ── WEEKLY OPS REVIEWS ────────────────────────────────────────────────────
  weeklyOpsReviews: [],

  // ── SPRINTS ───────────────────────────────────────────────────────────────
  sprints: [
    {
      id: 'sp_2026_1',
      name: 'Sprint 1',
      year: 2026,
      dates: 'May–July 2026',
      reviewDueDate: '2026-08-01',
      status: 'active',
      milestones: [
        'Weight: 197 lb by Jul 31',
        'English: 60 hrs active study',
        'AI-900 pass by Jun 30',
        'SC-300 pass by Jul 31',
        'BHD + Banesco + Popular = $0 by Jun 15',
        'Lucid Trading $50k eval passed',
        'Options account: $6,000',
        'Non-APEC income ≥ 9,600 DOP/mo (20% of APEC)'
      ]
    },
    {
      id: 'sp_2026_2',
      name: 'Sprint 2',
      year: 2026,
      dates: 'August–October 2026',
      reviewDueDate: '2026-11-01',
      status: 'upcoming',
      milestones: [
        'Weight: 195 lb',
        'B2 English practice exam',
        'Start MS-102 or AZ-900',
        'Second funded account eval passed',
        'Scotiabank: reduce by 500,000 DOP',
        'Options account: $10,000',
        'Non-APEC income ≥ 24,000 DOP/mo (50% of APEC)'
      ]
    },
    {
      id: 'sp_2026_wu',
      name: 'Wrap-up',
      year: 2026,
      dates: 'November–December 2026',
      reviewDueDate: '2027-01-15',
      status: 'upcoming',
      milestones: [
        'Maintain 195 lb',
        'Official B2 English exam passed',
        'Both funded accounts live: $400–$1,000/day total',
        'Scotiabank ≤ 2,200,000 DOP',
        'Options account: $15,000',
        'Non-APEC income ≥ 52,700 DOP/mo (replace APEC 100%)'
      ]
    }
  ],

  // ── QUARTERLY BUSINESS REVIEWS ────────────────────────────────────────────
  quarterlyReviews: [],

  // ── DECISION LOG ──────────────────────────────────────────────────────────
  decisions: [
    {
      id: 'D001',
      date: '2026-05-27',
      category: 'Strategy',
      decision: 'Adopt 5-year strategic plan: 188–195 lb lean, B2 English, 3 certifications, $12k–$25k monthly trading income, debt-free, 10% giving.',
      rationale: 'Needed a long-term compass to prioritize daily actions.',
      expectedOutcome: 'Clear roadmap, measurable KPIs, annual goals broken into sprints.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D002',
      date: '2026-05-27',
      category: 'Finance',
      decision: 'Execute debt snowball: pay BHD → Banesco → Popular by June 15, 2026.',
      rationale: '3-job income (281k DOP/month) makes small loans trivial. Psychological wins create momentum.',
      expectedOutcome: 'Zero balance on three loans by June 15; cash flow freed for Scotiabank.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D003',
      date: '2026-05-27',
      category: 'Career',
      decision: 'Certify in AI-900 (by June 30) and SC-300 (by July 31). MS-900 retired — skip.',
      rationale: 'AI and identity/access are high-demand skills. Quick wins build confidence.',
      expectedOutcome: 'Two certifications added to resume within 2 months.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D004',
      date: '2026-05-27',
      category: 'Trading',
      decision: 'Open Lucid Trading $50k funded evaluation account. Risk: 2% daily loss, 1% per trade.',
      rationale: 'Funded accounts provide non-APEC income without personal capital risk.',
      expectedOutcome: 'Pass evaluation by July 31; generate $200–$500/day per account.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D005',
      date: '2026-05-27',
      category: 'Health',
      decision: 'Target weight 197 lb by July 31 (from 203 lb) via calorie deficit and 85% workout compliance.',
      rationale: 'Leaner body improves energy, discipline, and mental clarity.',
      expectedOutcome: 'Visible progress toward 195 lb year-end goal.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D006',
      date: '2026-05-27',
      category: 'Language',
      decision: 'Complete 60 hours of active English study by July 31, with weekly tutor.',
      rationale: 'B2 English required for 5-year vision. Structured hours prevent plateau.',
      expectedOutcome: 'Improved fluency, measurable by practice exam.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D007',
      date: '2026-05-27',
      category: 'Investing',
      decision: 'Options account: no live trades until 50 paper trades with 70% win rate. Risk ≤2%.',
      rationale: 'Avoid blowing account. Paper trading proves strategy.',
      expectedOutcome: 'Grow account from $2k to $6k by July 31.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D008',
      date: '2026-05-27',
      category: 'Giving',
      decision: 'Automate 2% of each paycheck to separate giving account. Ramp to 5% in August.',
      rationale: '10% giving is core value. Starting small builds habit.',
      expectedOutcome: 'Consistent donations without last-minute decisions.',
      status: 'Active',
      actualOutcome: ''
    },
    {
      id: 'D009',
      date: '2026-05-27',
      category: 'Timeline',
      decision: 'Compress Year 1 goals into May–December (two sprints + wrap-up).',
      rationale: 'Started in May, cannot lose 7 months. Realistic given income.',
      expectedOutcome: 'Achieve annual goals by Dec 31, 2026.',
      status: 'Active',
      actualOutcome: ''
    }
  ]
}

export const SPENDING_CATEGORIES = [
  'Housing / Rent', 'Utilities', 'Transport', 'Groceries', 'Dining Out',
  'Phone / Mobile', 'Gym & Health', 'Entertainment', 'Clothing', 'Personal Care',
  'Education / Certs', 'Trading Fees', 'Medical', 'Subscriptions', 'Other'
]

export const DECISION_CATEGORIES = [
  'Strategy', 'Finance', 'Career', 'Trading', 'Health',
  'Language', 'Investing', 'Giving', 'Timeline', 'Other'
]

export const DECISION_STATUSES = ['Proposed', 'Active', 'Completed', 'Abandoned']

export const EVAL_ACCOUNT_STATUSES = ['not_started', 'in_progress', 'passed', 'failed', 'reset']

// Firm defaults — account size drives profit target and daily loss limit
export const FIRM_PRESETS = {
  'Lucid Trading': [
    { accountSize: 50000, profitTarget: 3000, dailyLossLimit: 2000, totalDrawdownLimit: 4000, minTradingDays: 5 }
  ],
  'TradeIfy': [
    { accountSize: 25000, profitTarget: 1500, dailyLossLimit: 1000, totalDrawdownLimit: 2000, minTradingDays: 5 }
  ],
  'TopStep': [
    { accountSize: 50000, profitTarget: 3000, dailyLossLimit: 2000, totalDrawdownLimit: 4000, minTradingDays: 5 }
  ],
  'Custom': [
    { accountSize: 50000, profitTarget: 3000, dailyLossLimit: 2000, totalDrawdownLimit: 4000, minTradingDays: 5 }
  ]
}

// Derive defaults from account size (universal rule)
export function accountSizeDefaults(size) {
  if (size <= 25000) return { profitTarget: 1500, dailyLossLimit: 1000, totalDrawdownLimit: 2000 }
  return { profitTarget: 3000, dailyLossLimit: 2000, totalDrawdownLimit: 4000 }
}

export const DEPT_META = {
  health:   { icon: '💪', color: '#3fb950', label: 'Body & Health' },
  language: { icon: '🗣️', color: '#58a6ff', label: 'Mind & Language' },
  certs:    { icon: '🎓', color: '#d2a8ff', label: 'Certifications' },
  finance:  { icon: '💰', color: '#f0c674', label: 'Financial Sovereignty' },
  trading:  { icon: '📈', color: '#56d364', label: 'Trading Desk' },
  impact:   { icon: '🙏', color: '#ff7b72', label: 'Impact & Purpose' }
}
