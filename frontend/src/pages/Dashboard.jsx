import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import StatusBadge from '../components/StatusBadge';

const COACH_PROMPTS = [
  'What should I focus on today?',
  'Help me prioritize my applications',
  'Keep me accountable this week',
  'Where am I losing momentum?',
];

function CoachChat() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetch('/api/chat').then(r => r.json()).then(setChat); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, loading]);

  const send = async e => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input; setInput('');
    setChat(c => [...c, { role: 'user', content: msg, id: Date.now() }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setChat(c => [...c, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
    } finally { setLoading(false); }
  };

  const clear = async () => {
    if (!confirm('Clear your coach conversation?')) return;
    await fetch('/api/chat', { method: 'DELETE' });
    setChat([]);
  };

  return (
    <div className="card flex flex-col" style={{ height: '60vh', minHeight: 420 }}>
      <div className="px-5 py-3.5 border-b border-sand-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐪</span>
          <div>
            <h2 className="font-semibold text-ocean-800 text-sm">Talk to your Coach</h2>
            <p className="text-xs text-sand-400">Aware of your whole search · remembers this conversation</p>
          </div>
        </div>
        {chat.length > 0 && <button onClick={clear} className="text-xs text-sand-400 hover:text-coral-500 transition-colors">Clear</button>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chat.length === 0 && !loading && (
          <div className="text-center py-8 text-sand-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium text-sand-500">Your AI accountability partner is ready</p>
            <p className="text-xs mt-1 mb-4">Ask about strategy, motivation, or what to tackle next</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {COACH_PROMPTS.map(q => (
                <button key={q} onClick={() => setInput(q)} className="text-xs bg-ocean-50 text-ocean-600 border border-ocean-200 px-3 py-1.5 rounded-full hover:bg-ocean-100 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}
        {chat.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-ocean-600 text-white' : 'bg-sand-50 border border-sand-100 text-ocean-800'}`}>
              {msg.role === 'assistant'
                ? <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-sand-50 border border-sand-100 rounded-2xl px-4 py-3 text-sm text-sand-400 flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Your coach is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="p-3 border-t border-sand-100 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your coach anything..." className="input flex-1" disabled={loading} />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">Send</button>
      </form>
    </div>
  );
}

function mondayOf(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.toISOString().split('T')[0];
}

function WeeklyGoalStrip() {
  const [goal, setGoal] = useState(null);
  useEffect(() => {
    fetch(`/api/goals/week?week_start=${mondayOf(new Date())}`).then(r => r.json()).then(setGoal);
  }, []);
  if (!goal || (!goal.applications_target && !goal.connections_target)) {
    return (
      <Link to="/goals" className="block bg-gradient-to-r from-ocean-50 to-seafoam-50 border border-ocean-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-semibold text-ocean-800">Set your weekly goals</p>
            <p className="text-ocean-600 text-sm">Commit to a target for applications and outreach this week →</p>
          </div>
        </div>
      </Link>
    );
  }
  const bar = (done, target, color) => {
    const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
    return (
      <div className="flex-1">
        <div className="h-2.5 bg-sand-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };
  return (
    <Link to="/goals" className="block card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ocean-800 flex items-center gap-2">🎯 This Week's Goals</h2>
        <span className="text-ocean-500 text-sm">Manage →</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-sand-500 w-24 shrink-0">📋 Applications</span>
          {bar(goal.applications_done, goal.applications_target, 'bg-ocean-500')}
          <span className="text-sm font-bold text-ocean-800 w-12 text-right">{goal.applications_done}/{goal.applications_target || '—'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-sand-500 w-24 shrink-0">🤝 Contacted</span>
          {bar(goal.connections_done, goal.connections_target, 'bg-seafoam-500')}
          <span className="text-sm font-bold text-ocean-800 w-12 text-right">{goal.connections_done}/{goal.connections_target || '—'}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3 text-ocean-300">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm">Loading your dashboard...</span>
      </div>
    </div>
  );

  const { total, byStatus, connections, pendingOutreach, recentApps, upcomingReminders } = stats;
  const inProgress = (byStatus.find(s => s.status === 'phone_screen')?.count || 0)
    + (byStatus.find(s => s.status === 'interview')?.count || 0)
    + (byStatus.find(s => s.status === 'offer')?.count || 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ocean-800">Your Dashboard</h1>
        <p className="text-sand-500 mt-1">Stay aggressive. Stay consistent. The tide turns for those who keep swimming. 🐪</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: total,         color: 'bg-ocean-700',    text: 'text-white', sub: 'text-ocean-200' },
          { label: 'Active (In Progress)', value: inProgress,  color: 'bg-seafoam-500',  text: 'text-white', sub: 'text-seafoam-100' },
          { label: 'Connections',          value: connections,  color: 'bg-sand-400',     text: 'text-white', sub: 'text-sand-100' },
          { label: 'Pending Outreach',     value: pendingOutreach, color: 'bg-coral-400', text: 'text-white', sub: 'text-coral-100' },
        ].map(({ label, value, color, text, sub }) => (
          <div key={label} className={`${color} rounded-2xl p-5 shadow-md`}>
            <div className={`text-4xl font-bold font-display ${text}`}>{value}</div>
            <div className={`text-xs font-medium mt-1 ${sub}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Accountability nudge */}
      {total < 5 && (
        <div className="bg-gradient-to-r from-ocean-50 to-seafoam-50 border border-ocean-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-ocean-800">Time to pick up the pace!</p>
            <p className="text-ocean-600 text-sm mt-0.5">Aim for at least 5 applications this week. The ocean rewards those who dive in. <Link to="/applications" className="underline font-medium">+ Add one now</Link></p>
          </div>
        </div>
      )}

      {/* Weekly goals */}
      <WeeklyGoalStrip />

      {/* Coach chat */}
      <CoachChat />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent applications */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-ocean-800">Recent Applications</h2>
            <Link to="/applications" className="text-ocean-500 text-sm hover:text-ocean-700 font-medium">View all →</Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="text-center py-8 text-sand-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">No applications yet.</p>
              <Link to="/applications" className="text-ocean-500 underline text-sm">Add your first one</Link>
            </div>
          ) : (
            <ul className="divide-y divide-sand-100">
              {recentApps.map(app => (
                <li key={app.id}>
                  <Link to={`/applications/${app.id}`} className="flex justify-between items-center py-3 hover:bg-sand-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div>
                      <div className="font-medium text-sm text-ocean-800">{app.position}</div>
                      <div className="text-sand-500 text-xs">{app.company}</div>
                    </div>
                    <StatusBadge status={app.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming reminders */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-ocean-800">Upcoming Reminders</h2>
            <Link to="/reminders" className="text-ocean-500 text-sm hover:text-ocean-700 font-medium">View all →</Link>
          </div>
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8 text-sand-400">
              <div className="text-3xl mb-2">⏰</div>
              <p className="text-sm">No reminders set.</p>
              <Link to="/reminders" className="text-ocean-500 underline text-sm">Add one</Link>
            </div>
          ) : (
            <ul className="divide-y divide-sand-100">
              {upcomingReminders.map(r => (
                <li key={r.id} className="py-3">
                  <div className="text-sm font-medium text-ocean-800">{r.title}</div>
                  <div className="text-xs text-sand-400 mt-0.5">{new Date(r.scheduled_at).toLocaleString()}{r.company ? ` · ${r.company}` : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card p-5">
        <h2 className="font-semibold text-ocean-800 mb-4">Pipeline Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {byStatus.map(s => (
            <div key={s.status} className="flex items-center gap-2 bg-sand-50 rounded-xl px-3 py-2">
              <StatusBadge status={s.status} />
              <span className="text-ocean-700 text-sm font-bold">{s.count}</span>
            </div>
          ))}
          {byStatus.length === 0 && <p className="text-sand-400 text-sm">No applications tracked yet.</p>}
        </div>
      </div>
    </div>
  );
}
