/**
 * Shared type definitions for the application
 */

// User types
export interface User {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  academicYear: number;
  profileImage: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Author {
  id: string;
  username: string;
  fullName: string;
  academicYear: number;
  profileImage?: string | null;
}

// Subject types
export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  order: number;
  createdAt?: Date | string;
}

// Vote types
export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface VoteData {
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
}

// Discussion types
export interface Discussion {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  academicYear: number;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
  isPinned: boolean;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  subject: Subject;
  _count: {
    comments: number;
  };
}

export interface DiscussionWithComments extends Discussion {
  comments: Comment[];
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  threadId: string;
  parentId: string | null;
  depth: number;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  replies?: Comment[];
}

// Material types
export interface Material {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  academicYear: number;
  filePath: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX';
  fileSize: number;
  tags: string[];
  downloadCount: number;
  createdAt: string;
  subject: Subject;
  uploadedBy: Author;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
