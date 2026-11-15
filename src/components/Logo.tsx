import Image from 'next/image';
import Link from 'next/link';

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/brand/icon.png"
      alt="نابغ"
      width={size}
      height={size}
      className="flex-none rounded-[22%]"
      priority
    />
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <LogoMark size={36} />
      <span className="font-heading text-lg font-extrabold text-[var(--navy-950)]">نابغ</span>
    </Link>
  );
}
