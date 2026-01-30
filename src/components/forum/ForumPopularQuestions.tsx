import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PopularQuestion {
  id: string;
  title: string;
  username: string;
  reply_count: number;
}

interface ForumPopularQuestionsProps {
  onQuestionClick: (postId: string) => void;
}

export const ForumPopularQuestions = ({ onQuestionClick }: ForumPopularQuestionsProps) => {
  const [popularQuestions, setPopularQuestions] = useState<PopularQuestion[]>([]);
  const [mostAnswered, setMostAnswered] = useState<PopularQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Get posts ordered by upvotes for "Popular"
        const { data: popularData } = await supabase
          .from('forum_posts')
          .select('id, title, user_id, upvotes')
          .order('upvotes', { ascending: false })
          .limit(5);

        // Get reply counts for all posts
        const { data: replyCounts } = await supabase
          .from('forum_replies')
          .select('post_id');

        const replyCountMap: Record<string, number> = {};
        (replyCounts || []).forEach((r) => {
          replyCountMap[r.post_id] = (replyCountMap[r.post_id] || 0) + 1;
        });

        // Get user profiles
        const userIds = [...new Set((popularData || []).map((p) => p.user_id))];
        let profiles: { id: string; username: string }[] = [];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
          profiles = profilesData || [];
        }

        const enrichedPopular = (popularData || []).map((post) => ({
          id: post.id,
          title: post.title,
          username: profiles.find((p) => p.id === post.user_id)?.username || 'Unknown',
          reply_count: replyCountMap[post.id] || 0,
        }));

        // Get posts with most replies for "Answers" tab
        const sortedByReplies = [...enrichedPopular].sort(
          (a, b) => b.reply_count - a.reply_count
        );

        setPopularQuestions(enrichedPopular);
        setMostAnswered(sortedByReplies);
      } catch (error) {
        console.error('Error fetching popular questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const QuestionItem = ({ question }: { question: PopularQuestion }) => (
    <div 
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onQuestionClick(question.id)}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {question.username?.charAt(0).toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
          {question.title}
        </p>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>{question.reply_count} Answers</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <Tabs defaultValue="popular" className="w-full">
        <CardHeader className="pb-2">
          <TabsList className="w-full grid grid-cols-2 h-9">
            <TabsTrigger value="popular" className="text-xs">Popular</TabsTrigger>
            <TabsTrigger value="answers" className="text-xs">Answers</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="pt-0">
          <TabsContent value="popular" className="m-0 space-y-1">
            {popularQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No questions yet
              </p>
            ) : (
              popularQuestions.map((q) => (
                <QuestionItem key={q.id} question={q} />
              ))
            )}
          </TabsContent>
          <TabsContent value="answers" className="m-0 space-y-1">
            {mostAnswered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No questions yet
              </p>
            ) : (
              mostAnswered.map((q) => (
                <QuestionItem key={q.id} question={q} />
              ))
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
