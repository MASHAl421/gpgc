import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ForumUserBadge } from './ForumUserBadge';
import { 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  Eye,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ForumQuestionCardProps {
  id: string;
  title: string;
  content: string;
  username: string;
  userId: string;
  subjectName: string;
  upvotes: number;
  replyCount: number;
  createdAt: string;
  isAnswered: boolean;
  isPinned?: boolean;
  hasUpvoted: boolean;
  isOwner: boolean;
  onUpvote: (e: React.MouseEvent) => void;
  onDownvote: (e: React.MouseEvent) => void;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export const ForumQuestionCard = ({
  id,
  title,
  content,
  username,
  userId,
  subjectName,
  upvotes,
  replyCount,
  createdAt,
  isAnswered,
  isPinned = false,
  hasUpvoted,
  isOwner,
  onUpvote,
  onDownvote,
  onClick,
  onEdit,
  onDelete,
}: ForumQuestionCardProps) => {
  return (
    <div 
      className="relative bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Pinned Ribbon */}
      {isPinned && (
        <div className="absolute -top-1 -right-1 overflow-hidden w-20 h-20 pointer-events-none">
          <div className="absolute transform rotate-45 bg-destructive text-destructive-foreground text-xs font-semibold py-1 right-[-35px] top-[12px] w-[120px] text-center shadow-sm">
            Pinned
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Vote Section */}
        <div className="flex flex-col items-center gap-0 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
            onClick={onUpvote}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <span className={`text-lg font-semibold ${hasUpvoted ? 'text-primary' : 'text-foreground'}`}>
            {upvotes}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDownvote}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header with Avatar, Username, Date, Category */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {username?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-primary text-sm">{username}</span>
            <span className="text-muted-foreground text-sm">
              Asked: {format(new Date(createdAt), 'MMMM d, yyyy')}
            </span>
            <span className="text-muted-foreground text-sm">In:</span>
            <span className="text-primary text-sm">{subjectName}</span>
            <ForumUserBadge userId={userId} />
          </div>

          {/* Question Title */}
          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
            {title}
          </h3>

          {/* Question Preview */}
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {content}
          </p>

          {/* Tags */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge 
              variant="default" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              {subjectName.toLowerCase().replace(/\s+/g, '-')}
            </Badge>
            {isAnswered && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs">
                Answered
              </Badge>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4" />
                <span>{replyCount} Answers</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Eye className="h-4 w-4" />
                <span>{upvotes * 23 + replyCount * 15} Views</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                Answer
              </Button>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
