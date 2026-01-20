# Storage Testing Guide

## Manual Testing Checklist

### ✅ Profile Images

#### Test 1: Upload Profile Image
**Steps:**
1. Go to http://localhost:3000/profile
2. Click "Upload Profile Image"
3. Select a JPEG/PNG image (<5MB)
4. Wait for upload to complete

**Expected Result:**
- ✅ Image uploads successfully
- ✅ Toast notification shows success
- ✅ Profile image appears in UI
- ✅ Check Supabase Dashboard → Storage → `profiles` bucket
- ✅ File should be there with path: `{userId}/profile-{timestamp}.{ext}`

#### Test 2: Replace Profile Image
**Steps:**
1. Upload a profile image (as above)
2. Upload a different image

**Expected Result:**
- ✅ New image uploads successfully
- ✅ Old image is deleted from Supabase Storage
- ✅ Only one image per user in `profiles` bucket

#### Test 3: Delete Profile Image
**Steps:**
1. Upload a profile image
2. Click "Remove Profile Image" button

**Expected Result:**
- ✅ Image is removed from UI
- ✅ Image is deleted from Supabase Storage
- ✅ Database profileImage field is set to null

---

### ✅ Materials - Small Files (<100MB)

#### Test 4: Upload Small Material to Supabase
**Steps:**
1. Go to http://localhost:3000/materials/upload
2. Fill in the form:
   - Title: "Test Material - Small File"
   - Subject: Select any
   - Academic Year: Select any
3. Upload a PDF file <100MB
4. Submit form

**Expected Result:**
- ✅ File uploads successfully
- ✅ Shows "Supabase Storage" in upload info
- ✅ Material status is "PENDING"
- ✅ Check Supabase Dashboard → Storage → `materials` bucket
- ✅ File should be there
- ✅ Database record has:
  - `storageType` = "SUPABASE"
  - `storageBucket` = "materials"
  - `filePath` = storage path
  - `externalUrl` = null

#### Test 5: Download Small Material
**Steps:**
1. Admin approves the material (from admin panel)
2. Go to materials list
3. Click "Download" on the test material

**Expected Result:**
- ✅ File downloads successfully
- ✅ File opens correctly
- ✅ Download count increments in database

---

### ✅ Materials - Large Files (>100MB)

#### Test 6: Upload Large Material to MEGA
**Steps:**
1. Create or find a PDF file >100MB (you can use a tool to create a dummy PDF)
2. Go to http://localhost:3000/materials/upload
3. Fill in the form
4. Upload the large PDF file
5. Wait for upload (this may take several minutes)

**Expected Result:**
- ✅ Upload form shows "External storage" warning
- ✅ Purple info box appears showing file will go to MEGA
- ✅ Upload completes successfully
- ✅ Toast shows success message
- ✅ Database record has:
  - `storageType` = "EXTERNAL_MEGA"
  - `externalUrl` = MEGA download link
  - `filePath` = filename
  - `storageBucket` = null

#### Test 7: Download Large Material
**Steps:**
1. Admin approves the large material
2. Go to materials list
3. Click "Download" on the large material

**Expected Result:**
- ✅ Browser redirects to MEGA download link
- ✅ File downloads from MEGA
- ✅ Download count increments

---

### ✅ File Compression

#### Test 8: Compression for Small Files
**Steps:**
1. Go to materials upload
2. Enable "Optimize file before upload" checkbox
3. Upload a PDF file that can be compressed
4. Wait for compression

**Expected Result:**
- ✅ Shows compression statistics
- ✅ If compression saves space, shows percentage saved
- ✅ Compressed file is uploaded
- ✅ File size in database is compressed size

#### Test 9: Large Files Skip Compression
**Steps:**
1. Upload a file >100MB

**Expected Result:**
- ✅ Compression option is hidden
- ✅ Original file is uploaded to MEGA without compression

---

### ✅ Migration Testing

#### Test 10: Profile Image Migration
**Steps:**
1. Place an old profile image in `public/uploads/profiles/`
2. Log in as that user
3. Upload a new profile image

**Expected Result:**
- ✅ New image uploads to Supabase
- ✅ Old local file is deleted
- ✅ Database updated with Supabase URL

#### Test 11: Material Migration Script (Dry Run)
**Steps:**
```bash
npm run migrate:storage:dry-run
```

**Expected Result:**
- ✅ Shows what would be migrated
- ✅ No actual changes made
- ✅ Shows count of files to migrate

#### Test 12: Material Migration Script (Live)
**Steps:**
```bash
npm run migrate:storage
```

**Expected Result:**
- ✅ Migrates files to Supabase or MEGA based on size
- ✅ Updates database records
- ✅ Shows summary of migrated files

---

### ✅ Error Handling

#### Test 13: File Too Large
**Steps:**
1. Try to upload a file >500MB

**Expected Result:**
- ✅ Shows error: "File size too large. Maximum size is 500MB."
- ✅ Upload is blocked

#### Test 14: Invalid File Type
**Steps:**
1. Try to upload a .txt or .exe file

**Expected Result:**
- ✅ Shows error about invalid file type
- ✅ Upload is blocked

#### Test 15: Supabase Not Configured
**Steps:**
1. Remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`
2. Restart server
3. Try to upload a file

**Expected Result:**
- ✅ Shows error: "Supabase not configured"
- ✅ Upload is blocked
- ✅ Shows setup instructions

#### Test 16: MEGA Not Configured
**Steps:**
1. Remove `MEGA_EMAIL` from `.env.local`
2. Restart server
3. Try to upload a file >100MB

**Expected Result:**
- ✅ Shows error: "External storage not configured"
- ✅ Upload is blocked

---

### ✅ Edge Cases

#### Test 17: Simultaneous Uploads
**Steps:**
1. Open two browser tabs
2. Start uploading different materials in both tabs

**Expected Result:**
- ✅ Both uploads complete successfully
- ✅ No conflicts
- ✅ Rate limiting may apply after 10 uploads

#### Test 18: Network Interruption
**Steps:**
1. Start uploading a large file
2. Disable network mid-upload
3. Re-enable network

**Expected Result:**
- ✅ Upload fails with error message
- ✅ Partial upload is cleaned up (for Supabase)
- ✅ User can retry

#### Test 19: File Exactly 100MB
**Steps:**
1. Create a file exactly 100MB (104,857,600 bytes)
2. Upload it

**Expected Result:**
- ✅ File goes to Supabase (boundary condition)
- ✅ Uploads successfully

#### Test 20: File 100MB + 1 byte
**Steps:**
1. Create a file 100MB + 1 byte (104,857,601 bytes)
2. Upload it

**Expected Result:**
- ✅ File goes to MEGA (crosses boundary)
- ✅ Shows external storage warning
- ✅ Uploads successfully

---

## Automated Testing (Future Enhancement)

```typescript
// Example test structure (to be implemented)
describe('Storage Integration', () => {
  test('uploads profile image to Supabase', async () => {
    // Test implementation
  });
  
  test('uploads small material to Supabase', async () => {
    // Test implementation
  });
  
  test('uploads large material to MEGA', async () => {
    // Test implementation
  });
});
```

---

## Performance Testing

### Profile Images
- **Target:** <3 seconds for <5MB image
- **Actual:** Measure and record

### Small Materials (<100MB)
- **Target:** <10 seconds for 50MB file
- **Actual:** Measure and record

### Large Materials (>100MB)
- **Target:** <60 seconds for 200MB file (depends on internet speed)
- **Actual:** Measure and record

---

## Security Testing

- ✅ Verify unauthenticated users cannot upload
- ✅ Verify users can only access approved materials
- ✅ Verify file type validation works
- ✅ Verify file size limits are enforced
- ✅ Verify rate limiting works

---

## Regression Testing

After any code changes, re-run:
1. Test 1: Profile image upload
2. Test 4: Small material upload
3. Test 6: Large material upload (if needed)
4. Test 5 & 7: Downloads

---

## Test Data Cleanup

After testing, you may want to:
1. Delete test materials from database
2. Remove test files from Supabase Storage
3. Remove test files from MEGA
4. Reset download counts

---

## Recording Test Results

| Test # | Description | Status | Notes |
|--------|-------------|--------|-------|
| 1 | Profile upload | ⏳ | |
| 2 | Replace profile | ⏳ | |
| 3 | Delete profile | ⏳ | |
| 4 | Small material upload | ⏳ | |
| 5 | Download small material | ⏳ | |
| 6 | Large material upload | ⏳ | |
| 7 | Download large material | ⏳ | |
| 8 | Compression | ⏳ | |
| 9 | Skip compression | ⏳ | |
| ... | ... | ... | |

Legend: ⏳ Not tested | ✅ Passed | ❌ Failed

---

**Last Updated:** January 20, 2026
