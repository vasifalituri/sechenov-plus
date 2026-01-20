import { User, Material, Subject, DiscussionThread, Comment, UserStatus, UserRole, ContentStatus } from '@prisma/client';

// Extended types with relations
export type UserWithStats = User & {
  _count?: {
    uploadedMaterials: number;
    discussionThreads: number;
    comments: number;
  };
};

export type MaterialWithRelations = Material & {
  subject: Subject;
  uploadedBy: User;
  approvedBy?: User | null;
};

export type DiscussionThreadWithRelations = DiscussionThread & {
  subject: Subject;
  author: User;
  approvedBy?: User | null;
  _count?: {
    comments: number;
    likes: number;
  };
};

export type CommentWithRelations = Comment & {
  author: User;
  replies?: CommentWithRelations[];
  approvedBy?: User | null;
};

// Form types
export type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  academicYear: number;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type MaterialUploadData = {
  title: string;
  description?: string;
  subjectId: string;
  academicYear: number;
  tags: string[];
  file: File;
};

export type ThreadCreateData = {
  title: string;
  content: string;
  subjectId: string;
  academicYear: number;
};

export type CommentCreateData = {
  content: string;
  threadId: string;
  parentId?: string;
};

// Filter types
export type MaterialFilters = {
  academicYear?: number;
  subjectId?: string;
  search?: string;
  tags?: string[];
};

export type DiscussionFilters = {
  academicYear?: number;
  subjectId?: string;
  search?: string;
};

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Export Prisma enums
export { UserStatus, UserRole, ContentStatus };
