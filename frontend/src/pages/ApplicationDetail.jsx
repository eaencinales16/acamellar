import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import StatusBadge, { STATUSES } from '../components/StatusBadge';

const TABS = ['Overview', 'Job Listing', 'Tailored Resume', 'Cover Letter', 'Chat', 'Connections'];

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
  const chatBottomRef = useRef(null);

  const loadApp = () => fetch(`/api/applications/${id}`).then(r => r.json()).then(data => { setApp(data); setForm(data); });
  const loadChat = () => fetch(`/api/applications/${id}/chat`).then(r => r.json()).then(setChat);
  const loadConns = () => fetch(`/api/connections?application_id=${id}`).then(r => r.json()).then(setConnections);

  useEffect(() => { loadApp(); loadChat(); loadConns(); }, [id]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  if (!app) return <div className="text-center py-12 text-stone-400">Loading...</div>;

  const save = async () => {
    await fetch(`/api/applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    await loadApp();
    setEditing(false);
  };

  const del = async () => {
    if (!confirm(`Delete this application for ${app.position} at ${app.company}?`)) return;
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    navigate('/applications');
  };

  const tailorResume = async () => {
    setLoading('resume');
    try {
      const res = await fetch(`/api/applications/${id}/tailor-resume`, { method: 'POST' });
      const data = await res.json();
      if (data.error) return alert(data.error);
      await loadApp();
      setTab('Tailored Resume');
    } finally { setLoading(''); }
  };

  const genCoverLetter = async () => {
    setLoading('cover');
    try {
      const res = await fetch(`/api/applications/${id}/cover-letter`, { method: 'POST' });
      const data = await res.json();
      if (data.error) return alert(data.error);
      await loadApp();
      setTab('Cover Letter');
    } finally { setLoading(''); }
  };

  const sendChat = async e => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
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
    setShowConnForm(false);
    loadConns();
  };

  const toggleOutreach = async (conn) => {
    await fetch(`/api/connections/${conn.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reached_out: conn.reached_out ? 0 : 1, outreach_date: conn.reached_out ? null : new Date().toISOString().split('T')[0] }) });
    loadConns();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/applications" className="text-camel-600 text-sm hover:underline">← Applications</Link>
          <h1 className="text-2xl font-bold text-stone-800 mt-1">{app.position}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-stone-600">{app.company}</span>
            <StatusBadge status={app.status} />
            {app.job_url && <a href={app.job_url} target="_blank" rel="noreferrer" className="text-camel-600 text-xs hover:underline">View Listing ↗</a>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="text-sm px-3 py-1.5 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors">Edit</button>
          <button onClick={del} className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t ? 'border-camel-500 text-camel-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><span className="text-xs text-stone-400 uppercase tracking-wide">Status</span><div><StatusBadge status={app.status} /></div></div>
            <div><span className="text-xs text-stone-400 uppercase tracking-wide">Applied Date</span><div className="text-sm text-stone-700">{app.applied_date || 'Not set'}</div></div>
          </div>
          <div><span className="text-xs text-stone-400 uppercase tracking-wide">Notes</span><p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">{app.notes || 'None'}</p></div>
          <div className="flex gap-3 pt-2">
            <button onClick={tailorResume} disabled={!!loading} className="flex-1 bg-camel-600 hover:bg-camel-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition-colors">
              {loading === 'resume' ? '⏳ Tailoring...' : '✨ Tailor Resume with AI'}
            </button>
            <button onClick={genCoverLetter} disabled={!!loading} className="flex-1 bg-camel-500 hover:bg-camel-600 disabled:opacity-50 text-white text-sm py-2 rounded-lg font-medium transition-colors">
              {loading === 'cover' ? '⏳ Writing...' : '📝 Generate Cover Letter'}
            </button>
          </div>
          {(!app.job_listing) && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⚠️ Add the job listing in the "Job Listing" tab to enable AI features.</p>}
        </div>
      )}

      {tab === 'Job Listing' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Job Listing</h2>
            <span className="text-xs text-stone-400">Paste the full job description here</span>
          </div>
          <textarea
            value={form.job_listing || ''}
            onChange={e => setForm(f => ({ ...f, job_listing: e.target.value }))}
            rows={20}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-camel-400"
            placeholder="Paste the full job listing here..."
          />
          <div className="flex gap-3">
            <button onClick={() => { setForm(f => ({ ...f })); save(); }} className="bg-camel-600 hover:bg-camel-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">Save Listing</button>
          </div>
        </div>
      )}

      {tab === 'Tailored Resume' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Tailored Resume</h2>
            <button onClick={tailorResume} disabled={!!loading} className="text-sm bg-camel-600 hover:bg-camel-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
              {loading === 'resume' ? '⏳ Tailoring...' : '✨ Re-tailor with AI'}
            </button>
          </div>
          {app.tailored_resume ? (
            <>
              <textarea
                value={form.tailored_resume || ''}
                onChange={e => setForm(f => ({ ...f, tailored_resume: e.target.value }))}
                rows={30}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-camel-400"
              />
              <div className="flex gap-3">
                <button onClick={save} className="bg-camel-600 hover:bg-camel-700 text-white text-sm px-4 py-2 rounded-lg font-medium">Save Changes</button>
                <button onClick={() => { navigator.clipboard.writeText(app.tailored_resume); alert('Copied!'); }} className="border border-stone-300 text-sm px-4 py-2 rounded-lg hover:bg-stone-50">Copy</button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-400">
              <div className="text-4xl mb-2">✨</div>
              <p>No tailored resume yet.</p>
              <button onClick={tailorResume} className="mt-3 text-camel-600 underline text-sm">Generate one with AI</button>
            </div>
          )}
        </div>
      )}

      {tab === 'Cover Letter' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Cover Letter</h2>
            <button onClick={genCoverLetter} disabled={!!loading} className="text-sm bg-camel-600 hover:bg-camel-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
              {loading === 'cover' ? '⏳ Writing...' : '📝 Re-generate with AI'}
            </button>
          </div>
          {app.cover_letter ? (
            <>
              <textarea
                value={form.cover_letter || ''}
                onChange={e => setForm(f => ({ ...f, cover_letter: e.target.value }))}
                rows={25}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400"
              />
              <div className="flex gap-3">
                <button onClick={save} className="bg-camel-600 hover:bg-camel-700 text-white text-sm px-4 py-2 rounded-lg font-medium">Save Changes</button>
                <button onClick={() => { navigator.clipboard.writeText(app.cover_letter); alert('Copied!'); }} className="border border-stone-300 text-sm px-4 py-2 rounded-lg hover:bg-stone-50">Copy</button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-400">
              <div className="text-4xl mb-2">📝</div>
              <p>No cover letter yet.</p>
              <button onClick={genCoverLetter} className="mt-3 text-camel-600 underline text-sm">Generate one with AI</button>
            </div>
          )}
        </div>
      )}

      {tab === 'Chat' && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 flex flex-col" style={{ height: '60vh' }}>
          <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
            <h2 className="font-semibold text-sm">Chat with Claude about this role</h2>
            <button onClick={() => { fetch(`/api/applications/${id}/chat`, { method: 'DELETE' }); setChat([]); }} className="text-xs text-stone-400 hover:text-red-500">Clear chat</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-sm">
                <div className="text-3xl mb-2">💬</div>
                <p>Ask me anything about this job — interview prep, company research, negotiation tips, or how to position your experience.</p>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-camel-600 text-white' : 'bg-stone-100 text-stone-800'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading === 'chat' && (
              <div className="flex justify-start">
                <div className="bg-stone-100 rounded-2xl px-4 py-2 text-sm text-stone-500">🐪 Thinking...</div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={sendChat} className="p-3 border-t border-stone-100 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about this role, interview prep, company..."
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400"
              disabled={loading === 'chat'}
            />
            <button type="submit" disabled={loading === 'chat' || !chatInput.trim()} className="bg-camel-600 hover:bg-camel-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Send</button>
          </form>
        </div>
      )}

      {tab === 'Connections' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-stone-700">Connections at {app.company}</h2>
            <button onClick={() => setShowConnForm(true)} className="text-sm bg-camel-600 hover:bg-camel-700 text-white px-3 py-1.5 rounded-lg transition-colors">+ Add Connection</button>
          </div>

          {showConnForm && (
            <form onSubmit={addConn} className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 space-y-3">
              <h3 className="font-medium text-sm">New Connection</h3>
              <div className="grid grid-cols-2 gap-3">
                {[['name', 'Name *', true], ['title', 'Title'], ['company', 'Company'], ['linkedin_url', 'LinkedIn URL'], ['email', 'Email']].map(([field, label, req]) => (
                  <input key={field} required={!!req} value={connForm[field]} onChange={e => setConnForm(f => ({ ...f, [field]: e.target.value }))} placeholder={label} className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
                ))}
                <textarea value={connForm.notes} onChange={e => setConnForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="col-span-2 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-camel-600 text-white text-sm px-4 py-2 rounded-lg font-medium">Add</button>
                <button type="button" onClick={() => setShowConnForm(false)} className="text-sm text-stone-500 hover:bg-stone-100 px-4 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          )}

          {connections.length === 0 ? (
            <div className="text-center py-8 text-stone-400 bg-white rounded-xl border border-stone-200">
              <div className="text-3xl mb-2">🤝</div>
              <p className="text-sm">No connections added yet. Who do you know at {app.company}?</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{conn.name}</div>
                    {conn.title && <div className="text-sm text-stone-500">{conn.title}{conn.company ? ` · ${conn.company}` : ''}</div>}
                    {conn.linkedin_url && <a href={conn.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-camel-600 hover:underline">LinkedIn ↗</a>}
                    {conn.notes && <p className="text-xs text-stone-400 mt-1">{conn.notes}</p>}
                    {conn.outreach_date && <p className="text-xs text-stone-400">Reached out: {conn.outreach_date}</p>}
                    {conn.outcome && <p className="text-xs text-green-600">Outcome: {conn.outcome}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleOutreach(conn)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${conn.reached_out ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600 hover:bg-camel-100 hover:text-camel-700'}`}
                    >
                      {conn.reached_out ? '✓ Reached Out' : 'Mark Reached Out'}
                    </button>
                    <button onClick={() => { fetch(`/api/connections/${conn.id}`, { method: 'DELETE' }); loadConns(); }} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">Edit Application</h2>
            <div className="space-y-3">
              {[['company', 'Company'], ['position', 'Position'], ['job_url', 'Job URL']].map(([f, l]) => (
                <div key={f}>
                  <label className="block text-xs font-medium text-stone-600 mb-1">{l}</label>
                  <input value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
                <select value={form.status || 'researching'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Applied Date</label>
                <input type="date" value={form.applied_date || ''} onChange={e => setForm(p => ({ ...p, applied_date: e.target.value }))} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-camel-400" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
              <button onClick={save} className="px-4 py-2 text-sm bg-camel-600 hover:bg-camel-700 text-white rounded-lg font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
