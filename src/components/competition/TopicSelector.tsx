import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Languages, BookOpen, ArrowLeft, ChevronRight } from 'lucide-react';

interface TopicSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string, difficulty: 'easy' | 'medium') => void;
}

// Semester 1 focused topics
const subjects = [
  {
    id: 'programming',
    name: 'Programming Fundamentals',
    icon: Code,
    topics: [
      { id: 'intro-cpp', name: 'Introduction to C++', description: 'History, IDE setup, first program' },
      { id: 'variables', name: 'Variables & Data Types', description: 'int, float, char, string basics' },
      { id: 'io-operations', name: 'Input/Output Operations', description: 'cin, cout, formatting' },
      { id: 'operators', name: 'Operators', description: 'Arithmetic, relational, logical operators' },
      { id: 'control-structures', name: 'Control Structures', description: 'if-else, switch, loops' },
      { id: 'arrays', name: 'Arrays', description: '1D and 2D arrays, operations' },
      { id: 'functions', name: 'Functions', description: 'Function definition, parameters, return' },
      { id: 'pointers', name: 'Pointers', description: 'Pointer basics, memory addresses' },
    ]
  },
  {
    id: 'english',
    name: 'Functional English',
    icon: Languages,
    topics: [
      { id: 'parts-of-speech', name: 'Parts of Speech', description: 'Nouns, verbs, adjectives, adverbs' },
      { id: 'tenses', name: 'Tenses & Modals', description: 'Past, present, future tenses' },
      { id: 'sentence-structure', name: 'Sentence Structure', description: 'Simple, compound, complex sentences' },
      { id: 'punctuation', name: 'Punctuation', description: 'Comma, period, quotation marks' },
      { id: 'voice', name: 'Active & Passive Voice', description: 'Voice conversion rules' },
      { id: 'reading-skills', name: 'Reading Skills', description: 'Comprehension, inference' },
      { id: 'paragraph-writing', name: 'Paragraph Writing', description: 'Topic sentences, coherence' },
    ]
  },
  {
    id: 'general',
    name: 'General Knowledge',
    icon: BookOpen,
    topics: [
      { id: 'pakistan-basics', name: 'Pakistan Studies', description: 'Geography, history, culture' },
      { id: 'current-affairs', name: 'Current Affairs', description: 'Recent events, news' },
      { id: 'basic-science', name: 'Basic Science', description: 'Simple science facts' },
      { id: 'computer-basics', name: 'Computer Basics', description: 'Hardware, software, internet' },
    ]
  }
];

export const TopicSelector = ({ isOpen, onClose, onSelectTopic }: TopicSelectorProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>('easy');

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  const handleStart = () => {
    if (selectedTopic && currentSubject) {
      const topic = currentSubject.topics.find(t => t.id === selectedTopic);
      // Format: "Subject - Topic" for better context
      const fullTopic = `${currentSubject.name} - ${topic?.name || selectedTopic}`;
      onSelectTopic(fullTopic, difficulty);
      onClose();
      // Reset state
      setSelectedSubject(null);
      setSelectedTopic(null);
      setDifficulty('easy');
    }
  };

  const handleClose = () => {
    setSelectedSubject(null);
    setSelectedTopic(null);
    setDifficulty('easy');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">
            {!selectedSubject ? 'Select a Subject' : `${currentSubject?.name}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] sm:max-h-[400px] pr-2 sm:pr-4">
          {!selectedSubject ? (
            // Subject Selection
            <div className="grid gap-2 sm:gap-3">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <Card
                    key={subject.id}
                    className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md active:bg-muted"
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="p-2 rounded-lg bg-muted text-primary shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base">{subject.name}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {subject.topics.length} topics
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Topic Selection
            <div className="space-y-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedSubject(null);
                  setSelectedTopic(null);
                }}
                className="gap-1 h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="grid gap-2">
                {currentSubject?.topics.map((topic) => {
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <Card
                      key={topic.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50 active:bg-muted'
                      }`}
                      onClick={() => setSelectedTopic(topic.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm">{topic.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                          </div>
                          {isSelected && <Badge className="shrink-0 text-xs">Selected</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedTopic && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium')}>
                      <SelectTrigger className="w-28 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {difficulty === 'easy' 
                      ? 'Basic concepts - great for beginners'
                      : 'Application-based - tests understanding'}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!selectedTopic} className="flex-1 sm:flex-none">
            Start Practice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
