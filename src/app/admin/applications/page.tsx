'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { ApplicationStatus, Pagination, TeacherApplication } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  processing: 'قيد المعالجة',
};

function ApplicationRow({
  application,
  onReviewed,
}: {
  application: TeacherApplication;
  onReviewed: () => void;
}) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [commissionPercent, setCommissionPercent] = useState('20');
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: 'approved' | 'rejected') {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload =
        decision === 'approved'
          ? {
              decision,
              commissionPercent: Number(commissionPercent),
              ...(reviewNote ? { reviewNote } : {}),
            }
          : { decision, ...(reviewNote ? { reviewNote } : {}) };
      await api.patch(`/teacher-applications/${application._id}/review`, payload);
      setIsReviewing(false);
      onReviewed();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--ink)]">{application.name}</p>
          <p className="text-sm text-[var(--ink-muted)]">{application.email}</p>
          {application.message && <p className="mt-2 text-sm">{application.message}</p>}
        </div>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-muted)]">
          {STATUS_LABELS[application.status] ?? application.status}
        </span>
      </div>

      {application.status === 'pending' && (
        <div className="mt-4">
          {!isReviewing ? (
            <button onClick={() => setIsReviewing(true)} className={`${ghostButtonClass} !px-4 !py-1 text-sm`}>
              مراجعة الطلب
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor={`commission-${application._id}`} className="text-sm text-[var(--ink-muted)]">
                  نسبة العمولة %
                </label>
                <input
                  id={`commission-${application._id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPercent}
                  onChange={(event) => setCommissionPercent(event.target.value)}
                  className={`w-20 ${inputClass} !py-1`}
                />
              </div>
              <textarea
                placeholder="ملاحظة المراجعة (اختياري)"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={2}
                className={inputClass}
              />
              {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => review('approved')}
                  disabled={isSubmitting}
                  className={`${primaryButtonClass} !px-4 !py-1 text-sm`}
                >
                  قبول
                </button>
                <button
                  onClick={() => review('rejected')}
                  disabled={isSubmitting}
                  className={`${ghostButtonClass} !px-4 !py-1 text-sm`}
                >
                  رفض
                </button>
                <button
                  onClick={() => setIsReviewing(false)}
                  disabled={isSubmitting}
                  className="rounded-full px-4 py-1 text-sm text-[var(--ink-muted)]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminApplicationsContent() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | ''>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/teacher-applications', {
          params: { page, limit: 20, ...(status ? { status } : {}) },
        });
        if (isMounted) {
          setApplications(response.data.data.applications);
          setPagination(response.data.data.pagination);
        }
      } catch (apiError) {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [page, status, reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <select
        value={status}
        onChange={(event) => {
          setPage(1);
          setStatus(event.target.value as ApplicationStatus | '');
        }}
        className={`w-fit ${inputClass}`}
      >
        <option value="">كل الحالات</option>
        <option value="pending">قيد المراجعة</option>
        <option value="approved">مقبول</option>
        <option value="rejected">مرفوض</option>
      </select>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : applications.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد طلبات</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <ApplicationRow
              key={application._id}
              application={application}
              onReviewed={refresh}
            />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
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

export default function AdminApplicationsPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          طلبات الانضمام كمدرس
        </h1>
        <AdminApplicationsContent />
      </main>
    </RequireRole>
  );
}
