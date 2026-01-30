import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Sparkles } from 'lucide-react';

const AITutor = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    {
      role: 'ai',
      content: "Hello! I'm your AI Tutor. Ask me any question about your subjects, and I'll help you understand the concepts better. You can ask about Physics, Chemistry, Biology, Mathematics, or any topic from your syllabus!",
    },
  ]);

  const handleSend = () => {
    if (!question.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    
    // Simulated AI response - in production, this would call your AI backend
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "Great question! To provide accurate answers, please enable Lovable Cloud to connect the AI backend. This will allow me to give you detailed explanations for any topic in your syllabus.",
      }]);
    }, 1000);

    setQuestion('');
  };

  const suggestedQuestions = [
    "Explain Coulomb's Law",
    "What is Ohm's Law?",
    "Describe cell division",
    "Solve integration problems",
  ];

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Tutor</h1>
            <p className="text-muted-foreground">Your personal learning assistant</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask Me Anything
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Questions */}
            {messages.length < 3 && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuestion(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="resize-none bg-background"
                  rows={2}
                />
                <Button onClick={handleSend} disabled={!question.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AITutor;
