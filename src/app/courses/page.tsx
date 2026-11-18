'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { cardClass, ghostButtonClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { Course, Pagination } from '@/lib/types';

function teacherName(course: Course): string {
  return typeof course.teacherId === 'string' ? '' : course.teacherId.user.name;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (isMounted) setIsLoading(true);
      try {
        const response = await api.get('/courses', { params: { page, limit: 20 } });
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
  }, [page]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">الكورسات</h1>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : courses.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد كورسات منشورة حاليًا</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course._id} href={`/courses/${course._id}`} className={`${cardClass} block`}>
              <p className="font-semibold text-[var(--navy-950)]">{course.title}</p>
              {teacherName(course) && (
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{teacherName(course)}</p>
              )}
              <p className="mt-3 font-heading font-bold">{piastresToEgp(course.price)} ج.م</p>
            </Link>
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
    </main>
  );
}
