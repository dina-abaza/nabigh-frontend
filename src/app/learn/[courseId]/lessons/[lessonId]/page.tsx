'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { primaryButtonClass } from '@/lib/ui';
import type { LessonPlayback } from '@/lib/types';

function LessonPlayerContent({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter();
  const [lessonTitle, setLessonTitle] = useState('');
  const [playback, setPlayback] = useState<LessonPlayback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/lessons/${lessonId}/playback`)
      .then((response) => {
        if (isMounted) {
          setLessonTitle(response.data.data.lesson.title);
          setPlayback(response.data.data.playback);
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
  }, [lessonId]);

  async function completeLesson() {
    setIsCompleting(true);
    setCompleteError(null);
    try {
      await api.post(`/progress/courses/${courseId}/lessons/${lessonId}/complete`, {});
      router.push(`/learn/${courseId}`);
    } catch (apiError) {
      setCompleteError(getApiErrorMessage(apiError).message);
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error || !playback) return <p className="text-[var(--bad)]">{error ?? 'تعذر تحميل الدرس'}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-extrabold text-[var(--navy-950)]">{lessonTitle}</h1>
        <Link href={`/learn/${courseId}`} className="text-sm text-[var(--navy-950)] underline">
          الرجوع لقائمة الدروس
        </Link>
      </div>

      <div className="aspect-video overflow-hidden rounded-xl bg-[var(--navy-950)]">
        {playback.type === 'iframe' ? (
          <iframe
            src={playback.url}
            className="h-full w-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
          <video src={playback.url} controls className="h-full w-full" />
        )}
      </div>

      {completeError && <p className="text-sm text-[var(--bad)]">{completeError}</p>}

      <button onClick={completeLesson} disabled={isCompleting} className={`${primaryButtonClass} w-fit`}>
        {isCompleting ? '...جارٍ الحفظ' : 'أكملت الدرس'}
      </button>
    </div>
  );
}

export default function LessonPlayerPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  return (
    <RequireRole role="student">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <LessonPlayerContent courseId={params.courseId} lessonId={params.lessonId} />
      </main>
    </RequireRole>
  );
}
