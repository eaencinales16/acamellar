import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Connections from './pages/Connections';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';

const NAV = [
  { to: '/', label: '🏠 Dashboard', exact: true },
  { to: '/applications', label: '📋 Applications' },
  { to: '/connections', label: '🤝 Connections' },
  { to: '/reminders', label: '⏰ Reminders' },
  { to: '/profile', label: '👤 Profile' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-camel-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🐪</span>
          <span className="font-bold text-xl tracking-tight">A Camellar</span>
          <span className="text-camel-200 text-sm ml-1">Job Search Tracker</span>
        </div>
      </header>

      <nav className="bg-camel-500 text-white">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-camel-700 text-white' : 'text-camel-100 hover:bg-camel-600'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
