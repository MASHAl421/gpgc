import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import SemesterOnboarding from '@/components/SemesterOnboarding';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  BookOpen,
  PlayCircle,
  FileText,
  Beaker,
  ClipboardList,
  PenTool,
  Files,
  TestTube,
  ChevronRight,
  GraduationCap,
  Loader2,
  ArrowLeft,
  Code,
  Atom,
  Users,
  Monitor,
  Download,
  ExternalLink,
} from 'lucide-react';

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

type ViewMode = 'subjects' | 'categories' | 'content';

const preparationCategories = [
  { id: 'keynotes', name: 'Key Notes', icon: 'FileText', description: 'Quick revision notes for each topic' },
  { id: 'video', name: 'Video Lectures', icon: 'PlayCircle', description: 'Watch explained video lessons' },
  { id: 'objective', name: 'Objective MCQs', icon: 'ClipboardList', description: 'Practice multiple choice questions' },
  { id: 'subjective', name: 'Subjective Questions', icon: 'PenTool', description: 'Long answer practice questions' },
  { id: 'pastpapers', name: 'Past & Model Papers', icon: 'Files', description: 'Previous exam papers' },
  { id: 'simulations', name: 'Simulations', icon: 'Beaker', description: 'Interactive lab simulations' },
  { id: 'experiments', name: 'Experiments', icon: 'TestTube', description: 'Step-by-step lab experiments' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  Monitor,
};

const Preparation = () => {
  const { needsOnboarding, profileData, isLoading: onboardingLoading, completeOnboarding } = useSemesterOnboarding();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [keyNotes, setKeyNotes] = useState<Record<string, KeyNote[]>>({});
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('subjects');

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

      const { data: subjectsData, error: subjectsError } = await query;

      if (subjectsError) throw subjectsError;

      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('order_index');

      if (unitsError) throw unitsError;

      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index');

      if (topicsError) throw topicsError;

      const organizedSubjects: Subject[] = (subjectsData || []).map((subject) => {
        const subjectUnits = (unitsData || [])
          .filter((unit) => unit.subject_id === subject.id)
          .map((unit) => ({
            ...unit,
            topics: (topicsData || []).filter((topic) => topic.unit_id === unit.id),
          }));

        return {
          ...subject,
          units: subjectUnits,
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

    setLoadingNotes((prev) => ({ ...prev, [topicId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('key_notes')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index');

      if (error) throw error;

      setKeyNotes((prev) => ({ ...prev, [topicId]: data || [] }));
    } catch (error) {
      console.error('Error fetching key notes:', error);
    } finally {
      setLoadingNotes((prev) => ({ ...prev, [topicId]: false }));
    }
  };

  const fetchPastPapers = async (subjectId: string) => {
    setLoadingPapers(true);
    try {
      const { data, error } = await supabase
        .from('past_papers')
        .select('*')
        .eq('subject_id', subjectId)
        .order('year', { ascending: false });

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
      setSelectedTopics((prev) => [...prev, topicId]);
      await fetchKeyNotesForTopic(topicId);
    } else {
      setSelectedTopics((prev) => prev.filter((id) => id !== topicId));
    }
  };

  const handleSelectAllTopics = async (topics: Topic[]) => {
    const topicIds = topics.map((t) => t.id);
    const allSelected = topicIds.every((id) => selectedTopics.includes(id));

    if (allSelected) {
      setSelectedTopics((prev) => prev.filter((id) => !topicIds.includes(id)));
    } else {
      setSelectedTopics((prev) => [...new Set([...prev, ...topicIds])]);
      for (const topicId of topicIds) {
        if (!keyNotes[topicId]) {
          fetchKeyNotesForTopic(topicId);
        }
      }
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('categories');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode('content');
    if (categoryId === 'pastpapers' && selectedSubject) {
      fetchPastPapers(selectedSubject.id);
    }
  };

  const handleBack = () => {
    if (viewMode === 'content') {
      setViewMode('categories');
      setSelectedCategory(null);
      setSelectedTopics([]);
      setPastPapers([]);
    } else if (viewMode === 'categories') {
      setViewMode('subjects');
      setSelectedSubject(null);
    }
  };

  const getSubjectIcon = (iconName: string | null) => {
    const Icon = iconName ? iconMap[iconName] : BookOpen;
    return Icon || BookOpen;
  };

  const getBackButtonText = () => {
    if (viewMode === 'content') return `Back to ${selectedSubject?.name}`;
    if (viewMode === 'categories') return 'Back to Subjects';
    return '';
  };

  if (onboardingLoading || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        {needsOnboarding && (
          <SemesterOnboarding open={needsOnboarding} onComplete={completeOnboarding} />
        )}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
              {viewMode === 'subjects' && (profileData?.semester 
                ? `Semester ${profileData.semester} Subjects`
                : 'Select a subject to start'
              )}
              {viewMode === 'categories' && selectedSubject && `${selectedSubject.name} - Choose a resource type`}
              {viewMode === 'content' && selectedSubject && selectedCategory && 
                `${selectedSubject.name} - ${preparationCategories.find(c => c.id === selectedCategory)?.name}`
              }
            </p>
          </div>
          {viewMode !== 'subjects' && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {getBackButtonText()}
            </Button>
          )}
        </div>

        {/* Subjects Grid */}
        {viewMode === 'subjects' && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg md:text-xl text-foreground">Select a Subject</CardTitle>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No subjects available yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {profileData?.semester 
                      ? `No subjects found for Semester ${profileData.semester}`
                      : 'Admin needs to add subjects first.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {subjects.map((subject) => {
                    const SubjectIcon = getSubjectIcon(subject.icon);
                    const totalTopics = subject.units.reduce((acc, u) => acc + u.topics.length, 0);
                    return (
                      <Card
                        key={subject.id}
                        className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary"
                        onClick={() => handleSubjectSelect(subject)}
                      >
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
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Category Selection */}
        {viewMode === 'categories' && selectedSubject && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const SubjectIcon = getSubjectIcon(selectedSubject.icon);
                  return (
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                      <SubjectIcon className="h-5 w-5 text-primary-foreground" />
                    </div>
                  );
                })()}
                <div>
                  <CardTitle className="text-lg md:text-xl text-foreground">{selectedSubject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedSubject.grade}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Choose a resource type to study from:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {preparationCategories.map((category) => {
                  const CategoryIcon = iconMap[category.icon] || BookOpen;
                  return (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <CardContent className="p-4 md:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                            <CategoryIcon className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content View */}
        {viewMode === 'content' && selectedSubject && selectedCategory && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
              <div>
                <Badge variant="secondary" className="mb-2">{selectedSubject.grade}</Badge>
                <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
                  {(() => {
                    const CategoryIcon = iconMap[preparationCategories.find(c => c.id === selectedCategory)?.icon || 'BookOpen'] || BookOpen;
                    return <CategoryIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />;
                  })()}
                  <span className="truncate">
                    {preparationCategories.find((c) => c.id === selectedCategory)?.name} - {selectedSubject.name}
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCategory === 'pastpapers' ? (
                /* Past Papers View */
                loadingPapers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pastPapers.length === 0 ? (
                  <div className="text-center py-8">
                    <Files className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No past papers available for this subject.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pastPapers.map((paper) => (
                      <Card
                        key={paper.id}
                        className="cursor-pointer hover:shadow-md transition-shadow bg-accent border-border"
                        onClick={() => setSelectedPaper(paper)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground text-sm truncate">{paper.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {paper.year && (
                                  <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                                )}
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {paper.paper_type || 'Past'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : selectedSubject.units.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No units available for this subject.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select topics to view {preparationCategories.find((c) => c.id === selectedCategory)?.name}
                  </p>

                  <Accordion type="multiple" defaultValue={selectedSubject.units.map(u => u.id)} className="space-y-2">
                    {selectedSubject.units.map((unit) => (
                      <AccordionItem
                        key={unit.id}
                        value={unit.id}
                        className="border border-border rounded-lg px-3 md:px-4"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAllTopics(unit.topics);
                              }}
                            >
                              Select All
                            </Button>
                            <span className="font-semibold text-primary text-sm md:text-base">{unit.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {unit.topics.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No topics in this unit yet.</p>
                          ) : (
                            <div className="space-y-3 pt-2">
                              {unit.topics.map((topic) => {
                                const isSelected = selectedTopics.includes(topic.id);
                                const topicNotes = keyNotes[topic.id] || [];
                                const isLoadingNotes = loadingNotes[topic.id];

                                return (
                                  <div key={topic.id} className="space-y-2">
                                    <div
                                      className="flex items-center gap-3 p-2 md:p-3 rounded-lg bg-accent hover:bg-muted transition-colors cursor-pointer"
                                      onClick={() => handleTopicToggle(topic.id)}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => handleTopicToggle(topic.id)}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                      />
                                      <span className="text-sm md:text-base text-foreground">{topic.name}</span>
                                    </div>

                                    {isSelected && selectedCategory === 'keynotes' && (
                                      <div className="ml-6 md:ml-8 pl-3 md:pl-4 border-l-2 border-primary/30">
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
                                            {topicNotes.map((note) => (
                                              <Card key={note.id} className="bg-background border-border">
                                                <CardContent className="p-3 md:p-4">
                                                  <h4 className="font-medium text-foreground mb-2 text-sm md:text-base">
                                                    {note.title}
                                                  </h4>
                                                  <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                                                    <ReactMarkdown
                                                      remarkPlugins={[remarkMath]}
                                                      rehypePlugins={[rehypeKatex]}
                                                    >
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
                                      <div className="ml-6 md:ml-8 pl-3 md:pl-4 border-l-2 border-primary/30">
                                        <p className="text-sm text-muted-foreground py-2 italic">
                                          {preparationCategories.find(c => c.id === selectedCategory)?.name} coming soon for this topic.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-destructive" />
              {selectedPaper?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedPaper && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedPaper.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedPaper.file_url} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
                <iframe
                  src={`${selectedPaper.file_url}#toolbar=1`}
                  className="flex-1 w-full rounded-lg border border-border"
                  title={selectedPaper.title}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Preparation;
