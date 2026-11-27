'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { CatalogItem } from '@/lib/types';

interface LevelConfig {
  key: string;
  collection: string;
  title: string;
  parentParam?: string;
}

const LEVELS: LevelConfig[] = [
  { key: 'country', collection: 'countries', title: 'الدول' },
  { key: 'curriculum', collection: 'curriculums', title: 'المناهج', parentParam: 'countryId' },
  { key: 'stage', collection: 'stages', title: 'المراحل', parentParam: 'curriculumId' },
  { key: 'grade', collection: 'grades', title: 'الصفوف', parentParam: 'stageId' },
  { key: 'subject', collection: 'subjects', title: 'المواد', parentParam: 'gradeId' },
];

function CatalogLevelSection({
  level,
  parentId,
  selectedId,
  onSelect,
}: {
  level: LevelConfig;
  parentId: string | null;
  selectedId: string;
  onSelect: (id: string, item: CatalogItem | null) => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const blocked = Boolean(level.parentParam) && !parentId;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (blocked) {
        if (isMounted) {
          setItems([]);
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = { limit: 100 };
        if (level.parentParam && parentId) params[level.parentParam] = parentId;
        const response = await api.get(`/catalog/${level.collection}`, { params });
        if (isMounted) setItems(response.data.data[level.collection]);
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
  }, [level.collection, level.parentParam, parentId, blocked, reloadKey]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/catalog/${level.collection}`, {
        code,
        name: { ar: nameAr, en: nameEn },
        ...(level.parentParam && parentId ? { [level.parentParam]: parentId } : {}),
      });
      setCode('');
      setNameAr('');
      setNameEn('');
      setReloadKey((key) => key + 1);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.delete(`/catalog/${level.collection}/${id}`);
      if (selectedId === id) onSelect('', null);
      setReloadKey((key) => key + 1);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    }
  }

  return (
    <div className={cardClass}>
      <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">{level.title}</h2>

      {blocked ? (
        <p className="text-sm text-[var(--ink-muted)]">اختاري عنصر من المستوى اللي فوق الأول.</p>
      ) : isLoading ? (
        <p className="text-sm text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item._id}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                  selectedId === item._id
                    ? 'border-[var(--navy-950)] bg-[var(--navy-950)] text-white'
                    : 'border-[var(--line)]'
                }`}
              >
                <button onClick={() => onSelect(item._id, item)}>{item.name.ar}</button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className={selectedId === item._id ? 'text-[var(--gold-100)]' : 'text-[var(--bad)]'}
                  title="حذف"
                >
                  ×
                </button>
              </div>
            ))}
            {items.length === 0 && <span className="text-sm text-[var(--ink-muted)]">لا يوجد عناصر بعد</span>}
          </div>

          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--ink-muted)]">الرمز (code)</label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                maxLength={32}
                className={`w-32 ${inputClass} !py-1`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--ink-muted)]">الاسم بالعربي</label>
              <input
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                required
                className={`${inputClass} !py-1`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--ink-muted)]">الاسم بالإنجليزي</label>
              <input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                required
                className={`${inputClass} !py-1`}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} !px-4 !py-1 text-sm`}>
              + إضافة
            </button>
          </form>
        </>
      )}

      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}
    </div>
  );
}

function AdminCatalogContent() {
  const [selection, setSelection] = useState<Record<string, string>>({
    country: '',
    curriculum: '',
    stage: '',
    grade: '',
    subject: '',
  });

  function selectAt(levelKey: string, id: string) {
    const index = LEVELS.findIndex((level) => level.key === levelKey);
    setSelection((previous) => {
      const next = { ...previous, [levelKey]: id };
      for (let i = index + 1; i < LEVELS.length; i++) {
        next[LEVELS[i].key] = '';
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--ink-muted)]">
        دوسي على اسم العنصر عشان تختاريه وتفتحي المستوى اللي تحته. دوسي على × عشان تحذفي عنصر (لو كان له عناصر
        تابعة مش هيتحذف وهيظهر خطأ).
      </p>
      {LEVELS.map((level, index) => (
        <CatalogLevelSection
          key={level.key}
          level={level}
          parentId={index === 0 ? null : selection[LEVELS[index - 1].key] || null}
          selectedId={selection[level.key]}
          onSelect={(id) => selectAt(level.key, id)}
        />
      ))}
    </div>
  );
}

export default function AdminCatalogPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">إدارة الكتالوج</h1>
        <AdminCatalogContent />
      </main>
    </RequireRole>
  );
}
