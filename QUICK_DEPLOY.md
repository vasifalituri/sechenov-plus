# ⚡ Быстрый запуск на Vercel (5 минут)

## 🎯 Самый простой способ запустить сайт публично

### Шаг 1: Подготовка (2 минуты)

```bash
# 1. Создайте GitHub репозиторий
git init
git add .
git commit -m "Ready for deployment"

# 2. Загрузите на GitHub
git remote add origin https://github.com/YOUR_USERNAME/sechenov-plus.git
git branch -M main
git push -u origin main
```

---

### Шаг 2: Deploy на Vercel (2 минуты)

1. **Перейдите на Vercel**: https://vercel.com
2. **Войдите через GitHub**
3. **Импортируйте проект**:
   - Нажмите **Add New... → Project**
   - Выберите репозиторий `sechenov-plus`
   - Нажмите **Import**

4. **Настройте Build Command**:
   ```
   npx prisma generate && npm run build
   ```

5. **Добавьте Environment Variables** (скопируйте из `.env.local`):
   
   **Минимально необходимые:**
   ```env
   DATABASE_URL=your-database-url
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret
   MEGA_EMAIL=your-mega-email
   MEGA_PASSWORD=your-mega-password
   ```

6. **Нажмите Deploy** 🚀

---

### Шаг 3: База данных на Neon (1 минута)

1. **Создайте аккаунт**: https://neon.tech
2. **Создайте проект** → Скопируйте Connection String
3. **Вставьте в Vercel** как `DATABASE_URL`
4. **Запустите миграции**:
   ```bash
   # Локально с production DATABASE_URL
   npx prisma migrate deploy
   ```

---

## ✅ Готово!

Ваш сайт доступен по адресу: `https://sechenov-plus.vercel.app`

---

## 🔐 Создание первого админа

После деплоя зарегистрируйтесь на сайте, затем в Neon Dashboard:

```sql
UPDATE users 
SET role = 'ADMIN', status = 'APPROVED' 
WHERE email = 'your-email@example.com';
```

---

## 📋 Полная инструкция

См. файл `DEPLOYMENT_GUIDE.md` для детальной информации.
