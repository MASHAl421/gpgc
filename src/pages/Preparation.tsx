import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { subjects, preparationCategories, type Subject, type Topic } from '@/data/subjects';
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
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  PlayCircle,
  FileText,
  Beaker,
  ClipboardList,
  PenTool,
  FileStack: Files,
  TestTube,
};

const Preparation = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('keynotes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSelectAllTopics = (topics: Topic[]) => {
    const topicIds = topics.map(t => t.id);
    const allSelected = topicIds.every(id => selectedTopics.includes(id));
    
    if (allSelected) {
      setSelectedTopics(prev => prev.filter(id => !topicIds.includes(id)));
    } else {
      setSelectedTopics(prev => [...new Set([...prev, ...topicIds])]);
    }
  };

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
                      {selectedCategory === 'keynotes' ? 'Key Notes' : preparationCategories.find(c => c.id === selectedCategory)?.name} - {selectedSubject.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Select topics of any unit to view {selectedCategory === 'keynotes' ? 'Key Notes' : preparationCategories.find(c => c.id === selectedCategory)?.name}
                  </p>
                  
                  <Accordion type="multiple" className="space-y-2">
                    {selectedSubject.units.map((unit) => (
                      <AccordionItem key={unit.id} value={unit.id} className="border border-border rounded-lg px-4">
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
                                <Badge variant="outline" className="text-muted-foreground">
                                  {topic.quizCount} MCQs
                                </Badge>
                              </div>
                            ))}
                          </div>
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
