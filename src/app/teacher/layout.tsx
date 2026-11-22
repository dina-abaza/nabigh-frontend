import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { TEACHER_NAV_ITEMS } from '@/lib/nav';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <DashboardSidebar items={TEACHER_NAV_ITEMS} />
      <div className="flex flex-1 flex-col overflow-x-auto">{children}</div>
    </div>
  );
}
