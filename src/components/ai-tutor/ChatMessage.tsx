import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '@/lib/utils';
import { Bot, User, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  tutorAvatar?: string;
  tutorName?: string;
  isStreaming?: boolean;
  onSpeak?: () => void;
  isSpeaking?: boolean;
}

export const ChatMessage = ({
  role,
  content,
  tutorAvatar,
  tutorName,
  isStreaming,
  onSpeak,
  isSpeaking
}: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-2xl",
      isUser ? "flex-row-reverse ml-8" : "mr-8"
    )}>
      {/* Avatar */}
      <Avatar className={cn(
        "h-10 w-10 flex-shrink-0 border-2",
        isUser ? "border-primary" : "border-secondary"
      )}>
        <AvatarFallback className={cn(
          "text-lg",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-5 w-5" /> : (tutorAvatar || <Bot className="h-5 w-5" />)}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-2",
        isUser && "text-right"
      )}>
        <div className="flex items-center gap-2" style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <span className="text-sm font-semibold text-foreground">
            {isUser ? 'You' : tutorName || 'AI Tutor'}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              thinking...
            </span>
          )}
        </div>
        
        <div className={cn(
          "inline-block p-4 rounded-2xl max-w-full",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          {role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && content && onSpeak && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSpeak}
              disabled={isSpeaking}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Volume2 className={cn("h-4 w-4 mr-1", isSpeaking && "animate-pulse text-primary")} />
              {isSpeaking ? 'Speaking...' : 'Read Aloud'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
