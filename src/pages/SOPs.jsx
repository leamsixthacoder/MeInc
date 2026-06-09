import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function SopStep({ time, title, detail, color = 'var(--blue)' }) {
  return (
    <div className="sop-step">
      <div className="sop-step-time" style={{ color }}>{time}</div>
      <div className="sop-step-content">
        <div className="sop-step-title">{title}</div>
        {detail && <div className="sop-step-detail">{detail}</div>}
      </div>
    </div>
  )
}

function MorningRoutine() {
  return (
    <div className="sop-content">
      <div className="alert alert-info section"><span>⏰</span><div>Start: 5:00 AM · End: ~8:10 AM (gym days) · Key rule: No snooze, no phone scrolling on wake</div></div>
      <h2>Morning Routine — Step by Step</h2>
      {[
        { time: '5:00–5:00', title: 'Wake without snooze', detail: 'Immediate sit up, feet on floor. No phone scrolling.' },
        { time: '5:00–5:15', title: 'Prayer (15 min)', detail: 'Structured prayer: gratitude, intercession, guidance for the day.' },
        { time: '5:15–5:25', title: 'Meditation + Breathing (10 min)', detail: 'Box breathing or mindfulness. Clear mental clutter.' },
        { time: '5:25–5:35', title: 'Bible / Words of Knowledge (10 min)', detail: 'Read assigned passage, journal one verse + application.' },
        { time: '5:35–5:40', title: '20 pushups + 20 situps + stretch (5 min)', detail: 'No excuses. Use proper form. Stretch hamstrings, shoulders, hips.' },
        { time: '5:40–5:45', title: 'Hydrate — 500 ml water', detail: 'Drink full glass. Optional: add lemon or electrolytes.' },
        { time: '5:45–6:00', title: 'Shower & dress (15 min)', detail: 'Cold or warm. Dress for gym (if gym day) or work.' },
        { time: '6:00–6:10', title: 'Review tasks & Daily KPI dashboard (10 min)', detail: 'Open task manager. Identify top 3 priorities. Check weight, debt progress, trading status.' },
        { time: '6:10–6:55', title: 'Study market strategies + trading plan (45 min)', detail: 'Analyze charts (futures). Write daily trading plan: entry, exit, stop loss. Check Lucid Trading eval rules.' },
        { time: '6:55–7:55', title: 'Gym workout (1 hour) — Wed–Sun only', detail: 'Mon & Tue = active recovery (walk/stretch). Follow current fitness split.' },
        { time: '7:55–8:10', title: 'Shower, dress, prepare breakfast (15 min)', detail: 'Protein + oats. Eat after shower.' },
      ].map(s => <SopStep key={s.time} {...s} />)}

      <h2>Gym Schedule</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
        {[
          ['Wednesday', 'Upper Strength',           'Bench, Pullups, OHP, Rows, Dips'],
          ['Thursday',  'Lower Strength',            'Squat, Deadlift, Leg Press, Curls, Calves'],
          ['Friday',    'Upper Hypertrophy',         'Incline DB, Lat Pulldown, Laterals, Triceps, Biceps'],
          ['Saturday',  'Lower Hypertrophy + Core',  'Goblet Squat, RDL, Lunges, Extensions, Leg Raises'],
          ['Sunday',    'Full Body / Cardio',        '5–6 compound + 30 min steady state'],
          ['Monday',    'Active Recovery',           '30 min walk + stretching'],
          ['Tuesday',   'Active Recovery',           'Mobility or yoga'],
        ].map(([day, type, notes]) => (
          <div key={day} style={{ padding: '.5rem .7rem', background: 'var(--bg-2)', borderRadius: 4 }}>
            <div className="font-bold text-sm">{day}</div>
            <div className="text-xs text-blue">{type}</div>
            <div className="text-xs text-muted">{notes}</div>
          </div>
        ))}
      </div>

      <h2>Success Criteria</h2>
      <ul>
        <li>Wake at 5:00 AM without snooze ≥90% of days</li>
        <li>Weight trends down 1 lb/week</li>
        <li>Trading plan written before market open</li>
        <li>Daily KPI dashboard reviewed before 7:00 AM</li>
        <li>Gym compliance ≥85% (Wed–Sun)</li>
      </ul>
    </div>
  )
}

function EveningRoutine() {
  return (
    <div className="sop-content">
      <div className="alert alert-info section"><span>🌙</span><div>Time Block: 7:00 PM – 10:30 PM · Key rule: In bed by 10:30 PM ≥90% of nights</div></div>
      <h2>Evening Routine — Step by Step</h2>
      {[
        { time: '7:00–7:15', title: 'Shower & dress (15 min)', detail: 'Warm shower to signal body wind-down. Change into comfortable, clean clothes.' },
        { time: '7:15–7:30', title: 'Dinner (15 min)', detail: 'Eat without screens. Focus on protein + vegetables. Log in nutrition tracker.' },
        { time: '7:30–7:40', title: 'Review tasks completed/pending (10 min)', detail: 'Mark done items. Move unfinished to tomorrow. Note any blockers.' },
        { time: '7:40–8:10', title: 'Language study session (30 min) — weekdays only', detail: 'Active study: speaking, listening, or vocabulary. See Language_Study_Session SOP.' },
        { time: '8:10–9:40', title: 'Personal work (1.5 hours)', detail: 'Deep work on certification (AI-900 / SC-300), trading journal review, or options study. No distractions.' },
        { time: '9:40–9:55', title: 'Set tomorrow\'s priorities & tasks (15 min)', detail: 'Write top 3 priorities for tomorrow. Assign time blocks. Ensure Morning Routine can start smoothly.' },
        { time: '9:55–10:10', title: 'Prayer / Meditation (15 min)', detail: 'Evening prayer (thanksgiving, examen). Meditation to release stress.' },
        { time: '10:10–10:25', title: 'No screens before bed (15–25 min)', detail: 'Read physical book, journal, or stretch. NO phone, TV, or computer.' },
        { time: '10:25–10:30', title: 'Prepare for sleep', detail: 'Brush teeth, set alarm for 5:00 AM, place phone away from bed.' },
        { time: '10:30', title: 'In bed, lights out', detail: 'Target sleep by 10:30 PM for 6.5 hours (wake at 5:00 AM).' },
      ].map(s => <SopStep key={s.time} {...s} color="var(--purple)" />)}

      <h2>Personal Work Ideas (8:10–9:40 PM)</h2>
      <ul>
        <li>Certification study (AI-900 or SC-300) — watch modules, take notes, do practice exams</li>
        <li>Trading journal — review today's Lucid Trading trades, document mistakes, update stats</li>
        <li>Debt tracking — update snowball spreadsheet, plan extra payments</li>
        <li>Options education — paper trading review, learn new strategy</li>
        <li>Side business — any project that generates non-APEC income</li>
      </ul>

      <h2>Weekend Adjustments</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
        {[['Saturday', 'Language optional (30 min or rest)', '1.5 hrs personal work (flexible)'],
          ['Sunday',   'Language optional or review week',   '1 hr personal work, focus on week planning']
        ].map(([day, lang, work]) => (
          <div key={day} style={{ padding: '.5rem .7rem', background: 'var(--bg-2)', borderRadius: 4 }}>
            <div className="font-bold text-sm">{day}</div>
            <div className="text-xs text-muted">{lang}</div>
            <div className="text-xs text-muted">{work}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TravelGuide() {
  return (
    <div className="sop-content">
      <div className="alert alert-warning section"><span>✈️</span><div>Travel is NOT an excuse to break SOPs. Execute all core routines even while away.</div></div>

      <h2>48 Hours Before Departure</h2>
      <ul>
        <li>Check if hotel/gym has a fitness center. If not, plan bodyweight circuit.</li>
        <li>Verify internet reliability for trading. Bring mobile hotspot as backup.</li>
        <li>Download offline study materials (certification videos, language podcasts, trading journals).</li>
        <li>Notify Lucid Trading if travelling to restricted jurisdiction (check platform).</li>
        <li>Print or save: Morning_Routine, Daily_CEO_Checklist, emergency contacts.</li>
      </ul>

      <h2>What to Pack — Core Execution Items</h2>
      {[
        {
          category: 'Morning / Spiritual', color: 'var(--purple)',
          items: ['Bible (physical or app)', 'Prayer journal / notebook', 'Meditation app downloaded offline', 'Travel alarm clock', 'Earplugs / sleep mask'],
        },
        {
          category: 'Gym & Active Recovery', color: 'var(--green)',
          items: ['Resistance bands (light/medium/heavy)', 'Jump rope (optional)', 'Running shoes', 'Workout clothes (2–3 sets, quick-dry)', 'Foam roller / lacrosse ball (travel size)', 'Workout log (Google Sheets / notebook)'],
        },
        {
          category: 'Trading & Market Prep', color: 'var(--blue)',
          items: ['Laptop (with Lucid Trading platform installed)', 'Charger + universal plug adapter', 'Mobile hotspot / phone tethering', 'Economic calendar bookmarked', 'Trade journal (digital offline mode)', 'Physical notebook for pre-market plan'],
        },
        {
          category: 'Certification & Language', color: 'var(--amber)',
          items: ['Laptop/tablet', 'Noise-cancelling headphones', 'Anki app with downloaded decks', 'Pocket notebook + pen', 'Tutor session pre-scheduled (video call)', 'PDF study guides offline'],
        },
        {
          category: 'Nutrition & Hydration', color: 'var(--red)',
          items: ['Protein powder (single-serving packs)', 'Shaker bottle', 'Reusable 1L water bottle', 'Healthy snacks: nuts, protein bars, beef jerky', 'MyFitnessPal with offline entries'],
        },
      ].map(section => (
        <div key={section.category} style={{ marginBottom: '.75rem' }}>
          <h3 style={{ color: section.color }}>{section.category}</h3>
          <ul>
            {section.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}

      <h2>Hotel Room Bodyweight Circuit (No Gym)</h2>
      <ul>
        <li>20 pushups + 20 situps + 20 squats × 3 rounds</li>
        <li>Band rows for back</li>
        <li>Band overhead press</li>
        <li>15 min jump rope or high knees</li>
      </ul>

      <h2>First 24 Hours Upon Arrival</h2>
      {[
        { time: 'Arrive', title: 'Unpack trading setup', detail: 'Test internet connection, Lucid Trading platform access.' },
        { time: 'Day 1',  title: 'Locate gym or plan circuit', detail: 'Find hotel gym or identify bodyweight area.' },
        { time: 'Day 1',  title: 'Grocery run', detail: 'Buy: Greek yogurt, oats, fruit, eggs, bottled water.' },
        { time: 'Night',  title: 'Set alarms for 5:00 AM local', detail: 'Account for time zone change.' },
        { time: 'Day 1',  title: 'Update checklist', detail: 'Note any location-specific adjustments (gym hours, local emergency numbers).' },
      ].map(s => <SopStep key={s.time + s.title} {...s} color="var(--amber)" />)}

      <h2>Post-Trip Debrief (within 2 days of return)</h2>
      <ul>
        <li>Log any travel disruptions in Decision Log</li>
        <li>Note what packing items were missing or unnecessary — update list</li>
        <li>Catch up on any missed study/trading days using the weekend</li>
      </ul>
    </div>
  )
}

const SOPS = {
  morning:  { label: 'Morning Routine',  icon: '🌅', component: MorningRoutine },
  evening:  { label: 'Evening Routine',  icon: '🌙', component: EveningRoutine },
  travel:   { label: 'Travel Guide',     icon: '✈️', component: TravelGuide },
}

export default function SOPs() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [active, setActive] = useState(slug || 'morning')

  const ActiveSop = SOPS[active]?.component

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📖 Standard Operating Procedures</div>
        <div className="page-subtitle">Reference workflows and routines — your execution playbook</div>
      </div>

      <div className="sop-nav">
        {Object.entries(SOPS).map(([key, sop]) => (
          <button
            key={key}
            className={`btn ${active === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActive(key)}
          >
            {sop.icon} {sop.label}
          </button>
        ))}
      </div>

      {ActiveSop && <ActiveSop />}
    </div>
  )
}
