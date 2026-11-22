import type { SidebarItem } from '@/components/DashboardSidebar';

export const ADMIN_NAV_ITEMS: SidebarItem[] = [
  { href: '/admin/users', label: 'المستخدمون' },
  { href: '/admin/teachers', label: 'المدرسون' },
  { href: '/admin/applications', label: 'طلبات المدرسين' },
  { href: '/admin/catalog', label: 'الكتالوج' },
  { href: '/admin/courses', label: 'الكورسات' },
  { href: '/admin/offers', label: 'عروض الأسعار' },
  { href: '/admin/video-settings', label: 'إعداد الفيديو' },
  { href: '/admin/subscriptions', label: 'الاشتراكات' },
  { href: '/admin/payment-gateways', label: 'بوابات الدفع' },
  { href: '/admin/payments', label: 'المدفوعات' },
  { href: '/admin/settlements', label: 'المستحقات' },
];

export const TEACHER_NAV_ITEMS: SidebarItem[] = [
  { href: '/teacher', label: 'ملف المدرس' },
  { href: '/teacher/courses', label: 'كورساتي' },
  { href: '/teacher/offers', label: 'عروض الأسعار' },
  { href: '/teacher/settlements', label: 'مستحقاتي' },
];
