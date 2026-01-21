'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ACADEMIC_YEARS } from '@/lib/constants';

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    academicYear: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    // Validate username - only Latin letters, numbers, underscore, hyphen
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (formData.username && !usernameRegex.test(formData.username)) {
      setError('Username может содержать только латинские буквы, цифры, _ и -');
      setIsLoading(false);
      return;
    }

    if (formData.username && formData.username.length < 3) {
      setError('Username должен содержать минимум 3 символа');
      setIsLoading(false);
      return;
    }

    if (!formData.academicYear) {
      setError('Выберите курс');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          academicYear: parseInt(formData.academicYear),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Ошибка регистрации');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?message=registered');
      }, 2000);
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-green-600">
            Регистрация успешна! ✅
          </CardTitle>
          <CardDescription>
            Ваша заявка отправлена. Ожидайте одобрения администратора.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Перенаправление на страницу входа...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Регистрация</CardTitle>
        <CardDescription>
          Создайте заявку для доступа к платформе
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Иванов Иван Иванович"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Никнейм</Label>
            <Input
              id="username"
              type="text"
              placeholder="vasya_2024"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
              pattern="[a-zA-Z0-9_-]+"
              title="Только буквы, цифры, дефис и подчеркивание"
            />
            <p className="text-xs text-muted-foreground">Только латинские буквы, цифры, _ и - (минимум 3 символа)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Курс обучения</Label>
            <Select
              value={formData.academicYear}
              onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите курс" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} курс
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Минимум 6 символов</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Отправка...' : 'Подать заявку'}
          </Button>
          
          <div className="text-sm text-center text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
