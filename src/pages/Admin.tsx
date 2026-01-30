import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  BookOpen,
  Layers,
  FileText,
  ClipboardList,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

const Admin = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Subject Form
  const [subjectName, setSubjectName] = useState('');
  const [subjectGrade, setSubjectGrade] = useState('BS Level');
  const [subjectDescription, setSubjectDescription] = useState('');

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

  const handleAddSubject = async () => {
    if (!subjectName.trim()) {
      toast({ title: "Error", description: "Please enter subject name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        name: subjectName,
        grade: subjectGrade,
        description: subjectDescription,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Subject added successfully!" });
      setSubjectName('');
      setSubjectDescription('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddUnit = async () => {
    if (!unitName.trim() || !unitSubjectId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('units').insert({
        subject_id: unitSubjectId,
        name: unitName,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Unit added successfully!" });
      setUnitName('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddTopic = async () => {
    if (!topicName.trim() || !topicUnitId) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('topics').insert({
        unit_id: topicUnitId,
        name: topicName,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Topic added successfully!" });
      setTopicName('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !optionA || !optionB || !optionC || !optionD || !correctOption || !questionTopicId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // First create or get quiz for this topic
      let { data: quiz, error: quizError } = await supabase
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
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        explanation: explanation,
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
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      const { error } = await supabase.from('key_notes').insert({
        topic_id: noteTopicId,
        title: noteTitle,
        content: noteContent,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Key note added successfully!" });
      setNoteTitle('');
      setNoteContent('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

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

        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
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
                      placeholder="e.g., Physics"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade/Level</Label>
                    <Input
                      placeholder="e.g., BS Level"
                      value={subjectGrade}
                      onChange={(e) => setSubjectGrade(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Subject description..."
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddSubject} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
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
                  <Label>Subject ID (copy from database)</Label>
                  <Input
                    placeholder="Subject UUID"
                    value={unitSubjectId}
                    onChange={(e) => setUnitSubjectId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Name</Label>
                  <Input
                    placeholder="e.g., Unit 1: Electrostatics"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddUnit} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
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
                <div className="space-y-2">
                  <Label>Unit ID (copy from database)</Label>
                  <Input
                    placeholder="Unit UUID"
                    value={topicUnitId}
                    onChange={(e) => setTopicUnitId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topic Name</Label>
                  <Input
                    placeholder="e.g., Coulomb's Law"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddTopic} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
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
                  <Label>Topic ID (copy from database)</Label>
                  <Input
                    placeholder="Topic UUID"
                    value={questionTopicId}
                    onChange={(e) => setQuestionTopicId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
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
                  />
                </div>
                <Button onClick={handleAddQuestion} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Add Key Note</CardTitle>
                <CardDescription>Add study notes for a topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic ID (copy from database)</Label>
                  <Input
                    placeholder="Topic UUID"
                    value={noteTopicId}
                    onChange={(e) => setNoteTopicId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note Title</Label>
                  <Input
                    placeholder="e.g., Introduction to Electrostatics"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Write your key notes here... (Markdown supported)"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button onClick={handleAddKeyNote} disabled={isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
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
              <li><strong>Step 1:</strong> Add a Subject (e.g., Physics, Chemistry)</li>
              <li><strong>Step 2:</strong> Copy the Subject ID from the database and add Units</li>
              <li><strong>Step 3:</strong> Copy the Unit ID and add Topics</li>
              <li><strong>Step 4:</strong> Copy the Topic ID and add Questions/Key Notes</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              💡 Tip: You can view all IDs in the Cloud database viewer by clicking "View Backend" below.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Admin;
