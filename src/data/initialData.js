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

  givingAccount: {
    currentBalance: 0,
    targetPercent: 2,
    automatedMonthly: 5620,
    currency: 'DOP',
    history: []
  },

  // ── SPENDING ──────────────────────────────────────────────────────────────
  spendingEntries: [],
  spendingCategories: [
    'Housing / Rent', 'Utilities', 'Transport', 'Groceries', 'Dining Out',
    'Phone / Mobile', 'Gym & Health', 'Entertainment', 'Clothing', 'Personal Care',
    'Education / Certs', 'Medical', 'Subscriptions', 'Other'
  ],
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
    { id: 'sb_medical',     category: 'Medical',             monthlyBudget: 0     },
    { id: 'sb_subs',        category: 'Subscriptions',       monthlyBudget: 0     },
    { id: 'sb_other',       category: 'Other',               monthlyBudget: 0     },
  ],
  // Exchange rate for converting between spending currencies — update as the rate changes
  financeSettings: {
    usdToDopRate: 60
  },

  // ── CHECKLIST ITEMS (dynamic no-negotiables) ─────────────────────────────
  checklistItems: {
    morning: [
      { id: 'cm_wake',   key: 'wake5am',    label: 'Wake at 5:00 AM (no snooze)' },
      { id: 'cm_pray',   key: 'prayer',     label: 'Prayer — 15 min' },
      { id: 'cm_med',    key: 'meditation', label: 'Meditation + breathing — 10 min' },
      { id: 'cm_bible',  key: 'bible',      label: 'Bible / words of knowledge — 10 min' },
      { id: 'cm_ex',     key: 'exercise',   label: '20 pushups + 20 situps + stretch' },
      { id: 'cm_water',  key: 'water',      label: '500 ml water' },
      { id: 'cm_shower', key: 'shower',     label: 'Shower & dress' },
      { id: 'cm_kpi',    key: 'kpiReview',  label: 'Review tasks & Daily KPI dashboard' },
      { id: 'cm_gym',    key: 'gym',        label: 'Gym workout (Road to Dunk Again)' },
    ],
    evening: [
      { id: 'ce_shower', key: 'shower',       label: 'Shower & dress' },
      { id: 'ce_dinner', key: 'dinner',       label: 'Dinner — tracked' },
      { id: 'ce_task',   key: 'taskReview',   label: 'Review tasks completed / pending' },
      { id: 'ce_lang',   key: 'languageStudy',label: 'Language study (30 min weekdays)' },
      { id: 'ce_cert',   key: 'certStudy',    label: 'Certification study (90 min)' },
      { id: 'ce_pri',    key: 'priorities',   label: "Set tomorrow's priorities" },
      { id: 'ce_pray',   key: 'prayer',       label: 'Prayer / meditation' },
      { id: 'ce_ns',     key: 'noScreens',    label: 'No screens 15 min before bed' },
      { id: 'ce_bed',    key: 'bed1030',      label: 'In bed by 10:30 PM' },
    ],
    kpis: [
      { id: 'ck_wo',  key: 'workout',       label: 'Workout completed' },
      { id: 'ck_en',  key: 'englishStudy',  label: 'English study (30 min)' },
      { id: 'ck_cs',  key: 'certStudy',     label: 'Certification study (90 min)' },
      { id: 'ck_dp',  key: 'debtPayment',   label: 'Debt payment made' },
    ]
  },

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
        'Scotiabank: reduce by 500,000 DOP',
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
        'Scotiabank ≤ 2,200,000 DOP',
        'Non-APEC income ≥ 52,700 DOP/mo (replace APEC 100%)'
      ]
    }
  ],

  // ── SOPs ──────────────────────────────────────────────────────────────────
  sops: [
    {
      id: 'morning', icon: '🌅', title: 'Morning Routine', color: '#4fa3f7',
      description: 'Start: 5:00 AM · End: ~7:25 AM · No snooze, no phone scrolling on wake',
      alertType: 'info',
      sections: [
        {
          id: 'ms', type: 'steps', title: 'Step by Step',
          items: [
            { id: 'ms1',  time: '5:00',       title: 'Wake without snooze',                   detail: 'Immediate sit up, feet on floor. No phone scrolling.' },
            { id: 'ms2',  time: '5:00–5:15',  title: 'Prayer (15 min)',                       detail: 'Structured prayer: gratitude, intercession, guidance for the day.' },
            { id: 'ms3',  time: '5:15–5:25',  title: 'Meditation + Breathing (10 min)',       detail: 'Box breathing or mindfulness. Clear mental clutter.' },
            { id: 'ms4',  time: '5:25–5:35',  title: 'Bible / Words of Knowledge (10 min)',   detail: 'Read assigned passage, journal one verse + application.' },
            { id: 'ms5',  time: '5:35–5:40',  title: '20 pushups + 20 situps + stretch',      detail: 'No excuses. Use proper form. Stretch hamstrings, shoulders, hips.' },
            { id: 'ms6',  time: '5:40–5:45',  title: 'Hydrate — 500 ml water',               detail: 'Drink full glass. Optional: add lemon or electrolytes.' },
            { id: 'ms7',  time: '5:45–6:00',  title: 'Shower & dress (15 min)',               detail: 'Cold or warm. Dress for gym (if gym day) or work.' },
            { id: 'ms8',  time: '6:00–6:10',  title: 'Review tasks & Daily KPI dashboard',    detail: 'Identify top 3 priorities. Check weight and debt status.' },
            { id: 'ms10', time: '6:10–7:10',  title: 'Gym workout (1 hour)',                  detail: 'Follow Road to Dunk Again program. See schedule below.' },
            { id: 'ms11', time: '7:10–7:25',  title: 'Shower, dress, breakfast (15 min)',     detail: 'Protein + oats. Eat after shower.' },
          ]
        },
        {
          id: 'mg', type: 'grid', title: 'Gym Schedule — Road to Dunk Again',
          items: [
            { id: 'mg1', primary: 'Monday',    secondary: 'Lower Strength + Tendon',  meta: 'Trap Bar Deadlift 4×5, Bulgarian Split Squat 3×8, RDL 3×8, Step-Ups 3×10, Seated Calf Raise 4×15, Tib Raises 3×20' },
            { id: 'mg2', primary: 'Tuesday',   secondary: 'Upper Strength',           meta: 'Pull-Ups 4 sets, Incline DB Bench 4×6–8, Barbell Rows 4×8, Shoulder Press 3×10, Face Pulls 3×15, Farmer Carries 3 rounds' },
            { id: 'mg3', primary: 'Wednesday', secondary: 'Athletic Conditioning',    meta: 'Bike Intervals 20–30 min (1 min hard / 2 min easy), Hip · Ankle · Calf · Hamstring Mobility' },
            { id: 'mg4', primary: 'Thursday',  secondary: 'Lower Explosive',          meta: 'Box Jumps 4×3, Broad Jumps 4×3, Goblet Squat 3×10, Single-Leg RDL 3×10, Hip Thrust 4×8, Isometric Calf Holds 3×30s' },
            { id: 'mg5', primary: 'Friday',    secondary: 'Upper Athletic',           meta: 'Weighted Pull-Ups 4×6–8, Flat Bench 4×5, Push Press 3×5, DB Rows 3×10, Lateral Raises 3×15, Med Ball Slams 3×10' },
            { id: 'mg6', primary: 'Saturday',  secondary: 'Mobility + Court Work',   meta: 'Form shooting, Layups, Footwork drills, Light approaches, 5–8 quality approach jumps' },
            { id: 'mg7', primary: 'Sunday',    secondary: 'Recovery',                meta: 'Walking, Stretching, Hydration, Sleep 8.5–9 hours' },
          ]
        },
        {
          id: 'ml', type: 'list', title: 'Success Criteria',
          items: [
            { id: 'ml1', text: 'Wake at 5:00 AM without snooze ≥90% of days' },
            { id: 'ml2', text: 'Weight trends down 1 lb/week' },
            { id: 'ml4', text: 'Daily KPI dashboard reviewed before 7:00 AM' },
            { id: 'ml5', text: 'Gym compliance ≥85% (7 days/week)' },
          ]
        }
      ]
    },
    {
      id: 'evening', icon: '🌙', title: 'Evening Routine', color: '#c084fc',
      description: 'Time Block: 7:00 PM – 10:30 PM · In bed by 10:30 PM ≥90% of nights',
      alertType: 'info',
      sections: [
        {
          id: 'es', type: 'steps', title: 'Step by Step',
          items: [
            { id: 'es1',  time: '7:00–7:15', title: 'Shower & dress (15 min)',               detail: 'Warm shower to signal body wind-down. Change into comfortable clothes.' },
            { id: 'es2',  time: '7:15–7:30', title: 'Dinner (15 min)',                       detail: 'Eat without screens. Protein + vegetables. Log in nutrition tracker.' },
            { id: 'es3',  time: '7:30–7:40', title: 'Review tasks (10 min)',                 detail: 'Mark done items. Move unfinished to tomorrow. Note any blockers.' },
            { id: 'es4',  time: '7:40–8:10', title: 'Language study (30 min) — weekdays',   detail: 'Active study: speaking, listening, or vocabulary.' },
            { id: 'es5',  time: '8:10–9:40', title: 'Personal work (1.5 hours)',             detail: 'Deep work on certification or side projects.' },
            { id: 'es6',  time: '9:40–9:55', title: "Set tomorrow's priorities (15 min)",   detail: 'Write top 3 priorities. Assign time blocks.' },
            { id: 'es7',  time: '9:55–10:10',title: 'Prayer / Meditation (15 min)',          detail: 'Evening prayer. Meditation to release stress.' },
            { id: 'es8',  time: '10:10–10:25',title: 'No screens before bed (15 min)',       detail: 'Read physical book, journal, or stretch. NO phone/TV/computer.' },
            { id: 'es9',  time: '10:25–10:30',title: 'Prepare for sleep',                   detail: 'Brush teeth, set 5:00 AM alarm, place phone away from bed.' },
            { id: 'es10', time: '10:30',      title: 'In bed, lights out',                   detail: 'Target 10:30 PM for 6.5 hours of sleep.' },
          ]
        },
        {
          id: 'ew', type: 'list', title: 'Personal Work Ideas (8:10–9:40 PM)',
          items: [
            { id: 'ew1', text: 'Certification study (AI-900 or SC-300) — modules, notes, practice exams' },
            { id: 'ew3', text: 'Debt tracking — update snowball, plan extra payments' },
            { id: 'ew5', text: 'Side business — any project that generates non-APEC income' },
          ]
        },
        {
          id: 'ewknd', type: 'grid', title: 'Weekend Adjustments',
          items: [
            { id: 'ewk1', primary: 'Saturday', secondary: 'Language optional (30 min or rest)', meta: '1.5 hrs personal work (flexible)' },
            { id: 'ewk2', primary: 'Sunday',   secondary: 'Language optional or week review',   meta: '1 hr personal work, focus on week planning' },
          ]
        }
      ]
    },
    {
      id: 'travel', icon: '✈️', title: 'Travel Guide', color: '#e5a820',
      description: 'Travel is NOT an excuse to break SOPs. Execute all core routines even while away.',
      alertType: 'warning',
      sections: [
        {
          id: 'tb', type: 'list', title: '48 Hours Before Departure',
          items: [
            { id: 'tb1', text: 'Check if hotel/gym has a fitness center. If not, plan bodyweight circuit.' },
            { id: 'tb3', text: 'Download offline study materials (certification videos, language podcasts).' },
            { id: 'tb5', text: 'Print or save: Morning_Routine, Daily_CEO_Checklist, emergency contacts.' },
          ]
        },
        {
          id: 'tp_gym', type: 'list', title: '💪 Gym & Active Recovery Pack',
          items: [
            { id: 'tpg1', text: 'Resistance bands (light/medium/heavy)' },
            { id: 'tpg2', text: 'Running shoes' },
            { id: 'tpg3', text: 'Workout clothes (2–3 sets, quick-dry)' },
            { id: 'tpg4', text: 'Jump rope (optional)' },
            { id: 'tpg5', text: 'Foam roller / lacrosse ball (travel size)' },
          ]
        },
        {
          id: 'tp_cert', type: 'list', title: '📚 Certification & Language Pack',
          items: [
            { id: 'tpc1', text: 'Laptop/tablet' },
            { id: 'tpc2', text: 'Noise-cancelling headphones' },
            { id: 'tpc3', text: 'Anki app with downloaded decks' },
            { id: 'tpc4', text: 'Tutor session pre-scheduled (video call)' },
            { id: 'tpc5', text: 'PDF study guides offline' },
          ]
        },
        {
          id: 'tc', type: 'list', title: 'Hotel Room Bodyweight Circuit (No Gym)',
          items: [
            { id: 'tc1', text: '20 pushups + 20 situps + 20 squats × 3 rounds' },
            { id: 'tc2', text: 'Band rows for back' },
            { id: 'tc3', text: 'Band overhead press' },
            { id: 'tc4', text: '15 min jump rope or high knees' },
          ]
        },
        {
          id: 'ta', type: 'steps', title: 'First 24 Hours Upon Arrival',
          items: [
            { id: 'ta2', time: 'Day 1',  title: 'Locate gym or plan circuit',   detail: 'Find hotel gym or identify bodyweight area.' },
            { id: 'ta3', time: 'Day 1',  title: 'Grocery run',                  detail: 'Buy: Greek yogurt, oats, fruit, eggs, bottled water.' },
            { id: 'ta4', time: 'Night',  title: 'Set alarms for 5:00 AM local', detail: 'Account for time zone change.' },
            { id: 'ta5', time: 'Day 1',  title: 'Update checklist',             detail: 'Note any location-specific adjustments (gym hours, local numbers).' },
          ]
        },
        {
          id: 'td', type: 'list', title: 'Post-Trip Debrief (within 2 days)',
          items: [
            { id: 'td1', text: 'Log any travel disruptions in Decision Log' },
            { id: 'td2', text: 'Note what packing items were missing or unnecessary — update list' },
            { id: 'td3', text: 'Catch up on any missed study days using the weekend' },
          ]
        }
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

export const DECISION_CATEGORIES = [
  'Strategy', 'Finance', 'Career', 'Health',
  'Language', 'Investing', 'Giving', 'Timeline', 'Other'
]

export const DECISION_STATUSES = ['Proposed', 'Active', 'Completed', 'Abandoned']

export const DEPT_META = {
  health:   { icon: '💪', color: '#3fb950', label: 'Body & Health' },
  language: { icon: '🗣️', color: '#58a6ff', label: 'Mind & Language' },
  certs:    { icon: '🎓', color: '#d2a8ff', label: 'Certifications' },
  finance:  { icon: '💰', color: '#f0c674', label: 'Financial Sovereignty' },
  impact:   { icon: '🙏', color: '#ff7b72', label: 'Impact & Purpose' }
}
