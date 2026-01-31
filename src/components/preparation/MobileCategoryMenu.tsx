import { useState } from 'react';
import { MoreVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface MobileCategoryMenuProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const MobileCategoryMenu = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: MobileCategoryMenuProps) => {
  const [open, setOpen] = useState(false);
  
  const activeCategory = categories.find(c => c.id === selectedCategory);
  const ActiveIcon = activeCategory?.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-11 px-3 bg-card border-border"
        >
          <div className="flex items-center gap-2 min-w-0">
            {ActiveIcon && (
              <div className={`h-7 w-7 rounded-md ${activeCategory?.color} flex items-center justify-center shrink-0`}>
                <ActiveIcon className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <span className="text-sm font-medium truncate">
              {activeCategory?.name || 'Select Category'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[calc(100vw-2rem)] max-w-sm bg-card border-border"
        sideOffset={4}
      >
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const isActive = selectedCategory === category.id;
          
          return (
            <DropdownMenuItem
              key={category.id}
              onClick={() => {
                onCategoryChange(category.id);
                setOpen(false);
              }}
              className={`flex items-center gap-3 py-3 px-3 cursor-pointer ${
                isActive ? 'bg-primary/10' : ''
              }`}
            >
              <div className={`h-8 w-8 rounded-lg ${category.color} flex items-center justify-center shrink-0`}>
                <CategoryIcon className="h-4 w-4 text-white" />
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                {category.name}
              </span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MobileCategoryMenu;
