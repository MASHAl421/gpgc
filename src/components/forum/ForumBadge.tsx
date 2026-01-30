import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BookOpen, 
  GraduationCap, 
  Brain, 
  Lightbulb, 
  Briefcase, 
  Crown,
  Award
} from 'lucide-react';

interface ForumBadgeProps {
  name: string;
  icon?: string | null;
  description?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  Brain,
  Lightbulb,
  Briefcase,
  Crown,
  Award,
};

const badgeColors: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  Teacher: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Pundit: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  Explainer: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  Professional: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  Enlightened: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
};

export const ForumBadge = ({ 
  name, 
  icon, 
  description, 
  size = 'sm',
  showTooltip = true 
}: ForumBadgeProps) => {
  const IconComponent = iconMap[icon || 'Award'] || Award;
  const colorClass = badgeColors[name] || 'bg-primary/10 text-primary border-primary/30';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badge = (
    <Badge 
      className={`${colorClass} ${sizeClasses[size]} border font-medium inline-flex items-center gap-1`}
      variant="outline"
    >
      <IconComponent className={iconSizes[size]} />
      {name}
    </Badge>
  );

  if (!showTooltip || !description) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[200px]">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
