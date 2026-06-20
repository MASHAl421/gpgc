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
import { BookOpen, PlayCircle, FileText, Beaker, ClipboardList, PenTool, Files, TestTube, ChevronRight, GraduationCap, Loader2, ArrowLeft, Code, Atom, Users, Monitor, Download, ExternalLink, Library, FlaskConical } from 'lucide-react';
import ObjectivePaperSelector, { QuizConfig } from '@/components/objective/ObjectivePaperSelector';
import ObjectiveQuiz from '@/components/objective/ObjectiveQuiz';
import AcademicResources from '@/components/academic/AcademicResources';
import MobileCategoryMenu from '@/components/preparation/MobileCategoryMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import SubjectivePaperSelector, { SubjectiveConfig } from '@/components/subjective/SubjectivePaperSelector';
import SubjectiveQuestionCount from '@/components/subjective/SubjectiveQuestionCount';
import PhysicsSimulations from '@/components/preparation/PhysicsSimulations';
import SubjectivePaperDisplay from '@/components/subjective/SubjectivePaperDisplay';

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
  id: 'simulations',
  name: 'Simulations',
  icon: FlaskConical,
  color: 'bg-cyan-500'
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
  Monitor,
  FlaskConical
};
const Preparation = () => {
  const isMobile = useIsMobile();
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
  
  // Subjective Paper State
  const [subjectiveStep, setSubjectiveStep] = useState<'select' | 'count' | 'paper'>('select');
  const [subjectiveConfig, setSubjectiveConfig] = useState<SubjectiveConfig | null>(null);
  const [subjectiveShortCount, setSubjectiveShortCount] = useState(5);
  const [subjectiveLongCount, setSubjectiveLongCount] = useState(3);
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
    // Reset subjective state when changing category
    setSubjectiveStep('select');
    setSubjectiveConfig(null);
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
    setSubjectiveStep('select');
    setSubjectiveConfig(null);
  };

  const handleStartQuiz = (config: QuizConfig) => {
    setQuizConfig(config);
  };

  const handleBackFromQuiz = () => {
    setQuizConfig(null);
  };

  // Subjective Paper Handlers
  const handleSubjectiveNext = (config: SubjectiveConfig) => {
    setSubjectiveConfig(config);
    setSubjectiveStep('count');
  };

  const handleSubjectiveStart = (shortCount: number, longCount: number) => {
    setSubjectiveShortCount(shortCount);
    setSubjectiveLongCount(longCount);
    setSubjectiveStep('paper');
  };

  const handleSubjectiveBack = () => {
    if (subjectiveStep === 'count') {
      setSubjectiveStep('select');
    } else if (subjectiveStep === 'paper') {
      setSubjectiveStep('count');
    }
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
      
      <div className="space-y-3 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary shrink-0" />
              <span className="truncate">Preparation</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
              {profileData?.semester ? `Semester ${profileData.semester} Resources` : 'Select a subject to start'}
            </p>
          </div>
          {selectedSubject && (
            <Button variant="outline" onClick={handleBackToSubjects} className="gap-2 h-9 text-xs sm:text-sm shrink-0">
              <Library className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Show</span> Books
            </Button>
          )}
        </div>

        {!selectedSubject ? (
          /* Subject Selection Grid */
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg md:text-xl text-foreground flex items-center gap-2">
                <Library className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Select a Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4">
              {subjects.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">No subjects available yet.</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                    {profileData?.semester ? `No subjects for Semester ${profileData.semester}` : 'Admin needs to add subjects.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                  {subjects.map(subject => {
                    const SubjectIcon = getSubjectIcon(subject.icon);
                    const totalTopics = subject.units.reduce((acc, u) => acc + u.topics.length, 0);
                    return (
                      <Card 
                        key={subject.id} 
                        className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary active:scale-[0.98]" 
                        onClick={() => handleSubjectSelect(subject)}
                      >
                        <CardContent className="p-3 sm:p-4 md:p-5">
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center shrink-0">
                              <SubjectIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                            </div>
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 line-clamp-2">
                            {subject.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
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
        ) : (
          /* Subject Detail View */
          <div className={quizConfig ? '' : 'space-y-3 sm:space-y-0 sm:grid lg:grid-cols-12 sm:gap-4 md:gap-6'}>
            {/* Filter categories - hide entirely when quiz is active */}
            {!quizConfig && (() => {
              const isPhysics = selectedSubject.name.toLowerCase().includes('physics');
              const filteredCategories = isPhysics 
                ? preparationCategories 
                : preparationCategories.filter(c => c.id !== 'simulations');
              
              return (
                <>
                  {/* Mobile: Dropdown Menu for Categories */}
                  {isMobile && (
                    <div className="lg:hidden">
                      <MobileCategoryMenu
                        categories={filteredCategories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                      />
                    </div>
                  )}

                  {/* Desktop: Categories Sidebar */}
                  <div className="hidden lg:block lg:col-span-3">
                    <Card className="bg-card border-border sticky top-4">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex flex-col gap-1">
                          {filteredCategories.map(category => {
                            const CategoryIcon = category.icon;
                            const isActive = selectedCategory === category.id;
                            return (
                              <button 
                                key={category.id} 
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left w-full ${
                                  isActive 
                                    ? 'bg-primary/10 border-l-4 border-primary' 
                                    : 'hover:bg-muted border-l-4 border-transparent'
                                }`} 
                                onClick={() => handleCategoryChange(category.id)}
                              >
                                <div className={`h-9 w-9 rounded-lg ${category.color} flex items-center justify-center shrink-0`}>
                                  <CategoryIcon className="h-5 w-5 text-white" />
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                  {category.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              );
            })()}

            {/* Topics Content */}
            <div className={quizConfig ? '' : 'lg:col-span-9'}>
              {/* Show Academic Resources */}
              {selectedCategory === 'academic' ? (
                <AcademicResources subjectId={selectedSubject.id} subjectName={selectedSubject.name} />
              ) : selectedCategory === 'video' ? (
                /* Show English message for video lectures - all subjects */
                <Card className="bg-card border-border">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-foreground mb-2">
                      Video lectures are not available yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please check back later for updates
                    </p>
                  </CardContent>
                </Card>
              ) : selectedCategory === 'simulations' ? (
                /* Show Simulations - only for Applied Physics */
                selectedSubject.name.toLowerCase().includes('physics') ? (
                  <PhysicsSimulations subjectName={selectedSubject.name} />
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-foreground mb-2">
                        Simulations are coming soon for this subject
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Currently available for Applied Physics only
                      </p>
                    </CardContent>
                  </Card>
                )
              ) : (selectedCategory === 'keynotes' || selectedCategory === 'objective' || selectedCategory === 'subjective') && selectedSubject.name.toLowerCase().includes('islamic') ? (
                /* Islamic Studies - Show Urdu message for keynotes, objective, subjective */
                <Card className="bg-card border-border">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-urdu text-foreground mb-2" dir="rtl">
                      {selectedCategory === 'keynotes' ? 'کلیدی نوٹس' : selectedCategory === 'objective' ? 'معروضی پرچہ' : 'مضمونی پرچہ'} دستیاب نہیں ہیں
                    </p>
                    <p className="text-sm font-urdu text-muted-foreground" dir="rtl">
                      آپ اکیڈمک ریسورسز سے نوٹس ڈاؤنلوڈ کر سکتے ہیں
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4 gap-2"
                      onClick={() => handleCategoryChange('academic')}
                    >
                      <BookOpen className="h-4 w-4" />
                      اکیڈمک ریسورسز دیکھیں
                    </Button>
                  </CardContent>
                </Card>
              ) : selectedCategory === 'objective' && quizConfig ? (
                <ObjectiveQuiz config={quizConfig} onBack={handleBackFromQuiz} />
              ) : selectedCategory === 'objective' ? (
                <ObjectivePaperSelector subject={selectedSubject} onStartQuiz={handleStartQuiz} />
              ) : selectedCategory === 'subjective' && subjectiveStep === 'paper' && subjectiveConfig ? (
                <SubjectivePaperDisplay 
                  config={subjectiveConfig} 
                  shortCount={subjectiveShortCount} 
                  longCount={subjectiveLongCount} 
                  onBack={handleSubjectiveBack} 
                />
              ) : selectedCategory === 'subjective' && subjectiveStep === 'count' && subjectiveConfig ? (
                <SubjectiveQuestionCount 
                  config={subjectiveConfig} 
                  onBack={handleSubjectiveBack} 
                  onStart={handleSubjectiveStart} 
                />
              ) : selectedCategory === 'subjective' ? (
                <SubjectivePaperSelector subject={selectedSubject} onNext={handleSubjectiveNext} />
              ) : (
              <Card className="bg-card border-border">
                <CardHeader className="py-3 sm:pb-4 px-3 sm:px-6 border-b border-border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base md:text-lg text-foreground truncate">
                        {getCategoryTitle()}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{selectedSubject.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {selectedCategory === 'pastpapers' ? (
                    /* Past Papers View */
                    loadingPapers ? (
                      <div className="flex items-center justify-center py-6 sm:py-8">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                      </div>
                    ) : pastPapers.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Files className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground">No past papers available.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {pastPapers.map(paper => (
                          <Card 
                            key={paper.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow bg-accent border-border active:scale-[0.98]" 
                            onClick={() => setSelectedPaper(paper)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-foreground text-xs sm:text-sm truncate">{paper.title}</h4>
                                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                                    {paper.year && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">{paper.year}</Badge>}
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize px-1.5">
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
                    <div className="text-center py-6 sm:py-8">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground">No units available.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Select topics to view {getCategoryTitle()}
                      </p>

                      {selectedSubject.units.map(unit => {
                        const isUnitExpanded = expandedUnits.includes(unit.id);
                        return (
                          <div key={unit.id} className="space-y-2 sm:space-y-3">
                            {/* Unit Header */}
                            <button
                              onClick={() => handleUnitToggle(unit.id)}
                              className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                            >
                              <span className="font-semibold text-foreground text-sm sm:text-base text-left">
                                {unit.name}
                              </span>
                              <ChevronRight className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform shrink-0 ${isUnitExpanded ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {/* Topics - Show when unit is expanded */}
                            {isUnitExpanded && (
                              <div className="ml-2 sm:ml-4 space-y-1.5 sm:space-y-2">
                                {unit.topics.length === 0 ? (
                                  <p className="text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4">
                                    No topics available.
                                  </p>
                                ) : (
                                  unit.topics.map(topic => {
                                    const isSelected = selectedTopics.includes(topic.id);
                                    const topicNotes = keyNotes[topic.id] || [];
                                    const isLoadingNotes = loadingNotes[topic.id];
                                    return (
                                      <div key={topic.id} className="space-y-1.5 sm:space-y-2">
                                        <div 
                                          className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 cursor-pointer group" 
                                          onClick={() => handleTopicToggle(topic.id)}
                                        >
                                          <Checkbox 
                                            checked={isSelected} 
                                            onCheckedChange={() => handleTopicToggle(topic.id)} 
                                            className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                                          />
                                          <span className={`text-xs sm:text-sm md:text-base transition-colors ${isSelected ? 'text-primary font-medium' : 'text-foreground group-hover:text-primary'}`}>
                                            {topic.name}
                                          </span>
                                        </div>

                                        {isSelected && selectedCategory === 'keynotes' && (
                                          <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-primary/30">
                                            {isLoadingNotes ? (
                                              <div className="flex items-center gap-2 py-2">
                                                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
                                                <span className="text-xs sm:text-sm text-muted-foreground">Loading...</span>
                                              </div>
                                            ) : topicNotes.length === 0 ? (
                                              <p className="text-xs sm:text-sm text-muted-foreground py-2">
                                                No notes available.
                                              </p>
                                            ) : (
                                              <div className="space-y-2 sm:space-y-3">
                                                {topicNotes.map(note => (
                                                  <Card key={note.id} className="bg-background border-border">
                                                    <CardContent className="p-2.5 sm:p-3 md:p-4">
                                                      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-headings:text-base sm:prose-headings:text-lg prose-p:text-muted-foreground prose-strong:text-foreground prose-strong:font-bold prose-li:text-muted-foreground prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 text-xs sm:text-sm md:text-base [&_h3]:text-sm [&_h3]:sm:text-base [&_h3]:md:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground">
                                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                          {note.content.replace(/^\s*#{1,6}\s+.*(?:\r?\n)+/, '').replace(/^\s*\*\*[^\n]+\*\*\s*(?:\r?\n)+/, '')}
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
                                          <div className="ml-6 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-primary/30">
                                            <p className="text-xs sm:text-sm text-muted-foreground py-2 italic">
                                              Coming soon.
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
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
            </div>
          </div>
        )}
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