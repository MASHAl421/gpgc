import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  unit_id: string;
}

interface SubjectSelectorProps {
  selectedSubject: Subject | null;
  selectedTopic: Topic | null;
  onSelectSubject: (subject: Subject | null) => void;
  onSelectTopic: (topic: Topic | null) => void;
}

export const SubjectSelector = ({
  selectedSubject,
  selectedTopic,
  onSelectSubject,
  onSelectTopic,
}: SubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      const { data: units } = await supabase
        .from('units')
        .select('id')
        .eq('subject_id', selectedSubject.id);

      if (units && units.length > 0) {
        const unitIds = units.map(u => u.id);
        const { data: topicsData } = await supabase
          .from('topics')
          .select('id, name, unit_id')
          .in('unit_id', unitIds)
          .order('order_index')
          .limit(15);
        if (topicsData) setTopics(topicsData);
      }
    };
    fetchTopics();
  }, [selectedSubject]);

  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {selectedSubject?.name || 'All Subjects'}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Select Subject</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { onSelectSubject(null); onSelectTopic(null); }}>
            All Subjects
          </DropdownMenuItem>
          {subjects.map((subject) => (
            <DropdownMenuItem
              key={subject.id}
              onClick={() => { onSelectSubject(subject); onSelectTopic(null); }}
            >
              {subject.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedSubject && topics.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {selectedTopic?.name || 'Select Topic'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
            <DropdownMenuLabel>Select Topic</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectTopic(null)}>
              All Topics
            </DropdownMenuItem>
            {topics.map((topic) => (
              <DropdownMenuItem
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
              >
                {topic.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {(selectedSubject || selectedTopic) && (
        <Badge variant="secondary" className="gap-1 px-2">
          {selectedSubject?.name}
          {selectedTopic && ` > ${selectedTopic.name}`}
          <button
            onClick={() => { onSelectSubject(null); onSelectTopic(null); }}
            className="ml-1 hover:text-destructive"
          >
            ×
          </button>
        </Badge>
      )}
    </div>
  );
};
