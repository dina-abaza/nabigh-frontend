'use client';

import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { Lesson } from '@/lib/types';

const VIDEO_STATUS_LABELS: Record<string, string> = {
  awaiting_upload: 'بانتظار الرفع',
  processing: 'جارٍ المعالجة',
  ready: 'جاهز',
  failed: 'فشل',
};

function AddLessonForm({ courseId, onCreated }: { courseId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/lessons', {
        courseId,
        title,
        order: Number(order),
        durationMinutes: Number(durationMinutes),
      });
      setTitle('');
      setOrder('');
      setDurationMinutes('');
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
        <label className="text-xs text-[var(--ink-muted)]">عنوان الدرس</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">الترتيب</label>
        <input
          type="number"
          min={1}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          required
          className={`w-20 ${inputClass}`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">المدة (دقيقة)</label>
        <input
          type="number"
          min={1}
          max={1440}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          required
          className={`w-24 ${inputClass}`}
        />
      </div>
      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? '...جارٍ الإضافة' : '+ إضافة درس'}
      </button>
      {error && <p className="w-full text-sm text-[var(--bad)]">{error}</p>}
    </form>
  );
}

function LessonVideoPanel({ lesson, onUpdated }: { lesson: Lesson; onUpdated: (lesson: Lesson) => void }) {
  const [mode, setMode] = useState<'file' | 'url' | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshStatus() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await api.post(`/lessons/${lesson._id}/video-status/refresh`);
      onUpdated(response.data.data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleFilePicked(file: File) {
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await api.post(`/lessons/${lesson._id}/video-upload`, { mimeType: file.type });
      const { upload } = response.data.data;

      if (upload.mode === 'direct') {
        await axios.put(upload.url, file, {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setUploadPercent(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            }
          },
        });
        setMessage('تم رفع الفيديو، جارٍ المعالجة من المزود.');
      } else {
        setMessage(
          `مزود الفيديو الحالي يحتاج تكامل إضافي (وضع "${upload.mode}") غير مُفعّل في هذه النسخة من الواجهة بعد.`,
        );
      }
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsBusy(false);
      setUploadPercent(null);
    }
  }

  async function handleUrlImport(event: FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.post(`/lessons/${lesson._id}/video-upload`, { sourceUrl });
      setMessage('تم إرسال الرابط، جارٍ استيراد الفيديو ومعالجته من المزود.');
      setSourceUrl('');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[var(--ink-muted)]">
          حالة الفيديو: {lesson.video ? VIDEO_STATUS_LABELS[lesson.video.status] ?? lesson.video.status : 'لم يُرفع بعد'}
        </span>
        <button onClick={refreshStatus} disabled={isBusy} className="text-xs underline text-[var(--navy-950)]">
          تحديث الحالة
        </button>
      </div>

      {!mode ? (
        <div className="flex gap-2">
          <button onClick={() => setMode('file')} className={`${ghostButtonClass} !px-3 !py-1 text-xs`}>
            رفع ملف من الجهاز
          </button>
          <button onClick={() => setMode('url')} className={`${ghostButtonClass} !px-3 !py-1 text-xs`}>
            استيراد من رابط
          </button>
        </div>
      ) : mode === 'file' ? (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFilePicked(file);
            }}
            disabled={isBusy}
            className="text-xs"
          />
          {uploadPercent !== null && <span className="text-xs">{uploadPercent}%</span>}
          <button onClick={() => setMode(null)} className="text-xs text-[var(--ink-muted)]">
            إلغاء
          </button>
        </div>
      ) : (
        <form onSubmit={handleUrlImport} className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
            className={`${inputClass} !py-1 text-xs`}
          />
          <button type="submit" disabled={isBusy} className={`${primaryButtonClass} !px-3 !py-1 text-xs`}>
            إرسال
          </button>
          <button type="button" onClick={() => setMode(null)} className="text-xs text-[var(--ink-muted)]">
            إلغاء
          </button>
        </form>
      )}

      {message && <p className="text-[var(--ink-muted)]">{message}</p>}
      {error && <p className="text-[var(--bad)]">{error}</p>}
    </div>
  );
}

function LessonRow({ lesson, onChanged }: { lesson: Lesson; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [order, setOrder] = useState(String(lesson.order));
  const [durationMinutes, setDurationMinutes] = useState(String(lesson.durationMinutes));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEdits() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/lessons/${lesson._id}`, {
        title,
        order: Number(order),
        durationMinutes: Number(durationMinutes),
      });
      setIsEditing(false);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteLesson() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.delete(`/lessons/${lesson._id}`);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cardClass}>
      {isEditing ? (
        <div className="flex flex-wrap items-end gap-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
          <input
            type="number"
            min={1}
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className={`w-20 ${inputClass}`}
          />
          <input
            type="number"
            min={1}
            max={1440}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className={`w-24 ${inputClass}`}
          />
          <button onClick={saveEdits} disabled={isSubmitting} className={`${primaryButtonClass} !px-3 !py-1 text-xs`}>
            حفظ
          </button>
          <button onClick={() => setIsEditing(false)} className="text-xs text-[var(--ink-muted)]">
            إلغاء
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">
              {lesson.order}. {lesson.title}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">{lesson.durationMinutes} دقيقة</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="text-xs underline text-[var(--navy-950)]">
              تعديل
            </button>
            <button onClick={deleteLesson} disabled={isSubmitting} className="text-xs text-[var(--bad)]">
              حذف
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}

      <LessonVideoPanel lesson={lesson} onUpdated={onChanged} />
    </div>
  );
}

function LessonsContent({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/lessons', { params: { courseId } })
      .then((response) => {
        if (isMounted) setLessons(response.data.data.lessons ?? response.data.data);
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
  }, [courseId, reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">إضافة درس</h2>
        <AddLessonForm courseId={courseId} onCreated={refresh} />
      </div>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : lessons.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد دروس بعد</p>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lesson) => (
              <LessonRow key={lesson._id} lesson={lesson} onChanged={refresh} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherLessonsPage() {
  const params = useParams<{ courseId: string }>();

  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">دروس الكورس</h1>
          <Link href={`/teacher/courses/${params.courseId}`} className="text-sm text-[var(--navy-950)] underline">
            الرجوع لبيانات الكورس
          </Link>
        </div>
        <LessonsContent courseId={params.courseId} />
      </main>
    </RequireRole>
  );
}
