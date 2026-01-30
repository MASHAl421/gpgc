import { useState, useRef, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TutorLanding } from '@/components/ai-tutor/TutorLanding';
import { TutorHeader } from '@/components/ai-tutor/TutorHeader';
import { ChatMessage } from '@/components/ai-tutor/ChatMessage';
import { ChatInput } from '@/components/ai-tutor/ChatInput';
import { VideoChat } from '@/components/ai-tutor/VideoChat';
import { SuggestedQuestions } from '@/components/ai-tutor/SuggestedQuestions';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant'; content: string };
type TutorMode = 'text' | 'video';
type ViewState = 'landing' | 'chat';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

const TUTORS: Record<string, { id: string; name: string; title: string; avatar: string; subject: string }> = {
  einstein: { id: 'einstein', name: 'Albert Einstein', title: 'Physics Master', avatar: '🧑‍🔬', subject: 'Physics' },
  khwarizmi: { id: 'khwarizmi', name: 'Al-Khwarizmi', title: 'Math Genius', avatar: '🧮', subject: 'Mathematics' },
  curie: { id: 'curie', name: 'Marie Curie', title: 'Chemistry Expert', avatar: '⚗️', subject: 'Chemistry' },
  darwin: { id: 'darwin', name: 'Charles Darwin', title: 'Biology Professor', avatar: '🧬', subject: 'Biology' },
  shakespeare: { id: 'shakespeare', name: 'Shakespeare', title: 'English Master', avatar: '📜', subject: 'English' },
  turing: { id: 'turing', name: 'Alan Turing', title: 'CS Pioneer', avatar: '💻', subject: 'Programming' },
  allama: { id: 'allama', name: 'Allama Iqbal', title: 'Urdu Poet', avatar: '✨', subject: 'Urdu' },
  custom: { id: 'custom', name: 'AI Tutor', title: 'Your Personal Teacher', avatar: '🤖', subject: 'All Subjects' },
};

const SUGGESTED_QUESTIONS = [
  "Explain Newton's Laws of Motion",
  "What is photosynthesis?",
  "Solve a quadratic equation",
  "Explain loops in programming",
  "What are the parts of speech?",
  "Describe the periodic table",
];

const AITutor = () => {
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('custom');
  const [mode, setMode] = useState<TutorMode>('text');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [videoTranscript, setVideoTranscript] = useState('');
  const [videoAiResponse, setVideoAiResponse] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const selectedTutor = TUTORS[selectedTutorId] || TUTORS.custom;

  // Voice chat hook
  const { 
    isListening, 
    isSpeaking, 
    voiceSupported, 
    toggleListening, 
    speak, 
    stopSpeaking,
    transcript,
    setTranscript
  } = useVoiceChat({
    onTranscript: (text) => {
      if (mode === 'video') {
        setVideoTranscript(text);
      } else {
        setQuestion(prev => prev + ' ' + text);
      }
    },
    onSpeechEnd: () => {
      if (mode === 'video' && videoTranscript) {
        handleVideoMessage(videoTranscript);
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message when entering chat
  useEffect(() => {
    if (viewState === 'chat' && messages.length === 0) {
      const welcomeMessage = `Hello! I'm ${selectedTutor.name}, your ${selectedTutor.title}. I'm here to help you with ${selectedTutor.subject}. Ask me anything!

آپ کی خدمت میں حاضر ہوں! مجھ سے کچھ بھی پوچھیں۔`;
      
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [viewState, selectedTutor]);

  const handleSelectTutor = (tutorId: string, selectedMode: TutorMode) => {
    setSelectedTutorId(tutorId);
    setMode(selectedMode);
    setMessages([]);
    setViewState('chat');
  };

  const handleBack = () => {
    setViewState('landing');
    setMessages([]);
    setVideoTranscript('');
    setVideoAiResponse('');
  };

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const systemPrompt = `You are ${selectedTutor.name}, a legendary ${selectedTutor.title} known for expertise in ${selectedTutor.subject}. 
      
Your teaching style:
- Break down complex concepts simply
- Use real-world examples
- Provide step-by-step explanations
- Use formulas with proper LaTeX notation when needed
- Be encouraging and supportive

Respond in a conversational, engaging manner that reflects your historical personality.`;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages, 
            userMsg 
          ] 
        }),
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

  const handleVideoMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setVideoAiResponse('Thinking...');
    
    try {
      const systemPrompt = `You are ${selectedTutor.name}. Keep responses concise (2-3 sentences) for voice conversation.`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ] 
        }),
      });

      if (!resp.ok) throw new Error('Failed to get response');
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
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
              fullResponse += content;
              setVideoAiResponse(fullResponse);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Speak the response
      if (fullResponse) {
        speak(fullResponse);
      }
    } catch (error) {
      console.error('Video chat error:', error);
      setVideoAiResponse('Sorry, I had trouble understanding. Please try again.');
    }
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  // Landing view
  if (viewState === 'landing') {
    return (
      <MainLayout>
        <TutorLanding onSelectTutor={handleSelectTutor} />
      </MainLayout>
    );
  }

  // Video mode
  if (mode === 'video') {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <TutorHeader
            tutor={selectedTutor}
            mode={mode}
            onModeChange={setMode}
            onBack={handleBack}
          />
          <VideoChat
            tutor={selectedTutor}
            isListening={isListening}
            onToggleMic={toggleListening}
            transcript={videoTranscript}
            aiResponse={videoAiResponse}
            isAISpeaking={isSpeaking}
            onEndCall={handleBack}
          />
        </div>
      </MainLayout>
    );
  }

  // Text chat mode
  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <TutorHeader
          tutor={selectedTutor}
          mode={mode}
          onModeChange={setMode}
          onBack={handleBack}
        />

        {/* Messages area */}
        <ScrollArea className="flex-1 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-4xl mx-auto py-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                tutorAvatar={selectedTutor.avatar}
                tutorName={selectedTutor.name}
                isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                onSpeak={message.role === 'assistant' ? () => handleSpeakMessage(message.content) : undefined}
                isSpeaking={isSpeaking}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested questions */}
        {messages.length < 3 && (
          <SuggestedQuestions
            questions={SUGGESTED_QUESTIONS}
            onSelect={setQuestion}
            disabled={isLoading}
          />
        )}

        {/* Input area */}
        <ChatInput
          value={question}
          onChange={setQuestion}
          onSend={handleSend}
          isLoading={isLoading}
          isListening={isListening}
          onToggleVoice={toggleListening}
          voiceSupported={voiceSupported}
          placeholder={`Ask ${selectedTutor.name} anything...`}
        />
      </div>
    </MainLayout>
  );
};

export default AITutor;
