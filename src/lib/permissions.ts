/**
 * Permission utilities for role-based access control
 */

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

/**
 * Check if user has admin or moderator privileges
 */
export function isStaff(role?: UserRole | null): boolean {
  return role === 'ADMIN' || role === 'MODERATOR';
}

/**
 * Check if user is an admin (can manage moderators)
 */
export function isAdmin(role?: UserRole | null): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user is a moderator
 */
export function isModerator(role?: UserRole | null): boolean {
  return role === 'MODERATOR';
}

/**
 * Get display badge for staff members
 */
export function getStaffBadge(role?: UserRole | null): { icon: string; label: string } | null {
  if (role === 'ADMIN') {
    return { icon: '👑', label: 'Админ' };
  }
  if (role === 'MODERATOR') {
    return { icon: '⭐', label: 'Мод' };
  }
  return null;
}

/**
 * Get staff username color classes (red for both admin and moderator)
 */
export function getStaffColorClass(role?: UserRole | null): string {
  if (role === 'ADMIN' || role === 'MODERATOR') {
    return 'text-red-600 dark:text-red-400';
  }
  return '';
}
