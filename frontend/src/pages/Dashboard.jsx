import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

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
