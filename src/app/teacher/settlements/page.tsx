'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass } from '@/lib/ui';
import type { Settlement } from '@/lib/types';

function minorToMajor(amountMinor: number, currency: string) {
  return `${(amountMinor / 100).toFixed(2)} ${currency}`;
}

function TeacherSettlementsContent() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/settlements/mine', { params: { limit: 50 } })
      .then((response) => {
        if (isMounted) setSettlements(response.data.data.settlements);
      })
      .catch((apiError) => {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  if (settlements.length === 0) {
    return <p className="text-center text-[var(--ink-muted)]">لا توجد مستحقات بعد</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {settlements.map((settlement) => (
        <div key={settlement._id} className={`${cardClass} flex flex-wrap items-center justify-between gap-2`}>
          <div className="min-w-0">
            <p className="font-heading font-bold">{minorToMajor(settlement.teacherNetMinor, settlement.currency)}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              الإجمالي {minorToMajor(settlement.grossMinor, settlement.currency)} — عمولة{' '}
              {minorToMajor(settlement.commissionMinor, settlement.currency)}
            </p>
          </div>
          <span className="flex-none rounded-full border border-[var(--line)] px-3 py-1 text-xs">
            {settlement.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TeacherSettlementsPage() {
  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">مستحقاتي</h1>
        <TeacherSettlementsContent />
      </main>
    </RequireRole>
  );
}
