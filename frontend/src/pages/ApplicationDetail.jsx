import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import StatusBadge, { STATUSES } from '../components/StatusBadge';

const TABS = ['Overview', 'Job Listing', 'Tailored Resume', 'Cover Letter', 'Interviews', 'Chat', 'Connections'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState('');
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [connections, setConnections] = useState([]);
  const [connForm, setConnForm] = useState({ name: '', title: '', company: '', linkedin_url: '', email: '', notes: '' });
  const [showConnForm, setShowConnForm] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [ivForm, setIvForm] = useState(null); // null = closed; object = editing/creating
  const chatBottomRef = useRef(null);

  const loadApp  = () => fetch(`/api/applications/${id}`).then(r => r.json()).then(d => { setApp(d); setForm(d); });
  const loadChat = () => fetch(`/api/applications/${id}/chat`).then(r => r.json()).then(setChat);
  const loadConns= () => fetch(`/api/connections?application_id=${id}`).then(r => r.json()).then(setConnections);
  const loadIvs  = () => fetch(`/api/interviews?application_id=${id}`).then(r => r.json()).then(setInterviews);

  useEffect(() => { loadApp(); loadChat(); loadConns(); loadIvs(); }, [id]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  if (!app) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin h-8 w-8 text-ocean-300" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  const save = async () => {
    await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    await loadApp(); setEditing(false);
  };

  const del = async () => {
    if (!confirm(`Delete ${app.position} at ${app.company}?`)) return;
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    navigate('/applications');
  };

  const tailorResume = async () => {
    setLoading('resume');
    try {
      const res = await fetch(`/api/applications/${id}/tailor-resume`, { method: 'POST' });
      const data = await res.json();
      if (data.error) return alert(data.error);
      await loadApp(); setTab('Tailored Resume');
    } finally { setLoading(''); }
  };

  const genCoverLetter = async () => {
    setLoading('cover');
    try {
      const res = await fetch(`/api/applications/${id}/cover-letter`, { method: 'POST' });
      const data = await res.json();
      if (data.error) return alert(data.error);
      await loadApp(); setTab('Cover Letter');
    } finally { setLoading(''); }
  };

  const sendChat = async e => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput; setChatInput('');
    setChat(c => [...c, { role: 'user', content: msg, id: Date.now() }]);
    setLoading('chat');
    try {
      const res = await fetch(`/api/applications/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      if (data.error) return alert(data.error);
      setChat(c => [...c, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
    } finally { setLoading(''); }
  };

  const addConn = async e => {
    e.preventDefault();
    await fetch('/api/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...connForm, application_id: id }) });
    setConnForm({ name: '', title: '', company: '', linkedin_url: '', email: '', notes: '' });
    setShowConnForm(false); loadConns();
  };

  const teachVoice = async (docType, content) => {
    if (!content) return;
    await fetch('/api/style-examples', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_type: docType, label: `${app.position} @ ${app.company}`, content })
    });
    alert('Saved as a voice sample! Future drafts will sound more like this.');
  };

  const EMPTY_IV = { round: '', scheduled_at: '', duration_min: 60, format: 'Video', interviewers: '', location: '', prep_notes: '', outcome: '' };
  const saveInterview = async e => {
    e.preventDefault();
    const body = { ...ivForm, application_id: id };
    if (ivForm.id) {
      await fetch(`/api/interviews/${ivForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }
    setIvForm(null);
    loadIvs();
  };
  const delInterview = async ivId => {
    if (!confirm('Delete this interview?')) return;
    await fetch(`/api/interviews/${ivId}`, { method: 'DELETE' });
    loadIvs();
  };

  const toggleOutreach = async conn => {
    await fetch(`/api/connections/${conn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reached_out: conn.reached_out ? 0 : 1, outreach_date: conn.reached_out ? null : new Date().toISOString().split('T')[0] }) });
    loadConns();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/applications" className="text-ocean-500 text-sm hover:text-ocean-700 font-medium">← Applications</Link>
          <h1 className="font-display text-3xl font-bold text-ocean-800 mt-1">{app.position}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-sand-600 font-medium">{app.company}</span>
            <StatusBadge status={app.status} />
            {app.job_url && <a href={app.job_url} target="_blank" rel="noreferrer" className="text-ocean-500 text-xs hover:underline font-medium">View Listing ↗</a>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-2 px-4">Edit</button>
          <button onClick={del} className="text-sm px-4 py-2 border border-coral-200 text-coral-600 rounded-xl hover:bg-coral-50 transition-colors">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-sand-200">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-ocean-500 text-ocean-700' : 'border-transparent text-sand-500 hover:text-ocean-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="card p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div><span className="text-xs font-bold text-ocean-400 uppercase tracking-wide">Status</span><div className="mt-1"><StatusBadge status={app.status} /></div></div>
            <div><span className="text-xs font-bold text-ocean-400 uppercase tracking-wide">Applied Date</span><div className="text-sm text-ocean-800 mt-1">{app.applied_date || '—'}</div></div>
          </div>
          {app.notes && <div><span className="text-xs font-bold text-ocean-400 uppercase tracking-wide">Notes</span><p className="text-sm text-sand-600 mt-1 whitespace-pre-wrap">{app.notes}</p></div>}
          <div className="flex gap-3 pt-2">
            <button onClick={tailorResume} disabled={!!loading} className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50">
              {loading === 'resume' ? '⏳ Tailoring...' : '✨ Tailor Resume with AI'}
            </button>
            <button onClick={genCoverLetter} disabled={!!loading} className="flex-1 bg-seafoam-500 hover:bg-seafoam-600 disabled:opacity-50 text-white text-sm py-2.5 rounded-xl font-semibold transition-all shadow-md">
              {loading === 'cover' ? '⏳ Writing...' : '📝 Generate Cover Letter'}
            </button>
          </div>
          {!app.job_listing && <p className="text-xs text-sand-500 bg-sand-50 border border-sand-200 rounded-xl px-3 py-2">💡 Add the job listing in the "Job Listing" tab to enable AI features.</p>}
        </div>
      )}

      {/* Job Listing */}
      {tab === 'Job Listing' && (
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-ocean-800">Job Listing</h2>
            <span className="text-xs text-sand-400">Paste the full job description</span>
          </div>
          <textarea value={form.job_listing || ''} onChange={e => setForm(f => ({ ...f, job_listing: e.target.value }))} rows={20} className="input font-mono text-xs" placeholder="Paste the full job listing here..." />
          <button onClick={save} className="btn-primary text-sm py-2.5">Save Listing</button>
        </div>
      )}

      {/* Tailored Resume */}
      {tab === 'Tailored Resume' && (
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-ocean-800">Tailored Resume</h2>
            <button onClick={tailorResume} disabled={!!loading} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
              {loading === 'resume' ? '⏳ Tailoring...' : '✨ Re-tailor'}
            </button>
          </div>
          {app.tailored_resume ? (
            <>
              <textarea value={form.tailored_resume || ''} onChange={e => setForm(f => ({ ...f, tailored_resume: e.target.value }))} rows={28} className="input font-mono text-xs" />
              <div className="flex gap-3 flex-wrap">
                <button onClick={save} className="btn-primary text-sm py-2.5">Save</button>
                <button onClick={() => { navigator.clipboard.writeText(app.tailored_resume); alert('Copied!'); }} className="btn-secondary text-sm py-2.5">Copy</button>
                <a href={`/api/applications/${id}/export?doc=resume&format=pdf`} className="text-sm py-2.5 px-4 border border-ocean-300 text-ocean-700 rounded-xl hover:bg-ocean-50 transition-colors">⬇ PDF</a>
                <a href={`/api/applications/${id}/export?doc=resume&format=docx`} className="text-sm py-2.5 px-4 border border-ocean-300 text-ocean-700 rounded-xl hover:bg-ocean-50 transition-colors">⬇ Word</a>
                <button onClick={() => teachVoice('resume', form.tailored_resume)} className="text-sm py-2.5 px-4 border border-seafoam-300 text-seafoam-700 rounded-xl hover:bg-seafoam-50 transition-colors">🗣️ Teach my voice</button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-sand-400">
              <div className="text-5xl mb-3">✨</div>
              <p className="font-medium text-sand-500">No tailored resume yet</p>
              <button onClick={tailorResume} className="mt-4 btn-primary text-sm py-2">Generate with AI</button>
            </div>
          )}
        </div>
      )}

      {/* Cover Letter */}
      {tab === 'Cover Letter' && (
        <div className="card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-ocean-800">Cover Letter</h2>
            <button onClick={genCoverLetter} disabled={!!loading} className="bg-seafoam-500 hover:bg-seafoam-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all">
              {loading === 'cover' ? '⏳ Writing...' : '📝 Re-generate'}
            </button>
          </div>
          {app.cover_letter ? (
            <>
              <textarea value={form.cover_letter || ''} onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))} rows={24} className="input text-sm" />
              <div className="flex gap-3 flex-wrap">
                <button onClick={save} className="btn-primary text-sm py-2.5">Save</button>
                <button onClick={() => { navigator.clipboard.writeText(app.cover_letter); alert('Copied!'); }} className="btn-secondary text-sm py-2.5">Copy</button>
                <a href={`/api/applications/${id}/export?doc=cover&format=pdf`} className="text-sm py-2.5 px-4 border border-ocean-300 text-ocean-700 rounded-xl hover:bg-ocean-50 transition-colors">⬇ PDF</a>
                <a href={`/api/applications/${id}/export?doc=cover&format=docx`} className="text-sm py-2.5 px-4 border border-ocean-300 text-ocean-700 rounded-xl hover:bg-ocean-50 transition-colors">⬇ Word</a>
                <button onClick={() => teachVoice('cover_letter', form.cover_letter)} className="text-sm py-2.5 px-4 border border-seafoam-300 text-seafoam-700 rounded-xl hover:bg-seafoam-50 transition-colors">🗣️ Teach my voice</button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-sand-400">
              <div className="text-5xl mb-3">📝</div>
              <p className="font-medium text-sand-500">No cover letter yet</p>
              <button onClick={genCoverLetter} className="mt-4 bg-seafoam-500 hover:bg-seafoam-600 text-white text-sm px-5 py-2 rounded-xl font-semibold">Generate with AI</button>
            </div>
          )}
        </div>
      )}

      {/* Interviews */}
      {tab === 'Interviews' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-ocean-800">Interview Rounds</h2>
            <button onClick={() => setIvForm({ ...EMPTY_IV })} className="btn-primary text-sm py-2 px-4">+ Add Interview</button>
          </div>

          {ivForm && (
            <form onSubmit={saveInterview} className="card p-5 space-y-3">
              <h3 className="font-semibold text-ocean-800">{ivForm.id ? 'Edit' : 'New'} Interview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Round</label>
                  <input value={ivForm.round} onChange={e => setIvForm(f => ({ ...f, round: e.target.value }))} placeholder="Phone Screen, Onsite, Final…" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Date & time</label>
                  <input type="datetime-local" value={ivForm.scheduled_at || ''} onChange={e => setIvForm(f => ({ ...f, scheduled_at: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Format</label>
                  <select value={ivForm.format} onChange={e => setIvForm(f => ({ ...f, format: e.target.value }))} className="input">
                    {['Video', 'Phone', 'Onsite'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Duration (min)</label>
                  <input type="number" min="0" value={ivForm.duration_min} onChange={e => setIvForm(f => ({ ...f, duration_min: e.target.value }))} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Interviewers</label>
                  <input value={ivForm.interviewers} onChange={e => setIvForm(f => ({ ...f, interviewers: e.target.value }))} placeholder="Names / titles" className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Location / link</label>
                  <input value={ivForm.location} onChange={e => setIvForm(f => ({ ...f, location: e.target.value }))} placeholder="Zoom link or address" className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Prep notes</label>
                  <textarea value={ivForm.prep_notes} onChange={e => setIvForm(f => ({ ...f, prep_notes: e.target.value }))} rows={3} placeholder="Topics to review, questions to ask, STAR stories…" className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">Outcome</label>
                  <input value={ivForm.outcome} onChange={e => setIvForm(f => ({ ...f, outcome: e.target.value }))} placeholder="e.g. Advanced to next round" className="input" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm py-2">{ivForm.id ? 'Save' : 'Add'}</button>
                <button type="button" onClick={() => setIvForm(null)} className="btn-secondary text-sm py-2">Cancel</button>
              </div>
            </form>
          )}

          {interviews.length === 0 && !ivForm ? (
            <div className="text-center py-12 card text-sand-400">
              <div className="text-4xl mb-2">🗓️</div>
              <p className="text-sm">No interviews logged yet. Add one when you get scheduled.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {interviews.map(iv => (
                <div key={iv.id} className="card p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-ocean-800">{iv.round || 'Interview'}{iv.format ? ` · ${iv.format}` : ''}</div>
                      {iv.scheduled_at && <div className="text-sm text-ocean-500 font-medium">📅 {new Date(iv.scheduled_at).toLocaleString()}</div>}
                      {iv.interviewers && <div className="text-xs text-sand-500 mt-1">With: {iv.interviewers}</div>}
                      {iv.location && <div className="text-xs text-sand-500">📍 {iv.location}</div>}
                      {iv.prep_notes && <div className="text-xs text-sand-500 mt-1 whitespace-pre-wrap">📝 {iv.prep_notes}</div>}
                      {iv.outcome && <div className="text-xs text-seafoam-600 mt-1 font-medium">✓ {iv.outcome}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {iv.scheduled_at && (
                        <a href={`/api/interviews/${iv.id}/calendar.ics`} className="text-xs bg-ocean-100 text-ocean-700 hover:bg-ocean-200 px-3 py-1.5 rounded-lg font-medium transition-colors">📆 Add to Calendar</a>
                      )}
                      <button onClick={() => setIvForm({ ...iv, scheduled_at: iv.scheduled_at ? iv.scheduled_at.replace(' ', 'T').slice(0, 16) : '' })} className="text-xs text-ocean-500 hover:underline">Edit</button>
                      <button onClick={() => delInterview(iv.id)} className="text-xs text-coral-400 hover:text-coral-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {tab === 'Chat' && (
        <div className="card flex flex-col" style={{ height: '62vh' }}>
          <div className="px-5 py-3.5 border-b border-sand-100 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-ocean-800 text-sm">Chat with Claude</h2>
              <p className="text-xs text-sand-400">Interview prep, company research, salary negotiation, strategy</p>
            </div>
            <button onClick={() => { fetch(`/api/applications/${id}/chat`, { method: 'DELETE' }); setChat([]); }} className="text-xs text-sand-400 hover:text-coral-500 transition-colors">Clear</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && (
              <div className="text-center py-10 text-sand-400">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-sand-500">Ask Claude anything about this role</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {['How should I prepare for interviews?','What salary should I ask for?','What makes a strong candidate here?'].map(q => (
                    <button key={q} onClick={() => setChatInput(q)} className="text-xs bg-ocean-50 text-ocean-600 border border-ocean-200 px-3 py-1.5 rounded-full hover:bg-ocean-100 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-ocean-600 text-white' : 'bg-sand-50 border border-sand-100 text-ocean-800'}`}>
                  {msg.role === 'assistant'
                    ? <div className="prose prose-sm max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    : msg.content}
                </div>
              </div>
            ))}
            {loading === 'chat' && (
              <div className="flex justify-start">
                <div className="bg-sand-50 border border-sand-100 rounded-2xl px-4 py-3 text-sm text-sand-400 flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Claude is thinking...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-sand-100 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about this role..." className="input flex-1" disabled={loading === 'chat'} />
            <button type="submit" disabled={loading === 'chat' || !chatInput.trim()} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">Send</button>
          </form>
        </div>
      )}

      {/* Connections */}
      {tab === 'Connections' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-ocean-800">Connections at {app.company}</h2>
            <button onClick={() => setShowConnForm(true)} className="btn-primary text-sm py-2 px-4">+ Add</button>
          </div>
          {showConnForm && (
            <form onSubmit={addConn} className="card p-5 space-y-3">
              <h3 className="font-semibold text-ocean-800">New Connection</h3>
              <div className="grid grid-cols-2 gap-3">
                {[['name','Name *',true],['title','Title'],['company','Company'],['linkedin_url','LinkedIn URL'],['email','Email']].map(([f,l,req]) => (
                  <input key={f} required={!!req} value={connForm[f]} onChange={e => setConnForm(p => ({ ...p, [f]: e.target.value }))} placeholder={l} className="input" />
                ))}
                <textarea value={connForm.notes} onChange={e => setConnForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" rows={2} className="input col-span-2" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm py-2">Add</button>
                <button type="button" onClick={() => setShowConnForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
              </div>
            </form>
          )}
          {connections.length === 0 ? (
            <div className="text-center py-10 card text-sand-400">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-sm">No connections at {app.company} yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="card p-4 flex justify-between items-start gap-3">
                  <div>
                    <div className="font-semibold text-ocean-800">{conn.name}</div>
                    {conn.title && <div className="text-sm text-sand-500">{conn.title}</div>}
                    {conn.linkedin_url && <a href={conn.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-ocean-500 hover:underline">LinkedIn ↗</a>}
                    {conn.outreach_date && <p className="text-xs text-sand-400 mt-1">Reached out: {conn.outreach_date}</p>}
                    {conn.outcome && <p className="text-xs text-seafoam-600 mt-1 font-medium">✓ {conn.outcome}</p>}
                    {conn.notes && <p className="text-xs text-sand-400 mt-1">{conn.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => toggleOutreach(conn)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${conn.reached_out ? 'bg-seafoam-100 text-seafoam-700' : 'bg-sand-100 text-sand-600 hover:bg-ocean-100 hover:text-ocean-700'}`}>
                      {conn.reached_out ? '✓ Reached Out' : 'Mark Reached Out'}
                    </button>
                    <button onClick={() => { fetch(`/api/connections/${conn.id}`, { method: 'DELETE' }); loadConns(); }} className="text-xs text-coral-400 hover:text-coral-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-ocean-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-xl font-bold text-ocean-800">Edit Application</h2>
              <button onClick={() => setEditing(false)} className="text-sand-400 hover:text-sand-600 text-xl">×</button>
            </div>
            <div className="space-y-3">
              {[['company','Company'],['position','Position'],['job_url','Job URL']].map(([f,l]) => (
                <div key={f}>
                  <label className="block text-xs font-semibold text-ocean-600 mb-1">{l}</label>
                  <input value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Status</label>
                <select value={form.status || 'researching'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Applied Date</label>
                <input type="date" value={form.applied_date || ''} onChange={e => setForm(p => ({ ...p, applied_date: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ocean-600 mb-1">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="input" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-2">Cancel</button>
              <button onClick={save} className="btn-primary text-sm py-2">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
