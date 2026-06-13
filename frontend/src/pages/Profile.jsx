import React, { useEffect, useState } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '', resume: '', writing_style: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const [examples, setExamples] = useState([]);
  const [exForm, setExForm] = useState({ doc_type: 'resume', label: '', content: '' });
  const [showExForm, setShowExForm] = useState(false);

  const loadExamples = () => fetch('/api/style-examples').then(r => r.json()).then(setExamples);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data =>
      setProfile({ name: data.name || '', email: data.email || '', resume: data.resume || '', writing_style: data.writing_style || '' })
    );
    loadExamples();
  }, []);

  const save = async e => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const addExample = async e => {
    e.preventDefault();
    if (!exForm.content.trim()) return;
    await fetch('/api/style-examples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exForm) });
    setExForm({ doc_type: 'resume', label: '', content: '' });
    setShowExForm(false);
    loadExamples();
  };

  const delExample = async id => {
    if (!confirm('Remove this voice sample?')) return;
    await fetch(`/api/style-examples/${id}`, { method: 'DELETE' });
    loadExamples();
  };

  const resumeExamples = examples.filter(e => e.doc_type === 'resume');
  const coverExamples = examples.filter(e => e.doc_type === 'cover_letter');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ocean-800">Your Profile</h1>
        <p className="text-sand-500 mt-1">Your info, resume, and voice power the AI — which works as a Fortune 500 recruiter on your side 🐪</p>
      </div>

      {/* Recruiter lens banner */}
      <div className="bg-gradient-to-r from-ocean-600 to-seafoam-500 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h2 className="font-semibold">Your AI thinks like a Fortune 500 recruiter</h2>
            <p className="text-ocean-50 text-sm mt-1">Every tailored resume, cover letter, and coaching answer is written through the lens of a senior recruiter who knows what clears ATS filters and what hiring committees actually say yes to. Teach it your voice below so the output still sounds like <em>you</em>.</p>
          </div>
        </div>
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
          <p className="text-xs text-sand-400 mb-2">Paste your full resume — the foundation the recruiter-AI tailors from for each role.</p>
          <textarea value={profile.resume} onChange={e => setProfile(p => ({ ...p, resume: e.target.value }))}
            rows={16} className="input font-mono text-xs" placeholder="Paste your full resume here..." />
          {!profile.resume && (
            <p className="text-xs text-coral-600 bg-coral-50 border border-coral-200 rounded-xl px-3 py-2 mt-2">
              ⚠️ Add your resume here before using AI tailoring and cover letter features.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-ocean-700 mb-1.5">Writing Style & Preferences</label>
          <p className="text-xs text-sand-400 mb-2">Tell the AI how you like to sound — e.g. "concise and metrics-driven, no buzzwords or fluff, confident but not arrogant, first person."</p>
          <textarea value={profile.writing_style} onChange={e => setProfile(p => ({ ...p, writing_style: e.target.value }))}
            rows={4} className="input" placeholder="Describe your preferred tone, voice, and any do's and don'ts..." />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="text-seafoam-600 text-sm font-medium">✓ Saved!</span>}
        </div>
      </form>

      {/* Voice samples / teaching examples */}
      <div className="card p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-ocean-800 flex items-center gap-2">🗣️ Your Voice Samples</h2>
            <p className="text-xs text-sand-400 mt-1">Add 1-2 resumes or cover letters you're proud of. The AI mirrors their tone and structure so generated docs sound authentically like you. It also learns from docs you save with "Teach my voice" on any application.</p>
          </div>
          <button onClick={() => setShowExForm(true)} className="btn-primary text-sm py-2 px-4 shrink-0">+ Add Sample</button>
        </div>

        {showExForm && (
          <form onSubmit={addExample} className="bg-sand-50 rounded-xl p-4 space-y-3 border border-sand-100">
            <div className="flex gap-3">
              <select value={exForm.doc_type} onChange={e => setExForm(f => ({ ...f, doc_type: e.target.value }))} className="input flex-1">
                <option value="resume">Resume</option>
                <option value="cover_letter">Cover Letter</option>
              </select>
              <input value={exForm.label} onChange={e => setExForm(f => ({ ...f, label: e.target.value }))} placeholder="Label (optional)" className="input flex-1" />
            </div>
            <textarea value={exForm.content} onChange={e => setExForm(f => ({ ...f, content: e.target.value }))} rows={8} className="input font-mono text-xs" placeholder="Paste a sample document that represents your voice..." required />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm py-2">Save Sample</button>
              <button type="button" onClick={() => setShowExForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
            </div>
          </form>
        )}

        {examples.length === 0 ? (
          <p className="text-sm text-sand-400 text-center py-4">No voice samples yet. Add one, or save a great AI draft as an example from any application.</p>
        ) : (
          <div className="space-y-4">
            {[['Resume samples', resumeExamples], ['Cover letter samples', coverExamples]].map(([title, list]) => list.length > 0 && (
              <div key={title}>
                <p className="text-xs font-bold text-ocean-500 uppercase tracking-wide mb-2">{title} ({list.length})</p>
                <div className="space-y-2">
                  {list.map(ex => (
                    <div key={ex.id} className="flex justify-between items-start gap-3 bg-sand-50 rounded-xl p-3 border border-sand-100">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ocean-800">{ex.label || 'Untitled sample'}</div>
                        <div className="text-xs text-sand-400 truncate">{ex.content.slice(0, 90)}…</div>
                      </div>
                      <button onClick={() => delExample(ex.id)} className="text-xs text-coral-400 hover:text-coral-600 shrink-0">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-ocean-50 to-seafoam-50 rounded-2xl p-5 border border-ocean-100">
        <h2 className="text-sm font-bold text-ocean-800 mb-3 flex items-center gap-2"><span>🐪</span> How A Camellar Works</h2>
        <ul className="text-sm text-ocean-700 space-y-2">
          {[
            'Add a job application with company and position',
            'Paste the full job listing in the "Job Listing" tab',
            'Click "Tailor Resume" or "Generate Cover Letter" — your recruiter-AI does the rest',
            'Edit the result, then hit "Teach my voice" to make future drafts sound more like you',
            'Track connections and mark when you\'ve reached out',
            'Chat with your recruiting strategist on any application or the dashboard',
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
