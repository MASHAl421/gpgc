import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Send, Loader2, 
  MessageSquare, Trash2, Search, ChevronDown, X,
  Copy, Check, Paperclip, Image as ImageIcon, FileText,
  ThumbsUp, ThumbsDown, Share2, Volume2, VolumeX, RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant'; content: string; imageData?: string; imageName?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

// Message action buttons component for assistant messages
interface MessageActionsProps {
  text: string;
  onRetry: () => void;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const MessageActions = ({ text, onRetry, speak, stop, isSpeaking, isSupported }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        toast({ title: 'Shared successfully' });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard (sharing not supported)' });
    }
  };
  
  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };
  
  const handleLike = () => {
    setLiked(liked === true ? null : true);
    if (liked !== true) toast({ title: 'Thanks for your feedback!' });
  };
  
  const handleDislike = () => {
    setLiked(liked === false ? null : false);
    if (liked !== false) toast({ title: 'Thanks for your feedback!' });
  };
  
  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCopy}
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${liked === true ? 'text-primary bg-primary/10' : ''}`}
        onClick={handleLike}
        title="Like"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${liked === false ? 'text-destructive bg-destructive/10' : ''}`}
        onClick={handleDislike}
        title="Dislike"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
      
      {isSupported && (
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${isSpeaking ? 'text-primary bg-primary/10' : ''}`}
          onClick={handleSpeak}
          title={isSpeaking ? "Stop speaking" : "Read aloud"}
        >
          {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleShare}
        title="Share"
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onRetry}
        title="Retry"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

const AITutor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string; name: string; type: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState<{ content: string; imageData?: string; imageName?: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, user, session } = useAuth();
  const isMobile = useIsMobile();
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  
  const { 
    chatSessions, 
    currentSessionId, 
    isLoading: historyLoading,
    fetchChatHistory, 
    createNewSession, 
    updateSession, 
    deleteSession,
    loadSession,
    setCurrentSessionId
  } = useChatHistory();

  useEffect(() => {
    if (isAuthenticated) {
      fetchChatHistory();
    }
  }, [isAuthenticated, fetchChatHistory]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (!shouldAutoScroll) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    // Using scrollTop avoids the "blank space" jump that can happen with
    // scrollIntoView during streaming + layout reflow.
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    // Keep the view pinned while streaming; smooth only after the message settles.
    scrollToBottom(isLoading ? 'auto' : 'smooth');
  }, [messages, shouldAutoScroll, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [question]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image (JPG, PNG, GIF, WebP) or PDF file.',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        data: reader.result as string,
        name: file.name,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!question.trim() && !attachedFile) || isLoading) return;

    // AI Tutor backend requires a real user JWT.
    // Session tokens can be stale/expired on some clients, so we fetch the latest
    // session and refresh if it's near expiry.
    const getValidAccessToken = async (): Promise<string | null> => {
      const { data } = await supabase.auth.getSession();
      let token = data.session?.access_token ?? session?.access_token ?? null;
      const expiresAt = data.session?.expires_at;

      // Refresh if expiring in the next 60 seconds.
      if (token && expiresAt && expiresAt * 1000 - Date.now() < 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token ?? token;
      }

      return token;
    };

    let accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast({
        title: 'Session expired',
        description: 'Please sign out and sign in again, then try the AI Tutor.',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: Message = { 
      role: 'user', 
      content: question || (attachedFile ? `Analyze this ${attachedFile.type.startsWith('image') ? 'image' : 'document'}` : ''),
      imageData: attachedFile?.data,
      imageName: attachedFile?.name,
    };
    // Store last user message for retry functionality
    setLastUserMessage({ 
      content: userMsg.content, 
      imageData: userMsg.imageData, 
      imageName: userMsg.imageName 
    });
    const questionText = question || attachedFile?.name || 'File analysis';
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuestion('');
    setAttachedFile(null);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const doRequest = async (token: string) =>
        fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        });

      let resp = await doRequest(accessToken);

      // If token expired between checks, refresh once and retry.
      if (resp.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const refreshedToken = refreshed.session?.access_token;
        if (refreshedToken) {
          accessToken = refreshedToken;
          resp = await doRequest(accessToken);
        }
      }

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save to history
      if (isAuthenticated && user) {
        const finalMessages = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
        if (currentSessionId) {
          await updateSession(currentSessionId, finalMessages);
        } else {
          const title = questionText.slice(0, 40) + (questionText.length > 40 ? '...' : '');
          const newId = await createNewSession();
          if (newId) {
            await updateSession(newId, finalMessages, title);
          }
        }
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentSessionId(null);
    setLastUserMessage(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
    const sessionMessages = loadSession(sessionId);
    setMessages(sessionMessages);
    // Find last user message for retry
    const lastUser = [...sessionMessages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setLastUserMessage({ content: lastUser.content, imageData: (lastUser as any).imageData, imageName: (lastUser as any).imageName });
    }
    if (isMobile) setSidebarOpen(false);
  };

  // Retry last message - removes last assistant response and resends
  const handleRetry = () => {
    if (!lastUserMessage || isLoading) return;
    
    // Remove the last assistant message
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });
    
    // Set the question and trigger send
    setQuestion(lastUserMessage.content);
    if (lastUserMessage.imageData && lastUserMessage.imageName) {
      setAttachedFile({
        data: lastUserMessage.imageData,
        name: lastUserMessage.imageName,
        type: lastUserMessage.imageData.startsWith('data:image') ? 'image/png' : 'application/pdf'
      });
    }
  };

  return (
    <MainLayout>
      {/* Fill MainLayout's <main> (which is overflow-hidden for /ai-tutor) */}
      <div className="h-full flex overflow-hidden">
        {/* Sidebar - Static/Fixed */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-border bg-muted/30 transition-all duration-300 overflow-hidden`}>
          <div className="w-64 h-full flex flex-col">
            {/* Sidebar Header with Close Button */}
            <div className="p-3 flex items-center justify-between flex-shrink-0">
              <Button 
                variant="outline" 
                className="flex-1 justify-start gap-2" 
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 ml-2"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search chats"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Your Chats Section - Scrollable */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 py-2 flex-shrink-0">
                <p className="text-xs font-medium text-muted-foreground">Your chats</p>
              </div>
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {historyLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No chats yet
                  </div>
                ) : (
                  chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        currentSessionId === session.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleLoadSession(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">
                        {session.title || 'New Chat'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* User Profile at Bottom */}
            {user && (
              <div className="p-3 border-t border-border flex-shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email?.split('@')[0] || 'User'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <span className="font-medium">AI Tutor</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Messages Area - Single scrollbar */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
              {messages.length === 0 ? (
                /* Welcome Screen */
                <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-2">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-semibold mb-2">How can I help you today?</h1>
                  <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
                    Ask me anything about Programming Fundamentals, Functional English, or any topic from your syllabus.
                  </p>
                  
                  {/* Quick Suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-lg">
                    {[
                      "Explain loops in C++",
                      "What are parts of speech?",
                      "Write a simple array program",
                      "Explain tenses with examples"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setQuestion(suggestion)}
                        className="text-left p-3 sm:p-4 rounded-xl border border-border hover:bg-muted/50 active:bg-muted transition-colors"
                      >
                        <span className="text-xs sm:text-sm">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message, index) => (
                    <div key={index} className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] sm:max-w-[85%] ${message.role === 'user' ? '' : ''}`}>
                        {message.role === 'user' ? (
                          <div className="relative">
                            <div className="bg-primary text-primary-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-br-md text-sm sm:text-base">
                              {message.imageName && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary-foreground/20">
                                  {message.imageData?.startsWith('data:image') ? (
                                    <ImageIcon className="h-4 w-4" />
                                  ) : (
                                    <FileText className="h-4 w-4" />
                                  )}
                                  <span className="text-xs sm:text-sm truncate">{message.imageName}</span>
                                </div>
                              )}
                              {message.imageData?.startsWith('data:image') && (
                                <img 
                                  src={message.imageData} 
                                  alt="Uploaded" 
                                  className="max-w-full max-h-32 sm:max-h-48 rounded-lg mb-2"
                                />
                              )}
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{ 
                                          borderRadius: '12px', 
                                          fontSize: '0.85em',
                                          margin: '1em 0'
                                        }}
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            <MessageActions 
                              text={message.content} 
                              onRetry={handleRetry}
                              speak={speak}
                              stop={stop}
                              isSpeaking={isSpeaking}
                              isSupported={isSupported}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Thinking Indicator - Simple & Professional */}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-xl">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: '200ms' }} />
                          <span className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse" style={{ animationDelay: '400ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
          {/* Input Area */}
          <div className="border-t border-border p-2 sm:p-4 safe-area-bottom">
            <div className="max-w-3xl mx-auto">
              {/* Attached File Preview */}
              {attachedFile && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                  {attachedFile.type.startsWith('image') ? (
                    <img src={attachedFile.data} alt="Preview" className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  )}
                  <span className="flex-1 text-xs sm:text-sm truncate">{attachedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setAttachedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="relative flex items-end gap-1 sm:gap-2 bg-muted/50 rounded-2xl border border-border p-1.5 sm:p-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or PDF"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <Textarea
                  ref={textareaRef}
                  placeholder={attachedFile ? "Add a message..." : "Ask anything"}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 min-h-[36px] sm:min-h-[40px] max-h-[150px] sm:max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 sm:py-2.5 px-0 text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading}
                />

                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                  onClick={() => handleSend()}
                  disabled={isLoading || (!question.trim() && !attachedFile)}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1.5 sm:mt-2">
                AI Tutor can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          >
            <div 
              className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="p-3 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                    New chat
                  </Button>
                </div>
                <div className="px-3 py-2 flex-shrink-0">
                  <p className="text-xs font-medium text-muted-foreground">Your chats</p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                        currentSessionId === session.id ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleLoadSession(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{session.title || 'New Chat'}</span>
                    </div>
                  ))}
                </div>
                {/* Mobile User Profile */}
                {user && (
                  <div className="p-3 border-t border-border flex-shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <p className="text-sm font-medium truncate">{user.email?.split('@')[0] || 'User'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AITutor;
