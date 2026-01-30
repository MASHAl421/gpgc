import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, Sparkles, Loader2, Video, History, 
  PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChatMessage } from '@/components/ai-tutor/ChatMessage';
import { VoiceRecordButton } from '@/components/ai-tutor/VoiceRecordButton';
import { VideoPlayer } from '@/components/ai-tutor/VideoPlayer';
import { SubjectSelector } from '@/components/ai-tutor/SubjectSelector';
import { ChatHistorySidebar } from '@/components/ai-tutor/ChatHistorySidebar';
import { QuickTopicButtons } from '@/components/ai-tutor/QuickTopicButtons';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  unit_id: string;
}

const AITutor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Tutor 🎓\n\nI can help you with:\n- **Programming Fundamentals** (C++, Arrays, Loops)\n- **Functional English** (Grammar, Writing, Reading)\n- **Any topic** from your syllabus\n\nAsk me anything, or use voice input! 🎤",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  
  const { isRecording, transcript, startRecording, stopRecording, isSupported: voiceSupported } = useVoiceRecording();
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
  const { 
    chatSessions, 
    currentSessionId, 
    isLoading: historyLoading,
    fetchChatHistory, 
    createNewSession, 
    updateSession, 
    deleteSession,
    loadSession 
  } = useChatHistory();

  // Load chat history on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchChatHistory();
    }
  }, [isAuthenticated, fetchChatHistory]);

  // Update question when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setQuestion(prev => prev + transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      // Build context-aware messages
      const contextMessages = [...messages, userMsg];
      if (selectedSubject || selectedTopic) {
        const contextNote = `[Context: ${selectedSubject?.name || ''}${selectedTopic ? ' > ' + selectedTopic.name : ''}]`;
        contextMessages[0] = { 
          ...contextMessages[0], 
          content: contextMessages[0].content + '\n\n' + contextNote 
        };
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: contextMessages }),
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
                if (last?.role === 'assistant' && prev.length > 1 && prev[prev.length - 2]?.role === 'user') {
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

      // Save to history if authenticated
      if (isAuthenticated && user) {
        const updatedMessages = [...messages, userMsg, { role: 'assistant' as const, content: assistantContent }];
        if (currentSessionId) {
          const title = messages.length <= 1 ? question.slice(0, 50) : undefined;
          await updateSession(currentSessionId, updatedMessages, title);
        } else {
          const newId = await createNewSession(selectedSubject?.id, selectedTopic?.id);
          if (newId) {
            await updateSession(newId, updatedMessages, question.slice(0, 50));
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
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your AI Tutor 🎓\n\nStart a new conversation by asking any question!",
    }]);
    if (isAuthenticated) {
      await createNewSession(selectedSubject?.id, selectedTopic?.id);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    const sessionMessages = loadSession(sessionId);
    if (sessionMessages.length > 0) {
      setMessages(sessionMessages);
    }
  };

  const showSidebar = !isMobile && (showVideo || showHistory);

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
              <p className="text-muted-foreground text-sm">Your personal learning assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showHistory ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowHistory(!showHistory); setShowVideo(false); }}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button
              variant={showVideo ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setShowVideo(!showVideo); setShowHistory(false); }}
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </Button>
          </div>
        </div>

        {/* Subject Selector */}
        <SubjectSelector
          selectedSubject={selectedSubject}
          selectedTopic={selectedTopic}
          onSelectSubject={setSelectedSubject}
          onSelectTopic={setSelectedTopic}
        />

        {/* Main Content */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Chat Area */}
          <Card className={`flex-1 flex flex-col bg-card/50 backdrop-blur-sm border-border overflow-hidden ${showSidebar ? 'lg:w-[70%]' : 'w-full'}`}>
            <CardHeader className="border-b border-border flex-shrink-0 py-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Ask Me Anything
                {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className="group">
                      <ChatMessage
                        role={message.role}
                        content={message.content}
                        onSpeak={speak}
                        onStop={stopSpeaking}
                        isSpeaking={isSpeaking}
                        speakingSupported={ttsSupported}
                      />
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted/80 backdrop-blur-sm p-4 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Topics */}
              {messages.length < 3 && (
                <div className="p-4 border-t border-border flex-shrink-0">
                  <QuickTopicButtons
                    onSelectQuestion={setQuestion}
                    subjectName={selectedSubject?.name}
                    topicName={selectedTopic?.name}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-border flex-shrink-0 bg-background/50">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder={isRecording ? "Listening... Speak now!" : "Type your question here..."}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className={`resize-none bg-background pr-12 ${isRecording ? 'border-destructive animate-pulse' : ''}`}
                      rows={2}
                      disabled={isLoading}
                    />
                    <div className="absolute right-2 bottom-2">
                      <VoiceRecordButton
                        isRecording={isRecording}
                        isSupported={voiceSupported}
                        onStart={startRecording}
                        onStop={stopRecording}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSend} 
                    disabled={!question.trim() || isLoading}
                    className="h-[68px] px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          {showSidebar && (
            <div className="w-[30%] min-w-[280px] max-w-[400px] hidden lg:block">
              {showVideo && <VideoPlayer onClose={() => setShowVideo(false)} />}
              {showHistory && (
                <Card className="h-full bg-card/80 backdrop-blur-sm">
                  <ChatHistorySidebar
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={handleLoadSession}
                    onNewChat={handleNewChat}
                    onDeleteSession={deleteSession}
                    isLoading={historyLoading}
                  />
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Mobile Sidebar Toggle */}
        {isMobile && (showVideo || showHistory) && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="absolute right-0 top-0 h-full w-[85%] max-w-[350px] bg-card shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-2"
                onClick={() => { setShowVideo(false); setShowHistory(false); }}
              >
                <PanelRightClose className="h-5 w-5" />
              </Button>
              <div className="pt-12 h-full">
                {showVideo && <VideoPlayer onClose={() => setShowVideo(false)} />}
                {showHistory && (
                  <ChatHistorySidebar
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onSelectSession={(id) => { handleLoadSession(id); setShowHistory(false); }}
                    onNewChat={() => { handleNewChat(); setShowHistory(false); }}
                    onDeleteSession={deleteSession}
                    isLoading={historyLoading}
                  />
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
