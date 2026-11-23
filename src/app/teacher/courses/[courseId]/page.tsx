'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RequireRole } from '@/components/RequireRole';
import { CatalogPicker, EMPTY_CATALOG_SELECTION, type CatalogSelection } from '@/components/CatalogPicker';
import { ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { egpToPiastres, piastresToEgp, usdCentsToUsd, usdToUsdCents } from '@/lib/money';
import type { Course, CourseStatus } from '@/lib/types';

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'مسودة',
  pending_review: 'قيد المراجعة',
  published: 'منشور',
  unpublished: 'مسحوب',
  archived: 'مؤرشف',
};

function EditCourseForm({ course, onUpdated }: { course: Course; onUpdated: (course: Course) => void }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [price, setPrice] = useState(piastresToEgp(course.price));
  const [priceUsd, setPriceUsd] = useState(usdCentsToUsd(course.priceUsd));
  const [selection, setSelection] = useState<CatalogSelection>({
    ...EMPTY_CATALOG_SELECTION,
    countryId: course.countryId,
    curriculumId: course.curriculumId,
    gradeId: course.gradeId,
    subjectId: course.subjectId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetail[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/catalog/grades/${course.gradeId}`)
      .then((response) => {
        if (isMounted) {
          setSelection((previous) => ({ ...previous, stageId: response.data.data.stageId ?? '' }));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [course.gradeId]);

  const fieldError = (field: string) =>
    fieldErrors.find((detail) => detail.field === field)?.message;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const response = await api.patch(`/courses/${course._id}`, {
        title,
        description,
        price: egpToPiastres(price),
        priceUsd: usdToUsdCents(priceUsd),
        countryId: selection.countryId,
        curriculumId: selection.curriculumId,
        gradeId: selection.gradeId,
        subjectId: selection.subjectId,
      });
      onUpdated(response.data.data);
      setSuccessMessage('تم حفظ التعديلات');
    } catch (error) {
      const { message, details } = getApiErrorMessage(error);
      setFormError(message);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitForReview() {
    setIsActing(true);
    setActionError(null);
    try {
      const response = await api.patch(`/courses/${course._id}/submit`);
      onUpdated(response.data.data);
    } catch (apiError) {
      setActionError(getApiErrorMessage(apiError).message);
    } finally {
      setIsActing(false);
    }
  }

  async function withdraw() {
    setIsActing(true);
    setActionError(null);
    try {
      const response = await api.patch(`/courses/${course._id}/withdraw`);
      onUpdated(response.data.data);
    } catch (apiError) {
      setActionError(getApiErrorMessage(apiError).message);
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--ink-muted)]">
          الحالة: {STATUS_LABELS[course.status]}
        </span>
        <div className="flex items-center gap-2">
          <Link href={`/teacher/courses/${course._id}/lessons`} className={ghostButtonClass}>
            إدارة الدروس
          </Link>
          {(course.status === 'draft' || course.status === 'unpublished') && (
            <button onClick={submitForReview} disabled={isActing} className={primaryButtonClass}>
              إرسال للمراجعة
            </button>
          )}
          {course.status === 'published' && (
            <button onClick={withdraw} disabled={isActing} className={ghostButtonClass}>
              سحب الكورس
            </button>
          )}
        </div>
      </div>

      {course.reviewNote && (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--gold-100)] p-3 text-sm">
          ملاحظة المراجعة: {course.reviewNote}
        </p>
      )}
      {actionError && <p className="text-sm text-[var(--bad)]">{actionError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--ink-muted)]">عنوان الكورس</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={160}
            className={inputClass}
          />
          {fieldError('title') && <p className="text-sm text-[var(--bad)]">{fieldError('title')}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--ink-muted)]">الوصف</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={5000}
            rows={4}
            className={inputClass}
          />
          {fieldError('description') && (
            <p className="text-sm text-[var(--bad)]">{fieldError('description')}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--ink-muted)]">السعر (جنيه مصري)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={`w-40 ${inputClass}`}
            />
            {fieldError('price') && <p className="text-sm text-[var(--bad)]">{fieldError('price')}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--ink-muted)]">السعر (دولار أمريكي)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={priceUsd}
              onChange={(event) => setPriceUsd(event.target.value)}
              className={`w-40 ${inputClass}`}
            />
            {fieldError('priceUsd') && (
              <p className="text-sm text-[var(--bad)]">{fieldError('priceUsd')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-[var(--ink-muted)]">الدولة / المنهج / المرحلة / الصف / المادة</label>
          <CatalogPicker value={selection} onChange={setSelection} />
        </div>

        {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}
        {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage}</p>}

        <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} w-fit`}>
          {isSubmitting ? '...جارٍ الحفظ' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}

function TeacherCourseDetailContent() {
  const params = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const path = user?.role === 'admin' ? 'manage' : 'mine';
    api
      .get(`/courses/${path}/${params.courseId}`)
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
  }, [params.courseId, user?.role]);

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error || !course) return <p className="text-[var(--bad)]">{error ?? 'تعذر تحميل الكورس'}</p>;

  return <EditCourseForm course={course} onUpdated={setCourse} />;
}

export default function TeacherCourseDetailPage() {
  return (
    <RequireRole role={['teacher', 'admin']}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">تعديل الكورس</h1>
        <TeacherCourseDetailContent />
      </main>
    </RequireRole>
  );
}
