# 🚀 Quick Start - Supabase Setup (5 minutes)

## ⚠️ Current Error
```
supabaseKey is required.
```

**This means Supabase environment variables are not set yet.**

---

## 📝 Steps to Fix

### 1. Create Supabase Account (2 min)
1. Go to https://supabase.com/
2. Sign up with GitHub or email
3. Click **"New Project"**
4. Fill in:
   - **Name:** `sechenov-plus` (or anything)
   - **Database Password:** (choose strong password)
   - **Region:** Choose closest to your location
5. Click **"Create new project"**
6. ⏰ Wait ~2 minutes for setup

---

### 2. Get API Keys (1 min)
1. In your Supabase project dashboard
2. Click **Settings** (⚙️ icon in left sidebar)
3. Click **API** in settings menu
4. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public** key (starts with `eyJhbGc...`)
   - **service_role** key (also starts with `eyJhbGc...`)

---

### 3. Create Storage Bucket (1 min)
1. Click **Storage** in left sidebar
2. Click **"New bucket"** button
3. Fill in:
   - **Name:** `materials` (exactly this name)
   - **Public bucket:** ✅ **CHECK THIS BOX**
   - **File size limit:** `200 MB`
   - **Allowed MIME types:** Leave empty (or add PDF/DOCX types)
4. Click **"Create bucket"**

---

### 4. Update `.env.local` (1 min)

Open `.env.local` file and replace these lines:

**OLD:**
```env
# Supabase (for file storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**NEW:** (paste your actual keys)
```env
# Supabase (for file storage)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi..."
```

⚠️ **Replace with YOUR actual values from step 2!**

---

### 5. Restart Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Test Upload

1. Open http://localhost:3000/materials/upload
2. Fill in the form
3. Select a PDF or DOCX file (try a large one!)
4. Click "Загрузить материал"
5. ✅ Should upload successfully!

---

## 🎯 That's It!

Your site now supports **200MB file uploads** directly to Supabase! 🚀

---

## 📸 Visual Guide

### Where to find API keys:
```
Supabase Dashboard
└── Settings (⚙️)
    └── API
        ├── Project URL: https://xxxxx.supabase.co
        ├── anon public key: eyJhbGc...
        └── service_role key: eyJhbGc...
```

### Where to create bucket:
```
Supabase Dashboard
└── Storage
    └── New bucket
        ├── Name: materials
        ├── Public: ✅ YES
        └── Size limit: 200 MB
```

---

## 🔧 Troubleshooting

### Error: "supabaseKey is required"
**Fix:** Add keys to `.env.local` and restart server

### Error: "Bucket not found"
**Fix:** Create bucket named exactly `materials` in Supabase Storage

### Error: "Failed to upload"
**Fix:** Make sure bucket is set to **Public**

---

Need help? Check `FILE_UPLOAD_REFACTOR.md` for detailed documentation.
