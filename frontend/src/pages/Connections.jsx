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
  useEffect(() => { load(); fetch('/api/applications').then(r => r.json()).then(setApps); }, []);

  const submit = async e => {
    e.preventDefault();
    await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(EMPTY); setShowForm(false); load();
  };

  const toggleOutreach = async conn => {
    await fetch(`/api/connections/${conn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reached_out: conn.reached_out ? 0 : 1, outreach_date: conn.reached_out ? null : new Date().toISOString().split('T')[0] }) });
    load();
  };

  const saveOutcome = async conn => {
    await fetch(`/api/connections/${conn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outcome: editOutcome }) });
    setEditId(null); load();
  };

  const del = async id => { if (!confirm('Delete this connection?')) return; await fetch(`/api/connections/${id}`, { method: 'DELETE' }); load(); };

  const pending = connections.filter(c => !c.reached_out);
  const reached = connections.filter(c => c.reached_out);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-ocean-800">Connections</h1>
          <p className="text-sand-500 text-sm mt-0.5">{pending.length} pending outreach · {reached.length} contacted</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5 px-5">+ Add Connection</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ocean-800">Add Connection</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-sand-400 hover:text-sand-600 text-xl">×</button>
            </div>
            {[['name','Name *',true],['title','Title',false],['company','Company',false],['linkedin_url','LinkedIn URL',false],['email','Email',false]].map(([f,l,req]) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">{l}</label>
                <input required={req} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="input" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-ocean-600 mb-1">Linked Application</label>
              <select value={form.application_id} onChange={e => setForm(p => ({ ...p, application_id: e.target.value }))} className="input">
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.position} at {a.company}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ocean-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="input" />
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
              <button type="submit" className="btn-primary text-sm py-2">Add Connection</button>
            </div>
          </form>
        </div>
      )}

      {connections.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-5xl mb-3">🤝</div>
          <p className="text-lg font-medium text-sand-600">No connections yet</p>
          <p className="text-sm text-sand-400 mt-1">Add people you know at companies you're targeting</p>
          <button onClick={() => setShowForm(true)} className="mt-5 btn-primary text-sm py-2">+ Add First Connection</button>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-coral-500 uppercase tracking-wider mb-3">⚠ Pending Outreach ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map(conn => <ConnCard key={conn.id} conn={conn} onToggle={toggleOutreach} onDelete={del} onEditOutcome={c => { setEditId(c.id); setEditOutcome(c.outcome || ''); }} editId={editId} editOutcome={editOutcome} setEditOutcome={setEditOutcome} onSaveOutcome={saveOutcome} />)}
              </div>
            </div>
          )}
          {reached.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-seafoam-600 uppercase tracking-wider mb-3">✓ Reached Out ({reached.length})</h2>
              <div className="space-y-2">
                {reached.map(conn => <ConnCard key={conn.id} conn={conn} onToggle={toggleOutreach} onDelete={del} onEditOutcome={c => { setEditId(c.id); setEditOutcome(c.outcome || ''); }} editId={editId} editOutcome={editOutcome} setEditOutcome={setEditOutcome} onSaveOutcome={saveOutcome} />)}
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
    <div className="card p-4">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="font-semibold text-ocean-800">{conn.name}</div>
          {conn.title && <div className="text-sm text-sand-500">{conn.title}{conn.company ? ` · ${conn.company}` : ''}</div>}
          <div className="flex gap-3 mt-1.5 text-xs">
            {conn.linkedin_url && <a href={conn.linkedin_url} target="_blank" rel="noreferrer" className="text-ocean-500 hover:underline font-medium">LinkedIn ↗</a>}
            {conn.email && <a href={`mailto:${conn.email}`} className="text-ocean-500 hover:underline">{conn.email}</a>}
            {conn.app_company && <Link to={`/applications/${conn.application_id}`} className="text-sand-400 hover:text-sand-600">{conn.position} @ {conn.app_company}</Link>}
          </div>
          {conn.outreach_date && <p className="text-xs text-sand-400 mt-1">Reached out: {conn.outreach_date}</p>}
          {conn.notes && <p className="text-xs text-sand-400 mt-1">{conn.notes}</p>}
          {editId === conn.id ? (
            <div className="flex gap-2 mt-2">
              <input value={editOutcome} onChange={e => setEditOutcome(e.target.value)} placeholder="Outcome (e.g. referral, coffee chat...)" className="flex-1 border border-sand-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ocean-300" />
              <button onClick={() => onSaveOutcome(conn)} className="text-xs bg-ocean-600 text-white px-3 py-1 rounded-lg">Save</button>
              <button onClick={() => onSaveOutcome({ ...conn })} className="text-xs text-sand-400 px-2">×</button>
            </div>
          ) : conn.outcome ? (
            <p className="text-xs text-seafoam-600 mt-1 cursor-pointer hover:underline font-medium" onClick={() => onEditOutcome(conn)}>✓ {conn.outcome}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => onToggle(conn)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${conn.reached_out ? 'bg-seafoam-100 text-seafoam-700 hover:bg-seafoam-200' : 'bg-sand-100 text-sand-600 hover:bg-ocean-100 hover:text-ocean-700'}`}>
            {conn.reached_out ? '✓ Reached Out' : 'Mark Reached Out'}
          </button>
          {!conn.outcome && conn.reached_out && (
            <button onClick={() => onEditOutcome(conn)} className="text-xs text-ocean-500 hover:underline">Add outcome</button>
          )}
          <button onClick={() => onDelete(conn.id)} className="text-xs text-coral-400 hover:text-coral-600">Delete</button>
        </div>
      </div>
    </div>
  );
}
