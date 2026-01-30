import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Loader2, Image, Paperclip, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  voiceSupported: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  value,
  onChange,
  onSend,
  isLoading,
  isListening,
  onToggleVoice,
  voiceSupported,
  placeholder = "Ask anything about your subjects..."
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4">
      <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
        {/* Main input container */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-background border border-border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
            {/* Left side tools */}
            <div className="flex items-center gap-1 px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                      disabled
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file (coming soon)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                      disabled
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload image (coming soon)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent resize-none min-h-[40px] max-h-[120px] focus-visible:ring-0 p-2"
              rows={1}
            />

            {/* Right side tools */}
            <div className="flex items-center gap-1 px-2">
              {/* Voice button */}
              {voiceSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isListening ? "default" : "ghost"}
                        size="icon"
                        onClick={onToggleVoice}
                        disabled={isLoading}
                        className={cn(
                          "h-9 w-9 rounded-full transition-all",
                          isListening 
                            ? "bg-destructive text-destructive-foreground animate-pulse" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isListening ? 'Stop listening' : 'Voice input'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Send button */}
              <Button
                onClick={onSend}
                disabled={!value.trim() || isLoading}
                size="icon"
                className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Language toggle and helper text */}
      <div className="flex items-center justify-between mt-2 px-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
            <Globe className="h-3 w-3 mr-1" />
            English
          </Button>
          <span className="text-muted-foreground">|</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
            اردو
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
