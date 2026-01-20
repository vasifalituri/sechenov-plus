export const ACADEMIC_YEARS = [1, 2, 3, 4, 5, 6] as const;

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_FILE_TYPES = [FILE_TYPES.PDF, FILE_TYPES.DOCX];

export const TAG_OPTIONS = [
  'high-yield',
  'exam-relevant',
  'практика',
  'теория',
  'case-based',
  'схемы',
  'таблицы',
] as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MATERIALS: '/materials',
  DISCUSSIONS: '/discussions',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;
