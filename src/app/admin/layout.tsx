import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardTopbar } from '@/components/DashboardTopbar';
import { ADMIN_NAV_ITEMS } from '@/lib/nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <DashboardSidebar items={ADMIN_NAV_ITEMS} />
      <div className="flex flex-1 flex-col overflow-x-auto">
        <DashboardTopbar />
        {children}
      </div>
    </div>
  );
}
