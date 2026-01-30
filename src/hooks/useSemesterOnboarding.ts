import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  is_bs_student: boolean | null;
  semester: number | null;
}

export const useSemesterOnboarding = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_bs_student, semester')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfileData(data);
      // User needs onboarding if is_bs_student is null (never answered)
      setNeedsOnboarding(data.is_bs_student === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkOnboardingStatus();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading, isAuthenticated]);

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
    checkOnboardingStatus(); // Refresh profile data
  };

  return {
    needsOnboarding,
    profileData,
    isLoading: isLoading || authLoading,
    completeOnboarding,
    refetch: checkOnboardingStatus,
  };
};
