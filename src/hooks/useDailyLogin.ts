import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailyLoginData {
  login_date: string;
  streak_count: number;
  coins_earned: number;
}

export const useDailyLogin = () => {
  const { user } = useAuth();
  const [todayLogin, setTodayLogin] = useState<DailyLoginData | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAndRecordLogin = useCallback(async () => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already logged in today
      const { data: existingLogin, error: fetchError } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', user.id)
        .eq('login_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingLogin) {
        // Already logged in today
        setTodayLogin(existingLogin);
        setIsChecking(false);
        return;
      }

      // Get yesterday's login to calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayLogin } = await supabase
        .from('daily_logins')
        .select('streak_count')
        .eq('user_id', user.id)
        .eq('login_date', yesterdayStr)
        .maybeSingle();

      // Calculate streak
      const newStreak = yesterdayLogin ? yesterdayLogin.streak_count + 1 : 1;
      
      // Calculate coins based on streak (5 base + bonus for streak)
      const baseCoins = 5;
      const streakBonus = Math.min(newStreak - 1, 10) * 2; // Max 20 bonus coins
      const totalCoins = baseCoins + streakBonus;

      // Record today's login
      const { data: newLogin, error: insertError } = await supabase
        .from('daily_logins')
        .insert({
          user_id: user.id,
          login_date: today,
          streak_count: newStreak,
          coins_earned: totalCoins,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Use atomic RPC function to add coins (prevents race conditions)
      const { error: coinError } = await supabase.rpc('add_coins', {
        _user_id: user.id,
        _amount: totalCoins,
        _transaction_type: 'daily_login',
        _description: `Daily login (${newStreak} day streak)`,
        _reference_id: null,
      });

      if (coinError && import.meta.env.DEV) {
        console.error('Error adding daily login coins:', coinError);
      }

      setTodayLogin(newLogin);
      setShowReward(true);
    } catch (error) {
      console.error('Error recording daily login:', error);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  useEffect(() => {
    checkAndRecordLogin();
  }, [checkAndRecordLogin]);

  const dismissReward = () => {
    setShowReward(false);
  };

  return {
    todayLogin,
    showReward,
    isChecking,
    dismissReward,
  };
};
