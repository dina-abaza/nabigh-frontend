'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { CatalogPicker, EMPTY_CATALOG_SELECTION, type CatalogSelection } from '@/components/CatalogPicker';
import { inputClass, primaryButtonClass } from '@/lib/ui';
import { egpToPiastres } from '@/lib/money';

function NewCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selection, setSelection] = useState<CatalogSelection>(EMPTY_CATALOG_SELECTION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetail[]>([]);

  const fieldError = (field: string) =>
    fieldErrors.find((detail) => detail.field === field)?.message;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setIsSubmitting(true);
    try {
      const response = await api.post('/courses', {
        title,
        description,
        price: egpToPiastres(price),
        countryId: selection.countryId,
        curriculumId: selection.curriculumId,
        gradeId: selection.gradeId,
        subjectId: selection.subjectId,
      });
      router.push(`/teacher/courses/${response.data.data._id}`);
    } catch (error) {
      const { message, details } = getApiErrorMessage(error);
      setFormError(message);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--ink-muted)]">عنوان الكورس</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
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
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          className={inputClass}
        />
        {fieldError('description') && (
          <p className="text-sm text-[var(--bad)]">{fieldError('description')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-[var(--ink-muted)]">السعر (جنيه مصري)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
          className={`w-40 ${inputClass}`}
        />
        {fieldError('price') && <p className="text-sm text-[var(--bad)]">{fieldError('price')}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-[var(--ink-muted)]">الدولة / المنهج / المرحلة / الصف / المادة</label>
        <CatalogPicker value={selection} onChange={setSelection} />
        {(fieldError('countryId') ||
          fieldError('curriculumId') ||
          fieldError('gradeId') ||
          fieldError('subjectId')) && (
          <p className="text-sm text-[var(--bad)]">
            تأكدي من اختيار الدولة والمنهج والصف والمادة بالكامل، وإنها ضمن المواد المسموح لك بتدريسها.
          </p>
        )}
      </div>

      {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !selection.subjectId}
        className={`${primaryButtonClass} w-fit`}
      >
        {isSubmitting ? '...جارٍ الإنشاء' : 'إنشاء مسودة'}
      </button>
    </form>
  );
}

export default function NewCoursePage() {
  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">كورس جديد</h1>
        <NewCourseForm />
      </main>
    </RequireRole>
  );
}
