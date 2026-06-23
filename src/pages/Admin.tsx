import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  BookOpen,
  Layers,
  FileText,
  ClipboardList,
  Plus,
  Loader2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { BulkQuizUpload } from '@/components/admin/BulkQuizUpload';

interface Subject {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  name: string;
  subject_id: string;
}

interface Topic {
  id: string;
  name: string;
  unit_id: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Data for dropdowns
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Subject Form
  const [subjectName, setSubjectName] = useState('');
  const [subjectGrade, setSubjectGrade] = useState('BS Level');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [subjectSemester, setSubjectSemester] = useState<string>('');

  // Unit Form
  const [unitSubjectId, setUnitSubjectId] = useState('');
  const [unitName, setUnitName] = useState('');

  // Topic Form
  const [topicUnitId, setTopicUnitId] = useState('');
  const [topicName, setTopicName] = useState('');

  // Question Form
  const [questionTopicId, setQuestionTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [explanation, setExplanation] = useState('');

  // Key Note Form
  const [noteTopicId, setNoteTopicId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Fetch all data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, unitsRes, topicsRes] = await Promise.all([
          supabase.from('subjects').select('id, name').order('name'),
          supabase.from('units').select('id, name, subject_id').order('name'),
          supabase.from('topics').select('id, name, unit_id').order('name'),
        ]);

        if (subjectsRes.data) setSubjects(subjectsRes.data);
        if (unitsRes.data) setUnits(unitsRes.data);
        if (topicsRes.data) setTopics(topicsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data after adding new items
  const refreshData = async () => {
    const [subjectsRes, unitsRes, topicsRes] = await Promise.all([
      supabase.from('subjects').select('id, name').order('name'),
      supabase.from('units').select('id, name, subject_id').order('name'),
      supabase.from('topics').select('id, name, unit_id').order('name'),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (unitsRes.data) setUnits(unitsRes.data);
    if (topicsRes.data) setTopics(topicsRes.data);
  };

  // Get filtered units based on selected subject
  const getFilteredUnits = (subjectId: string) => {
    return units.filter(u => u.subject_id === subjectId);
  };

  // Get filtered topics based on selected unit
  const getFilteredTopics = (unitId: string) => {
    return topics.filter(t => t.unit_id === unitId);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) {
      toast({ title: "Error", description: "Please enter subject name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        name: subjectName.trim(),
        grade: subjectGrade.trim(),
        description: subjectDescription.trim() || null,
        semester: subjectSemester ? parseInt(subjectSemester) : null,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Subject added successfully!" });
      setSubjectName('');
      setSubjectDescription('');
      setSubjectSemester('');
      await refreshData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddUnit = async () => {
    if (!unitName.trim() || !unitSubjectId) {
      toast({ title: "Error", description: "Please select a subject and enter unit name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify subject exists
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('id', unitSubjectId)
        .single();

      if (!subject) {
        toast({ title: "Error", description: "Selected subject not found", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from('units').insert({
        subject_id: unitSubjectId,
        name: unitName.trim(),
      });

      if (error) throw error;

      toast({ title: "Success", description: "Unit added successfully!" });
      setUnitName('');
      await refreshData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddTopic = async () => {
    if (!topicName.trim() || !topicUnitId) {
      toast({ title: "Error", description: "Please select a unit and enter topic name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify unit exists
      const { data: unit } = await supabase
        .from('units')
        .select('id')
        .eq('id', topicUnitId)
        .single();

      if (!unit) {
        toast({ title: "Error", description: "Selected unit not found", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from('topics').insert({
        unit_id: topicUnitId,
        name: topicName.trim(),
      });

      if (error) throw error;

      toast({ title: "Success", description: "Topic added successfully!" });
      setTopicName('');
      await refreshData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !correctOption || !questionTopicId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify topic exists
      const { data: topic } = await supabase
        .from('topics')
        .select('id')
        .eq('id', questionTopicId)
        .single();

      if (!topic) {
        toast({ title: "Error", description: "Selected topic not found", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // First create or get quiz for this topic
      let { data: quiz } = await supabase
        .from('quizzes')
        .select('id')
        .eq('topic_id', questionTopicId)
        .single();

      if (!quiz) {
        const { data: newQuiz, error: createError } = await supabase
          .from('quizzes')
          .insert({ topic_id: questionTopicId, title: 'Topic Quiz' })
          .select('id')
          .single();
        
        if (createError) throw createError;
        quiz = newQuiz;
      }

      const { error } = await supabase.from('questions').insert({
        quiz_id: quiz.id,
        question_text: questionText.trim(),
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        option_c: optionC.trim(),
        option_d: optionD.trim(),
        correct_option: correctOption,
        explanation: explanation.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Question added successfully!" });
      setQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectOption('');
      setExplanation('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddKeyNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim() || !noteTopicId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify topic exists
      const { data: topic } = await supabase
        .from('topics')
        .select('id')
        .eq('id', noteTopicId)
        .single();

      if (!topic) {
        toast({ title: "Error", description: "Selected topic not found", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from('key_notes').insert({
        topic_id: noteTopicId,
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });

      if (error) throw error;

      toast({ title: "Success", description: "Key note added successfully!" });
      setNoteTitle('');
      setNoteContent('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: "Error", description: message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Bulk regenerate short/easy key notes via Gemini
  const [regenSemester, setRegenSemester] = useState<'1' | '2' | 'all'>('all');
  const [regenRunning, setRegenRunning] = useState(false);
  const [regenProgress, setRegenProgress] = useState({ done: 0, total: 0, failed: 0 });

  const handleRegenerateAll = async () => {
    if (!confirm('This will replace existing key notes with new short, easy AI-generated notes. Continue?')) return;
    setRegenRunning(true);
    setRegenProgress({ done: 0, total: 0, failed: 0 });
    try {
      // Fetch all topics for selected semester(s)
      let query = supabase
        .from('topics')
        .select('id, units!inner(subjects!inner(semester))');
      if (regenSemester !== 'all') {
        query = query.eq('units.subjects.semester', parseInt(regenSemester));
      }
      const { data: topicRows, error } = await query;
      if (error) throw error;
      const ids = (topicRows ?? []).map((t: any) => t.id);
      setRegenProgress({ done: 0, total: ids.length, failed: 0 });

      const BATCH = 5;
      let done = 0;
      let failed = 0;
      for (let i = 0; i < ids.length; i += BATCH) {
        const batch = ids.slice(i, i + BATCH);
        const { data, error: fnErr } = await supabase.functions.invoke('regenerate-key-notes', {
          body: { topicIds: batch },
        });
        if (fnErr) {
          failed += batch.length;
        } else {
          const results = (data as any)?.results ?? [];
          for (const r of results) {
            if (r.ok) done++;
            else failed++;
          }
        }
        setRegenProgress({ done, total: ids.length, failed });
      }
      toast({
        title: 'Regeneration Complete',
        description: `${done} succeeded, ${failed} failed of ${ids.length} topics.`,
      });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setRegenRunning(false);
    }
  };

  if (loadingData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subjects, topics, quizzes, and content
          </p>
        </div>

        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Key Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk">
            <BulkQuizUpload />
          </TabsContent>

          <TabsContent value="subjects">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add New Subject</CardTitle>
                <CardDescription>Create a new subject for your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject Name</Label>
                    <Input
                      placeholder="e.g., Functional English"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade/Level</Label>
                    <Input
                      placeholder="e.g., BS Level"
                      value={subjectGrade}
                      onChange={(e) => setSubjectGrade(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={subjectSemester} onValueChange={setSubjectSemester}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Subject description..."
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>
                <Button onClick={handleAddSubject} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Subject
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add New Unit</CardTitle>
                <CardDescription>Add a unit to an existing subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Subject</Label>
                  <Select value={unitSubjectId} onValueChange={setUnitSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit Name</Label>
                  <Input
                    placeholder="e.g., Unit 1: Introduction"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    maxLength={150}
                  />
                </div>
                <Button onClick={handleAddUnit} disabled={isLoading || !unitSubjectId}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Unit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add New Topic</CardTitle>
                <CardDescription>Add a topic to an existing unit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Subject</Label>
                    <Select 
                      onValueChange={(value) => {
                        setTopicUnitId(''); // Reset unit when subject changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Unit</Label>
                    <Select value={topicUnitId} onValueChange={setTopicUnitId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Topic Name</Label>
                  <Input
                    placeholder="e.g., Parts of Speech"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    maxLength={150}
                  />
                </div>
                <Button onClick={handleAddTopic} disabled={isLoading || !topicUnitId}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Topic
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add MCQ Question</CardTitle>
                <CardDescription>Add a multiple choice question to a topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Topic</Label>
                  <Select value={questionTopicId} onValueChange={setQuestionTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    maxLength={1000}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select value={correctOption} onValueChange={setCorrectOption}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Explain the correct answer..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    maxLength={1000}
                  />
                </div>
                <Button onClick={handleAddQuestion} disabled={isLoading || !questionTopicId}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI: Regenerate Short Key Notes
                </CardTitle>
                <CardDescription>
                  Replaces existing key notes with short, easy-to-remember AI notes (idea + bullets + memory hook) for every topic. Islamic Studies stays in Urdu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Semester</Label>
                    <Select value={regenSemester} onValueChange={(v) => setRegenSemester(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All (Semester 1 & 2)</SelectItem>
                        <SelectItem value="1">Semester 1 only</SelectItem>
                        <SelectItem value="2">Semester 2 only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRegenerateAll} disabled={regenRunning}>
                    {regenRunning ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {regenRunning ? 'Regenerating...' : 'Regenerate All'}
                  </Button>
                </div>
                {regenProgress.total > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Progress: {regenProgress.done + regenProgress.failed} / {regenProgress.total}
                    {regenProgress.failed > 0 && ` (${regenProgress.failed} failed)`}
                  </div>
                )}
              </CardContent>
            </Card>


            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add Key Note</CardTitle>
                <CardDescription>Add study notes for a topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Topic</Label>
                  <Select value={noteTopicId} onValueChange={setNoteTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Note Title</Label>
                  <Input
                    placeholder="e.g., Introduction to Parts of Speech"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Write your key notes here... (Markdown supported)"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[200px]"
                    maxLength={10000}
                  />
                </div>
                <Button onClick={handleAddKeyNote} disabled={isLoading || !noteTopicId}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Key Note
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-muted/50 border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">📌 How to Add Content</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>First, create <strong>Subjects</strong> (e.g., Functional English, Programming)</li>
              <li>Then add <strong>Units</strong> to each subject</li>
              <li>Add <strong>Topics</strong> to each unit</li>
              <li>Finally, add <strong>Questions</strong> and <strong>Key Notes</strong> to topics</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Admin;
