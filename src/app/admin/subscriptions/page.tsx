'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { AdminUser, Course, Pagination, Subscription, SubscriptionStatus } from '@/lib/types';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'نشط',
  cancelled: 'ملغى',
  pending_payment: 'بانتظار الدفع',
};

function courseTitle(subscription: Subscription): string {
  return typeof subscription.courseId === 'string' ? subscription.courseId : subscription.courseId.title;
}

function studentName(subscription: Subscription): string {
  return typeof subscription.studentId === 'string' ? subscription.studentId : subscription.studentId.name;
}

function ActivateSubscriptionForm({ onCreated }: { onCreated: () => void }) {
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/users', { params: { role: 'student', limit: 100 } })
      .then((response) => setStudents(response.data.data.users))
      .catch(() => {});
    api
      .get('/courses', { params: { limit: 100 } })
      .then((response) => setCourses(response.data.data.courses))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/subscriptions/manage', { studentId, courseId });
      setStudentId('');
      setCourseId('');
      onCreated();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">الطالب</label>
        <select value={studentId} onChange={(event) => setStudentId(event.target.value)} required className={inputClass}>
          <option value="">اختاري طالب...</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">الكورس المنشور</label>
        <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required className={inputClass}>
          <option value="">اختاري كورس...</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? '...جارٍ التفعيل' : 'تفعيل الاشتراك'}
      </button>
      {error && <p className="w-full text-sm text-[var(--bad)]">{error}</p>}
      {courses.length === 0 && (
        <p className="w-full text-xs text-[var(--ink-muted)]">
          مفيش كورسات منشورة بعد — انشري كورس الأول قبل ما تفعّلي اشتراك.
        </p>
      )}
    </form>
  );
}

function AdminSubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/subscriptions/manage', {
          params: { page, limit: 20, ...(status ? { status } : {}) },
        });
        if (isMounted) {
          setSubscriptions(response.data.data.subscriptions);
          setPagination(response.data.data.pagination);
        }
      } catch (apiError) {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [page, status, reloadKey]);

  async function cancelSubscription(id: string) {
    setPendingId(id);
    try {
      await api.patch(`/subscriptions/manage/${id}/cancel`);
      refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">تفعيل اشتراك يدوي</h2>
        <ActivateSubscriptionForm onCreated={refresh} />
      </div>

      <select
        value={status}
        onChange={(event) => {
          setPage(1);
          setStatus(event.target.value);
        }}
        className={`w-fit ${inputClass}`}
      >
        <option value="">كل الحالات</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : (
        <div className={`overflow-x-auto ${cardClass} !p-0`}>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <th className="p-3">الطالب</th>
                <th className="p-3">الكورس</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription._id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3">{studentName(subscription)}</td>
                  <td className="p-3">{courseTitle(subscription)}</td>
                  <td className="p-3">{STATUS_LABELS[subscription.status]}</td>
                  <td className="p-3">
                    {subscription.status === 'active' && (
                      <button
                        onClick={() => cancelSubscription(subscription._id)}
                        disabled={pendingId === subscription._id}
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && (
            <p className="p-4 text-center text-[var(--ink-muted)]">لا توجد اشتراكات</p>
          )}
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

export default function AdminSubscriptionsPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">الاشتراكات</h1>
        <AdminSubscriptionsContent />
      </main>
    </RequireRole>
  );
}
