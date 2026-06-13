import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  const { total, byStatus, connections, pendingOutreach, recentApps, upcomingReminders } = stats;
  const inProgress = (byStatus.find(s => s.status === 'phone_screen')?.count || 0) +
    (byStatus.find(s => s.status === 'interview')?.count || 0) +
    (byStatus.find(s => s.status === 'offer')?.count || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Your Job Search Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Stay aggressive. Stay consistent. 🐪</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: total, color: 'bg-camel-100 text-camel-800' },
          { label: 'Active (In Progress)', value: inProgress, color: 'bg-orange-100 text-orange-800' },
          { label: 'Connections', value: connections, color: 'bg-blue-100 text-blue-800' },
          { label: 'Pending Outreach', value: pendingOutreach, color: 'bg-red-100 text-red-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <div className="text-3xl font-bold">{value}</div>
            <div className="text-sm font-medium mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Accountability nudge */}
      {total < 5 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-800">Time to pick up the pace!</p>
            <p className="text-red-600 text-sm">Aim for at least 5 applications this week. Add more now — <Link to="/applications" className="underline">+ New Application</Link>.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent applications */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-stone-700">Recent Applications</h2>
            <Link to="/applications" className="text-camel-600 text-sm hover:underline">View all</Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">No applications yet. <Link to="/applications" className="text-camel-600 underline">Add one!</Link></p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentApps.map(app => (
                <li key={app.id} className="py-2">
                  <Link to={`/applications/${app.id}`} className="flex justify-between items-center hover:bg-stone-50 -mx-2 px-2 rounded">
                    <div>
                      <div className="font-medium text-sm">{app.position}</div>
                      <div className="text-stone-500 text-xs">{app.company}</div>
                    </div>
                    <StatusBadge status={app.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-stone-700">Upcoming Reminders</h2>
            <Link to="/reminders" className="text-camel-600 text-sm hover:underline">View all</Link>
          </div>
          {upcomingReminders.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">No reminders set. <Link to="/reminders" className="text-camel-600 underline">Add one!</Link></p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {upcomingReminders.map(r => (
                <li key={r.id} className="py-2">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-stone-500">{new Date(r.scheduled_at).toLocaleString()}{r.company ? ` · ${r.company}` : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
        <h2 className="font-semibold text-stone-700 mb-3">Application Status Breakdown</h2>
        <div className="flex flex-wrap gap-3">
          {byStatus.map(s => (
            <div key={s.status} className="flex items-center gap-2">
              <StatusBadge status={s.status} />
              <span className="text-stone-600 text-sm font-semibold">{s.count}</span>
            </div>
          ))}
          {byStatus.length === 0 && <p className="text-stone-400 text-sm">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
