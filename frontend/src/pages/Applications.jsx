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
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const created = await res.json();
    setShowForm(false);
    setForm(EMPTY);
    navigate(`/applications/${created.id}`);
  };

  const filtered = filter ? apps.filter(a => a.status === filter) : apps;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-stone-800">Applications</h1>
        <button onClick={() => setShowForm(true)} className="bg-camel-600 hover:bg-camel-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Application
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!filter ? 'bg-camel-600 text-white border-camel-600' : 'border-stone-300 text-stone-600 hover:bg-stone-100'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === s ? 'bg-camel-600 text-white border-camel-600' : 'border-stone-300 text-stone-600 hover:bg-stone-100'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* New Application Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold">New Application</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Company *</label>
                <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" placeholder="Google" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Position *</label>
                <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" placeholder="Software Engineer" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Job URL</label>
                <input value={form.job_url} onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Applied Date</label>
                <input type="date" value={form.applied_date} onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-camel-600 hover:bg-camel-700 text-white rounded-lg font-medium">Create & Open</button>
            </div>
          </form>
        </div>
      )}

      {/* Application List */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <div className="text-4xl mb-2">📋</div>
            <p>No applications yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-camel-600 underline text-sm">Add your first one</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Company / Position</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Applied</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{app.position}</div>
                    <div className="text-stone-500">{app.company}</div>
                    <div className="md:hidden mt-1"><StatusBadge status={app.status} /></div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-stone-500 hidden md:table-cell">{app.applied_date || '—'}</td>
                  <td className="px-4 py-3 text-stone-400 hidden lg:table-cell">{new Date(app.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
