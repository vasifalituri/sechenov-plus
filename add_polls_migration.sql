-- Create polls table
CREATE TABLE IF NOT EXISTS "polls" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMultiple" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for poll_votes
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_pollId_userId_optionId_key" ON "poll_votes"("pollId", "userId", "optionId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "polls_isActive_idx" ON "polls"("isActive");
CREATE INDEX IF NOT EXISTS "polls_createdAt_idx" ON "polls"("createdAt");
CREATE INDEX IF NOT EXISTS "polls_createdById_idx" ON "polls"("createdById");

CREATE INDEX IF NOT EXISTS "poll_options_pollId_idx" ON "poll_options"("pollId");

CREATE INDEX IF NOT EXISTS "poll_votes_pollId_idx" ON "poll_votes"("pollId");
CREATE INDEX IF NOT EXISTS "poll_votes_optionId_idx" ON "poll_votes"("optionId");
CREATE INDEX IF NOT EXISTS "poll_votes_userId_idx" ON "poll_votes"("userId");

-- Add foreign keys
ALTER TABLE "polls" ADD CONSTRAINT "polls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
