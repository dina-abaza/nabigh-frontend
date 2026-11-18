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
