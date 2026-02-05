# 🗄️ Настройка Supabase Storage для фото преподавателей

## Шаг 1: Создание bucket

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. В левом меню перейдите в **Storage**
4. Нажмите **"New bucket"**
5. Введите имя bucket: `teachers`
6. ✅ Включите **"Public bucket"** (чтобы фото были доступны всем)
7. Нажмите **"Create bucket"**

## Шаг 2: Настройка политик доступа

Перейдите в **Storage** → **Policies** и добавьте следующие политики для bucket `teachers`:

### Политика 1: Публичный доступ на чтение (для всех)

```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'teachers');
```

**Через UI:**
- Policy name: `Allow public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'teachers'`

### Политика 2: Загрузка файлов (для аутентифицированных)

```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'teachers' 
  AND auth.role() = 'authenticated'
);
```

**Через UI:**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'teachers' AND auth.role() = 'authenticated'`

### Политика 3: Обновление файлов (для аутентифицированных)

```sql
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'teachers'
  AND auth.role() = 'authenticated'
);
```

**Через UI:**
- Policy name: `Allow authenticated updates`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'teachers' AND auth.role() = 'authenticated'`

### Политика 4: Удаление файлов (для аутентифицированных)

```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'teachers'
  AND auth.role() = 'authenticated'
);
```

**Через UI:**
- Policy name: `Allow authenticated deletes`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'teachers' AND auth.role() = 'authenticated'`

## Шаг 3: Проверка настроек

1. Перейдите в **Storage** → **teachers**
2. Попробуйте загрузить тестовое изображение
3. Скопируйте публичный URL
4. Откройте URL в браузере - изображение должно открыться

## ✅ Готово!

Теперь ваш проект может загружать фото преподавателей в Supabase Storage.

---

## Переменные окружения

Убедитесь, что в `.env.local` есть:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Где найти ключи:**
1. Supabase Dashboard → **Settings** → **API**
2. Скопируйте:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Альтернатива: Автоматическая настройка через SQL

Если вы хотите создать все политики одной командой, выполните в **SQL Editor**:

```sql
-- Создание bucket (если еще не создан)
INSERT INTO storage.buckets (id, name, public)
VALUES ('teachers', 'teachers', true)
ON CONFLICT (id) DO NOTHING;

-- Политика на чтение (все могут просматривать)
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'teachers' );

-- Политика на загрузку (только аутентифицированные)
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teachers' 
  AND auth.role() = 'authenticated'
);

-- Политика на обновление (только аутентифицированные)
CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'teachers'
  AND auth.role() = 'authenticated'
);

-- Политика на удаление (только аутентифицированные)
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'teachers'
  AND auth.role() = 'authenticated'
);
```

Нажмите **"RUN"** и все политики будут созданы автоматически!

---

## 🎉 Проверка работы

1. Запустите проект: `npm run dev`
2. Войдите как админ: `admin@sechenov.plus` / `admin123`
3. Перейдите в `/admin/teachers`
4. Создайте преподавателя и загрузите фото
5. Фото должно появиться в профиле преподавателя

Готово! 🚀
