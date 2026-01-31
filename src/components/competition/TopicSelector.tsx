import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Code, Globe, Calculator, Atom, FlaskConical, Languages, Brain } from 'lucide-react';

interface TopicSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

const topics = [
  { id: 'general', name: 'General Knowledge', icon: Globe, description: 'Current affairs, history, geography' },
  { id: 'programming', name: 'Programming Fundamentals', icon: Code, description: 'C++, algorithms, data structures' },
  { id: 'physics', name: 'Applied Physics', icon: Atom, description: 'Mechanics, electricity, waves' },
  { id: 'english', name: 'English & Grammar', icon: Languages, description: 'Grammar, vocabulary, comprehension' },
  { id: 'math', name: 'Mathematics', icon: Calculator, description: 'Algebra, calculus, statistics' },
  { id: 'ict', name: 'ICT & Computer Basics', icon: BookOpen, description: 'Networking, OS, basics' },
  { id: 'science', name: 'General Science', icon: FlaskConical, description: 'Biology, chemistry, environment' },
  { id: 'reasoning', name: 'Logical Reasoning', icon: Brain, description: 'Patterns, puzzles, aptitude' },
];

export const TopicSelector = ({ isOpen, onClose, onSelectTopic }: TopicSelectorProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleStart = () => {
    if (selectedTopic) {
      const topic = topics.find(t => t.id === selectedTopic);
      onSelectTopic(topic?.name || selectedTopic);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select a Topic</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="grid gap-3">
            {topics.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.id;

              return (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{topic.name}</h4>
                      <p className="text-sm text-muted-foreground">{topic.description}</p>
                    </div>
                    {isSelected && <Badge>Selected</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
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
