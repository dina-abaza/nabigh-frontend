'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cardClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { Course } from '@/lib/types';

function teacherName(course: Course): string {
  return typeof course.teacherId === 'string' ? '' : course.teacherId.user.name;
}

const FEATURES = [
  { title: 'دروس مسجلة', body: 'راجعي أي حصة في أي وقت يناسبك.' },
  { title: 'متابعة حقيقية', body: 'تقدمك واشتراكك واضحين قدامك دايمًا.' },
  { title: 'دفع آمن', body: 'اشتركي وادفعي ببوابات دفع موثوقة.' },
];

function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/courses', { params: { limit: 3 } })
      .then((response) => {
        if (isMounted) setCourses(response.data.data.courses);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || courses.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-10">
      <h3 className="font-heading text-lg font-extrabold">كورسات مميزة</h3>
      <p className="mb-4 text-sm text-[var(--ink-muted)]">أحدث الكورسات المنشورة</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </section>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <main className="flex flex-1 flex-col">
      <section
        className="px-6 py-14 text-center text-white"
        style={{
          background:
            'radial-gradient(60% 120% at 50% 0%, var(--navy-800), var(--navy-950))',
        }}
      >
        <p className="text-xs font-bold tracking-widest text-[var(--gold-500)]">
          تعلّم · تحدّى · تفوّق
        </p>
        <h1 className="font-heading mt-2 text-3xl font-extrabold">مدرستك أونلاين في كل المواد</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#c7cdee]">
          دروس مسجلة تراجعيها في أي وقت، ومتابعة حقيقية لمستواك خطوة بخطوة.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/courses"
            className="rounded-full bg-[var(--gold-500)] px-6 py-2 font-bold text-[var(--navy-950)]"
          >
            اكتشفي الكورسات
          </Link>
          {!isLoading && !user && (
            <Link
              href="/register"
              className="rounded-full border border-[#3b4784] px-6 py-2 font-semibold text-white"
            >
              إنشاء حساب
            </Link>
          )}
        </div>
        <Link
          href="/become-teacher"
          className="mt-4 block text-sm text-[#c7cdee] underline"
        >
          هل أنتِ مدرسة؟ قدّمي طلب انضمام
        </Link>
      </section>

      <FeaturedCourses />

      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <h3 className="font-heading text-lg font-extrabold">ليه نابغ</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--gold-100)] text-[#a9690f]">
                ●
              </span>
              <div>
                <h5 className="text-sm font-bold">{feature.title}</h5>
                <p className="text-xs text-[var(--ink-muted)]">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
