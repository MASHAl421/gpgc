import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, ArrowUp, Loader2,
  MessageSquare, Trash2, Search, X,
  Copy, Check, Image as ImageIcon, FileText,
  ThumbsUp, ThumbsDown, Share2, Volume2, VolumeX, RotateCcw,
  PanelLeft, Edit3, ImagePlus, Pencil, Globe, Sparkles, FileUp,
  MoreHorizontal, BookOpen, Calculator, Atom, Code2, Languages, FlaskConical,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

type Message = { role: 'user' | 'assistant'; content: string; imageData?: string; imageName?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

interface MessageActionsProps {
  text: string;
  onRetry: () => void;
  onExport: () => void;
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const MessageActions = ({ text, onRetry, onExport, speak, stop, isSpeaking, isSupported }: MessageActionsProps) => {
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
      } catch (err) { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard (sharing not supported)' });
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) stop();
    else speak(text);
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
    <div className="flex items-center gap-0.5 mt-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-wrap">
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-lg ${liked === true ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`} onClick={handleLike} title="Good response">
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-lg ${liked === false ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-foreground'}`} onClick={handleDislike} title="Bad response">
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
      {isSupported && (
        <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-lg ${isSpeaking ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`} onClick={handleSpeak} title={isSpeaking ? "Stop" : "Read aloud"}>
          {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={handleShare} title="Share">
        <Share2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={onRetry} title="Regenerate">
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary" onClick={onExport} title="Export to PDF">
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export const MeshChat = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string; name: string; type: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState<{ content: string; imageData?: string; imageName?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSemester, setUserSemester] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Typewriter buffer refs
  const targetContentRef = useRef<string>('');
  const displayedLengthRef = useRef<number>(0);
  const typewriterRafRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user, session } = useAuth();
  const isMobile = useIsMobile();
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  const {
    chatSessions, currentSessionId, isLoading: historyLoading,
    fetchChatHistory, createNewSession, updateSession, deleteSession,
    loadSession, setCurrentSessionId
  } = useChatHistory();

  useEffect(() => {
    if (isAuthenticated) fetchChatHistory();
  }, [isAuthenticated, fetchChatHistory]);

  // Fetch user's semester for personalized study suggestions
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('semester')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.semester) setUserSemester(data.semester);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (!shouldAutoScroll) return;
    const el = scrollContainerRef.current;
    if (!el) return;
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
    scrollToBottom(isLoading ? 'auto' : 'smooth');
  }, [messages, shouldAutoScroll, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (!question) {
      ta.style.height = '';
      return;
    }
    ta.style.height = 'auto';
    const maxH = isMobile ? 140 : 200;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
  }, [question, isMobile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload an image (JPG, PNG, GIF, WebP) or PDF file.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload a file smaller than 10MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({ data: reader.result as string, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText ?? question;
    if ((!textToSend.trim() && !attachedFile) || isLoading) return;

    const getValidAccessToken = async (): Promise<string | null> => {
      const { data } = await supabase.auth.getSession();
      let token = data.session?.access_token ?? session?.access_token ?? null;
      const expiresAt = data.session?.expires_at;
      if (token && expiresAt && expiresAt * 1000 - Date.now() < 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token ?? token;
      }
      return token;
    };

    let accessToken = await getValidAccessToken();
    if (!accessToken) {
      toast({ title: 'Session expired', description: 'Please sign out and sign in again, then try Mesh Chat.', variant: 'destructive' });
      return;
    }

    const userMsg: Message = {
      role: 'user',
      content: textToSend || (attachedFile ? `Analyze this ${attachedFile.type.startsWith('image') ? 'image' : 'document'}` : ''),
      imageData: attachedFile?.data,
      imageName: attachedFile?.name,
    };
    setLastUserMessage({ content: userMsg.content, imageData: userMsg.imageData, imageName: userMsg.imageName });
    const questionText = textToSend || attachedFile?.name || 'File analysis';
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuestion('');
    setAttachedFile(null);
    setIsLoading(true);

    let assistantContent = '';
    targetContentRef.current = '';
    displayedLengthRef.current = 0;

    // Typewriter loop — reveals buffered chars smoothly
    const startTypewriter = () => {
      if (typewriterRafRef.current !== null) return;
      const tick = () => {
        const target = targetContentRef.current;
        const displayed = displayedLengthRef.current;
        if (displayed < target.length) {
          // Reveal a small chunk per frame for smooth typing feel
          const remaining = target.length - displayed;
          const step = Math.max(2, Math.min(8, Math.ceil(remaining / 30)));
          const next = Math.min(target.length, displayed + step);
          displayedLengthRef.current = next;
          const visible = target.slice(0, next);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: visible } : m));
            }
            return [...prev, { role: 'assistant', content: visible }];
          });
        }
        typewriterRafRef.current = requestAnimationFrame(tick);
      };
      typewriterRafRef.current = requestAnimationFrame(tick);
    };

    const stopTypewriter = () => {
      if (typewriterRafRef.current !== null) {
        cancelAnimationFrame(typewriterRafRef.current);
        typewriterRafRef.current = null;
      }
    };

    try {
      const doRequest = async (token: string) =>
        fetch(CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: newMessages }),
        });

      let resp = await doRequest(accessToken);

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
      let firstTokenReceived = false;

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
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                setIsLoading(false);
                setIsStreaming(true);
                startTypewriter();
              }
              assistantContent += content;
              targetContentRef.current = assistantContent;
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Drain remaining buffered chars
      await new Promise<void>((resolve) => {
        const drain = () => {
          if (displayedLengthRef.current >= targetContentRef.current.length) {
            resolve();
          } else {
            requestAnimationFrame(drain);
          }
        };
        drain();
      });
      stopTypewriter();
      setIsStreaming(false);

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
      stopTypewriter();
      setIsStreaming(false);
      console.error('Mesh Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRafRef.current !== null) {
        cancelAnimationFrame(typewriterRafRef.current);
      }
    };
  }, []);

  // Strip markdown for clean PDF text (asterisks, hashes, backticks)
  const stripMarkdownArtifacts = (md: string): string => {
    return md
      .replace(/^#{1,6}\s+/gm, '')              // headings #
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')      // bold-italic
      .replace(/\*\*(.+?)\*\*/g, '$1')          // bold
      .replace(/\*(.+?)\*/g, '$1')              // italic
      .replace(/__(.+?)__/g, '$1')              // bold _
      .replace(/_(.+?)_/g, '$1')                // italic _
      .replace(/`([^`]+)`/g, '$1')              // inline code
      .replace(/^>\s?/gm, '')                   // blockquote
      .replace(/^[-*+]\s+/gm, '• ')             // list bullets
      .replace(/^\d+\.\s+/gm, (m) => m);        // keep numbered
  };

  // Export current chat output to PDF (with KaTeX math rendering)
  const handleExportPDF = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant?.content?.trim()) {
      toast({ title: 'Nothing to export', description: 'Send a message first to get a response.' });
      return;
    }

    toast({ title: 'Preparing PDF...', description: 'Rendering math and formatting.' });

    try {
      // Lazy import heavy libs
      const [{ default: html2pdf }, { default: ReactDOMServer }, ReactMod, MarkdownMod, MathMod, KatexMod] = await Promise.all([
        import('html2pdf.js'),
        import('react-dom/server'),
        import('react'),
        import('react-markdown'),
        import('remark-math'),
        import('rehype-katex'),
      ]);

      // Use the raw markdown so KaTeX renders properly; strip cosmetic markdown for plain text fallback if needed
      const html = ReactDOMServer.renderToStaticMarkup(
        ReactMod.createElement(MarkdownMod.default as any, {
          remarkPlugins: [MathMod.default],
          rehypePlugins: [KatexMod.default],
          children: lastAssistant.content,
        })
      );

      const container = document.createElement('div');
      container.className = 'pdf-export';
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #6366f1;padding-bottom:10px;margin-bottom:18px;">
          <div>
            <div style="font-size:18px;font-weight:700;color:#0a0a0a;">Mesh Chat — Export</div>
            <div style="font-size:11px;color:#666;">GPGC Portal · ${new Date().toLocaleString()}</div>
          </div>
          <div style="font-size:10px;color:#888;">Developed By: Mashal Khan</div>
        </div>
        ${html}
      `;
      // Inject KaTeX stylesheet inline so math renders in PDF
      const katexCss = document.createElement('link');
      katexCss.rel = 'stylesheet';
      katexCss.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      container.prepend(katexCss);

      document.body.appendChild(container);
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '794px'; // A4 width

      // Wait for KaTeX CSS
      await new Promise(r => setTimeout(r, 400));

      await (html2pdf() as any)
        .set({
          margin: [12, 12, 14, 12],
          filename: `mesh-chat-${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
      toast({ title: 'PDF downloaded', description: 'Your chat response has been exported.' });
    } catch (err) {
      console.error('PDF export error:', err);
      toast({ title: 'Export failed', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
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
    const lastUser = [...sessionMessages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setLastUserMessage({ content: lastUser.content, imageData: (lastUser as any).imageData, imageName: (lastUser as any).imageName });
    }
    if (isMobile) setSidebarOpen(false);
  };

  const handleRetry = () => {
    if (!lastUserMessage || isLoading) return;
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });
    setQuestion(lastUserMessage.content);
    if (lastUserMessage.imageData && lastUserMessage.imageName) {
      setAttachedFile({
        data: lastUserMessage.imageData,
        name: lastUserMessage.imageName,
        type: lastUserMessage.imageData.startsWith('data:image') ? 'image/png' : 'application/pdf'
      });
    }
  };

  const filteredSessions = chatSessions.filter(s =>
    !searchQuery || (s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Semester-aware quick study suggestions for BS students
  const getQuickActions = () => {
    const sem = userSemester ?? 1;
    if (sem === 1) {
      return [
        { icon: Atom, label: 'Electrostatics', prompt: 'Explain Coulomb\'s law and electric field intensity with examples for BS Semester 1 Applied Physics.' },
        { icon: Code2, label: 'C++ loops', prompt: 'Explain for, while and do-while loops in C++ with simple BS-level examples.' },
        { icon: Calculator, label: 'Calculus limits', prompt: 'Explain limits and continuity in Calculus with step-by-step solved examples for BS Semester 1.' },
        { icon: Languages, label: 'Parts of speech', prompt: 'Explain all 8 parts of speech in Functional English with examples and usage rules.' },
      ];
    }
    if (sem === 2) {
      return [
        { icon: Atom, label: 'Heat & thermodynamics', prompt: 'Explain laws of thermodynamics and heat transfer for BS Semester 2 Physics.' },
        { icon: Code2, label: 'OOP in C++', prompt: 'Explain classes, objects, inheritance and polymorphism in C++ with code examples.' },
        { icon: Calculator, label: 'Differentiation rules', prompt: 'Explain product, quotient and chain rule in calculus with solved examples.' },
        { icon: FlaskConical, label: 'Chemical bonding', prompt: 'Explain ionic, covalent and metallic bonds with examples for BS Chemistry.' },
      ];
    }
    if (sem === 3) {
      return [
        { icon: Atom, label: 'Wave mechanics', prompt: 'Explain wave-particle duality, de Broglie wavelength and Schrodinger equation basics.' },
        { icon: Code2, label: 'Data structures', prompt: 'Explain arrays, linked lists and stacks with C++ implementations for BS Semester 3.' },
        { icon: Calculator, label: 'Integration techniques', prompt: 'Explain integration by parts and substitution with step-by-step solved examples.' },
        { icon: BookOpen, label: 'Past paper help', prompt: 'Help me prepare for my upcoming midterm — give me the most important topics to revise.' },
      ];
    }
    if (sem === 4) {
      return [
        { icon: Atom, label: 'Modern physics', prompt: 'Explain relativity, photoelectric effect and atomic models for BS Semester 4 Physics.' },
        { icon: Code2, label: 'Algorithms', prompt: 'Explain sorting algorithms (bubble, merge, quick) with complexity analysis and C++ code.' },
        { icon: Calculator, label: 'Linear algebra', prompt: 'Explain matrices, determinants and eigenvalues with solved examples.' },
        { icon: BookOpen, label: 'Research project tips', prompt: 'How should I structure a BS research report? Give me a clear outline and best practices.' },
      ];
    }
    if (sem && sem >= 5) {
      return [
        { icon: BookOpen, label: 'FYP planning', prompt: 'Help me plan my Final Year Project — how do I pick a topic, write a proposal and manage timeline?' },
        { icon: Code2, label: 'Advanced coding', prompt: 'Explain advanced topics like OOP design patterns, databases and APIs for senior BS students.' },
        { icon: Calculator, label: 'Numerical methods', prompt: 'Explain numerical methods (Newton-Raphson, Simpson\'s rule) with solved examples.' },
        { icon: Sparkles, label: 'Career guidance', prompt: 'I\'m in final year BS — what career paths and skills should I focus on for jobs in Pakistan?' },
      ];
    }
    // Fallback (no semester selected)
    return [
      { icon: BookOpen, label: 'Explain a concept', prompt: 'Explain the concept of ' },
      { icon: Pencil, label: 'Write or edit', prompt: 'Help me write ' },
      { icon: Calculator, label: 'Solve a problem', prompt: 'Solve this problem step by step: ' },
      { icon: Sparkles, label: 'Study tips', prompt: 'Give me effective study tips for ' },
    ];
  };
  const quickActions = getQuickActions();

  /* ---------- Sidebar content (shared between desktop + mobile drawer) ---------- */
  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-3 flex items-center gap-2 flex-shrink-0">
        {/* Close button — only on mobile drawer (desktop uses the header toggle) */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted"
            onClick={onClose}
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          className="flex-1 justify-start gap-2 h-9 rounded-full hover:bg-muted font-medium"
          onClick={handleNewChat}
        >
          <Edit3 className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 flex-shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your chats</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2 scrollbar-thin">
          {historyLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery ? 'No matches' : 'No chats yet'}
            </div>
          ) : (
            filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === s.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => handleLoadSession(s.id)}
              >
                <span className="flex-1 text-sm truncate">{s.title || 'New Chat'}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-background"
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {user && (
        <div className="p-2 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-semibold flex-shrink-0">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email?.split('@')[0] || 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate">Free plan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-border transition-all duration-300 overflow-hidden`}>
          <div className="w-64 h-full">
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header — professional branded bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-muted"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2">
              <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">Mesh Chat</span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">AI Study Assistant · Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              className="h-9 px-3 rounded-full hover:bg-muted gap-1.5 text-xs sm:text-sm font-medium"
              onClick={handleNewChat}
              title="New chat"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-muted"
                  title="More"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleNewChat}>
                  <Edit3 className="h-4 w-4 mr-2" /> New chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSidebarOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Show history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scroll area */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-3 pb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[45vh] text-center px-2 animate-in fade-in duration-500">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
                <h1 className="text-xl sm:text-3xl font-semibold mb-1.5 tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  Welcome to Mesh Chat
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-md">
                  Ask anything from your syllabus — Mesh Chat understands text, images, and PDFs.
                </p>
              </div>
            ) : (
              <div className="space-y-5 sm:space-y-7 pt-2">
                {messages.map((message, index) => (
                  <div key={index} className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={message.role === 'user' ? 'max-w-[88%] sm:max-w-[80%]' : 'w-full sm:max-w-[90%]'}>
                      {message.role === 'user' ? (
                        <div className="flex flex-col items-end gap-2">
                          {/* Image — bare, transparent, no bubble/shadow */}
                          {message.imageData?.startsWith('data:image') && (
                            <img
                              src={message.imageData}
                              alt={message.imageName || 'Uploaded'}
                              className="max-w-[260px] sm:max-w-[320px] max-h-64 sm:max-h-80 rounded-2xl object-contain"
                            />
                          )}
                          {/* PDF chip — transparent border-only style */}
                          {message.imageData && !message.imageData.startsWith('data:image') && message.imageName && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-border/60 bg-transparent">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-xs sm:text-sm truncate max-w-[200px]">{message.imageName}</span>
                            </div>
                          )}
                          {/* Text message — only render bubble if there's actual user text */}
                          {message.content && message.content.trim() && message.content !== `Analyze this image` && message.content !== `Analyze this document` && (
                            <div className="bg-muted text-foreground px-4 py-2.5 sm:py-3 rounded-3xl rounded-br-lg text-[15px] sm:text-base max-w-full">
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative group">
                          <div className={`prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-pre:my-2 prose-p:my-2.5 prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-li:my-1 prose-ul:my-2 prose-ol:my-2 leading-relaxed ${isStreaming && index === messages.length - 1 ? 'stream-caret' : ''}`}>
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
                                      customStyle={{ borderRadius: '14px', fontSize: '0.85em', margin: '0.75em 0' }}
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className="bg-muted px-1.5 py-0.5 rounded-md text-[0.85em] font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {!(isStreaming && index === messages.length - 1) && (
                            <MessageActions
                              text={message.content}
                              onRetry={handleRetry}
                              onExport={handleExportPDF}
                              speak={speak}
                              stop={stop}
                              isSpeaking={isSpeaking}
                              isSupported={isSupported}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      <div className="relative flex h-5 w-5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/30 animate-ping" />
                        <Sparkles className="relative h-4 w-4 text-primary" />
                      </div>
                      <span className="thinking-shimmer text-sm">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Input Area — ChatGPT-style pill */}
        <div className="px-3 sm:px-6 pb-2 sm:pb-3 pt-0 safe-area-bottom flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Quick action chips — only show on empty state */}
            {messages.length === 0 && !attachedFile && (
              <div className="flex flex-wrap gap-1.5 justify-center mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {quickActions.slice(0, isMobile ? 3 : 4).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(action.prompt);
                      textareaRef.current?.focus();
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/60 hover:bg-muted active:scale-95 transition-all text-xs sm:text-sm border border-border/50"
                  >
                    <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Attached file preview — transparent, clean */}
            {attachedFile && (
              <div className="mb-2 inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="relative">
                  {attachedFile.type.startsWith('image') ? (
                    <img
                      src={attachedFile.data}
                      alt="Preview"
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl border border-border/60"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border border-border/60 flex flex-col items-center justify-center bg-transparent">
                      <FileText className="h-5 w-5 text-primary mb-1" />
                      <span className="text-[9px] font-semibold text-muted-foreground">PDF</span>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-sm border border-border bg-background hover:bg-muted"
                    onClick={() => setAttachedFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[260px]">{attachedFile.name}</span>
              </div>
            )}

            {/* Input pill — always white box with dark text for clear visibility */}
            <div className="relative flex items-end gap-1.5 sm:gap-2 bg-white text-neutral-900 rounded-[28px] border border-neutral-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all p-1.5 sm:p-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attach button (Plus icon like ChatGPT) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 flex-shrink-0"
                    title="Add"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-52 mb-2">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="h-4 w-4 mr-2" />
                    Upload PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Textarea
                ref={textareaRef}
                placeholder={attachedFile ? "Add a message..." : "Ask anything"}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ height: question ? undefined : (isMobile ? '36px' : '40px') }}
                className="flex-1 !min-h-[36px] sm:!min-h-[40px] max-h-[140px] sm:max-h-[200px] resize-none border-0 bg-transparent text-neutral-900 focus-visible:ring-0 focus-visible:ring-offset-0 py-2 sm:py-2.5 px-1 text-[15px] sm:text-base leading-relaxed overflow-y-auto scrollbar-thin placeholder:text-neutral-400"
                rows={1}
                disabled={isLoading}
              />

              {/* Send button */}
              <Button
                size="icon"
                className="h-9 w-9 rounded-full flex-shrink-0 bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted-foreground/40 disabled:text-background transition-all"
                onClick={() => handleSend()}
                disabled={isLoading || (!question.trim() && !attachedFile)}
                title="Send"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                )}
              </Button>
            </div>

            <p className="text-[10px] sm:text-[11px] text-center text-muted-foreground mt-1.5">
              Mesh Chat can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
