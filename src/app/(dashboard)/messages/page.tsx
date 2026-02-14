'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Mail, Loader2, Search, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { getStaffBadge, getStaffColorClass } from '@/lib/permissions';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    role?: string;
  };
  receiver: {
    id: string;
    username: string;
    fullName: string;
    role?: string;
  };
}

interface Conversation {
  userId: string;
  username: string;
  fullName: string;
  role?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const userParam = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(userParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchConversations();
    
    // Refresh unread count when visiting messages page
    const refreshUnreadCount = () => {
      window.dispatchEvent(new Event('refresh-unread-count'));
    };
    
    // Refresh when leaving the page
    return () => {
      refreshUnreadCount();
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
      // Refresh unread count after reading messages
      setTimeout(() => {
        window.dispatchEvent(new Event('refresh-unread-count'));
      }, 1000);
    }
  }, [selectedUser]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/messages/conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (username: string) => {
    try {
      const response = await fetch(`/api/messages?user=${username}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverUsername: selectedUser,
          content: newMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(selectedUser);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 flex-col md:flex-row">
      {/* Conversations List - Hidden on mobile when chat is selected */}
      <Card className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Сообщения
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations and Search Results */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery && searchResults.length > 0 ? (
              // Show search results when searching
              <>
                <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                  Найденные пользователи
                </div>
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user.username);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          {getStaffBadge(user.role as any) && (
                            <span className="text-xs" title={getStaffBadge(user.role as any)?.label}>
                              {getStaffBadge(user.role as any)?.icon}
                            </span>
                          )}
                          <p className={`font-medium text-sm ${getStaffColorClass(user.role as any) || ''}`}>@{user.username}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.academicYear} курс</p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            ) : searchQuery && !isSearching && searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Пользователи не найдены
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p className="mb-2">Нет активных бесед</p>
                <p className="text-xs">Найдите пользователя выше, чтобы начать переписку</p>
              </div>
            ) : (
              <>
                {searchQuery && (
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    Активные беседы
                  </div>
                )}
                {filteredConversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUser(conv.username)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedUser === conv.username
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <Link 
                      href={`/users/${conv.username}`}
                      className="flex items-center gap-1 font-medium text-sm hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {getStaffBadge(conv.role as any) && (
                        <span className="text-xs" title={getStaffBadge(conv.role as any)?.label}>
                          {getStaffBadge(conv.role as any)?.icon}
                        </span>
                      )}
                      <span className={getStaffColorClass(conv.role as any) || ''}>
                        @{conv.username}
                      </span>
                    </Link>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {conv.lastMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(conv.lastMessageTime)}
                  </p>
                </button>
              ))}
            </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedUser ? (
          <>
            <CardHeader className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
              <CardTitle className="flex items-center gap-2 md:gap-0">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden mr-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Вернуться к списку"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link href={`/users/${selectedUser}`} className="hover:underline flex-1">
                  @{selectedUser}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 gap-0 bg-gray-50 dark:bg-gray-900">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Нет сообщений. Начните общение!
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.senderId === session?.user?.id;
                    const currentDate = new Date(message.createdAt).toLocaleDateString('ru-RU');
                    const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString('ru-RU') : null;
                    const showDateSeparator = index === 0 || currentDate !== prevDate;

                    return (
                      <div key={message.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                              {currentDate}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-green-500 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 opacity-70`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Message - WhatsApp Style */}
              <div className="border-t dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isSending}
                    className="resize-none rounded-full border-gray-300 dark:border-gray-700"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isSending || !newMessage.trim()}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Выберите диалог или начните новый</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
