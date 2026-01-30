import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';

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
  units: Unit[];
}

const preparationCategories = [
  { id: 'academic', name: 'Academic Resources', icon: 'BookOpen' },
  { id: 'video', name: 'Video Lectures', icon: 'PlayCircle' },
  { id: 'keynotes', name: 'Key Notes', icon: 'FileText' },
  { id: 'simulations', name: 'Simulations', icon: 'Beaker' },
  { id: 'objective', name: 'Objective Paper', icon: 'ClipboardList' },
  { id: 'subjective', name: 'Subjective Paper', icon: 'PenTool' },
  { id: 'pastpapers', name: 'Past & Model Papers', icon: 'Files' },
  { id: 'experiments', name: 'Experiments', icon: 'TestTube' },
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
};

const Preparation = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('keynotes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch units for all subjects
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('order_index');

      if (unitsError) throw unitsError;

      // Fetch topics for all units
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index');

      if (topicsError) throw topicsError;

      // Organize data
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

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAllTopics = (topics: Topic[]) => {
    const topicIds = topics.map((t) => t.id);
    const allSelected = topicIds.every((id) => selectedTopics.includes(id));

    if (allSelected) {
      setSelectedTopics((prev) => prev.filter((id) => !topicIds.includes(id)));
    } else {
      setSelectedTopics((prev) => [...new Set([...prev, ...topicIds])]);
    }
  };

  if (isLoading) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Preparation
            </h1>
            <p className="text-muted-foreground mt-1">
              Select subject and start your preparation
            </p>
          </div>
          {selectedSubject && (
            <Button variant="outline" onClick={() => setSelectedSubject(null)}>
              Show All Books
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="space-y-2">
            {preparationCategories.map((category) => {
              const Icon = iconMap[category.icon] || BookOpen;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon className="h-5 w-5" />
                  {category.name}
                </Button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedSubject ? (
              /* Subject Selection */
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Select a Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No subjects available yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Admin needs to add subjects first.
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {subjects.map((subject) => (
                        <Card
                          key={subject.id}
                          className="cursor-pointer hover:shadow-lg transition-shadow bg-accent border-border group"
                          onClick={() => setSelectedSubject(subject)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{subject.name}</h3>
                                <p className="text-sm text-muted-foreground">{subject.grade}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Topic Selection */
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{selectedSubject.grade}</Badge>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {selectedCategory === 'keynotes' ? 'Key Notes' : preparationCategories.find((c) => c.id === selectedCategory)?.name} - {selectedSubject.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSubject.units.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No units available for this subject.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">
                        Select topics of any unit to view{' '}
                        {selectedCategory === 'keynotes'
                          ? 'Key Notes'
                          : preparationCategories.find((c) => c.id === selectedCategory)?.name}
                      </p>

                      <Accordion type="multiple" className="space-y-2">
                        {selectedSubject.units.map((unit) => (
                          <AccordionItem
                            key={unit.id}
                            value={unit.id}
                            className="border border-border rounded-lg px-4"
                          >
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAllTopics(unit.topics);
                                  }}
                                >
                                  All Units
                                </Button>
                                <span className="font-semibold text-foreground">{unit.name}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {unit.topics.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">No topics in this unit yet.</p>
                              ) : (
                                <div className="space-y-2 pt-2">
                                  {unit.topics.map((topic) => (
                                    <div
                                      key={topic.id}
                                      className="flex items-center justify-between p-3 rounded-lg bg-accent hover:bg-muted transition-colors cursor-pointer"
                                      onClick={() => handleTopicToggle(topic.id)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={selectedTopics.includes(topic.id)}
                                          onCheckedChange={() => handleTopicToggle(topic.id)}
                                        />
                                        <span className="text-foreground">{topic.name}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>

                      {selectedTopics.length > 0 && (
                        <div className="mt-6 flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                          <span className="text-foreground font-medium">
                            {selectedTopics.length} topic(s) selected
                          </span>
                          <Button>
                            Start {selectedCategory === 'keynotes' ? 'Reading' : 'Quiz'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Preparation;
