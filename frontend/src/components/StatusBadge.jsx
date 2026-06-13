import React from 'react';

const STATUS_MAP = {
  researching: { label: 'Researching', color: 'bg-blue-100 text-blue-800' },
  applied: { label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
  phone_screen: { label: 'Phone Screen', color: 'bg-purple-100 text-purple-800' },
  interview: { label: 'Interview', color: 'bg-orange-100 text-orange-800' },
  offer: { label: 'Offer 🎉', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-stone-100 text-stone-500' },
};

export const STATUSES = Object.keys(STATUS_MAP);

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, color: 'bg-stone-100 text-stone-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

export { STATUS_MAP };
