import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Checks user stats and grants any newly-unlocked achievements (with coin rewards).
 * Safe to call after any earning event (quiz, competition, daily login).
 */
export async function checkAchievements(userId: string) {
  try {
    const { data, error } = await supabase.rpc('check_and_grant_achievements', {
      _user_id: userId,
    });
    if (error) throw error;
    if (data && data.length > 0) {
      data.forEach((a: { name: string; coins_reward: number }) => {
        toast.success(`🏆 Achievement unlocked: ${a.name} (+${a.coins_reward} coins)`);
      });
    }
    return data || [];
  } catch (e) {
    if (import.meta.env.DEV) console.error('checkAchievements error', e);
    return [];
  }
}
