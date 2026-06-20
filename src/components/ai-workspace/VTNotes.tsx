import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Mic, Square, Loader2, Sparkles, Save, Trash2, Download, Copy, Check,
  NotebookPen, FileText, Plus, Edit3, X, Wand2, Clock, Search,
  FileType2, FileDown, MoreVertical, Hash, Timer, Pause, PlusCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'katex/dist/katex.min.css';

type NoteStyle = 'detailed' | 'concise' | 'flashcards' | 'summary';

type SavedNote = {
  id: string;
  title: string;
  transcript: string;
  notes: string;
  style: NoteStyle;
  createdAt: number;
  updatedAt: number;
  durationSec: number;
};

const STORAGE_KEY = 'gpgc_vt_notes_v2';
const VOICE_NOTES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-notes`;

const STYLE_OPTIONS: { value: NoteStyle; label: string; desc: string }[] = [
  { value: 'detailed', label: 'Detailed Notes', desc: 'Full explanations & examples' },
  { value: 'concise', label: 'Concise Bullets', desc: 'Quick scan, key facts only' },
  { value: 'flashcards', label: 'Q&A Flashcards', desc: 'Study cards for revision' },
  { value: 'summary', label: 'Executive Summary', desc: 'Short paragraph overview' },
];

function pickMime(): string | null {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const result = r.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function wordCount(s: string) {
  return (s.trim().match(/\S+/g) || []).length;
}

function loadNotes(): SavedNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function persist(notes: SavedNote[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

function safeFileName(s: string) {
  return (s || 'voice-notes').replace(/[^a-z0-9-_ ]/gi, '').trim().slice(0, 60) || 'voice-notes';
}

export const VTNotes = () => {
  const { toast } = useToast();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  // recording
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [appendMode, setAppendMode] = useState(false);

  // working draft
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState<NoteStyle>('detailed');
  const [editingNotes, setEditingNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedBaseRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mimeRef = useRef<string>('audio/webm');
  const pdfRenderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setSavedNotes(loadNotes()); }, []);

  const cleanupAudio = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  const startRecording = async (append = false) => {
    const mime = pickMime();
    if (!mime) {
      toast({ variant: 'destructive', title: 'Recording not supported', description: "Your browser doesn't support a compatible audio format." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      mimeRef.current = mime;
      setAppendMode(append);

      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setAudioLevel(Math.min(1, (sum / data.length) / 128));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }

      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const sessionDuration = Math.round((Date.now() - startedAtRef.current) / 1000) + elapsedBaseRef.current;
        cleanupAudio();
        setIsRecording(false);
        setIsPaused(false);
        if (blob.size < 1024) {
          toast({ variant: 'destructive', title: 'Recording too short', description: 'Please record at least a few seconds.' });
          return;
        }
        await transcribeBlob(blob, mime, sessionDuration, append);
      };
      mediaRecorderRef.current = rec;
      rec.start(250);
      startedAtRef.current = Date.now();
      elapsedBaseRef.current = 0;
      setElapsed(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(elapsedBaseRef.current + Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Microphone blocked', description: e?.message || 'Please allow microphone access.' });
      cleanupAudio();
    }
  };

  const pauseRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      elapsedBaseRef.current += Math.round((Date.now() - startedAtRef.current) / 1000);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsPaused(true);
    } else if (rec.state === 'paused') {
      rec.resume();
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(elapsedBaseRef.current + Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
  };

  const transcribeBlob = async (blob: Blob, mimeType: string, durationSec: number, append: boolean) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: 'destructive', title: 'Sign in required' });
        return;
      }
      const b64 = await blobToBase64(blob);
      const mimeForApi = mimeType.split(';')[0];
      const res = await fetch(VOICE_NOTES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'transcribe', audio: b64, mimeType: mimeForApi }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Failed (${res.status})`);
      }
      const { transcript: tx } = await res.json();
      if (!tx) throw new Error('Empty transcript');

      const combined = append && transcript.trim() ? `${transcript.trim()}\n\n${tx}` : tx;
      setTranscript(combined);
      if (!append) {
        setNotes('');
        setEditingNotes(false);
        setActiveId(null);
        if (!title) setTitle(`Note · ${new Date().toLocaleString()}`);
      }
      await enhance(combined, style);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Transcription failed', description: e?.message || 'Please try again.' });
    } finally {
      setIsProcessing(false);
      setAppendMode(false);
    }
  };

  const enhance = async (rawTranscript?: string, useStyle?: NoteStyle) => {
    const tx = (rawTranscript ?? transcript).trim();
    if (!tx) {
      toast({ variant: 'destructive', title: 'Nothing to enhance', description: 'Record or paste a transcript first.' });
      return;
    }
    setIsEnhancing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(VOICE_NOTES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'enhance', transcript: tx, style: useStyle ?? style }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Failed (${res.status})`);
      }
      const { notes: n } = await res.json();
      setNotes(n || '');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Enhancement failed', description: e?.message || 'Please try again.' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const saveCurrent = () => {
    const finalTitle = title.trim() || `Note · ${new Date().toLocaleString()}`;
    if (!transcript.trim() && !notes.trim()) {
      toast({ variant: 'destructive', title: 'Nothing to save' });
      return;
    }
    let next: SavedNote[];
    const now = Date.now();
    if (activeId) {
      next = savedNotes.map(n => n.id === activeId ? { ...n, title: finalTitle, transcript, notes, style, updatedAt: now } : n);
    } else {
      const newNote: SavedNote = {
        id: crypto.randomUUID(),
        title: finalTitle,
        transcript, notes, style,
        createdAt: now, updatedAt: now,
        durationSec: elapsed,
      };
      next = [newNote, ...savedNotes];
      setActiveId(newNote.id);
    }
    setSavedNotes(next);
    persist(next);
    toast({ title: 'Saved', description: 'Your note is stored on this device.' });
  };

  const loadSaved = (n: SavedNote) => {
    setActiveId(n.id);
    setTitle(n.title);
    setTranscript(n.transcript);
    setNotes(n.notes);
    setStyle(n.style || 'detailed');
    setEditingNotes(false);
    setElapsed(n.durationSec);
  };

  const deleteSaved = (id: string) => {
    const next = savedNotes.filter(n => n.id !== id);
    setSavedNotes(next);
    persist(next);
    if (activeId === id) startNew();
  };

  const startNew = () => {
    if (isRecording) stopRecording();
    setActiveId(null);
    setTitle('');
    setTranscript('');
    setNotes('');
    setElapsed(0);
    elapsedBaseRef.current = 0;
    setEditingNotes(false);
    setStyle('detailed');
  };

  const copyText = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Copied to clipboard' });
  };

  const downloadFile = (content: string, ext: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeFileName(title)}.${ext}`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    const text = notes || transcript;
    if (!text) return;
    downloadFile(`# ${title || 'Voice Notes'}\n\n_Generated ${new Date().toLocaleString()}_\n\n${text}\n`, 'md', 'text/markdown');
  };

  const exportTxt = () => {
    const text = notes || transcript;
    if (!text) return;
    const plain = text.replace(/[#*_`>]/g, '').replace(/\n{3,}/g, '\n\n');
    downloadFile(`${title || 'Voice Notes'}\n\n${plain}\n`, 'txt', 'text/plain');
  };

  const exportPdf = async () => {
    const text = notes || transcript;
    if (!text) {
      toast({ variant: 'destructive', title: 'Nothing to export' });
      return;
    }
    setIsExporting(true);
    try {
      const html = await marked.parse(text, { gfm: true, breaks: true });
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '794px'; // A4 width at ~96dpi
      container.style.padding = '56px 60px';
      container.style.background = '#ffffff';
      container.style.color = '#0f172a';
      container.style.fontFamily = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
      container.style.fontSize = '14px';
      container.style.lineHeight = '1.65';
      container.innerHTML = `
        <div style="border-bottom:3px solid #2563eb;padding-bottom:18px;margin-bottom:28px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div>
              <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;color:#2563eb;text-transform:uppercase;">GPGC Portal · Voice Notes</div>
              <h1 style="margin:6px 0 0;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">${escapeHtml(title || 'Voice Notes')}</h1>
            </div>
            <div style="text-align:right;font-size:11px;color:#64748b;line-height:1.5;">
              <div>${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div>${fmtTime(elapsed)} recorded</div>
              <div>${wordCount(text)} words</div>
            </div>
          </div>
        </div>
        <div class="vt-content">${html}</div>
        <div style="margin-top:36px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
          Generated by GPGC Portal · Developed By: Mashal Khan
        </div>
        <style>
          .vt-content h1, .vt-content h2, .vt-content h3 { color:#1e293b; margin:22px 0 10px; font-weight:700; line-height:1.3; }
          .vt-content h1 { font-size:22px; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
          .vt-content h2 { font-size:18px; }
          .vt-content h3 { font-size:16px; color:#2563eb; }
          .vt-content p { margin:8px 0; }
          .vt-content ul, .vt-content ol { margin:8px 0 8px 22px; padding:0; }
          .vt-content li { margin:4px 0; }
          .vt-content strong { color:#0f172a; }
          .vt-content code { background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:12.5px; font-family:'JetBrains Mono', ui-monospace, monospace; }
          .vt-content pre { background:#0f172a; color:#e2e8f0; padding:14px 16px; border-radius:8px; overflow-x:auto; font-size:12px; }
          .vt-content blockquote { border-left:4px solid #2563eb; background:#eff6ff; padding:8px 14px; margin:12px 0; color:#1e3a8a; border-radius:0 6px 6px 0; }
          .vt-content table { border-collapse:collapse; width:100%; margin:12px 0; font-size:13px; }
          .vt-content th, .vt-content td { border:1px solid #cbd5e1; padding:6px 10px; text-align:left; }
          .vt-content th { background:#f1f5f9; }
          .vt-content hr { border:none; border-top:1px solid #e2e8f0; margin:18px 0; }
        </style>
      `;
      document.body.appendChild(container);
      pdfRenderRef.current = container;

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      document.body.removeChild(container);
      pdfRenderRef.current = null;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH, undefined, 'FAST');
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH, undefined, 'FAST');
        heightLeft -= pageH;
      }
      pdf.save(`${safeFileName(title)}.pdf`);
      toast({ title: 'PDF exported', description: 'Saved to your downloads.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'PDF export failed', description: e?.message || 'Please try again.' });
      if (pdfRenderRef.current && pdfRenderRef.current.parentNode) {
        pdfRenderRef.current.parentNode.removeChild(pdfRenderRef.current);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const filteredNotes = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return savedNotes;
    return savedNotes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.transcript.toLowerCase().includes(q) ||
      n.notes.toLowerCase().includes(q)
    );
  }, [savedNotes, searchQ]);

  const stats = useMemo(() => {
    const src = notes || transcript;
    const words = wordCount(src);
    const readMin = Math.max(1, Math.round(words / 200));
    return { words, readMin };
  }, [notes, transcript]);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="lg:w-72 lg:border-r border-border bg-muted/30 flex flex-col flex-shrink-0 max-h-56 lg:max-h-none overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <NotebookPen className="h-4 w-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-sm truncate">Saved Notes</h3>
            <Badge variant="secondary" className="text-[10px] h-5">{savedNotes.length}</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={startNew} className="h-7 w-7 p-0" title="New">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-2 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search notes..."
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-2">
              {searchQ ? 'No matching notes.' : 'No saved notes yet. Record your first one.'}
            </p>
          ) : filteredNotes.map(n => (
            <button
              key={n.id}
              onClick={() => loadSaved(n)}
              className={`w-full text-left rounded-lg px-2.5 py-2 group transition-colors border ${activeId === n.id ? 'bg-primary/10 border-primary/30' : 'bg-background/60 hover:bg-accent border-transparent'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(n.createdAt).toLocaleDateString()}
                    <span>·</span>
                    {fmtTime(n.durationSec)}
                    <span>·</span>
                    <Hash className="h-2.5 w-2.5" />
                    {wordCount(n.notes || n.transcript)}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); deleteSaved(n.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-destructive cursor-pointer flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold leading-tight">Voice Taker Notes</h2>
              <p className="text-xs text-muted-foreground">Record · Transcribe · Structure · Export PDF</p>
            </div>
          </div>

          {/* Recorder */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full bg-primary/20 transition-transform duration-150 ${isRecording && !isPaused ? '' : 'opacity-0'}`}
                  style={{ transform: `scale(${1 + audioLevel * 0.6})` }}
                />
                <div
                  className={`absolute inset-2 rounded-full bg-primary/30 transition-transform duration-150 ${isRecording && !isPaused ? '' : 'opacity-0'}`}
                  style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
                />
                <Button
                  size="lg"
                  onClick={isRecording ? stopRecording : () => startRecording(false)}
                  disabled={isProcessing}
                  className={`relative h-16 w-16 rounded-full p-0 shadow-lg ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  title={isRecording ? 'Stop' : 'Start recording'}
                >
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isRecording ? (
                    <Square className="h-6 w-6 fill-current" />
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </Button>
              </div>

              <div className="text-center">
                <div className="font-mono text-2xl font-semibold tabular-nums">{fmtTime(elapsed)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isProcessing ? 'Transcribing audio…' : isRecording ? (isPaused ? 'Paused' : 'Recording — tap red to stop') : 'Tap the mic to start recording'}
                </p>
              </div>

              {isRecording && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={pauseRecording} className="gap-1.5">
                    {isPaused ? <Mic className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                </div>
              )}

              {!isRecording && !isProcessing && transcript && (
                <Button size="sm" variant="outline" onClick={() => startRecording(true)} className="gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add More Audio
                </Button>
              )}
            </div>
          </Card>

          {/* Title + Style */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Physics — Newton's Laws Lecture"
              />
            </div>
            <div className="sm:w-56">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Note Style</label>
              <Select value={style} onValueChange={(v) => setStyle(v as NoteStyle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex flex-col items-start">
                        <span className="text-sm">{o.label}</span>
                        <span className="text-[10px] text-muted-foreground">{o.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transcript */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Raw Transcript</h3>
                {transcript && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1">
                    <Hash className="h-2.5 w-2.5" />{wordCount(transcript)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {transcript && (
                  <Button size="sm" variant="ghost" onClick={() => copyText(transcript)} className="h-8 px-2 gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Copy</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => enhance()}
                  disabled={isEnhancing || !transcript.trim()}
                  className="h-8 gap-1.5"
                >
                  {isEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {isEnhancing ? 'Enhancing…' : 'Enhance with AI'}
                </Button>
              </div>
            </div>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your transcribed speech will appear here. You can also paste or edit text manually."
              className="min-h-[120px] resize-y text-sm leading-relaxed"
            />
          </Card>

          {/* Notes */}
          {(notes || isEnhancing) && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Professional Notes</h3>
                  {notes && (
                    <>
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Hash className="h-2.5 w-2.5" />{stats.words}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Timer className="h-2.5 w-2.5" />{stats.readMin} min read
                      </Badge>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(v => !v)} className="h-8 w-8 p-0" title={editingNotes ? 'Preview' : 'Edit'}>
                    {editingNotes ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => copyText(notes)} className="h-8 w-8 p-0" title="Copy">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="hidden sm:inline text-xs">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={exportPdf} disabled={isExporting}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Professional PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={exportMarkdown}>
                        <FileType2 className="h-4 w-4 mr-2" />
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportTxt}>
                        <FileText className="h-4 w-4 mr-2" />
                        Plain text (.txt)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isEnhancing && !notes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Structuring your notes…
                </div>
              ) : editingNotes ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[260px] font-mono text-xs leading-relaxed"
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-li:my-0.5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {notes}
                  </ReactMarkdown>
                </div>
              )}
            </Card>
          )}

          {/* Save bar */}
          {(transcript || notes) && (
            <div className="flex flex-wrap gap-2 sticky bottom-2 bg-background/90 backdrop-blur rounded-xl border border-border p-2 shadow-sm">
              <Button onClick={saveCurrent} className="gap-1.5 flex-1 sm:flex-none">
                <Save className="h-4 w-4" />
                {activeId ? 'Update' : 'Save Note'}
              </Button>
              <Button variant="outline" onClick={exportPdf} disabled={isExporting || (!notes && !transcript)} className="gap-1.5">
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                PDF
              </Button>
              <Button variant="outline" onClick={startNew} className="gap-1.5">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default VTNotes;
