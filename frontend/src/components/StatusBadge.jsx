import React from 'react';

const STATUS_MAP = {
  researching:  { label: 'Researching',  color: 'bg-ocean-100 text-ocean-700 border-ocean-200' },
  applied:      { label: 'Applied',       color: 'bg-sand-100 text-sand-700 border-sand-300' },
  phone_screen: { label: 'Phone Screen',  color: 'bg-seafoam-100 text-seafoam-700 border-seafoam-200' },
  interview:    { label: 'Interview',     color: 'bg-ocean-200 text-ocean-800 border-ocean-300' },
  offer:        { label: 'Offer 🎉',      color: 'bg-seafoam-200 text-seafoam-800 border-seafoam-300' },
  rejected:     { label: 'Rejected',      color: 'bg-coral-100 text-coral-700 border-coral-200' },
  withdrawn:    { label: 'Withdrawn',     color: 'bg-sand-100 text-sand-500 border-sand-200' },
};

export const STATUSES = Object.keys(STATUS_MAP);
export { STATUS_MAP };

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-sand-100 text-sand-600 border-sand-200' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>
      {s.label}
    </span>
  );
}
