import React, { useEffect, useState } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '', resume: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => setProfile({ name: data.name || '', email: data.email || '', resume: data.resume || '' }));
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
        <h1 className="text-2xl font-bold text-stone-800">Your Profile</h1>
        <p className="text-stone-500 text-sm mt-1">Your info and base resume are used for AI-tailored documents</p>
      </div>

      <form onSubmit={save} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
          <input
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400"
            placeholder="Angelica Encinales"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email for Reminders</label>
          <input
            type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400"
            placeholder="ea.encinales@gmail.com"
          />
          <p className="text-xs text-stone-400 mt-1">Daily accountability digest and reminders will be sent here</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Base Resume</label>
          <p className="text-xs text-stone-400 mb-2">Paste your full resume here. This is the starting point for AI tailoring.</p>
          <textarea
            value={profile.resume}
            onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))}
            rows={20}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-camel-400"
            placeholder="Paste your full resume here..."
          />
          {!profile.resume && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
              ⚠️ You need to add your resume before you can use AI resume tailoring and cover letter generation.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="bg-camel-600 hover:bg-camel-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ Saved!</span>}
        </div>
      </form>

      <div className="bg-camel-50 rounded-xl p-4 border border-camel-200">
        <h2 className="text-sm font-semibold text-camel-800 mb-2">🐪 How A Camellar Works</h2>
        <ul className="text-sm text-camel-700 space-y-1 list-disc list-inside">
          <li>Add a job application with the company and position</li>
          <li>Paste the full job listing in the "Job Listing" tab</li>
          <li>Click "Tailor Resume" or "Generate Cover Letter" — Claude does the work</li>
          <li>Track connections and mark when you've reached out</li>
          <li>Set reminders for follow-ups and daily goals</li>
          <li>Chat with Claude in any application for interview prep</li>
          <li>Get a daily digest email every morning to stay accountable</li>
        </ul>
      </div>
    </div>
  );
}
