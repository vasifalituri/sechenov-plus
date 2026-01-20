# 🏗️ Архитектура загрузки учебных материалов

## 📋 Общий обзор

Платформа использует **гибридную систему хранения файлов**:
- **MEGA Cloud Storage** - для всех учебных материалов (до 30MB)
- **Supabase Storage** - резервный вариант (не используется для материалов, но код остался)
- **PostgreSQL** - для метаданных файлов

---

## 🔄 Полный цикл загрузки файла

### 1️⃣ **Клиентская сторона** (Frontend)

**Файл:** `src/components/materials/MaterialUploadForm.tsx`

#### Этап 1.1: Выбор файла пользователем
```
Пользователь выбирает файл → handleFileSelect()
├─ Проверка типа файла (PDF или DOCX)
├─ Проверка размера (макс. 30MB)
├─ Валидация magic bytes (проверка подлинности файла)
└─ Установка флага willUseExternalStorage = true (всегда MEGA)
```

**Константы:**
- `MAX_FILE_SIZE = 30 * 1024 * 1024` (30MB)
- `MAX_SUPABASE_SIZE = 0` (Supabase отключен для материалов)
- `ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']`

#### Этап 1.2: Отправка формы
```
handleSubmit() вызывается при отправке формы
├─ Валидация полей (название, предмет)
├─ Выбор файла для загрузки (оригинал или сжатый)
└─ Вызов uploadToExternalStorage()
```

#### Этап 1.3: Загрузка в MEGA
```typescript
uploadToExternalStorage(file: File)
├─ Создание FormData объекта
├─ formData.append('file', file)
├─ Отправка POST запроса на /api/materials/external-upload
└─ Получение ответа с externalUrl (ссылка на MEGA)
```

#### Этап 1.4: Сохранение метаданных
```typescript
POST /api/materials
├─ Отправка метаданных:
│   ├─ title, description, subjectId
│   ├─ fileUrl (MEGA ссылка)
│   ├─ fileName, fileSize, fileType
│   ├─ storageType: 'EXTERNAL_MEGA'
│   └─ externalUrl (MEGA ссылка)
└─ Сохранение в базу данных
```

---

### 2️⃣ **Серверная сторона - API Route для загрузки в MEGA**

**Файл:** `src/app/api/materials/external-upload/route.ts`

#### Этап 2.1: Аутентификация и проверки
```typescript
POST /api/materials/external-upload
├─ getServerSession() - проверка авторизации
├─ Проверка статуса пользователя (APPROVED)
├─ Rate limiting: 5 загрузок в день
└─ Проверка конфигурации MEGA (MEGA_EMAIL, MEGA_PASSWORD)
```

#### Этап 2.2: Парсинг multipart/form-data с Busboy
```
Получение Request
├─ Проверка Content-Type: multipart/form-data
├─ Чтение req.arrayBuffer() (весь файл в память)
├─ Преобразование в Buffer
├─ Создание Readable stream
└─ Pipe в busboy парсер
```

**Busboy конфигурация:**
```typescript
busboy({
  headers: { 'content-type': contentType },
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
    files: 1
  }
})
```

#### Этап 2.3: Обработка событий Busboy
```
Busboy events:
├─ 'file' - получение файлового потока
│   ├─ Сохранение chunks в массив fileChunks[]
│   ├─ Слушание события 'limit' - превышен лимит размера
│   ├─ Слушание события 'end' - поток завершён
│   └─ Слушание события 'error' - ошибка потока
├─ 'finish' - парсинг завершён
└─ 'error' - ошибка парсера
```

#### Этап 2.4: Объединение chunks и создание File
```typescript
const fileBuffer = Buffer.concat(fileChunks);
const file = new File([fileBuffer], fileName, { type: fileType });
```

#### Этап 2.5: Валидация
```
Финальные проверки:
├─ Размер файла <= 30MB
└─ Тип файла в allowedTypes
```

#### Этап 2.6: Загрузка в MEGA
```typescript
const externalUrl = await uploadToMega(file, file.name);
```

---

### 3️⃣ **MEGA Storage Integration**

**Файл:** `src/lib/external-storage.ts`

#### Этап 3.1: Подключение к MEGA
```typescript
uploadToMega(file: File, fileName: string)
├─ import { Storage } from 'megajs'
├─ Создание Storage с credentials:
│   ├─ email: MEGA_EMAIL
│   └─ password: MEGA_PASSWORD
└─ Ожидание storage.ready
```

**Environment Variables:**
```env
MEGA_EMAIL=your-email@example.com
MEGA_PASSWORD=your-password
MEGA_FOLDER_NAME=sechenov-plus-materials
```

#### Этап 3.2: Поиск или создание папки
```
storage.root.children - список папок/файлов в корне
├─ Поиск папки 'sechenov-plus-materials'
├─ Если найдена → targetFolder = existingFolder
└─ Если не найдена → targetFolder = storage.mkdir('sechenov-plus-materials')
```

#### Этап 3.3: Преобразование файла в Buffer
```typescript
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
```

#### Этап 3.4: Загрузка файла в папку
```typescript
const uploadedFile = await targetFolder.upload({
  name: fileName,
  size: buffer.length
}, buffer).complete;
```

**Важно:** Используется `targetFolder.upload()`, а не `storage.upload()`, чтобы файл попал именно в нужную папку!

#### Этап 3.5: Генерация shareable link
```typescript
const link = await uploadedFile.link();
// Возвращает: https://mega.nz/file/XXXXXXXXX#KEY
```

#### Этап 3.6: Возврат ссылки
```typescript
return link; // Эта ссылка сохраняется в БД
```

---

### 4️⃣ **Сохранение метаданных в базу данных**

**Файл:** `src/app/api/materials/route.ts`

#### Этап 4.1: Получение метаданных от клиента
```typescript
POST /api/materials
Body: {
  title, description, subjectId, academicYear, tags,
  fileUrl,      // MEGA ссылка
  fileName,     // Имя файла
  fileSize,     // Размер в байтах
  fileType,     // 'application/pdf'
  storagePath,  // fileName (для MEGA)
  storageType,  // 'EXTERNAL_MEGA'
  externalUrl   // MEGA ссылка
}
```

#### Этап 4.2: Создание записи в PostgreSQL
```typescript
const material = await prisma.material.create({
  data: {
    title,
    description,
    subjectId,
    academicYear,
    filePath: storagePath,      // fileName
    fileName,
    fileType: 'PDF' or 'DOCX',
    fileSize,
    storageType: 'EXTERNAL_MEGA',
    storageBucket: null,        // Не используется для MEGA
    externalUrl: fileUrl,       // MEGA ссылка
    tags,
    status: 'PENDING',          // Требует одобрения админа
    uploadedById: session.user.id,
    downloadCount: 0
  }
});
```

---

## 🗄️ Структура базы данных

### Таблица `materials`

```sql
CREATE TABLE materials (
  id              UUID PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  subjectId       UUID NOT NULL,
  academicYear    INTEGER NOT NULL,  -- 1-6
  
  -- Файловое хранилище
  filePath        TEXT NOT NULL,     -- Путь/имя файла
  fileName        TEXT NOT NULL,     -- Оригинальное имя
  fileType        ENUM('PDF', 'DOCX'),
  fileSize        INTEGER NOT NULL,  -- Байты
  storageType     ENUM('SUPABASE', 'EXTERNAL_MEGA', 'LOCAL'),
  storageBucket   TEXT,              -- Для Supabase (если используется)
  externalUrl     TEXT,              -- MEGA ссылка
  
  tags            TEXT[],            -- Массив тегов
  status          ENUM('PENDING', 'APPROVED', 'REJECTED'),
  uploadedById    UUID NOT NULL,
  approvedById    UUID,
  downloadCount   INTEGER DEFAULT 0,
  
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW()
);
```

### Индексы:
- `subjectId` - быстрый поиск по предмету
- `academicYear` - быстрый поиск по курсу
- `status` - фильтрация по статусу
- `createdAt` - сортировка по дате

---

## 📦 Bucket / Storage концепция

### ❌ Нет традиционного "bucket" для MEGA
В отличие от AWS S3 или Supabase Storage, MEGA не использует концепцию "buckets". Вместо этого:

**MEGA структура:**
```
Root (/)
└── sechenov-plus-materials/ (папка)
    ├── file1.pdf
    ├── file2.docx
    └── file3.pdf
```

**Файлы идентифицируются:**
- `externalUrl` - публичная ссылка для скачивания
- `filePath` - имя файла (для справки)

### ✅ Supabase Storage (не используется, но поддерживается)
Если бы использовался Supabase:
```
Bucket: "materials"
├── user-{userId}/
│   ├── {timestamp}-file1.pdf
│   └── {timestamp}-file2.pdf
```

---

## 🔐 Безопасность и валидация

### Клиентская валидация:
1. **Тип файла** - проверка MIME type
2. **Размер** - макс. 30MB
3. **Magic bytes** - проверка подлинности (PDF начинается с `%PDF`, DOCX с `PK`)

### Серверная валидация:
1. **Аутентификация** - только авторизованные пользователи
2. **Статус** - только APPROVED пользователи
3. **Rate limiting** - 5 загрузок/день
4. **Размер файла** - busboy limits
5. **Тип файла** - повторная проверка MIME type

### MEGA безопасность:
- Credentials хранятся в `.env.local` (не в git)
- End-to-end encryption от MEGA
- Публичные ссылки работают только с правильным ключом

---

## 🚀 Оптимизации

### 1. Streaming с Busboy
Вместо загрузки всего файла в память сразу, используется потоковая обработка:
```
Request → arrayBuffer() → Buffer → Readable stream → Busboy → Chunks
```

### 2. Сжатие (опционально)
В коде есть функция `compressFile()`, но для MEGA загрузок она не используется.

### 3. Rate Limiting
Предотвращает злоупотребление:
- 5 загрузок в день на пользователя
- Использует LRU cache для отслеживания

---

## 📥 Процесс скачивания файла

**Файл:** `src/app/api/materials/download/[id]/route.ts`

```
GET /api/materials/download/{id}
├─ Получение материала из БД
├─ Проверка storageType
│
├─ Если EXTERNAL_MEGA:
│   ├─ Инкремент downloadCount
│   └─ Redirect на externalUrl (MEGA ссылка)
│
└─ Если SUPABASE:
    ├─ Получение signed URL
    ├─ Fetch файла из Supabase
    ├─ Инкремент downloadCount
    └─ Возврат файла с Content-Disposition header
```

---

## 🔧 Конфигурация Next.js

**Файл:** `next.config.js`

```javascript
{
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb' // Для Server Actions
    }
  },
  serverExternalPackages: ['busboy'], // Исключить из бандла
  runtime: 'nodejs', // Для route handlers
  maxDuration: 300 // 5 минут таймаут
}
```

---

## 🐛 Типичные проблемы и решения

### Проблема 1: "Unexpected end of form"
**Причина:** Next.js `formData()` имеет лимит ~4-5MB  
**Решение:** Использовать busboy с `arrayBuffer()` вместо `formData()`

### Проблема 2: Файлы загружаются в root, а не в папку
**Причина:** Использование `storage.upload()` вместо `folder.upload()`  
**Решение:** Вызывать `targetFolder.upload()`

### Проблема 3: Ошибка генерации ссылки
**Причина:** Метод `link()` возвращает Promise  
**Решение:** Использовать `await uploadedFile.link()`

### Проблема 4: Rate limit exceeded
**Причина:** Превышен лимит 5 загрузок/день  
**Решение:** Подождать 24 часа или увеличить лимит в коде

---

## 📊 Диаграмма потока данных

```
┌─────────────┐
│   Browser   │ 1. Выбор файла
│  (Client)   │────────────────────────┐
└─────────────┘                        │
                                       ▼
                              ┌─────────────────┐
                              │ MaterialUpload  │
                              │     Form        │ 2. Валидация
                              │  (Frontend)     │    (тип, размер)
                              └─────────────────┘
                                       │
                                       │ 3. POST FormData
                                       ▼
                              ┌─────────────────┐
                              │  /api/materials/│
                              │ external-upload │ 4. Auth + Rate limit
                              │   (API Route)   │
                              └─────────────────┘
                                       │
                                       │ 5. Busboy parse
                                       ▼
                              ┌─────────────────┐
                              │ external-storage│
                              │     (Lib)       │ 6. Connect to MEGA
                              └─────────────────┘
                                       │
                                       │ 7. Upload to folder
                                       ▼
                              ┌─────────────────┐
                              │   MEGA Cloud    │
                              │ sechenov-plus-  │ 8. Generate link
                              │   materials/    │
                              └─────────────────┘
                                       │
                                       │ 9. Return URL
                                       ▼
                              ┌─────────────────┐
                              │  /api/materials │
                              │   (API Route)   │ 10. Save metadata
                              └─────────────────┘
                                       │
                                       │ 11. INSERT
                                       ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │   (Database)    │ 12. Material record
                              └─────────────────┘
                                       │
                                       │ 13. Success response
                                       ▼
                              ┌─────────────────┐
                              │   Browser       │
                              │   (Client)      │ 14. Redirect to /materials
                              └─────────────────┘
```

---

## 📝 Пример записи в БД

```json
{
  "id": "0bf0305e-...",
  "title": "Лекция по Анатомии",
  "description": "Сердечно-сосудистая система",
  "subjectId": "abc123...",
  "academicYear": 2,
  "filePath": "lecture-anatomy.pdf",
  "fileName": "lecture-anatomy.pdf",
  "fileType": "PDF",
  "fileSize": 12582912,
  "storageType": "EXTERNAL_MEGA",
  "storageBucket": null,
  "externalUrl": "https://mega.nz/file/XXXXXX#KEY",
  "tags": ["high-yield", "exam"],
  "status": "PENDING",
  "uploadedById": "user123",
  "approvedById": null,
  "downloadCount": 0,
  "createdAt": "2026-01-20T10:30:00Z",
  "updatedAt": "2026-01-20T10:30:00Z"
}
```

---

## 🎯 Итоговый чеклист загрузки

- ✅ Пользователь выбирает файл
- ✅ Клиентская валидация (тип, размер, magic bytes)
- ✅ FormData отправляется на `/api/materials/external-upload`
- ✅ Сервер проверяет auth, rate limit, MEGA config
- ✅ Busboy парсит multipart/form-data
- ✅ Файл загружается в MEGA папку `sechenov-plus-materials`
- ✅ Генерируется публичная ссылка
- ✅ Метаданные сохраняются в PostgreSQL
- ✅ Статус материала: `PENDING` (требует одобрения админа)
- ✅ Пользователь перенаправляется на `/materials`

---

## 🔮 Будущие улучшения

1. **Chunked upload** - для файлов >30MB
2. **Resume capability** - продолжение после обрыва
3. **Client-side compression** - перед отправкой
4. **Image thumbnails** - для PDF превью
5. **Virus scanning** - проверка на вирусы
6. **CDN integration** - для быстрой доставки

---

Создано: 20.01.2026  
Версия: 1.0
