export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type UserStatus = 'active' | 'suspended';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'processing';

export interface TeacherApplication {
  _id: string;
  name: string;
  email: string;
  message?: string;
  status: ApplicationStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProfile {
  _id: string;
  user: AdminUser;
  commissionPercent: number;
  allowedCountryIds: string[];
  allowedSubjectIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalizedName {
  ar: string;
  en: string;
}

export interface CatalogItem {
  _id: string;
  code: string;
  name: LocalizedName;
  countryId?: string;
  curriculumId?: string;
  stageId?: string;
  gradeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CourseStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'unpublished'
  | 'archived';

export interface TeacherRef {
  _id: string;
  user: { _id: string; name: string; avatarUrl?: string | null };
}

export interface Course {
  _id: string;
  teacherId: TeacherRef | string;
  title: string;
  description: string;
  price: number;
  priceUsd: number;
  countryId: string;
  curriculumId: string;
  gradeId: string;
  subjectId: string;
  status: CourseStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type LessonVideoStatus = 'awaiting_upload' | 'processing' | 'ready' | 'failed';
export type LessonStatus = 'uploading' | 'published';

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  durationMinutes: number;
  status: LessonStatus;
  video?: { status: LessonVideoStatus };
  createdAt: string;
  updatedAt: string;
}

export type OfferStatus = 'pending_review' | 'approved' | 'rejected';

export interface SubjectOffer {
  _id: string;
  teacherId: TeacherRef | string;
  gradeId: CatalogItem | string;
  subjectId: CatalogItem | string;
  price: number;
  status: OfferStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoProvider {
  id: string;
  name: string;
  credentials: { key: string; label: string }[];
}

export interface VideoSettings {
  configured: boolean;
  provider: { id: string; name: string } | null;
  credentials: { key: string; configured: boolean }[];
  updatedAt?: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'pending_payment';

export interface SubscriptionCourseRef {
  _id: string;
  title: string;
  teacherId: string;
  price: number;
  subjectId: string;
  status: CourseStatus;
}

export interface Subscription {
  _id: string;
  studentId: string | AdminUser;
  courseId: SubscriptionCourseRef | string;
  status: SubscriptionStatus;
  activationMethod: 'manual' | 'payment';
  activatedBy?: string;
  activatedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerLesson {
  _id: string;
  title: string;
  order: number;
  durationMinutes: number;
  completed: boolean;
  completedAt: string | null;
  unlocked: boolean;
}

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  nextLessonId: string | null;
}

export interface CourseLessonsResponse {
  course: { _id: string; title: string };
  lessons: LearnerLesson[];
  summary: CourseProgressSummary;
}

export interface LessonPlayback {
  type: 'iframe' | 'hls';
  url: string;
  expiresAt: string | null;
}

export interface PaymentMethodDef {
  id: string;
  name: string;
  liveOnly?: boolean;
  refunds?: boolean;
}

export interface PaymentProviderDef {
  id: string;
  name: string;
  currencies: string[];
  methods: PaymentMethodDef[];
  credentials: { key: string; label: string }[];
  webhookUrl: string | null;
}

export interface FeeRule {
  method: string;
  currency: string;
  percentBps: number;
  fixedMinor: number;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  enabled: boolean;
  configuredCredentials: string[];
  methods: string[];
  currencies: string[];
  feeRules: FeeRule[];
  webhookUrl: string | null;
  updatedAt: string | null;
}

export interface PublicPaymentMethod {
  id: string;
  name: string;
}

export interface PublicPaymentGateway {
  id: string;
  name: string;
  methods: PublicPaymentMethod[];
  currencies: string[];
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  _id: string;
  provider: string;
  method: string;
  currency: string;
  amountMinor: number;
  commissionMinor: number;
  gatewayFeeMinor: number;
  teacherNetMinor: number;
  platformNetMinor: number;
  status: PaymentStatus;
  courseId?: string;
  studentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SettlementStatus = string;

export interface Settlement {
  _id: string;
  teacherId: string;
  grossMinor: number;
  commissionMinor: number;
  gatewayFeeMinor: number;
  teacherNetMinor: number;
  platformNetMinor: number;
  currency: string;
  status: SettlementStatus;
  createdAt?: string;
  updatedAt?: string;
}
