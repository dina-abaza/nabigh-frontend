'use client';

import { useAuth } from '@/context/AuthContext';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء الخير';
}

export function DashboardTopbar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-3">
      <p className="text-sm text-[var(--ink-muted)]">
        {greeting()}، <span className="font-bold text-[var(--ink)]">{user.name}</span> 👋
      </p>
    </div>
  );
}
