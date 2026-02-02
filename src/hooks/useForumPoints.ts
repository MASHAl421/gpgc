import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ForumBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  required_points: number;
  required_answers: number;
}

export interface UserForumStats {
  forumPoints: number;
  totalPosts: number;
  totalReplies: number;
  bestAnswers: number;
  currentBadge: ForumBadge | null;
  nextBadge: ForumBadge | null;
  earnedBadges: ForumBadge[];
}

// Points configuration based on PDF
export const FORUM_POINTS = {
  SIGNUP: 20,
  REFERRAL_PAID: 20,
  REFERRAL_FREE: 10,
  BEST_ANSWER: 5,
  NEW_REPLY: 2,
  NEW_POST: 2,
  NEW_QUESTION: 1,
  QUESTION_UPVOTE: 1,
};

export const useForumPoints = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserForumStats>({
    forumPoints: 0,
    totalPosts: 0,
    totalReplies: 0,
    bestAnswers: 0,
    currentBadge: null,
    nextBadge: null,
    earnedBadges: [],
  });
  const [badges, setBadges] = useState<ForumBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    const { data } = await supabase
      .from('forum_badges')
      .select('*')
      .order('required_points', { ascending: true });
    
    setBadges(data || []);
    return data || [];
  };

  const fetchUserStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile for forum_points
      const { data: profile } = await supabase
        .from('profiles')
        .select('forum_points')
        .eq('id', user.id)
        .single();

      // Fetch post count
      const { count: postCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch reply count
      const { count: replyCount } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch best answers count
      const { count: bestAnswerCount } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_accepted_answer', true);

      // Fetch earned badges
      const { data: earnedBadgeData } = await supabase
        .from('user_forum_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const allBadges = await fetchBadges();
      const earnedBadgeIds = new Set((earnedBadgeData || []).map(b => b.badge_id));
      const earnedBadges = allBadges.filter(b => earnedBadgeIds.has(b.id));

      const forumPoints = profile?.forum_points || 0;
      const totalAnswers = replyCount || 0;

      // Determine current and next badge based on points and answers
      let currentBadge: ForumBadge | null = null;
      let nextBadge: ForumBadge | null = null;

      for (const badge of allBadges) {
        if (forumPoints >= badge.required_points && totalAnswers >= badge.required_answers) {
          currentBadge = badge;
        } else if (!nextBadge) {
          nextBadge = badge;
        }
      }

      setStats({
        forumPoints,
        totalPosts: postCount || 0,
        totalReplies: replyCount || 0,
        bestAnswers: bestAnswerCount || 0,
        currentBadge,
        nextBadge,
        earnedBadges,
      });
    } catch (error) {
      console.error('Error fetching forum stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = async (
    transactionType: string,
    points: number,
    referenceId?: string,
    description?: string
  ) => {
    if (!user) return false;

    try {
      // Use atomic RPC function to prevent race conditions
      const { data: newBalance, error } = await supabase.rpc('add_forum_points', {
        _user_id: user.id,
        _points: points,
        _transaction_type: transactionType,
        _description: description || null,
        _reference_id: referenceId || null,
      });

      if (error) throw error;

      // Check and award badges with the new balance
      await checkAndAwardBadges(newBalance, stats.totalReplies);

      // Refresh stats
      await fetchUserStats();
      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  };

  const checkAndAwardBadges = async (currentPoints: number, totalAnswers: number) => {
    if (!user) return;

    try {
      // Get badges user qualifies for but hasn't earned
      const { data: earnedBadgeData } = await supabase
        .from('user_forum_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const earnedBadgeIds = new Set((earnedBadgeData || []).map(b => b.badge_id));

      for (const badge of badges) {
        if (
          !earnedBadgeIds.has(badge.id) &&
          currentPoints >= badge.required_points &&
          totalAnswers >= badge.required_answers
        ) {
          // Award this badge
          await supabase
            .from('user_forum_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id,
            });
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  return {
    stats,
    badges,
    loading,
    awardPoints,
    refetch: fetchUserStats,
    FORUM_POINTS,
  };
};

// Helper function to get user's forum stats for display (non-hook version)
export const getUserForumStats = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('forum_points, username')
      .eq('id', userId)
      .single();

    const { count: replyCount } = await supabase
      .from('forum_replies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: allBadges } = await supabase
      .from('forum_badges')
      .select('*')
      .order('required_points', { ascending: true });

    const forumPoints = profile?.forum_points || 0;
    const totalAnswers = replyCount || 0;

    let currentBadge: ForumBadge | null = null;
    for (const badge of (allBadges || [])) {
      if (forumPoints >= badge.required_points && totalAnswers >= badge.required_answers) {
        currentBadge = badge;
      }
    }

    return {
      username: profile?.username || 'Unknown',
      forumPoints,
      currentBadge,
    };
  } catch (error) {
    console.error('Error fetching user forum stats:', error);
    return null;
  }
};
