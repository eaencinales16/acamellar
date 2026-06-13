import React, { useEffect, useState } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '', resume: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data =>
      setProfile({ name: data.name || '', email: data.email || '', resume: data.resume || '' })
    );
  }, []);

  const save = async e => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ocean-800">Your Profile</h1>
        <p className="text-sand-500 mt-1">Your info and base resume power the AI tailoring features</p>
      </div>

      <form onSubmit={save} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-ocean-700 mb-1.5">Your Name</label>
          <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="input" placeholder="Angelica Encinales" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ocean-700 mb-1.5">Email for Reminders</label>
          <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            className="input" placeholder="ea.encinales@gmail.com" />
          <p className="text-xs text-sand-400 mt-1">Daily accountability digest and custom reminders will be sent here</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-ocean-700 mb-1.5">Base Resume</label>
          <p className="text-xs text-sand-400 mb-2">Paste your full resume here — this is the foundation Claude tailors from for each role.</p>
          <textarea value={profile.resume} onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))}
            rows={20} className="input font-mono text-xs"
            placeholder="Paste your full resume here..." />
          {!profile.resume && (
            <p className="text-xs text-coral-600 bg-coral-50 border border-coral-200 rounded-xl px-3 py-2 mt-2">
              ⚠️ Add your resume here before using AI tailoring and cover letter features.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-seafoam-600 text-sm font-medium">✓ Saved!</span>}
        </div>
      </form>

      <div className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-2xl p-5 border border-ocean-100">
        <h2 className="text-sm font-bold text-ocean-800 mb-3 flex items-center gap-2"><span>🐪</span> How A Camellar Works</h2>
        <ul className="text-sm text-ocean-700 space-y-2">
          {[
            'Add a job application with company and position',
            'Paste the full job listing in the "Job Listing" tab',
            'Click "Tailor Resume" or "Generate Cover Letter" — Claude does the rest',
            'Track connections and mark when you\'ve reached out',
            'Set reminders for follow-ups and daily goals',
            'Chat with Claude in any application for interview prep',
            'Receive a daily digest email every morning at 8am',
          ].map(s => (
            <li key={s} className="flex items-start gap-2">
              <span className="text-seafoam-500 mt-0.5">›</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
