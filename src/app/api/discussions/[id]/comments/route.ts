import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createMentionNotifications } from '@/lib/notifications';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Комментарий не может быть пустым'),
  parentId: z.string().optional(),
  mentionedUsers: z.array(z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createCommentSchema.parse(body);

    // Check if thread exists
    const thread = await prisma.discussionThread.findUnique({
      where: { id },
    });

    if (!thread || thread.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Calculate depth if replying to another comment
    let depth = 0;
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      });
      if (parentComment) {
        depth = parentComment.depth + 1;
      }
    }

    // Create comment (auto-approve for now)
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        threadId: id,
        parentId: validatedData.parentId || null,
        authorId: session.user.id,
        depth,
        status: 'APPROVED',
      },
      include: {
        author: {
          select: {
            fullName: true,
            academicYear: true,
            profileImage: true,
          },
        },
      },
    });

    // Update thread comment count
    await prisma.discussionThread.update({
      where: { id },
      data: { commentsCount: { increment: 1 } },
    });

    // Send mention notifications
    if (validatedData.mentionedUsers && validatedData.mentionedUsers.length > 0) {
      await createMentionNotifications(
        validatedData.mentionedUsers,
        session.user.id,
        session.user.name || 'Пользователь',
        validatedData.content,
        `/discussions/${id}`
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Комментарий отправлен. Ожидайте одобрения администратора.',
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
