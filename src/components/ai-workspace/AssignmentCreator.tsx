import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileEdit, Sparkles, Loader2, Download, Copy, Check, RefreshCw,
  ArrowLeft, FileText, Settings2, GraduationCap, BookOpen, User as UserIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { subjects as allSubjects } from '@/data/subjects';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'katex/dist/katex.min.css';

type AssignmentType =
  | 'Assignment' | 'Report' | 'Essay' | 'Term Paper'
  | 'Case Study' | 'Research Article' | 'Presentation Outline' | 'Lab Report';

type LengthOpt = 'short' | 'medium' | 'long';
type LangOpt = 'english' | 'roman-urdu' | 'urdu';

interface FormState {
  studentName: string;
  rollNumber: string;
  teacherName: string;
  semester: string;
  subject: string;
  customSubject: string;
  topic: string;
  assignmentType: AssignmentType;
  length: LengthOpt;
  language: LangOpt;
  dueDate: string;
  pakistaniContext: boolean;
  includeDiagrams: boolean;
  includeFormulas: boolean;
  includeReferences: boolean;
  includeTOC: boolean;
}

const STORAGE_FORM = 'gpgc_assignment_form_v1';
const STORAGE_HISTORY = 'gpgc_assignment_history_v1';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-assignment`;

const subjectOptions = Array.from(new Set(allSubjects.map(s => s.name)));

export const AssignmentCreator = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FORM);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      studentName: '',
      rollNumber: '',
      teacherName: '',
      semester: '1',
      subject: subjectOptions[0] || 'Physics',
      customSubject: '',
      topic: '',
      assignmentType: 'Assignment',
      length: 'medium',
      language: 'english',
      dueDate: '',
      pakistaniContext: true,
      includeDiagrams: false,
      includeFormulas: true,
      includeReferences: true,
      includeTOC: false,
    };
  });

  useEffect(() => {
    if (profile && !form.studentName) {
      setForm(f => ({ ...f, studentName: profile.username || '' }));
    }
  }, [profile]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_FORM, JSON.stringify(form)); } catch {}
  }, [form]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const finalSubject = form.subject === '__custom' ? form.customSubject.trim() : form.subject;

  const canGenerate = !!finalSubject && !!form.topic.trim() && !loading;

  const generate = async () => {
    if (!canGenerate) {
      toast({ title: 'Missing info', description: 'Please fill in subject and topic.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setContent('');
    setStep('preview');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in again.');

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(FN_URL, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          studentName: form.studentName,
          rollNumber: form.rollNumber,
          teacherName: form.teacherName,
          semester: form.semester,
          subject: finalSubject,
          topic: form.topic,
          assignmentType: form.assignmentType,
          length: form.length,
          language: form.language,
          dueDate: form.dueDate,
          pakistaniContext: form.pakistaniContext,
          includeDiagrams: form.includeDiagrams,
          includeFormulas: form.includeFormulas,
          includeReferences: form.includeReferences,
          includeTOC: form.includeTOC,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          const line = buf.slice(0, idx).replace(/\r$/, '');
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (!json || json === '[DONE]') continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed?.choices?.[0]?.delta?.content || '';
            if (delta) {
              acc += delta;
              setContent(acc);
            }
          } catch {}
        }
      }

      // Save to history
      try {
        const hist = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]');
        hist.unshift({
          id: crypto.randomUUID(),
          topic: form.topic,
          subject: finalSubject,
          content: acc,
          createdAt: Date.now(),
        });
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(hist.slice(0, 20)));
      } catch {}
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
        setStep('form');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 10;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fname = `${form.topic.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}_assignment.pdf`;
      pdf.save(fname);
      toast({ title: 'PDF downloaded' });
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const downloadDOCX = () => {
    // Simple HTML doc that Word opens cleanly
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${form.topic}</title>
<style>body{font-family:'Times New Roman',serif;line-height:1.6;padding:40px;max-width:780px;margin:auto;color:#111}
h1{font-size:24pt;text-align:center}h2{font-size:16pt;border-bottom:1px solid #ccc;padding-bottom:4px}
h3{font-size:13pt}code,pre{background:#f4f4f4;padding:2px 6px;border-radius:4px}</style></head>
<body>${markdownToHtml(content)}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.topic.replace(/[^a-z0-9]+/gi, '_').slice(0, 40)}_assignment.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Word document downloaded' });
  };

  function markdownToHtml(md: string): string {
    // very light conversion — headings, bold, lists, paragraphs
    return md
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<)(.+)$/gm, '$1')
      .replace(/^([^<].*)$/m, '<p>$1</p>');
  }

  const wordCountVal = content.trim() ? content.trim().split(/\s+/).length : 0;

  // ============== PREVIEW SCREEN ==============
  if (step === 'preview') {
    return (
      <div className="h-full flex flex-col bg-muted/20">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10 px-4 py-3 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setStep('form')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-sm">{form.topic}</p>
            <p className="text-xs text-muted-foreground truncate">
              {finalSubject} • {form.assignmentType} • {wordCountVal} words
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!content || loading}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadDOCX} disabled={!content || loading}>
              <FileText className="h-3.5 w-3.5 mr-1" /> Word
            </Button>
            <Button size="sm" onClick={downloadPDF} disabled={!content || loading || downloading}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
              PDF
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {loading && !content && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="font-semibold mb-1">Writing your assignment...</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Crafting a human-style {form.assignmentType.toLowerCase()} on "{form.topic}". This may take 30–60 seconds.
                </p>
              </div>
            )}
            <div
              ref={previewRef}
              className="bg-white text-black rounded-xl shadow-lg p-8 md:p-12 prose prose-sm md:prose-base max-w-none prose-headings:text-black prose-strong:text-black prose-p:text-gray-800 prose-li:text-gray-800"
              style={{ fontFamily: '"Times New Roman", Georgia, serif', minHeight: '60vh' }}
            >
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                !loading && <p className="text-muted-foreground">No content yet.</p>
              )}
              {loading && content && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== FORM SCREEN ==============
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <FileEdit className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Unique Assignment Creator
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
            Generate original, human-style assignments written in easy words — tailored for Pakistani BS students.
          </p>
        </div>

        {/* Student Info */}
        <Card className="p-5 md:p-6 mb-4 border-2">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Your Name</Label>
              <Input
                value={form.studentName}
                onChange={(e) => update('studentName', e.target.value)}
                placeholder="e.g. Ahmad Khan"
                maxLength={100}
              />
            </div>
            <div>
              <Label>Roll Number</Label>
              <Input
                value={form.rollNumber}
                onChange={(e) => update('rollNumber', e.target.value)}
                placeholder="e.g. BS-2024-15"
                maxLength={50}
              />
            </div>
            <div>
              <Label>Teacher's Name</Label>
              <Input
                value={form.teacherName}
                onChange={(e) => update('teacherName', e.target.value)}
                placeholder="e.g. Sir Ali / Madam Sara"
                maxLength={100}
              />
            </div>
            <div>
              <Label>Submission Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Subject & Topic */}
        <Card className="p-5 md:p-6 mb-4 border-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Subject & Topic</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Semester</Label>
              <Select value={form.semester} onValueChange={(v) => update('semester', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['1','2','3','4','5','6','7','8'].map(s => (
                    <SelectItem key={s} value={s}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject} onValueChange={(v) => update('subject', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                  <SelectItem value="__custom">Other (type below)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.subject === '__custom' && (
              <div className="md:col-span-2">
                <Label>Custom Subject Name</Label>
                <Input
                  value={form.customSubject}
                  onChange={(e) => update('customSubject', e.target.value)}
                  placeholder="e.g. Pakistan Studies"
                  maxLength={80}
                />
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Assignment Topic <span className="text-destructive">*</span></Label>
              <Textarea
                value={form.topic}
                onChange={(e) => update('topic', e.target.value)}
                placeholder="e.g. Applications of Gauss's Law in Real Life"
                rows={2}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific. A clear topic gives a better assignment.
              </p>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-5 md:p-6 mb-4 border-2">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Writing Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <Label>Type</Label>
              <Select value={form.assignmentType} onValueChange={(v) => update('assignmentType', v as AssignmentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['Assignment','Report','Essay','Term Paper','Case Study','Research Article','Presentation Outline','Lab Report'] as AssignmentType[]).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Length</Label>
              <Select value={form.length} onValueChange={(v) => update('length', v as LengthOpt)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (3–4 pages)</SelectItem>
                  <SelectItem value="medium">Medium (5–7 pages)</SelectItem>
                  <SelectItem value="long">Long (8–12 pages)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => update('language', v as LangOpt)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">Easy English</SelectItem>
                  <SelectItem value="roman-urdu">Roman Urdu</SelectItem>
                  <SelectItem value="urdu">Urdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { k: 'pakistaniContext', label: 'Pakistani Examples', desc: 'Use local examples' },
              { k: 'includeFormulas', label: 'Formulas & Math', desc: 'Equations in LaTeX' },
              { k: 'includeDiagrams', label: 'Diagram Markers', desc: 'Add diagram placeholders' },
              { k: 'includeReferences', label: 'References', desc: 'Add citation list' },
              { k: 'includeTOC', label: 'Table of Contents', desc: 'Add at the start' },
            ].map(({ k, label, desc }) => (
              <label
                key={k}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <Switch
                  checked={(form as any)[k]}
                  onCheckedChange={(v) => update(k as keyof FormState, v as any)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Action */}
        <div className="sticky bottom-4 z-10">
          <Button
            onClick={generate}
            disabled={!canGenerate}
            size="lg"
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:opacity-95"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Generate Assignment</>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Free • Powered by AI • Written like a real human
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCreator;
