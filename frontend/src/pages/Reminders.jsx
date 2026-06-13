import React, { useEffect, useState } from 'react';

const EMPTY = { title: '', message: '', scheduled_at: '', application_id: '' };

const QUICK = [
  { title: 'Follow up on application', message: 'Time to follow up on your recent application — send a brief check-in email today.' },
  { title: 'Apply to 3 new jobs today', message: 'Hit your daily goal — find and apply to 3 new positions before end of day.' },
  { title: 'Reach out to a connection', message: 'Pick one person from your connections list and send them a message today.' },
  { title: 'Update your LinkedIn', message: 'Spend 15 minutes updating your LinkedIn profile and engaging with posts in your field.' },
];

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(null);

  const load = () => fetch('/api/reminders').then(r => r.json()).then(setReminders);
  useEffect(() => { load(); fetch('/api/applications').then(r => r.json()).then(setApps); }, []);

  const submit = async e => {
    e.preventDefault();
    await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(EMPTY); setShowForm(false); load();
  };

  const del = async id => { await fetch(`/api/reminders/${id}`, { method: 'DELETE' }); load(); };

  const sendNow = async id => {
    setSending(id);
    try {
      const res = await fetch(`/api/reminders/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.error) alert(data.error); else { alert('Reminder sent! Check your email.'); load(); }
    } finally { setSending(null); }
  };

  const upcoming = reminders.filter(r => !r.sent);
  const sent = reminders.filter(r => r.sent);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-ocean-800">Reminders</h1>
          <p className="text-sand-500 text-sm mt-0.5">A daily digest goes to your email every morning at 8am automatically</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2.5 px-5">+ New Reminder</button>
      </div>

      {/* Quick add */}
      <div className="bg-gradient-to-r from-ocean-50 to-seafoam-50 rounded-2xl p-5 border border-ocean-100">
        <p className="text-xs font-bold text-ocean-600 uppercase tracking-wider mb-3">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(q => (
            <button key={q.title} onClick={() => { setForm(f => ({ ...f, title: q.title, message: q.message })); setShowForm(true); }}
              className="text-xs bg-white border border-ocean-200 text-ocean-700 px-3 py-1.5 rounded-full hover:bg-ocean-50 hover:border-ocean-400 transition-all font-medium">
              {q.title}
            </button>
          ))}
        </div>
      </div>

      {/* New Reminder Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ocean-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ocean-800">New Reminder</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-sand-400 hover:text-sand-600 text-xl">×</button>
            </div>
            {[['title','Title *',true,'text','Follow up with recruiter'],['message','Message *',true,'textarea','What should this remind you to do?']].map(([f,l,req,type,ph]) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">{l}</label>
                {type === 'textarea'
                  ? <textarea required={req} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} rows={3} placeholder={ph} className="input" />
                  : <input required={req} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={ph} className="input" />
                }
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-ocean-600 mb-1">When *</label>
              <input required type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ocean-600 mb-1">Linked Application (optional)</label>
              <select value={form.application_id} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))} className="input">
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.position} at {a.company}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
              <button type="submit" className="btn-primary text-sm py-2">Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-ocean-600 uppercase tracking-wider">Upcoming ({upcoming.length})</h2>
          {upcoming.map(r => (
            <div key={r.id} className="card p-4 flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-ocean-800 text-sm">{r.title}</div>
                <div className="text-sand-500 text-xs mt-0.5">{r.message}</div>
                <div className="text-ocean-500 text-xs mt-1.5 font-medium">📅 {new Date(r.scheduled_at).toLocaleString()}{r.company ? ` · ${r.company}` : ''}</div>
              </div>
              <div className="flex gap-2 shrink-0 items-start">
                <button onClick={() => sendNow(r.id)} disabled={sending === r.id} className="text-xs bg-ocean-100 text-ocean-700 hover:bg-ocean-200 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium transition-colors">
                  {sending === r.id ? '...' : 'Send Now'}
                </button>
                <button onClick={() => del(r.id)} className="text-xs text-coral-400 hover:text-coral-600 py-1.5">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent */}
      {sent.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-sand-400 uppercase tracking-wider">Sent ({sent.length})</h2>
          {sent.map(r => (
            <div key={r.id} className="bg-sand-50 rounded-xl border border-sand-100 p-4 flex justify-between items-start gap-3 opacity-60">
              <div>
                <div className="text-sm font-medium line-through text-sand-500">{r.title}</div>
                <div className="text-xs text-sand-400">Sent {r.sent_at ? new Date(r.sent_at).toLocaleString() : ''}</div>
              </div>
              <button onClick={() => del(r.id)} className="text-xs text-coral-400 hover:text-coral-600 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-16 card">
          <div className="text-5xl mb-3">⏰</div>
          <p className="text-lg font-medium text-sand-600">No reminders yet</p>
          <p className="text-sm text-sand-400 mt-1">Set reminders to stay accountable and follow up consistently</p>
          <button onClick={() => setShowForm(true)} className="mt-5 btn-primary text-sm py-2">+ Add First Reminder</button>
        </div>
      )}
    </div>
  );
}
