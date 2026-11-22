'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass } from '@/lib/ui';
import type { CourseLessonsResponse } from '@/lib/types';

function LearnCourseContent({ courseId }: { courseId: string }) {
  const [data, setData] = useState<CourseLessonsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/lessons/courses/${courseId}`)
      .then((response) => {
        if (isMounted) setData(response.data.data);
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
  }, [courseId]);

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error || !data) return <p className="text-[var(--bad)]">{error ?? 'تعذر تحميل الكورس'}</p>;

  const { course, lessons, summary } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">{course.title}</h1>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full bg-[var(--gold-500)]"
            style={{ width: `${summary.completionPercent}%` }}
          />
        </div>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {summary.completedLessons} من {summary.totalLessons} دروس مكتملة ({summary.completionPercent}%)
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {lessons.map((lesson) => (
          <div
            key={lesson._id}
            className={`${cardClass} flex items-center justify-between ${!lesson.unlocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-[var(--line)] text-sm font-bold">
                {lesson.order}
              </span>
              <div>
                <p className="font-semibold">{lesson.title}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {lesson.durationMinutes} دقيقة
                  {lesson.completed && ' · مكتمل ✓'}
                </p>
              </div>
            </div>
            {lesson.unlocked ? (
              <Link
                href={`/learn/${courseId}/lessons/${lesson._id}`}
                className="rounded-full bg-[var(--gold-500)] px-4 py-1.5 text-sm font-bold text-[var(--navy-950)]"
              >
                {lesson.completed ? 'مشاهدة تانية' : 'ابدئي الدرس'}
              </Link>
            ) : (
              <span className="text-xs text-[var(--ink-muted)]">🔒 مقفول</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LearnCoursePage() {
  const params = useParams<{ courseId: string }>();
  return (
    <RequireRole role="student">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <LearnCourseContent courseId={params.courseId} />
      </main>
    </RequireRole>
  );
}
