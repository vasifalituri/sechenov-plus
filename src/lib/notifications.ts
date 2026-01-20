import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface CreateNotificationParams {
  userId: string;
  type: 'MENTION' | 'REPLY' | 'NEW_MESSAGE' | 'MATERIAL_RATED';
  title: string;
  message: string;
  link?: string;
  createdById?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        createdById: params.createdById,
      },
    });
  } catch (error) {
    logger.error('Create notification error', error);
  }
}

export async function createMentionNotifications(
  mentionedUsernames: string[],
  authorId: string,
  authorName: string,
  message: string,
  link: string
) {
  try {
    logger.debug('Creating mention notifications', {
      mentionedUsernames,
      authorId,
      authorName,
    });
    
    // Find users by usernames
    const users = await prisma.user.findMany({
      where: {
        username: { in: mentionedUsernames },
        NOT: { id: authorId }, // Don't notify yourself
      },
      select: { id: true, username: true },
    });

    logger.debug('Found users for mentions', { count: users.length });

    // Create notifications for each mentioned user
    const notifications = users.map((user) => ({
      userId: user.id,
      type: 'MENTION' as const,
      title: 'Вас упомянули',
      message: `${authorName} упомянул вас в комментарии`,
      link,
      createdById: authorId,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
      logger.info('Mention notifications created', { count: notifications.length });
    }

    return notifications.length;
  } catch (error) {
    logger.error('Create mention notifications error', error);
    return 0;
  }
}
