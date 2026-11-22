'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { CatalogPicker, EMPTY_CATALOG_SELECTION, type CatalogSelection } from '@/components/CatalogPicker';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { egpToPiastres, piastresToEgp } from '@/lib/money';
import type { Course, CourseStatus, Pagination, TeacherProfile } from '@/lib/types';

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'مسودة',
  pending_review: 'قيد المراجعة',
  published: 'منشور',
  unpublished: 'مسحوب',
  archived: 'مؤرشف',
};

function teacherName(course: Course): string {
  return typeof course.teacherId === 'string' ? course.teacherId : course.teacherId.user.name;
}

function CreateCourseForBehalfForm({ onCreated }: { onCreated: () => void }) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selection, setSelection] = useState<CatalogSelection>(EMPTY_CATALOG_SELECTION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/teachers', { params: { limit: 100 } })
      .then((response) => setTeachers(response.data.data.teachers))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/courses/manage', {
        teacherId,
        title,
        description,
        price: egpToPiastres(price),
        countryId: selection.countryId,
        curriculumId: selection.curriculumId,
        gradeId: selection.gradeId,
        subjectId: selection.subjectId,
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setSelection(EMPTY_CATALOG_SELECTION);
      onCreated();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        value={teacherId}
        onChange={(event) => setTeacherId(event.target.value)}
        required
        className={inputClass}
      >
        <option value="">اختاري المدرس...</option>
        {teachers.map((teacher) => (
          <option key={teacher._id} value={teacher._id}>
            {teacher.user.name}
          </option>
        ))}
      </select>
      <input
        placeholder="عنوان الكورس"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        minLength={3}
        maxLength={160}
        className={inputClass}
      />
      <textarea
        placeholder="الوصف"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        required
        minLength={10}
        maxLength={5000}
        rows={3}
        className={inputClass}
      />
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder="السعر (جنيه)"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        required
        className={`w-40 ${inputClass}`}
      />
      <CatalogPicker value={selection} onChange={setSelection} />
      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting || !teacherId || !selection.subjectId}
        className={`${primaryButtonClass} w-fit`}
      >
        {isSubmitting ? '...جارٍ الإنشاء' : 'إنشاء مسودة للمدرس'}
      </button>
    </form>
  );
}

function CourseManageRow({ course, onChanged }: { course: Course; onChanged: () => void }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: 'approve' | 'reject') {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/courses/${course._id}/review`, {
        decision,
        ...(reviewNote ? { reviewNote } : {}),
      });
      setIsReviewing(false);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function archive() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/courses/manage/${course._id}/archive`);
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

  async function submitForReview() {
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

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[var(--ink)]">{course.title}</p>
          <p className="text-sm text-[var(--ink-muted)]">المدرس: {teacherName(course)}</p>
          <p className="font-heading text-sm">{piastresToEgp(course.price)} ج.م</p>
        </div>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-muted)]">
          {STATUS_LABELS[course.status]}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}

      {(course.status === 'draft' || course.status === 'unpublished') && (
        <button
          onClick={submitForReview}
          disabled={isSubmitting}
          className={`${primaryButtonClass} !px-4 !py-1 mt-3 text-sm`}
        >
          إرسال للمراجعة
        </button>
      )}

      {course.status === 'pending_review' && (
        <div className="mt-3">
          {!isReviewing ? (
            <button onClick={() => setIsReviewing(true)} className={`${ghostButtonClass} !px-4 !py-1 text-sm`}>
              مراجعة
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="ملاحظة المراجعة (مطلوبة عند الرفض)"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={2}
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => review('approve')}
                  disabled={isSubmitting}
                  className={`${primaryButtonClass} !px-4 !py-1 text-sm`}
                >
                  قبول
                </button>
                <button
                  onClick={() => review('reject')}
                  disabled={isSubmitting}
                  className={`${ghostButtonClass} !px-4 !py-1 text-sm`}
                >
                  رفض
                </button>
                <button onClick={() => setIsReviewing(false)} className="text-sm text-[var(--ink-muted)]">
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {course.status === 'published' && (
        <button
          onClick={withdraw}
          disabled={isSubmitting}
          className={`${ghostButtonClass} !px-4 !py-1 mt-3 text-sm`}
        >
          سحب الكورس
        </button>
      )}

      {course.status === 'unpublished' && (
        <button
          onClick={archive}
          disabled={isSubmitting}
          className={`${ghostButtonClass} !px-4 !py-1 mt-3 text-sm`}
        >
          أرشفة
        </button>
      )}

      <Link
        href={`/teacher/courses/${course._id}/lessons`}
        className="mt-3 inline-block text-sm text-[var(--navy-950)] underline"
      >
        إدارة الدروس
      </Link>
    </div>
  );
}

function AdminCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending_review');
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
        const response = await api.get('/courses/manage', {
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
      <div className={cardClass}>
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">إنشاء كورس نيابة عن مدرس</h2>
        <CreateCourseForBehalfForm onCreated={refresh} />
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
      ) : courses.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد كورسات</p>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map((course) => (
            <CourseManageRow key={course._id} course={course} onChanged={refresh} />
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

export default function AdminCoursesPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">إدارة الكورسات</h1>
        <AdminCoursesContent />
      </main>
    </RequireRole>
  );
}
