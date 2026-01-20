import { api } from './api';

export interface Discussion {
  id: string;
  title: string;
  content: string;
  subjectId: string;
  academicYear: number;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    academicYear: number;
  };
  subject: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    academicYear: number;
  };
  replies?: Comment[];
}

export interface VoteResponse {
  upvotes: number;
  downvotes: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
}

export const discussionService = {
  // Get all discussions with filters
  async getAll(params?: {
    sort?: 'hot' | 'new' | 'top' | 'controversial';
    subjectId?: string;
    academicYear?: number;
  }): Promise<Discussion[]> {
    const searchParams = new URLSearchParams();
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.subjectId) searchParams.set('subjectId', params.subjectId);
    if (params?.academicYear) searchParams.set('academicYear', params.academicYear.toString());
    
    const url = `/api/discussions${searchParams.toString() ? `?${searchParams}` : ''}`;
    return api.get<Discussion[]>(url);
  },

  // Get single discussion
  async getById(id: string): Promise<Discussion & { comments: Comment[] }> {
    return api.get(`/api/discussions/${id}`);
  },

  // Create discussion
  async create(data: {
    title: string;
    content: string;
    subjectId: string;
    academicYear: number;
  }): Promise<Discussion> {
    return api.post('/api/discussions', data);
  },

  // Delete discussion
  async delete(id: string): Promise<void> {
    return api.delete(`/api/discussions/${id}`);
  },

  // Vote on discussion
  async vote(id: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<VoteResponse> {
    return api.post(`/api/discussions/${id}/vote`, { type });
  },

  // Pin/unpin discussion
  async togglePin(id: string): Promise<{ isPinned: boolean }> {
    return api.post(`/api/discussions/${id}/pin`);
  },

  // Comment operations
  comments: {
    async create(threadId: string, content: string, parentId?: string): Promise<Comment> {
      return api.post(`/api/discussions/${threadId}/comments`, { content, parentId });
    },

    async delete(threadId: string, commentId: string): Promise<void> {
      return api.delete(`/api/discussions/${threadId}/comments/${commentId}`);
    },

    async vote(threadId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<VoteResponse> {
      return api.post(`/api/discussions/${threadId}/comments/${commentId}/vote`, { type });
    },

    async togglePin(threadId: string, commentId: string): Promise<{ isPinned: boolean }> {
      return api.post(`/api/discussions/${threadId}/comments/${commentId}/pin`);
    },
  },
};
