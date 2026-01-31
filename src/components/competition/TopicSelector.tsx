import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Languages, BookOpen } from 'lucide-react';

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {!selectedSubject ? 'Select a Subject' : `${currentSubject?.name} - Select Topic`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {!selectedSubject ? (
            // Subject Selection
            <div className="grid gap-3">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <Card
                    key={subject.id}
                    className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md"
                    onClick={() => setSelectedSubject(subject.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{subject.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {subject.topics.length} topics available
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Topic Selection
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedSubject(null);
                  setSelectedTopic(null);
                }}
              >
                ← Back to Subjects
              </Button>

              <div className="grid gap-3">
                {currentSubject?.topics.map((topic) => {
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <Card
                      key={topic.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTopic(topic.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{topic.name}</h4>
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                          </div>
                          {isSelected && <Badge>Selected</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedTopic && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium')}>
                      <SelectTrigger className="w-32">
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
                      ? 'Basic concepts and definitions - great for beginners'
                      : 'Application-based questions - tests understanding'}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!selectedTopic}>
            Start Practice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
