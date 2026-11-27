'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass } from '@/lib/ui';
import type { Pagination, Settlement } from '@/lib/types';

function minorToMajor(amountMinor: number, currency: string) {
  return `${(amountMinor / 100).toFixed(2)} ${currency}`;
}

function AdminSettlementsContent() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/settlements/manage', { params: { page, limit: 20 } })
      .then((response) => {
        if (isMounted) {
          setSettlements(response.data.data.settlements);
          setPagination(response.data.data.pagination);
        }
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
  }, [page]);

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      {settlements.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد مستحقات</p>
      ) : (
        <div className="flex flex-col gap-3">
          {settlements.map((settlement) => (
            <div key={settlement._id} className={`${cardClass} flex flex-wrap items-center justify-between gap-2`}>
              <div className="min-w-0">
                <p className="break-all text-xs text-[var(--ink-muted)]">المدرس: {settlement.teacherId}</p>
                <p className="font-heading font-bold">
                  {minorToMajor(settlement.teacherNetMinor, settlement.currency)}
                </p>
              </div>
              <span className="flex-none rounded-full border border-[var(--line)] px-3 py-1 text-xs">
                {settlement.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className={`${ghostButtonClass} !px-4 !py-1`}
          >
            السابق
          </button>
          <span className="text-[var(--ink-muted)]">
            صفحة {pagination.page} من {pagination.pages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            disabled={page >= pagination.pages}
            className={`${ghostButtonClass} !px-4 !py-1`}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminSettlementsPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">المستحقات</h1>
        <AdminSettlementsContent />
      </main>
    </RequireRole>
  );
}
