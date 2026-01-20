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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Обсуждения</h1>
          <p className="text-muted-foreground mt-2">
            Делитесь опытом и задавайте вопросы 💬
          </p>
        </div>
        <Link href="/discussions/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать тему
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
