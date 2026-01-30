import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Send, Loader2, 
  MessageSquare, Trash2, Search, ChevronDown, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatHistory } from '@/hooks/useChatHistory';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDistanceToNow } from 'date-fns';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

const AITutor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  
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

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, shouldAutoScroll]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [question]);

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: question };
    const questionText = question; // Store for title before clearing
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuestion('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

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
    if (isMobile) setSidebarOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
    const sessionMessages = loadSession(sessionId);
    setMessages(sessionMessages);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <MainLayout>
      <div className="fixed inset-0 top-16 flex overflow-hidden">
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
            className="flex-1 overflow-y-auto scrollbar-thin"
          >
            <div className="max-w-3xl mx-auto px-4 py-4">
              {messages.length === 0 ? (
                /* Welcome Screen */
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
                  <p className="text-muted-foreground mb-8 max-w-md">
                    Ask me anything about Programming Fundamentals, Functional English, or any topic from your syllabus.
                  </p>
                  
                  {/* Quick Suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {[
                      "Explain loops in C++",
                      "What are parts of speech?",
                      "Write a simple array program",
                      "Explain tenses with examples"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setQuestion(suggestion)}
                        className="text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${message.role === 'user' ? '' : ''}`}>
                        {message.role === 'user' ? (
                          <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-br-md">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="flex gap-1 px-4 py-3">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border border-border p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleNewChat}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask anything"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-0"
                  rows={1}
                  disabled={isLoading}
                />

                <Button
                  variant="default"
                  size="icon"
                  className="h-9 w-9 rounded-full flex-shrink-0"
                  onClick={() => handleSend()}
                  disabled={isLoading || !question.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
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
