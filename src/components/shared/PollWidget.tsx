'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  order: number;
  _count: {
    votes: number;
  };
}

interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  _count: {
    votes: number;
  };
}

export function PollWidget() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, []);

  const fetchPoll = async () => {
    try {
      const res = await fetch('/api/polls');
      const data = await res.json();
      
      if (data && data.id) {
        setPoll(data);
        
        // Fetch user's vote
        const voteRes = await fetch(`/api/polls/vote?pollId=${data.id}`);
        if (voteRes.ok) {
          const votes = await voteRes.json();
          if (votes.length > 0) {
            setUserVotes(votes);
            setHasVoted(true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    }
  };

  const handleVote = async (optionId: string) => {
    if (isVoting || !poll) return;
    
    setIsVoting(true);
    try {
      const res = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId,
        }),
      });

      if (res.ok) {
        setUserVotes([optionId]);
        setHasVoted(true);
        fetchPoll(); // Refresh to get updated vote counts
      } else {
        alert('Ошибка при голосовании');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Ошибка при голосовании');
    } finally {
      setIsVoting(false);
    }
  };

  if (!poll) return null;

  const totalVotes = poll._count.votes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 {poll.question}
        </CardTitle>
        {poll.description && (
          <CardDescription>{poll.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {hasVoted ? (
          <>
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 
                ? Math.round((option._count.votes / totalVotes) * 100) 
                : 0;
              const isUserVote = userVotes.includes(option.id);

              return (
                <div key={option.id} className="relative">
                  <div
                    className={`p-3 rounded-lg border transition-all ${
                      isUserVote 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {isUserVote && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        <span className="font-medium">{option.text}</span>
                      </div>
                      <span className="text-sm font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option._count.votes} {option._count.votes === 1 ? 'голос' : 'голосов'}
                    </span>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Всего проголосовало: {totalVotes} {totalVotes === 1 ? 'человек' : 'человек'}
            </p>
          </>
        ) : (
          <>
            {poll.options.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => handleVote(option.id)}
                disabled={isVoting}
              >
                {option.text}
              </Button>
            ))}
            <p className="text-xs text-muted-foreground text-center mt-2">
              Выберите вариант ответа
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
