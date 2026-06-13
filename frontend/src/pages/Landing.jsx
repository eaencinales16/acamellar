import React from 'react';

const FEATURES = [
  { icon: '📋', title: 'Track Every Application', desc: 'Organize your job search pipeline with statuses from researching to offer.' },
  { icon: '✨', title: 'AI-Tailored Resumes', desc: 'Claude reads the job listing and rewrites your resume to match — in seconds.' },
  { icon: '📝', title: 'Custom Cover Letters', desc: 'Personalized, non-generic cover letters generated for each role.' },
  { icon: '💬', title: 'In-App Career Coach', desc: 'Chat with Claude about interview prep, salary negotiation, and strategy.' },
  { icon: '🤝', title: 'Connections Tracker', desc: 'Track every contact at every company and your outreach progress.' },
  { icon: '📧', title: 'Accountability Partner', desc: 'Daily digest emails and custom reminders to keep your search aggressive.' },
];

export default function Landing() {
  const login = () => { window.location.href = '/login'; };
  const signup = () => { window.location.href = '/signup'; };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="relative overflow-hidden bg-coastal-gradient min-h-screen flex flex-col">

        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-white/5 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full bg-white/5 animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Wave SVG bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
            <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#fdfaf5" fillOpacity="0.15"/>
            <path d="M0,80 C300,40 600,100 900,70 C1100,50 1300,90 1440,80 L1440,120 L0,120 Z" fill="#fdfaf5" fillOpacity="0.3"/>
            <path d="M0,100 C360,80 720,120 1080,90 C1260,76 1380,110 1440,100 L1440,120 L0,120 Z" fill="#fdfaf5"/>
          </svg>
        </div>

        {/* Nav bar */}
        <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐪</span>
            <span className="text-white font-display text-xl font-bold tracking-wide">A Camellar</span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-32">
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="inline-block bg-white/15 backdrop-blur-sm text-seafoam-200 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-white/20">
              Your Personal Job Search Command Center
            </span>
          </div>

          <h1 className="animate-fade-up font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6 max-w-4xl" style={{ animationDelay: '0.2s' }}>
            Navigate Your Career
            <span className="block text-ocean-200 italic"> Like the Tides</span>
          </h1>

          <p className="animate-fade-up text-ocean-100 text-lg md:text-xl max-w-2xl leading-relaxed mb-12" style={{ animationDelay: '0.3s' }}>
            AI-powered job search tracker with tailored resumes, cover letters, a built-in career coach, and the accountability reminders to keep you relentlessly moving forward.
          </p>

          {/* Login card */}
          <div className="animate-fade-up w-full max-w-sm" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-7 shadow-2xl">
              <div className="text-4xl mb-2">🐪</div>
              <h2 className="text-white font-display text-2xl font-bold mb-1">Welcome back</h2>
              <p className="text-ocean-100 text-sm mb-6">Sign in to your job search command center</p>

              <button
                onClick={login}
                className="w-full bg-seafoam-500 hover:bg-seafoam-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-seafoam-500/30 active:scale-95 text-base mb-3"
              >
                Log In →
              </button>
              <button
                onClick={signup}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-95 text-base"
              >
                Create an account
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-ocean-200 text-xs">secure login by Auth0</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>
              <p className="text-ocean-200/80 text-xs leading-relaxed">
                Sign in with email & password or your Google account — whichever you've enabled. Your credentials are handled by Auth0 and never stored by this app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-sand-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-ocean-800 mb-4">Everything you need to land the role</h2>
            <p className="text-sand-600 text-lg max-w-xl mx-auto">Built for the serious job seeker who refuses to drift — every feature designed to keep you focused and moving.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-sand-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-ocean-50 flex items-center justify-center text-2xl mb-4">{icon}</div>
                <h3 className="font-semibold text-ocean-800 mb-2">{title}</h3>
                <p className="text-sand-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coastal CTA */}
      <section className="bg-wave-gradient py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🐪</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to take charge of your search?</h2>
          <p className="text-ocean-100 mb-8">The ocean is patient. Your job search shouldn't be.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={signup}
              className="bg-white text-ocean-700 font-bold px-8 py-3.5 rounded-xl hover:bg-sand-50 transition-all active:scale-95 shadow-lg text-lg"
            >
              Create an Account →
            </button>
            <button
              onClick={login}
              className="bg-ocean-800/40 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-ocean-800/60 transition-all active:scale-95 text-lg"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ocean-900 text-ocean-300 text-center py-8 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>🐪</span>
          <span className="font-display text-white font-semibold">A Camellar</span>
        </div>
        <p>Powered by Claude AI · Built for the relentless job seeker</p>
      </footer>
    </div>
  );
}
