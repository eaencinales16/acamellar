import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Connections from './pages/Connections';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';

const NAV = [
  { to: '/',            label: '🏠 Dashboard',    exact: true },
  { to: '/applications', label: '📋 Applications' },
  { to: '/connections',  label: '🤝 Connections'  },
  { to: '/goals',        label: '🎯 Goals'        },
  { to: '/reminders',    label: '⏰ Reminders'    },
  { to: '/profile',      label: '👤 Profile'      },
];

export default function App() {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'in' | 'out'
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/me')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => { setUser(data.user); setAuthState('in'); })
      .catch(() => setAuthState('out'));
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coastal-gradient">
        <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (authState === 'out') return <Landing />;

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      {/* Header */}
      <header className="bg-ocean-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐪</span>
            <span className="font-display font-bold text-xl tracking-wide">A Camellar</span>
            <span className="hidden sm:inline text-ocean-300 text-sm">· Job Search Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:inline text-ocean-200 text-xs">{user.name || user.email}</span>
            )}
            <a
              href="/logout"
              className="text-ocean-300 hover:text-white text-xs transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-ocean-700 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex gap-0.5 overflow-x-auto">
          {NAV.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'border-seafoam-300 text-white bg-ocean-800/40'
                    : 'border-transparent text-ocean-200 hover:text-white hover:bg-ocean-600/40'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/applications"    element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/connections"     element={<Connections />} />
          <Route path="/goals"           element={<Goals />} />
          <Route path="/reminders"       element={<Reminders />} />
          <Route path="/profile"         element={<Profile />} />
        </Routes>
      </main>

      <footer className="text-center py-4 text-ocean-300 text-xs border-t border-sand-200 bg-white">
        🐪 A Camellar · Powered by Claude AI
      </footer>
    </div>
  );
}
