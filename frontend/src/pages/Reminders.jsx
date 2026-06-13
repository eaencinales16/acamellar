import React, { useEffect, useState } from 'react';

const EMPTY = { title: '', message: '', scheduled_at: '', application_id: '' };

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(null);

  const load = () => fetch('/api/reminders').then(r => r.json()).then(setReminders);
  useEffect(() => {
    load();
    fetch('/api/applications').then(r => r.json()).then(setApps);
  }, []);

  const submit = async e => {
    e.preventDefault();
    await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const del = async id => {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
    load();
  };

  const sendNow = async id => {
    setSending(id);
    try {
      const res = await fetch(`/api/reminders/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.error) alert(data.error);
      else { alert('Reminder sent!'); load(); }
    } finally { setSending(null); }
  };

  const upcoming = reminders.filter(r => !r.sent);
  const sent = reminders.filter(r => r.sent);

  const quickReminders = [
    { title: 'Follow up on application', message: 'Time to follow up on your recent application! Send a brief check-in email.' },
    { title: 'Apply to 3 new jobs today', message: 'Hit your daily application goal — find and apply to 3 new positions today.' },
    { title: 'Reach out to a connection', message: 'Pick one person from your connections list and send them a message today.' },
    { title: 'Update your LinkedIn', message: 'Spend 15 minutes updating your LinkedIn profile and engaging with posts.' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Reminders</h1>
          <p className="text-stone-500 text-sm">A daily digest is sent to your email every morning at 8am</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-camel-600 hover:bg-camel-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Reminder
        </button>
      </div>

      {/* Quick reminder templates */}
      <div className="bg-camel-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-camel-700 uppercase tracking-wide">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {quickReminders.map(qr => (
            <button key={qr.title} onClick={() => { setForm(f => ({ ...f, title: qr.title, message: qr.message })); setShowForm(true); }} className="text-xs bg-white border border-camel-200 text-camel-700 px-3 py-1.5 rounded-full hover:bg-camel-100 transition-colors">
              {qr.title}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold">New Reminder</h2>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" placeholder="Follow up with recruiter" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Message *</label>
              <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" placeholder="What do you want to be reminded about?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">When *</label>
              <input required type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Linked Application (optional)</label>
              <select value={form.application_id} onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400">
                <option value="">None</option>
                {apps.map(a => <option key={a.id} value={a.id}>{a.position} at {a.company}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-camel-600 hover:bg-camel-700 text-white rounded-lg font-medium">Create</button>
            </div>
          </form>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-2">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between items-start gap-3">
                <div>
                  <div className="font-medium text-sm">{r.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{r.message}</div>
                  <div className="text-xs text-camel-600 mt-1">📅 {new Date(r.scheduled_at).toLocaleString()}{r.company ? ` · ${r.company}` : ''}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => sendNow(r.id)} disabled={sending === r.id} className="text-xs bg-camel-100 text-camel-700 hover:bg-camel-200 disabled:opacity-50 px-3 py-1 rounded-full transition-colors">
                    {sending === r.id ? 'Sending...' : 'Send Now'}
                  </button>
                  <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-2">Sent ({sent.length})</h2>
          <div className="space-y-2">
            {sent.map(r => (
              <div key={r.id} className="bg-stone-50 rounded-xl border border-stone-200 p-4 flex justify-between items-start gap-3 opacity-70">
                <div>
                  <div className="font-medium text-sm line-through text-stone-400">{r.title}</div>
                  <div className="text-xs text-stone-400">Sent {r.sent_at ? new Date(r.sent_at).toLocaleString() : ''}</div>
                </div>
                <button onClick={() => del(r.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-16 text-stone-400 bg-white rounded-xl border border-stone-200">
          <div className="text-5xl mb-3">⏰</div>
          <p className="text-lg font-medium text-stone-600">No reminders yet</p>
          <p className="text-sm mt-1">Set reminders to stay accountable and follow up consistently</p>
        </div>
      )}
    </div>
  );
}
