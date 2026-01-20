import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadProfileImage, deleteProfileImage, isSupabaseConfigured } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST - Upload profile image
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get current user's profile image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true },
    });

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      logger.warn('Supabase not configured, using local storage fallback');
      return NextResponse.json(
        { error: 'File storage is not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    try {
      // Upload to Supabase Storage
      const { publicUrl, path } = await uploadProfileImage(file, session.user.id);

      // Delete old profile image if exists (from Supabase)
      if (user?.profileImage) {
        // Check if old image is from Supabase (contains supabase URL)
        if (user.profileImage.includes('supabase')) {
          try {
            // Extract path from URL (format: https://xxx.supabase.co/storage/v1/object/public/profiles/path)
            const urlParts = user.profileImage.split('/profiles/');
            if (urlParts.length > 1) {
              const oldPath = urlParts[1];
              await deleteProfileImage(oldPath);
            }
          } catch (error) {
            logger.error('Error deleting old Supabase image:', error);
          }
        } else if (user.profileImage.startsWith('/uploads/')) {
          // Delete old local filesystem image if exists
          const oldImagePath = join(process.cwd(), 'public', user.profileImage);
          if (existsSync(oldImagePath)) {
            try {
              await unlink(oldImagePath);
              logger.info('Deleted old local profile image during migration');
            } catch (error) {
              logger.error('Error deleting old local image:', error);
            }
          }
        }
      }

      // Update user profile image URL in database
      await prisma.user.update({
        where: { id: session.user.id },
        data: { profileImage: publicUrl },
      });

      logger.info('Profile image uploaded to Supabase', {
        userId: session.user.id,
        path: path,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: { profileImage: publicUrl },
      });
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      logger.error('Error uploading profile image to Supabase:', uploadError);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error uploading profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}

// DELETE - Remove profile image
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current profile image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      // Check if image is from Supabase
      if (user.profileImage.includes('supabase')) {
        try {
          // Extract path from URL
          const urlParts = user.profileImage.split('/profiles/');
          if (urlParts.length > 1) {
            const path = urlParts[1];
            await deleteProfileImage(path);
            logger.info('Deleted profile image from Supabase', {
              userId: session.user.id,
              path: path,
            });
          }
        } catch (error) {
          logger.error('Error deleting Supabase image:', error);
        }
      } else if (user.profileImage.startsWith('/uploads/')) {
        // Delete old local filesystem image
        const imagePath = join(process.cwd(), 'public', user.profileImage);
        if (existsSync(imagePath)) {
          try {
            await unlink(imagePath);
            logger.info('Deleted local profile image');
          } catch (error) {
            logger.error('Error deleting local image file:', error);
          }
        }
      }
    }

    // Remove profile image from database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully',
    });
  } catch (error) {
    logger.error('Error removing profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove profile image' },
      { status: 500 }
    );
  }
}
