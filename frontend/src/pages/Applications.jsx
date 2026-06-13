import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge, { STATUSES } from '../components/StatusBadge';

const EMPTY = { company: '', position: '', job_url: '', status: 'researching', applied_date: '', notes: '' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const load = () => fetch('/api/applications').then(r => r.json()).then(setApps);
  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const created = await res.json();
    setShowForm(false);
    setForm(EMPTY);
    navigate(`/applications/${created.id}`);
  };

  const filtered = filter ? apps.filter(a => a.status === filter) : apps;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-ocean-800">Applications</h1>
          <p className="text-sand-500 text-sm mt-0.5">{apps.length} total · {apps.filter(a => ['phone_screen','interview','offer'].includes(a.status)).length} active</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5 px-5">
          + New Application
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!filter ? 'bg-ocean-600 text-white border-ocean-600 shadow-sm' : 'border-sand-300 text-sand-600 hover:bg-sand-100'}`}>
          All ({apps.length})
        </button>
        {STATUSES.map(s => {
          const count = apps.filter(a => a.status === s).length;
          if (!count && filter !== s) return null;
          return (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === s ? 'bg-ocean-600 text-white border-ocean-600 shadow-sm' : 'border-sand-300 text-sand-600 hover:bg-sand-100'}`}>
              {s.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* New Application Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ocean-800">New Application</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-sand-400 hover:text-sand-600 text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Company *</label>
                <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input" placeholder="Google" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Position *</label>
                <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="input" placeholder="Software Engineer" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Job URL</label>
                <input value={form.job_url} onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Applied Date</label>
                <input type="date" value={form.applied_date} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} className="input" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="input" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
              <button type="submit" className="btn-primary text-sm py-2">Create & Open →</button>
            </div>
          </form>
        </div>
      )}

      {/* Applications table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sand-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg font-medium text-sand-500">No applications yet</p>
            <p className="text-sm mt-1">Every journey starts with one application</p>
            <button onClick={() => setShowForm(true)} className="mt-4 btn-primary text-sm py-2">+ Add Your First</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ocean-50 text-ocean-500 text-xs uppercase tracking-wide border-b border-sand-100">
              <tr>
                <th className="text-left px-5 py-3">Company / Position</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Applied</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-ocean-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-ocean-800">{app.position}</div>
                    <div className="text-sand-500 text-xs">{app.company}</div>
                    <div className="md:hidden mt-1"><StatusBadge status={app.status} /></div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell"><StatusBadge status={app.status} /></td>
                  <td className="px-5 py-3.5 text-sand-500 hidden md:table-cell">{app.applied_date || '—'}</td>
                  <td className="px-5 py-3.5 text-sand-400 text-xs hidden lg:table-cell">{new Date(app.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
