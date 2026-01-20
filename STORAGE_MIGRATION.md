# Storage Migration Guide

## Overview
This guide explains how to migrate existing files from local filesystem to Supabase Storage and configure external storage (MEGA) for large files.

## Current Architecture

### File Storage Strategy
- **Profile Images (<5MB)**: Supabase Storage bucket `profiles`
- **Materials (<100MB)**: Supabase Storage bucket `materials`
- **Large Materials (100-500MB)**: MEGA external storage
- **Database**: Supabase PostgreSQL (already configured)
- **Text Content**: Database (discussions, comments, messages)

### Database Schema Changes
New fields added to `Material` model:
- `storageType`: `SUPABASE` | `EXTERNAL_MEGA` | `LOCAL` (for migration)
- `storageBucket`: Supabase bucket name (e.g., "materials")
- `externalUrl`: Direct URL for external storage

## Setup Instructions

### 1. Configure Supabase Storage

#### Create Storage Buckets in Supabase Dashboard:

1. **Go to Supabase Dashboard** → Your Project → Storage

2. **Create `profiles` bucket:**
   - Name: `profiles`
   - Public: Yes (or use RLS for privacy)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

3. **Create `materials` bucket:**
   - Name: `materials`
   - Public: No (use RLS policies)
   - File size limit: 100MB
   - Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Set up Row Level Security (RLS) Policies:

**For `materials` bucket:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- Allow authenticated users to read approved materials
CREATE POLICY "Authenticated users can read materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

-- Allow service role to delete
CREATE POLICY "Service role can delete materials"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'materials');
```

**For `profiles` bucket:**
```sql
-- Allow users to upload their own profile images
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to read profile images
CREATE POLICY "Public profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. Configure MEGA External Storage

#### Create MEGA Account:
1. Go to https://mega.nz/
2. Sign up for free account (50GB free storage)
3. Create a folder named `sechenov-plus-materials` (optional)

#### Add to `.env.local`:
```env
# MEGA Configuration
MEGA_EMAIL=your-mega-email@example.com
MEGA_PASSWORD=your-mega-password
MEGA_FOLDER_NAME=sechenov-plus-materials
```

### 3. Update Environment Variables

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

## Migration Process

### Option 1: Manual Migration (Recommended for Small Datasets)

#### Migrate Profile Images:
1. Old profile images are in `public/uploads/profiles/`
2. When users next upload a profile image, it will automatically:
   - Upload to Supabase Storage
   - Delete old local file
   - Update database with new URL

**To force immediate migration:**
- Users can re-upload their profile images
- Old local files will be automatically cleaned up

#### Migrate Materials:
1. Existing materials are marked as `LOCAL` storage type
2. Downloads will still work (fallback to local filesystem)
3. New uploads automatically use Supabase or MEGA based on size

**No immediate action needed** - migration happens gradually as users re-upload.

### Option 2: Automated Migration Script (For Production)

Run the migration script (coming soon):
```bash
npm run migrate:storage
```

This will:
1. Find all files in `public/uploads/`
2. Upload to Supabase Storage (if <100MB) or MEGA (if >100MB)
3. Update database records
4. Keep local files as backup (you can delete manually later)

### Option 3: Fresh Start (Recommended for Development)

If you don't have important existing files:
1. Clear `public/uploads/` folder
2. All new uploads will use new storage system
3. Update database to remove old file references

## Verification

### Test Profile Image Upload:
1. Go to `/profile`
2. Upload a new profile image
3. Check Supabase Dashboard → Storage → `profiles` bucket
4. Verify image appears

### Test Material Upload (Small File):
1. Go to `/materials/upload`
2. Upload a PDF file <100MB
3. Check Supabase Dashboard → Storage → `materials` bucket
4. Download the material to verify

### Test Material Upload (Large File):
1. Go to `/materials/upload`
2. Upload a PDF file >100MB
3. Should show "External storage" message
4. File uploaded to MEGA
5. Download should work seamlessly

## Troubleshooting

### Supabase Upload Fails
**Error:** "Failed to fetch" or "Invalid URL"
- **Solution:** Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Restart development server after changing env variables

### MEGA Upload Fails
**Error:** "MEGA storage not configured"
- **Solution:** Check `MEGA_EMAIL` and `MEGA_PASSWORD` in `.env.local`
- Verify credentials by logging into MEGA website

**Error:** "Failed to upload to MEGA"
- **Solution:** Check internet connection, MEGA account status
- MEGA free accounts have upload/download quotas - check if exceeded

### Profile Images Not Showing
- Old profile images (local filesystem): Check if path is correct
- New profile images (Supabase): Check bucket is public or RLS policies are correct

### Download Not Working
- **Check storage type** in database
- **SUPABASE**: Verify file exists in Supabase Storage
- **EXTERNAL_MEGA**: Verify `externalUrl` is valid
- **LOCAL**: Verify file exists in `public/uploads/`

## File Limits

| Storage Type | Min Size | Max Size | Location |
|-------------|----------|----------|----------|
| Supabase (profiles) | 0 | 5MB | Profile images |
| Supabase (materials) | 0 | 100MB | Study materials |
| MEGA (external) | 100MB | 500MB | Large study materials |

## Security Considerations

✅ **Implemented:**
- All uploads require authentication
- Rate limiting on uploads (10/hour for materials, 5/day for large files)
- File type validation (PDF, DOCX only)
- File size validation
- Supabase RLS policies

⚠️ **Future Enhancements:**
- Virus scanning before approval
- Content moderation
- Automatic file cleanup for rejected materials

## Cost Considerations

### Supabase (Current Usage)
- **Free Tier:** 1GB storage, 2GB bandwidth/month
- **Pro Tier:** $25/month - 100GB storage, 200GB bandwidth

### MEGA (External Storage)
- **Free Tier:** 50GB storage
- **Pro Lite:** €4.99/month - 400GB storage
- No bandwidth limits

### Recommendation
- Start with free tiers
- Monitor usage in Supabase Dashboard
- Upgrade when needed (typically after 100+ users or 50GB+ content)

## Backup Strategy

1. **Supabase:** Automatic backups (check dashboard)
2. **MEGA:** Manual export or API backup (implement if needed)
3. **Database:** Regular PostgreSQL backups via Supabase

## Next Steps

1. ✅ Set up Supabase Storage buckets
2. ✅ Configure MEGA account
3. ✅ Update environment variables
4. ✅ Test profile image upload
5. ✅ Test material upload (small and large)
6. 🔄 Monitor storage usage
7. 🔄 Migrate existing files (if needed)
8. 🔄 Delete old local files after verification

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Check application logs (`npm run dev`)
3. Review error messages in browser console
4. Check this documentation

---

**Last Updated:** January 20, 2026
**Version:** 1.0
