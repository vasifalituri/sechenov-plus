import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DiscussionsList } from '@/components/discussions/DiscussionsList';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getDiscussions() {
  const session = await getServerSession(authOptions);
  
  return prisma.discussionThread.findMany({
    where: { status: 'APPROVED' },
    include: {
      subject: true,
      author: {
        select: { 
          id: true,
          username: true,
          fullName: true, 
          academicYear: true 
        },
      },
      votes: session?.user ? {
        where: { userId: session.user.id },
        select: { type: true },
      } : false,
      _count: {
        select: {
          comments: { where: { status: 'APPROVED' } },
        },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { upvotes: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: { order: 'asc' },
  });
}

export default async function DiscussionsPage() {
  const [discussions, subjects] = await Promise.all([
    getDiscussions(),
    getSubjects(),
  ]);

  // Transform discussions to include userVote and score
  const transformedDiscussions = discussions.map((discussion: any) => ({
    ...discussion,
    userVote: discussion.votes && discussion.votes.length > 0 ? discussion.votes[0].type : null,
    votes: undefined,
    score: discussion.upvotes - discussion.downvotes,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Обсуждения</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Делитесь опытом и задавайте вопросы 💬
          </p>
        </div>
        <Link href="/discussions/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            <span className="sm:inline">Создать тему</span>
          </Button>
        </Link>
      </div>

      <DiscussionsList 
        initialDiscussions={transformedDiscussions}
        subjects={subjects}
      />
    </div>
  );
}
