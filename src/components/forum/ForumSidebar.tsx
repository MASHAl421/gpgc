import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForumPointsDisplay } from './ForumPointsDisplay';
import { ForumBadge } from './ForumBadge';
import { FORUM_POINTS } from '@/hooks/useForumPoints';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, TrendingUp, Loader2 } from 'lucide-react';

interface TopMember {
  username: string;
  forum_points: number;
  total_posts: number;
  badge_name: string | null;
}

export const ForumSidebar = () => {
  const { isAuthenticated } = useAuth();
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopMembers = async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, forum_points')
          .order('forum_points', { ascending: false })
          .limit(5);

        if (!profiles) {
          setLoading(false);
          return;
        }

        const userIds = profiles.map(p => p.id);
        const { data: postCounts } = await supabase
          .from('forum_posts')
          .select('user_id')
          .in('user_id', userIds);

        const { data: replyCounts } = await supabase
          .from('forum_replies')
          .select('user_id')
          .in('user_id', userIds);

        const { data: badges } = await supabase
          .from('forum_badges')
          .select('*')
          .order('required_points', { ascending: true });

        const postCountMap: Record<string, number> = {};
        (postCounts || []).forEach(p => {
          postCountMap[p.user_id] = (postCountMap[p.user_id] || 0) + 1;
        });

        const replyCountMap: Record<string, number> = {};
        (replyCounts || []).forEach(r => {
          replyCountMap[r.user_id] = (replyCountMap[r.user_id] || 0) + 1;
        });

        const enrichedMembers = profiles.map(p => {
          const totalAnswers = replyCountMap[p.id] || 0;
          let badgeName: string | null = null;

          for (const badge of (badges || [])) {
            if (p.forum_points >= badge.required_points && totalAnswers >= badge.required_answers) {
              badgeName = badge.name;
            }
          }

          return {
            username: p.username,
            forum_points: p.forum_points || 0,
            total_posts: postCountMap[p.id] || 0,
            badge_name: badgeName,
          };
        });

        setTopMembers(enrichedMembers);
      } catch (error) {
        console.error('Error fetching top members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopMembers();
  }, []);

  return (
    <div className="space-y-4">
      {/* User's points (only if authenticated) */}
      {isAuthenticated && <ForumPointsDisplay />}

      {/* Points System Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Points System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sign up</span>
            <span className="font-medium text-primary">+{FORUM_POINTS.SIGNUP} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Best answer</span>
            <span className="font-medium text-primary">+{FORUM_POINTS.BEST_ANSWER} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New post</span>
            <span className="font-medium text-primary">+{FORUM_POINTS.NEW_POST} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">New reply</span>
            <span className="font-medium text-primary">+{FORUM_POINTS.NEW_REPLY} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Question upvote</span>
            <span className="font-medium text-primary">+{FORUM_POINTS.QUESTION_UPVOTE} pts</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Members */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : topMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No members yet
            </p>
          ) : (
            <div className="space-y-3">
              {topMembers.map((member, index) => (
                <div key={member.username} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground truncate max-w-[100px]">
                        {member.username}
                      </div>
                      {member.badge_name && (
                        <ForumBadge name={member.badge_name} showTooltip={false} />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {member.forum_points} pts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.total_posts} posts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
