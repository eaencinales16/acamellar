import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const EMPTY = { name: '', title: '', company: '', linkedin_url: '', email: '', notes: '', application_id: '' };

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [editOutcome, setEditOutcome] = useState('');

  const load = () => fetch('/api/connections').then(r => r.json()).then(setConnections);
  const loadApps = () => fetch('/api/applications').then(r => r.json()).then(setApps);
  useEffect(() => { load(); loadApps(); }, []);

  const submit = async e => {
    e.preventDefault();
    await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const toggleOutreach = async conn => {
    await fetch(`/api/connections/${conn.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reached_out: conn.reached_out ? 0 : 1, outreach_date: conn.reached_out ? null : new Date().toISOString().split('T')[0] })
    });
    load();
  };

  const saveOutcome = async (conn) => {
    await fetch(`/api/connections/${conn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: editOutcome }) });
    setEditId(null);
    load();
  };

  const del = async id => {
    if (!confirm('Delete this connection?')) return;
    await fetch(`/api/connections/${id}`, { method: 'DELETE' });
    load();
  };

  const pending = connections.filter(c => !c.reached_out);
  const reached = connections.filter(c => c.reached_out);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Connections</h1>
          <p className="text-stone-500 text-sm">Track who you know and your outreach</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-camel-600 hover:bg-camel-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Connection
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">Add Connection</h2>
            {[['name', 'Name *', true], ['title', 'Title'], ['company', 'Company'], ['linkedin_url', 'LinkedIn URL'], ['email', 'Email']].map(([f, l, req]) => (
              <div key={f}>
                <label className="block text-xs font-medium text-stone-600 mb-1">{l}</label>
                <input required={!!req} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Linked Application</label>
              <select value={form.application_id} onChange={e => setForm(p => ({ ...p, application_id: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400">
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.position} at {a.company}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-camel-600 hover:bg-camel-700 text-white rounded-lg font-medium">Add</button>
            </div>
          </form>
        </div>
      )}

      {connections.length === 0 ? (
        <div className="text-center py-16 text-stone-400 bg-white rounded-xl border border-stone-200">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-lg font-medium text-stone-600">No connections yet</p>
          <p className="text-sm mt-1">Add people you know at companies you're targeting</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-camel-600 underline text-sm">Add first connection</button>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">⚠️ Pending Outreach ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map(conn => <ConnCard key={conn.id} conn={conn} onToggle={toggleOutreach} onDelete={del} onEditOutcome={(c) => { setEditId(c.id); setEditOutcome(c.outcome || ''); }} editId={editId} editOutcome={editOutcome} setEditOutcome={setEditOutcome} onSaveOutcome={saveOutcome} />)}
              </div>
            </div>
          )}
          {reached.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">✓ Reached Out ({reached.length})</h2>
              <div className="space-y-2">
                {reached.map(conn => <ConnCard key={conn.id} conn={conn} onToggle={toggleOutreach} onDelete={del} onEditOutcome={(c) => { setEditId(c.id); setEditOutcome(c.outcome || ''); }} editId={editId} editOutcome={editOutcome} setEditOutcome={setEditOutcome} onSaveOutcome={saveOutcome} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnCard({ conn, onToggle, onDelete, onEditOutcome, editId, editOutcome, setEditOutcome, onSaveOutcome }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="font-medium">{conn.name}</div>
          {conn.title && <div className="text-sm text-stone-500">{conn.title}{conn.company ? ` · ${conn.company}` : ''}</div>}
          <div className="flex gap-3 mt-1 text-xs">
            {conn.linkedin_url && <a href={conn.linkedin_url} target="_blank" rel="noreferrer" className="text-camel-600 hover:underline">LinkedIn ↗</a>}
            {conn.email && <a href={`mailto:${conn.email}`} className="text-camel-600 hover:underline">{conn.email}</a>}
            {conn.app_company && <Link to={`/applications/${conn.application_id}`} className="text-stone-400 hover:text-stone-600">{conn.position} @ {conn.app_company}</Link>}
          </div>
          {conn.outreach_date && <p className="text-xs text-stone-400 mt-1">Reached out: {conn.outreach_date}</p>}
          {conn.notes && <p className="text-xs text-stone-400 mt-1">{conn.notes}</p>}
          {editId === conn.id ? (
            <div className="flex gap-2 mt-2">
              <input value={editOutcome} onChange={e => setEditOutcome(e.target.value)} placeholder="Outcome (e.g. referral, coffee chat...)" className="flex-1 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-camel-400" />
              <button onClick={() => onSaveOutcome(conn)} className="text-xs bg-camel-600 text-white px-3 py-1 rounded">Save</button>
              <button onClick={() => onSaveOutcome({ ...conn, id: conn.id })} className="text-xs text-stone-400 px-2">Cancel</button>
            </div>
          ) : conn.outcome ? (
            <p className="text-xs text-green-600 mt-1 cursor-pointer hover:underline" onClick={() => onEditOutcome(conn)}>Outcome: {conn.outcome}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => onToggle(conn)} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${conn.reached_out ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-600 hover:bg-camel-100 hover:text-camel-700'}`}>
            {conn.reached_out ? '✓ Reached Out' : 'Mark Reached Out'}
          </button>
          {!conn.outcome && conn.reached_out && (
            <button onClick={() => onEditOutcome(conn)} className="text-xs text-camel-600 hover:underline">Add outcome</button>
          )}
          <button onClick={() => onDelete(conn.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
