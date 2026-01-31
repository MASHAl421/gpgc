import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import SemesterOnboarding from '@/components/SemesterOnboarding';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { BookOpen, PlayCircle, FileText, Beaker, ClipboardList, PenTool, Files, TestTube, ChevronRight, GraduationCap, Loader2, ArrowLeft, Code, Atom, Users, Monitor, Download, ExternalLink, Library } from 'lucide-react';
import ObjectivePaperSelector, { QuizConfig } from '@/components/objective/ObjectivePaperSelector';
import ObjectiveQuiz from '@/components/objective/ObjectiveQuiz';
import AcademicResources from '@/components/academic/AcademicResources';

interface KeyNote {
  id: string;
  title: string;
  content: string;
  order_index: number;
}
interface Topic {
  id: string;
  name: string;
  order_index: number;
}
interface Unit {
  id: string;
  name: string;
  order_index: number;
  topics: Topic[];
}
interface Subject {
  id: string;
  name: string;
  grade: string;
  icon: string | null;
  semester: number | null;
  units: Unit[];
}
interface PastPaper {
  id: string;
  title: string;
  file_url: string;
  year: number | null;
  paper_type: string | null;
  subject_id: string;
}
const preparationCategories = [{
  id: 'academic',
  name: 'Academic Resources',
  icon: BookOpen,
  color: 'bg-emerald-500'
}, {
  id: 'video',
  name: 'Video Lectures',
  icon: PlayCircle,
  color: 'bg-sky-500'
}, {
  id: 'keynotes',
  name: 'Key Notes',
  icon: FileText,
  color: 'bg-amber-500'
}, {
  id: 'objective',
  name: 'Objective Paper',
  icon: ClipboardList,
  color: 'bg-violet-500'
}, {
  id: 'subjective',
  name: 'Subjective Paper',
  icon: PenTool,
  color: 'bg-pink-500'
}, {
  id: 'pastpapers',
  name: 'Past & Model Papers',
  icon: Files,
  color: 'bg-rose-500'
}];
const iconMap: Record<string, React.ComponentType<{
  className?: string;
}>> = {
  BookOpen,
  PlayCircle,
  FileText,
  Beaker,
  ClipboardList,
  PenTool,
  Files,
  TestTube,
  Code,
  Atom,
  Users,
  Monitor
};
const Preparation = () => {
  const {
    needsOnboarding,
    profileData,
    isLoading: onboardingLoading,
    completeOnboarding
  } = useSemesterOnboarding();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('keynotes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [keyNotes, setKeyNotes] = useState<Record<string, KeyNote[]>>({});
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
  useEffect(() => {
    if (!onboardingLoading && !needsOnboarding) {
      fetchSubjects();
    }
  }, [onboardingLoading, needsOnboarding, profileData?.semester]);
  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('subjects').select('*').order('name');
      if (profileData?.semester) {
        query = query.eq('semester', profileData.semester);
      }
      const {
        data: subjectsData,
        error: subjectsError
      } = await query;
      if (subjectsError) throw subjectsError;
      const {
        data: unitsData,
        error: unitsError
      } = await supabase.from('units').select('*').order('order_index');
      if (unitsError) throw unitsError;
      const {
        data: topicsData,
        error: topicsError
      } = await supabase.from('topics').select('*').order('order_index');
      if (topicsError) throw topicsError;
      const organizedSubjects: Subject[] = (subjectsData || []).map(subject => {
        const subjectUnits = (unitsData || []).filter(unit => unit.subject_id === subject.id).map(unit => ({
          ...unit,
          topics: (topicsData || []).filter(topic => topic.unit_id === unit.id)
        }));
        return {
          ...subject,
          units: subjectUnits
        };
      });
      setSubjects(organizedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchKeyNotesForTopic = async (topicId: string) => {
    if (keyNotes[topicId]) return;
    setLoadingNotes(prev => ({
      ...prev,
      [topicId]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.from('key_notes').select('*').eq('topic_id', topicId).order('order_index');
      if (error) throw error;
      setKeyNotes(prev => ({
        ...prev,
        [topicId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching key notes:', error);
    } finally {
      setLoadingNotes(prev => ({
        ...prev,
        [topicId]: false
      }));
    }
  };
  const fetchPastPapers = async (subjectId: string) => {
    setLoadingPapers(true);
    try {
      const {
        data,
        error
      } = await supabase.from('past_papers').select('*').eq('subject_id', subjectId).order('year', {
        ascending: false
      });
      if (error) throw error;
      setPastPapers(data || []);
    } catch (error) {
      console.error('Error fetching past papers:', error);
    } finally {
      setLoadingPapers(false);
    }
  };
  const handleTopicToggle = async (topicId: string) => {
    const isSelected = selectedTopics.includes(topicId);
    if (!isSelected) {
      setSelectedTopics(prev => [...prev, topicId]);
      await fetchKeyNotesForTopic(topicId);
    } else {
      setSelectedTopics(prev => prev.filter(id => id !== topicId));
    }
  };
  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedTopics([]);
    setExpandedUnits([]);
    if (selectedCategory === 'pastpapers') {
      fetchPastPapers(subject.id);
    }
  };

  const handleUnitToggle = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedTopics([]);
    setQuizConfig(null); // Reset quiz when changing category
    if (category === 'pastpapers' && selectedSubject) {
      fetchPastPapers(selectedSubject.id);
    }
  };
  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedTopics([]);
    setExpandedUnits([]);
    setPastPapers([]);
    setQuizConfig(null);
  };

  const handleStartQuiz = (config: QuizConfig) => {
    setQuizConfig(config);
  };

  const handleBackFromQuiz = () => {
    setQuizConfig(null);
  };
  const getSubjectIcon = (iconName: string | null) => {
    const Icon = iconName ? iconMap[iconName] : BookOpen;
    return Icon || BookOpen;
  };
  const getCategoryTitle = () => {
    const category = preparationCategories.find(c => c.id === selectedCategory);
    return category?.name || 'Key Notes';
  };
  if (onboardingLoading || isLoading) {
    return <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        {needsOnboarding && <SemesterOnboarding open={needsOnboarding} onComplete={completeOnboarding} />}
      </MainLayout>;
  }
  return <MainLayout>
      <SemesterOnboarding open={needsOnboarding} onComplete={completeOnboarding} />
      
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Preparation
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {profileData?.semester ? `Semester ${profileData.semester} Resources` : 'Select a subject to start learning'}
            </p>
          </div>
          {selectedSubject && <Button variant="outline" onClick={handleBackToSubjects} className="gap-2">
              <Library className="h-4 w-4" />
              Show Books
            </Button>}
        </div>

        {!selectedSubject ? (/* Subject Selection Grid */
      <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl text-foreground flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                Select a Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No subjects available yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {profileData?.semester ? `No subjects found for Semester ${profileData.semester}` : 'Admin needs to add subjects first.'}
                  </p>
                </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {subjects.map(subject => {
              const SubjectIcon = getSubjectIcon(subject.icon);
              const totalTopics = subject.units.reduce((acc, u) => acc + u.topics.length, 0);
              return <Card key={subject.id} className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary" onClick={() => handleSubjectSelect(subject)}>
                        <CardContent className="p-4 md:p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                              <SubjectIcon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-semibold text-foreground text-base md:text-lg mb-1">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {subject.units.length} Units • {totalTopics} Topics
                          </p>
                        </CardContent>
                      </Card>;
            })}
                </div>}
            </CardContent>
          </Card>) : (/* Subject Detail View - Categories Sidebar + Topics */
      <div className="grid lg:grid-cols-12 gap-4 md:gap-6">
            {/* Categories Sidebar - Horizontal scroll on mobile */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border lg:sticky lg:top-4">
                <CardContent className="p-2 sm:p-3 md:p-4">
                  {/* Mobile: Horizontal scrollable */}
                  <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                    {preparationCategories.map(category => {
                  const CategoryIcon = category.icon;
                  const isActive = selectedCategory === category.id;
                  return <button key={category.id} className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all text-left whitespace-nowrap lg:whitespace-normal lg:w-full shrink-0 ${isActive ? 'bg-primary/10 border-l-4 lg:border-l-4 border-primary' : 'hover:bg-muted border-l-4 lg:border-l-4 border-transparent'}`} onClick={() => handleCategoryChange(category.id)}>
                          <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg ${category.color} flex items-center justify-center shrink-0`}>
                            <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                          <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {category.name}
                          </span>
                        </button>;
                })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Topics Content */}
            <div className="lg:col-span-9">
              {/* Show Academic Resources */}
              {selectedCategory === 'academic' ? (
                <AcademicResources subjectId={selectedSubject.id} subjectName={selectedSubject.name} />
              ) : selectedCategory === 'objective' && quizConfig ? (
                <ObjectiveQuiz config={quizConfig} onBack={handleBackFromQuiz} />
              ) : selectedCategory === 'objective' ? (
                <ObjectivePaperSelector subject={selectedSubject} onStartQuiz={handleStartQuiz} />
              ) : (
              <Card className="bg-card border-border">
                <CardHeader className="pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        {getCategoryTitle()} - {selectedSubject.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedSubject.grade}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {selectedCategory === 'pastpapers' ? (/* Past Papers View */
              loadingPapers ? <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div> : pastPapers.length === 0 ? <div className="text-center py-8">
                        <Files className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No past papers available for this subject.</p>
                      </div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pastPapers.map(paper => <Card key={paper.id} className="cursor-pointer hover:shadow-md transition-shadow bg-accent border-border" onClick={() => setSelectedPaper(paper)}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-foreground text-sm truncate">{paper.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    {paper.year && <Badge variant="outline" className="text-xs">{paper.year}</Badge>}
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {paper.paper_type || 'Past'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>)}
                      </div>) : selectedSubject.units.length === 0 ? <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No units available for this subject.</p>
                    </div> : <div className="space-y-6">
                      <p className="text-muted-foreground">
                        Select topics of any unit to view {getCategoryTitle()}
                      </p>

                      {selectedSubject.units.map(unit => {
                        const isUnitExpanded = expandedUnits.includes(unit.id);
                        return (
                          <div key={unit.id} className="space-y-3">
                            {/* Unit Header - Clickable */}
                            <button
                              onClick={() => handleUnitToggle(unit.id)}
                              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                              <span className="font-semibold text-foreground">
                                {unit.name}
                              </span>
                              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isUnitExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {/* Topics - Show when unit is expanded */}
                            {isUnitExpanded && (
                              <div className="ml-4 space-y-2">
                                {unit.topics.length === 0 ? (
                                  <p className="text-sm text-muted-foreground pl-4">
                                    No topics available for this unit.
                                  </p>
                                ) : (
                                  unit.topics.map(topic => {
                                    const isSelected = selectedTopics.includes(topic.id);
                                    const topicNotes = keyNotes[topic.id] || [];
                                    const isLoadingNotes = loadingNotes[topic.id];
                                    return (
                                      <div key={topic.id} className="space-y-2">
                                        <div 
                                          className="flex items-center gap-3 py-2 cursor-pointer group" 
                                          onClick={() => handleTopicToggle(topic.id)}
                                        >
                                          <Checkbox 
                                            checked={isSelected} 
                                            onCheckedChange={() => handleTopicToggle(topic.id)} 
                                            className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                                          />
                                          <span className={`text-sm md:text-base transition-colors ${isSelected ? 'text-primary font-medium' : 'text-foreground group-hover:text-primary'}`}>
                                            {topic.name}
                                          </span>
                                        </div>

                                        {isSelected && selectedCategory === 'keynotes' && (
                                          <div className="ml-8 pl-4 border-l-2 border-primary/30">
                                            {isLoadingNotes ? (
                                              <div className="flex items-center gap-2 py-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                <span className="text-sm text-muted-foreground">Loading notes...</span>
                                              </div>
                                            ) : topicNotes.length === 0 ? (
                                              <p className="text-sm text-muted-foreground py-2">
                                                No key notes available for this topic.
                                              </p>
                                            ) : (
                                              <div className="space-y-3">
                                                {topicNotes.map(note => (
                                                  <Card key={note.id} className="bg-background border-border">
                                                    <CardContent className="p-3 md:p-4">
                                                      <h4 className="font-medium text-foreground mb-2 text-sm md:text-base">
                                                        {note.title}
                                                      </h4>
                                                      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                          {note.content}
                                                        </ReactMarkdown>
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {isSelected && selectedCategory !== 'keynotes' && selectedCategory !== 'pastpapers' && (
                                          <div className="ml-8 pl-4 border-l-2 border-primary/30">
                                            <p className="text-sm text-muted-foreground py-2 italic">
                                              {getCategoryTitle()} coming soon for this topic.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>}
                </CardContent>
              </Card>
              )}
            </div>
          </div>)}
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
              <span className="truncate">{selectedPaper?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            {selectedPaper && <div className="h-full flex flex-col gap-3 sm:gap-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                    <a href={selectedPaper.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Open
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                    <a href={selectedPaper.file_url} download>
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
                <iframe src={`${selectedPaper.file_url}#toolbar=1`} className="flex-1 w-full rounded-lg border border-border min-h-0" title={selectedPaper.title} />
              </div>}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>;
};
export default Preparation;