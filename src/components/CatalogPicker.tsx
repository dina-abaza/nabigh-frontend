'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inputClass } from '@/lib/ui';
import type { CatalogItem } from '@/lib/types';

export interface CatalogSelection {
  countryId: string;
  curriculumId: string;
  stageId: string;
  gradeId: string;
  subjectId: string;
}

export const EMPTY_CATALOG_SELECTION: CatalogSelection = {
  countryId: '',
  curriculumId: '',
  stageId: '',
  gradeId: '',
  subjectId: '',
};

function useCatalogLevel(
  collection: string,
  parentParam: string | null,
  parentValue: string,
) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (parentParam && !parentValue) {
        if (isMounted) setItems([]);
        return;
      }
      if (isMounted) setIsLoading(true);
      try {
        const params: Record<string, string | number> = { limit: 100 };
        if (parentParam) params[parentParam] = parentValue;
        const response = await api.get(`/catalog/${collection}`, { params });
        if (isMounted) setItems(response.data.data[collection]);
      } catch {
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [collection, parentParam, parentValue]);

  return { items, isLoading };
}

export function CatalogPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: CatalogSelection;
  onChange: (next: CatalogSelection) => void;
  disabled?: boolean;
}) {
  const { items: countries } = useCatalogLevel('countries', null, '');
  const { items: curriculums } = useCatalogLevel('curriculums', 'countryId', value.countryId);
  const { items: stages } = useCatalogLevel('stages', 'curriculumId', value.curriculumId);
  const { items: grades } = useCatalogLevel('grades', 'stageId', value.stageId);
  const { items: subjects } = useCatalogLevel('subjects', 'gradeId', value.gradeId);

  const fieldClass = `${inputClass} w-full`;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">الدولة</label>
        <select
          value={value.countryId}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...EMPTY_CATALOG_SELECTION,
              countryId: event.target.value,
            })
          }
          className={fieldClass}
        >
          <option value="">اختاري...</option>
          {countries.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name.ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">المنهج</label>
        <select
          value={value.curriculumId}
          disabled={disabled || !value.countryId}
          onChange={(event) =>
            onChange({
              ...value,
              curriculumId: event.target.value,
              stageId: '',
              gradeId: '',
              subjectId: '',
            })
          }
          className={fieldClass}
        >
          <option value="">اختاري...</option>
          {curriculums.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name.ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">المرحلة</label>
        <select
          value={value.stageId}
          disabled={disabled || !value.curriculumId}
          onChange={(event) =>
            onChange({ ...value, stageId: event.target.value, gradeId: '', subjectId: '' })
          }
          className={fieldClass}
        >
          <option value="">اختاري...</option>
          {stages.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name.ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">الصف</label>
        <select
          value={value.gradeId}
          disabled={disabled || !value.stageId}
          onChange={(event) => onChange({ ...value, gradeId: event.target.value, subjectId: '' })}
          className={fieldClass}
        >
          <option value="">اختاري...</option>
          {grades.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name.ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--ink-muted)]">المادة</label>
        <select
          value={value.subjectId}
          disabled={disabled || !value.gradeId}
          onChange={(event) => onChange({ ...value, subjectId: event.target.value })}
          className={fieldClass}
        >
          <option value="">اختاري...</option>
          {subjects.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name.ar}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
