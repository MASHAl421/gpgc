import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const VoiceRecordButton = ({ 
  isRecording, 
  isSupported, 
  onStart, 
  onStop 
}: VoiceRecordButtonProps) => {
  if (!isSupported) {
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-50">
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant={isRecording ? "destructive" : "ghost"}
      size="icon"
      onClick={isRecording ? onStop : onStart}
      className={cn(
        "relative transition-all",
        isRecording && "animate-pulse"
      )}
    >
      {isRecording ? (
        <>
          <Square className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
        </>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
};
