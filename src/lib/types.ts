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
