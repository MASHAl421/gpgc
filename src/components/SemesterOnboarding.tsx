import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type OnboardingStep = 'program' | 'semester' | 'complete';

interface SemesterOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

const SemesterOnboarding = ({ open, onComplete }: SemesterOnboardingProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('program');
  const [isLoading, setIsLoading] = useState(false);

  const handleProgramSelection = async (isBsStudent: boolean) => {
    if (!isBsStudent) {
      // If not BS student, just mark as complete with null values
      await updateProfile(false, null);
      onComplete();
      return;
    }
    setStep('semester');
  };

  const handleSemesterSelection = async (semester: number) => {
    await updateProfile(true, semester);
    onComplete();
  };

  const updateProfile = async (isBsStudent: boolean, semester: number | null) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_bs_student: isBsStudent, 
          semester: semester 
        })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            {step === 'program' ? 'Welcome!' : 'Select Your Semester'}
          </DialogTitle>
          <DialogDescription>
            {step === 'program' 
              ? 'Let us personalize your learning experience'
              : 'Choose your current semester to see relevant subjects'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'program' && (
          <div className="space-y-4 pt-4">
            <p className="text-foreground font-medium text-center">
              Are you a BS student?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleProgramSelection(true)}
                disabled={isLoading}
              >
                <BookOpen className="h-8 w-8 text-primary" />
                <span>Yes, I am</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-muted-foreground"
                onClick={() => handleProgramSelection(false)}
                disabled={isLoading}
              >
                <span className="text-2xl">🎓</span>
                <span>No</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'semester' && (
          <div className="space-y-4 pt-4">
            <p className="text-foreground font-medium text-center">
              Which semester are you in?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <Card
                  key={sem}
                  className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                    sem > 2 ? 'opacity-50' : ''
                  }`}
                  onClick={() => sem <= 2 && handleSemesterSelection(sem)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        sem <= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {sem}
                      </div>
                      <span className={`font-medium ${sem <= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Semester {sem}
                      </span>
                    </div>
                    {sem <= 2 && <ArrowRight className="h-4 w-4 text-primary" />}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              More semesters coming soon!
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SemesterOnboarding;
