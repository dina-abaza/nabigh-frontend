import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { ghostButtonClass, primaryButtonClass } from "@/lib/ui";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <LogoMark size={56} />
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-[var(--navy-950)]">
          نابغ — تعلّم · تحدّى · تفوّق
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">سجّل حسابك أو سجّل الدخول للمتابعة</p>
      </div>
      <div className="flex gap-4">
        <Link href="/login" className={primaryButtonClass}>
          تسجيل الدخول
        </Link>
        <Link href="/register" className={ghostButtonClass}>
          إنشاء حساب
        </Link>
      </div>
      <Link href="/become-teacher" className="text-sm text-[var(--ink-muted)] underline">
        هل أنت مدرس؟ قدّم طلب انضمام
      </Link>
    </main>
  );
}
