import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Download, FileSpreadsheet } from 'lucide-react';

// Required columns (case-insensitive). `difficulty` and `explanation` optional.
const REQUIRED = ['subject', 'unit', 'topic', 'quiz_title', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'];

interface Row {
  subject: string;
  unit: string;
  topic: string;
  quiz_title: string;
  difficulty?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
}

/** Simple CSV parser that handles quoted fields and embedded newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); cur = '';
        if (row.some(v => v.trim() !== '')) rows.push(row);
        row = [];
      } else { cur += c; }
    }
  }
  if (cur !== '' || row.length) { row.push(cur); if (row.some(v => v.trim() !== '')) rows.push(row); }
  return rows;
}

function rowsToObjects(rows: string[][]): Row[] {
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const missing = REQUIRED.filter(r => !header.includes(r));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);
  return rows.slice(1).map((r) => {
    const o: any = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o as Row;
  });
}

const TEMPLATE = `subject,unit,topic,quiz_title,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation
Physics,Mechanics,Newton's Laws,Newton's Laws Quiz,easy,"What is the SI unit of force?",Newton,Joule,Watt,Pascal,A,"Force is measured in Newtons (N)."
Physics,Mechanics,Newton's Laws,Newton's Laws Quiz,medium,"F = ma is which law?",First,Second,Third,None,B,"Second law of motion."
`;

export const BulkQuizUpload = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [log, setLog] = useState<string[]>([]);

  const append = (m: string) => setLog(l => [...l.slice(-50), m]);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'quiz-bank-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const process = async (file: File) => {
    setRunning(true);
    setLog([]);
    setProgress({ done: 0, total: 0, errors: 0 });
    try {
      const text = await file.text();
      let data: Row[] = [];
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
        data = parsed as Row[];
      } else {
        data = rowsToObjects(parseCSV(text));
      }
      if (!data.length) throw new Error('No rows found');

      // Validate
      const valid: Row[] = [];
      data.forEach((r, idx) => {
        for (const k of REQUIRED) if (!(r as any)[k]) { append(`Row ${idx + 2}: missing ${k}`); return; }
        if (!['A', 'B', 'C', 'D'].includes(r.correct_option.toUpperCase())) {
          append(`Row ${idx + 2}: correct_option must be A/B/C/D`); return;
        }
        valid.push({ ...r, correct_option: r.correct_option.toUpperCase() });
      });
      setProgress(p => ({ ...p, total: valid.length, errors: data.length - valid.length }));
      append(`Parsed ${data.length} rows, ${valid.length} valid`);

      // Cache existing hierarchy
      const [{ data: subjs }, { data: unitsAll }, { data: topicsAll }, { data: quizzesAll }] = await Promise.all([
        supabase.from('subjects').select('id, name'),
        supabase.from('units').select('id, name, subject_id'),
        supabase.from('topics').select('id, name, unit_id'),
        supabase.from('quizzes').select('id, title, topic_id'),
      ]);
      const subjMap = new Map((subjs || []).map(s => [s.name.toLowerCase(), s.id]));
      const unitMap = new Map((unitsAll || []).map(u => [`${u.subject_id}::${u.name.toLowerCase()}`, u.id]));
      const topicMap = new Map((topicsAll || []).map(t => [`${t.unit_id}::${t.name.toLowerCase()}`, t.id]));
      const quizMap = new Map((quizzesAll || []).map(q => [`${q.topic_id}::${q.title.toLowerCase()}`, q.id]));

      const ensureSubject = async (name: string) => {
        const key = name.toLowerCase();
        let id = subjMap.get(key);
        if (id) return id;
        const { data, error } = await supabase.from('subjects').insert({ name, grade: 'BS Level' }).select('id').single();
        if (error) throw error;
        subjMap.set(key, data.id); return data.id;
      };
      const ensureUnit = async (subjectId: string, name: string) => {
        const key = `${subjectId}::${name.toLowerCase()}`;
        let id = unitMap.get(key);
        if (id) return id;
        const { data, error } = await supabase.from('units').insert({ subject_id: subjectId, name }).select('id').single();
        if (error) throw error;
        unitMap.set(key, data.id); return data.id;
      };
      const ensureTopic = async (unitId: string, name: string) => {
        const key = `${unitId}::${name.toLowerCase()}`;
        let id = topicMap.get(key);
        if (id) return id;
        const { data, error } = await supabase.from('topics').insert({ unit_id: unitId, name }).select('id').single();
        if (error) throw error;
        topicMap.set(key, data.id); return data.id;
      };
      const ensureQuiz = async (topicId: string, title: string, difficulty?: string) => {
        const key = `${topicId}::${title.toLowerCase()}`;
        let id = quizMap.get(key);
        if (id) return id;
        const { data, error } = await supabase.from('quizzes').insert({ topic_id: topicId, title, difficulty: difficulty || null }).select('id').single();
        if (error) throw error;
        quizMap.set(key, data.id); return data.id;
      };

      // Group by quiz to minimize ensure* calls
      const buckets = new Map<string, { quiz_id: string; rows: Row[] }>();
      let done = 0, errors = progress.errors;
      for (const r of valid) {
        try {
          const sId = await ensureSubject(r.subject);
          const uId = await ensureUnit(sId, r.unit);
          const tId = await ensureTopic(uId, r.topic);
          const qId = await ensureQuiz(tId, r.quiz_title, r.difficulty);
          if (!buckets.has(qId)) buckets.set(qId, { quiz_id: qId, rows: [] });
          buckets.get(qId)!.rows.push(r);
        } catch (e: any) {
          errors++; append(`Hierarchy error: ${e.message}`);
        }
      }
      append(`Inserting questions across ${buckets.size} quizzes...`);

      const BATCH = 200;
      for (const { quiz_id, rows } of buckets.values()) {
        for (let i = 0; i < rows.length; i += BATCH) {
          const slice = rows.slice(i, i + BATCH);
          const payload = slice.map((r, j) => ({
            quiz_id,
            question_text: r.question_text,
            option_a: r.option_a,
            option_b: r.option_b,
            option_c: r.option_c,
            option_d: r.option_d,
            correct_option: r.correct_option,
            explanation: r.explanation || null,
            difficulty: r.difficulty || null,
            order_index: i + j,
          }));
          const { error } = await supabase.from('questions').insert(payload);
          if (error) { errors += slice.length; append(`Insert error: ${error.message}`); }
          else { done += slice.length; }
          setProgress({ done, total: valid.length, errors });
        }
      }
      append(`Done. Inserted ${done}, errors ${errors}.`);
      toast({ title: 'Upload complete', description: `${done} questions added, ${errors} errors.` });
    } catch (e: any) {
      append(`Fatal: ${e.message}`);
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setRunning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" /> Bulk Quiz Upload
        </CardTitle>
        <CardDescription>
          Upload thousands of MCQs at once via CSV or JSON. Missing subjects, units, topics, and quizzes are created automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Download CSV template
          </Button>
          <Button onClick={() => fileRef.current?.click()} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {running ? 'Uploading...' : 'Upload CSV / JSON'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) process(f);
            }}
          />
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>Required columns:</strong> subject, unit, topic, quiz_title, question_text, option_a, option_b, option_c, option_d, correct_option</div>
          <div><strong>Optional:</strong> difficulty (easy/medium/hard), explanation</div>
          <div><strong>correct_option</strong> must be A, B, C, or D.</div>
        </div>

        {progress.total > 0 && (
          <div className="space-y-2">
            <Label>Progress: {progress.done} / {progress.total} {progress.errors > 0 && `(${progress.errors} errors)`}</Label>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (progress.done / progress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-muted/50 rounded-md p-3 max-h-48 overflow-auto text-xs font-mono space-y-0.5">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
