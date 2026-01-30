import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Flame, Coins, Sparkles } from 'lucide-react';

interface DailyLoginRewardProps {
  open: boolean;
  onClose: () => void;
  streak: number;
  coins: number;
}

const DailyLoginReward = ({ open, onClose, streak, coins }: DailyLoginRewardProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Daily Login Reward!
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {/* Streak Display */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Login Streak</p>
              <p className="text-3xl font-bold text-foreground">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
            </div>
          </div>

          {/* Coins Earned */}
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-2">
              <Coins className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">+{coins}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Coins added to your balance
            </p>
          </div>

          {/* Motivation Text */}
          <p className="text-sm text-muted-foreground">
            {streak >= 7 
              ? "Amazing! You're on fire! 🔥" 
              : streak >= 3 
              ? "Great progress! Keep it up! 💪"
              : "Come back tomorrow for bonus coins!"}
          </p>

          <Button onClick={onClose} className="w-full">
            Continue Learning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyLoginReward;
