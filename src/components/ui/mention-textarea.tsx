'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  fullName: string;
  academicYear: number;
  role?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionedUsers?: (users: string[]) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}

export function MentionTextarea({
  value,
  onChange,
  onMentionedUsers,
  placeholder,
  className,
  minRows = 3,
}: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search users when @ is typed
  useEffect(() => {
    const searchUsers = async () => {
      if (mentionQuery.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`);
        if (response.ok) {
          const users = await response.json();
          setSuggestions(users);
          setShowSuggestions(users.length > 0);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search users error:', error);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [mentionQuery]);

  // Extract mentioned usernames from text
  useEffect(() => {
    const mentionRegex = /@(\w+)/g;
    const matches = [...value.matchAll(mentionRegex)];
    const usernames = matches.map(match => match[1]);
    onMentionedUsers?.(usernames);
  }, [value, onMentionedUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setMentionQuery('');
      setShowSuggestions(false);
    } else if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const beforeMention = value.substring(0, lastAtIndex);
      const newValue = `${beforeMention}@${user.username} ${textAfterCursor}`;
      onChange(newValue);
      
      setShowSuggestions(false);
      setMentionQuery('');
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + user.username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('min-h-[80px]', className)}
        rows={minRows}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between',
                index === selectedIndex && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div>
                <div className="font-medium text-sm flex items-center gap-1">
                  {getStaffBadge(user.role as any) && (
                    <span className="text-xs" title={getStaffBadge(user.role as any)?.label}>
                      {getStaffBadge(user.role as any)?.icon}
                    </span>
                  )}
                  <span className={getStaffColorClass(user.role as any) || ''}>
                    @{user.username}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{user.fullName}</div>
              </div>
              <div className="text-xs text-muted-foreground">{user.academicYear} курс</div>
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      <div className="text-xs text-muted-foreground mt-1">
        Используйте @ для упоминания пользователей
      </div>
    </div>
  );
}
