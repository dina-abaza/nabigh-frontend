'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { Course, CourseStatus, Pagination } from '@/lib/types';

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'مسودة',
  pending_review: 'قيد المراجعة',
  published: 'منشور',
  unpublished: 'مسحوب',
  archived: 'مؤرشف',
};

function CourseRow({ course, onChanged }: { course: Course; onChanged: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/courses/${course._id}/submit`);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function withdraw() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/courses/${course._id}/withdraw`);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <tr className="border-b border-[var(--line)] last:border-0">
      <td className="p-3">
        <Link href={`/teacher/courses/${course._id}`} className="font-semibold text-[var(--navy-950)] underline">
          {course.title}
        </Link>
      </td>
      <td className="p-3 font-heading">{piastresToEgp(course.price)} ج.م</td>
      <td className="p-3">{STATUS_LABELS[course.status]}</td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          {(course.status === 'draft' || course.status === 'unpublished') && (
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
            >
              إرسال للمراجعة
            </button>
          )}
          {course.status === 'published' && (
            <button
              onClick={withdraw}
              disabled={isSubmitting}
              className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
            >
              سحب
            </button>
          )}
          {error && <span className="text-xs text-[var(--bad)]">{error}</span>}
        </div>
      </td>
    </tr>
  );
}

function TeacherCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/courses/mine', {
          params: { page, limit: 20, ...(status ? { status } : {}) },
        });
        if (isMounted) {
          setCourses(response.data.data.courses);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className={inputClass}
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Link href="/teacher/courses/new" className={primaryButtonClass}>
          + كورس جديد
        </Link>
      </div>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : (
        <div className={`overflow-x-auto ${cardClass} !p-0`}>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <th className="p-3">العنوان</th>
                <th className="p-3">السعر</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <CourseRow key={course._id} course={course} onChanged={refresh} />
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <p className="p-4 text-center text-[var(--ink-muted)]">لا توجد كورسات بعد</p>
          )}
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

export default function TeacherCoursesPage() {
  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">كورساتي</h1>
        <TeacherCoursesContent />
      </main>
    </RequireRole>
  );
}
