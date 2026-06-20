import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Square, Loader2, Sparkles, Save, Trash2, Download, Copy, Check,
  NotebookPen, FileText, Plus, Edit3, X, Wand2, Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type SavedNote = {
  id: string;
  title: string;
  transcript: string;
  notes: string;
  createdAt: number;
  durationSec: number;
};

const STORAGE_KEY = 'gpgc_vt_notes_v1';
const VOICE_NOTES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-notes`;

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

export const VTNotes = () => {
  const { toast } = useToast();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // recording state
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // working draft
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mimeRef = useRef<string>('audio/webm');

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

  const startRecording = async () => {
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

      // visualizer
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
        const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
        cleanupAudio();
        setIsRecording(false);
        if (blob.size < 1024) {
          toast({ variant: 'destructive', title: 'Recording too short', description: 'Please record at least a few seconds of audio.' });
          return;
        }
        await transcribeBlob(blob, mime, duration);
      };
      mediaRecorderRef.current = rec;
      rec.start(250);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Microphone blocked', description: e?.message || 'Please allow microphone access.' });
      cleanupAudio();
    }
  };

  const stopRecording = () => {
    try { mediaRecorderRef.current?.stop(); } catch {}
  };

  const transcribeBlob = async (blob: Blob, mimeType: string, durationSec: number) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: 'destructive', title: 'Sign in required' });
        return;
      }
      const b64 = await blobToBase64(blob);
      const mimeForApi = mimeType.split(';')[0]; // strip codecs param
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
      setTranscript(tx);
      setNotes('');
      setEditingNotes(false);
      setActiveId(null);
      if (!title) setTitle(`Note · ${new Date().toLocaleString()}`);
      // auto-enhance
      await enhance(tx, durationSec);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Transcription failed', description: e?.message || 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const enhance = async (rawTranscript?: string, _duration?: number) => {
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
        body: JSON.stringify({ action: 'enhance', transcript: tx }),
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
    if (activeId) {
      next = savedNotes.map(n => n.id === activeId ? { ...n, title: finalTitle, transcript, notes } : n);
    } else {
      const newNote: SavedNote = {
        id: crypto.randomUUID(),
        title: finalTitle,
        transcript,
        notes,
        createdAt: Date.now(),
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
    setEditingNotes(false);
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
    setEditingNotes(false);
  };

  const copyNotes = async () => {
    const text = notes || transcript;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadMd = () => {
    const text = notes || transcript;
    if (!text) return;
    const safeTitle = (title || 'voice-notes').replace(/[^a-z0-9-_ ]/gi, '').slice(0, 60) || 'voice-notes';
    const blob = new Blob([`# ${title || 'Voice Notes'}\n\n${text}\n`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${safeTitle}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Sidebar: saved notes */}
      <aside className="lg:w-72 lg:border-r border-border bg-muted/30 flex flex-col flex-shrink-0 max-h-48 lg:max-h-none overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Saved Notes</h3>
            <Badge variant="secondary" className="text-[10px] h-5">{savedNotes.length}</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={startNew} className="h-7 w-7 p-0" title="New">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {savedNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-2">No saved notes yet. Record your first one.</p>
          ) : savedNotes.map(n => (
            <button
              key={n.id}
              onClick={() => loadSaved(n)}
              className={`w-full text-left rounded-lg px-2.5 py-2 group transition-colors border ${activeId === n.id ? 'bg-primary/10 border-primary/30' : 'bg-background/60 hover:bg-accent border-transparent'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(n.createdAt).toLocaleDateString()} · {fmtTime(n.durationSec)}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); deleteSaved(n.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-destructive cursor-pointer"
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
              <p className="text-xs text-muted-foreground">Record lectures, get clean AI-structured notes instantly.</p>
            </div>
          </div>

          {/* Recorder */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-4">
              {/* Pulse visualizer */}
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full bg-primary/20 transition-transform duration-150 ${isRecording ? '' : 'opacity-0'}`}
                  style={{ transform: `scale(${1 + audioLevel * 0.6})` }}
                />
                <div
                  className={`absolute inset-2 rounded-full bg-primary/30 transition-transform duration-150 ${isRecording ? '' : 'opacity-0'}`}
                  style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
                />
                <Button
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`relative h-16 w-16 rounded-full p-0 shadow-lg ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
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
                  {isProcessing ? 'Transcribing audio...' : isRecording ? 'Recording — tap to stop' : 'Tap the mic to start recording'}
                </p>
              </div>
            </div>
          </Card>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Physics — Newton's Laws Lecture"
            />
          </div>

          {/* Transcript */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Raw Transcript</h3>
              </div>
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Professional Notes</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(v => !v)} className="h-8 w-8 p-0" title={editingNotes ? 'Preview' : 'Edit'}>
                    {editingNotes ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={copyNotes} className="h-8 w-8 p-0" title="Copy">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={downloadMd} className="h-8 w-8 p-0" title="Download .md">
                    <Download className="h-4 w-4" />
                  </Button>
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
            <div className="flex flex-wrap gap-2 sticky bottom-2 bg-background/80 backdrop-blur rounded-xl border border-border p-2 shadow-sm">
              <Button onClick={saveCurrent} className="gap-1.5 flex-1 sm:flex-none">
                <Save className="h-4 w-4" />
                {activeId ? 'Update Note' : 'Save Note'}
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

export default VTNotes;
