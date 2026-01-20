# Quick Storage Setup Guide

## 🚀 5-Minute Setup

### Step 1: Supabase Storage Setup (3 minutes)

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** → **Storage**
3. **Create two buckets:**

   **Bucket 1: `profiles`**
   - Click "Create bucket"
   - Name: `profiles`
   - Public bucket: ✅ Yes
   - Click "Create bucket"

   **Bucket 2: `materials`**
   - Click "Create bucket"
   - Name: `materials`
   - Public bucket: ❌ No (we'll use RLS)
   - Click "Create bucket"

4. **Set up RLS for `materials` bucket:**
   - Go to **Policies** tab in Storage
   - Click on `materials` bucket
   - Add these policies:

   ```sql
   -- Allow authenticated users to read
   CREATE POLICY "Allow authenticated read" ON storage.objects
   FOR SELECT TO authenticated
   USING (bucket_id = 'materials');

   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated upload" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'materials');
   ```

### Step 2: MEGA Setup (2 minutes)

1. **Create MEGA account**: https://mega.nz/register
2. **Verify email**
3. **Login** and note your credentials
4. **(Optional)** Create a folder named `sechenov-plus-materials`

### Step 3: Update Environment Variables

Add to your `.env.local`:

```env
# Supabase Storage Buckets
SUPABASE_STORAGE_BUCKET=materials
SUPABASE_PROFILES_BUCKET=profiles

# File Size Limits
MAX_FILE_SIZE=524288000           # 500MB
MAX_SUPABASE_FILE_SIZE=104857600  # 100MB

# MEGA External Storage
MEGA_EMAIL=your-mega-email@example.com
MEGA_PASSWORD=your-mega-password
MEGA_FOLDER_NAME=sechenov-plus-materials
```

### Step 4: Restart Server

```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

## ✅ Verify Setup

### Test 1: Profile Image Upload
1. Go to http://localhost:3000/profile
2. Click "Upload Profile Image"
3. Select an image (<5MB)
4. Check Supabase Dashboard → Storage → `profiles` bucket
5. You should see your uploaded image

### Test 2: Small Material Upload
1. Go to http://localhost:3000/materials/upload
2. Upload a PDF file <100MB
3. Fill in the form and submit
4. Check Supabase Dashboard → Storage → `materials` bucket
5. File should be there

### Test 3: Large Material Upload
1. Go to http://localhost:3000/materials/upload
2. Upload a PDF file >100MB (if you have one)
3. You should see "External storage" message
4. File uploads to MEGA
5. Download should work seamlessly

## 🔧 Troubleshooting

### "Supabase not configured"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server

### "MEGA storage not configured"
- Check `.env.local` has `MEGA_EMAIL` and `MEGA_PASSWORD`
- Verify credentials are correct

### Profile image not showing
- Check if bucket `profiles` is public
- Or set up RLS policies for `profiles` bucket

### Material upload fails
- Check bucket names match in `.env.local`
- Verify RLS policies are set up correctly

## 📊 Storage Limits

| Type | Storage | Max File | Free Tier |
|------|---------|----------|-----------|
| Supabase | profiles + materials | 100MB | 1GB total |
| MEGA | large files | 500MB | 50GB total |

## 🎯 What's Migrated

✅ **Profile Images**: Automatically migrate on next upload
✅ **New Materials**: Automatically use correct storage
🔄 **Old Materials**: Use migration script (see STORAGE_MIGRATION.md)

## Next Steps

1. ✅ Set up Supabase buckets
2. ✅ Configure MEGA
3. ✅ Update `.env.local`
4. ✅ Restart server
5. ✅ Test uploads
6. 📚 Read full guide: `STORAGE_MIGRATION.md`

---

Need help? Check the full migration guide: **STORAGE_MIGRATION.md**
