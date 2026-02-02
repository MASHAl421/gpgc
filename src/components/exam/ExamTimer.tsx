import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
  className?: string;
}

export const ExamTimer = ({ totalSeconds, onTimeUp, isPaused = false, className }: ExamTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const percentage = (remainingSeconds / totalSeconds) * 100;
  const isWarning = remainingSeconds <= 300; // 5 minutes warning
  const isCritical = remainingSeconds <= 60; // 1 minute critical

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors",
      isCritical ? "bg-destructive/20 text-destructive animate-pulse" :
      isWarning ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
      "bg-muted text-foreground",
      className
    )}>
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span>{formatTime(remainingSeconds)}</span>
      {isPaused && <span className="text-xs text-muted-foreground ml-2">(Paused)</span>}
    </div>
  );
};

export default ExamTimer;
