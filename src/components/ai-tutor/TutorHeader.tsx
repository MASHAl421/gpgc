import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, MessageSquare, Brain, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tutor {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

interface TutorHeaderProps {
  tutor: Tutor;
  mode: 'text' | 'video';
  onModeChange: (mode: 'text' | 'video') => void;
  onBack: () => void;
  onOpenMindMap?: () => void;
}

export const TutorHeader = ({
  tutor,
  mode,
  onModeChange,
  onBack,
  onOpenMindMap
}: TutorHeaderProps) => {
  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-between p-3 max-w-6xl mx-auto">
        {/* Left side - Back and Tutor info */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl shadow-md">
              {tutor.avatar}
            </div>
            <div>
              <h2 className="font-bold text-foreground">{tutor.name}</h2>
              <p className="text-xs text-muted-foreground">{tutor.title}</p>
            </div>
          </div>
        </div>

        {/* Center - Mode toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-full p-1">
          <Button
            variant={mode === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('text')}
            className={cn(
              "rounded-full px-4 h-8",
              mode === 'text' ? 'shadow-md' : ''
            )}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Text Chat
          </Button>
          <Button
            variant={mode === 'video' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('video')}
            className={cn(
              "rounded-full px-4 h-8",
              mode === 'video' ? 'shadow-md' : ''
            )}
          >
            <Video className="h-4 w-4 mr-2" />
            Video Chat
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenMindMap}
            className="rounded-full hidden sm:flex"
          >
            <Brain className="h-4 w-4 mr-2" />
            MindMap
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
