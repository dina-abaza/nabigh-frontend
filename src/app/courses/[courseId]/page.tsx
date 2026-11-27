'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cardClass, primaryButtonClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { Course } from '@/lib/types';

function teacherName(course: Course): string {
  return typeof course.teacherId === 'string' ? '' : course.teacherId.user.name;
}

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/courses/${params.courseId}`)
      .then((response) => {
        if (isMounted) setCourse(response.data.data);
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
  }, [params.courseId]);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <p className="text-[var(--bad)]">{error ?? 'هذا الكورس غير متاح'}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">{course.title}</h1>
        {teacherName(course) && (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{teacherName(course)}</p>
        )}
      </div>

      <p className="whitespace-pre-line text-[var(--ink)]">{course.description}</p>

      <div className={cardClass}>
        <p className="mb-3 font-heading text-xl font-extrabold">{piastresToEgp(course.price)} ج.م</p>
        {isAuthLoading ? null : !user ? (
          <Link href="/login" className={`${primaryButtonClass} block w-full text-center`}>
            سجلي الدخول للاشتراك
          </Link>
        ) : user.role === 'student' ? (
          <Link href={`/checkout/${course._id}`} className={`${primaryButtonClass} block w-full text-center`}>
            اشترك في الكورس
          </Link>
        ) : (
          <button className={`${primaryButtonClass} w-full`} disabled title="الاشتراك متاح لحساب الطالب فقط">
            اشترك في الكورس
          </button>
        )}
      </div>
    </main>
  );
}
