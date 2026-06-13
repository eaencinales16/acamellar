import React, { useEffect, useState } from 'react';

// Monday (local) of the week containing `d`, as YYYY-MM-DD.
function mondayOf(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Monday
  date.setDate(date.getDate() - day);
  return date.toISOString().split('T')[0];
}
function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function prettyRange(weekStart) {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(addDays(weekStart, 6) + 'T00:00:00');
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function ProgressBar({ done, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const hit = target > 0 && done >= target;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-2xl font-bold font-display text-ocean-800">{done}<span className="text-sand-400 text-lg font-sans"> / {target || '—'}</span></span>
        {hit && <span className="text-seafoam-600 text-xs font-bold">✓ Goal hit!</span>}
      </div>
      <div className="h-3 bg-sand-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Goals() {
  const thisWeek = mondayOf(new Date());
  const [week, setWeek] = useState(thisWeek);
  const [goal, setGoal] = useState(null);
  const [history, setHistory] = useState([]);
  const [appTarget, setAppTarget] = useState('');
  const [connTarget, setConnTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const loadWeek = w => fetch(`/api/goals/week?week_start=${w}`).then(r => r.json()).then(g => {
    setGoal(g);
    setAppTarget(g.applications_target || '');
    setConnTarget(g.connections_target || '');
    setNotes(g.notes || '');
  });
  const loadHistory = () => fetch('/api/goals').then(r => r.json()).then(setHistory);

  useEffect(() => { loadWeek(week); }, [week]);
  useEffect(() => { loadHistory(); }, []);

  const save = async e => {
    e.preventDefault();
    await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: week, applications_target: Number(appTarget) || 0, connections_target: Number(connTarget) || 0, notes })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    loadWeek(week);
    loadHistory();
  };

  const isThisWeek = week === thisWeek;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ocean-800">Weekly Goals</h1>
        <p className="text-sand-500 mt-1">Set targets for applications submitted and people contacted. Progress tracks automatically. 🐪</p>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between bg-white card px-4 py-3">
        <button onClick={() => setWeek(addDays(week, -7))} className="text-ocean-600 hover:bg-sand-50 rounded-lg px-3 py-1.5 text-sm font-medium">← Prev</button>
        <div className="text-center">
          <div className="font-semibold text-ocean-800">{prettyRange(week)}</div>
          <div className="text-xs text-sand-400">{isThisWeek ? 'This week' : (week > thisWeek ? 'Upcoming' : 'Past week')}</div>
        </div>
        <button onClick={() => setWeek(addDays(week, 7))} className="text-ocean-600 hover:bg-sand-50 rounded-lg px-3 py-1.5 text-sm font-medium">Next →</button>
      </div>

      {/* Current week progress */}
      {goal && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📋</span>
              <h2 className="font-semibold text-ocean-800">Applications Submitted</h2>
            </div>
            <ProgressBar done={goal.applications_done} target={goal.applications_target} color="bg-ocean-500" />
            <p className="text-xs text-sand-400 mt-2">Counts applications with an applied date this week.</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🤝</span>
              <h2 className="font-semibold text-ocean-800">People Contacted</h2>
            </div>
            <ProgressBar done={goal.connections_done} target={goal.connections_target} color="bg-seafoam-500" />
            <p className="text-xs text-sand-400 mt-2">Counts connections you marked reached out this week.</p>
          </div>
        </div>
      )}

      {/* Set targets */}
      <form onSubmit={save} className="card p-5 space-y-4">
        <h2 className="font-semibold text-ocean-800">Set targets for {prettyRange(week)}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ocean-600 mb-1">📋 Applications target</label>
            <input type="number" min="0" value={appTarget} onChange={e => setAppTarget(e.target.value)} className="input" placeholder="e.g. 5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ocean-600 mb-1">🤝 People to contact</label>
            <input type="number" min="0" value={connTarget} onChange={e => setConnTarget(e.target.value)} className="input" placeholder="e.g. 3" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ocean-600 mb-1">Notes / focus for the week (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input" placeholder="e.g. Focus on product roles, follow up with 2 recruiters" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Save Goals</button>
          {saved && <span className="text-seafoam-600 text-sm font-medium">✓ Saved!</span>}
        </div>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-ocean-800 mb-3">Goal History</h2>
          <div className="space-y-2">
            {history.map(g => {
              const appsHit = g.applications_target > 0 && g.applications_done >= g.applications_target;
              const connHit = g.connections_target > 0 && g.connections_done >= g.connections_target;
              return (
                <button key={g.id} onClick={() => setWeek(g.week_start)}
                  className="w-full flex items-center justify-between gap-3 bg-sand-50 hover:bg-sand-100 rounded-xl px-4 py-3 text-left transition-colors">
                  <div>
                    <div className="text-sm font-medium text-ocean-800">{prettyRange(g.week_start)}</div>
                    {g.notes && <div className="text-xs text-sand-400 truncate max-w-xs">{g.notes}</div>}
                  </div>
                  <div className="flex gap-4 text-sm shrink-0">
                    <span className={appsHit ? 'text-seafoam-600 font-semibold' : 'text-sand-600'}>📋 {g.applications_done}/{g.applications_target || '—'}</span>
                    <span className={connHit ? 'text-seafoam-600 font-semibold' : 'text-sand-600'}>🤝 {g.connections_done}/{g.connections_target || '—'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
