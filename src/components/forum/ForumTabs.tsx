import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ForumSortOption = 
  | 'recent' 
  | 'most_answered' 
  | 'most_upvoted' 
  | 'unanswered'
  | 'trending';

interface ForumTabsProps {
  activeTab: ForumSortOption;
  onTabChange: (tab: ForumSortOption) => void;
}

const tabs: { id: ForumSortOption; label: string }[] = [
  { id: 'recent', label: 'Recent Questions' },
  { id: 'most_answered', label: 'Most Answered' },
  { id: 'trending', label: 'Trending' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'most_upvoted', label: 'Most Upvoted' },
];

export const ForumTabs = ({ activeTab, onTabChange }: ForumTabsProps) => {
  const visibleTabs = tabs.slice(0, 4);
  const hiddenTabs = tabs.slice(4);

  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
            activeTab === tab.id
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
      
      {hiddenTabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {hiddenTabs.map((tab) => (
              <DropdownMenuItem 
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={activeTab === tab.id ? 'text-primary' : ''}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
