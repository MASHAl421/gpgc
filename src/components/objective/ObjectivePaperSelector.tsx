import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ClipboardList, ChevronRight, Play } from 'lucide-react';

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

interface ObjectivePaperSelectorProps {
  subject: Subject;
  onStartQuiz: (config: QuizConfig) => void;
}

export interface QuizConfig {
  subjectId: string;
  subjectName: string;
  isEntranceExam: boolean;
  questionTypes: string[];
  difficultyLevels: string[];
  selectedUnits: string[];
  selectedTopics: string[];
}

const questionTypeOptions = [
  { id: 'exercise', label: 'Exercise' },
  { id: 'conceptual', label: 'Conceptual' },
];

const difficultyOptions = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

const ObjectivePaperSelector = ({ subject, onStartQuiz }: ObjectivePaperSelectorProps) => {
  const [isEntranceExam, setIsEntranceExam] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['exercise', 'conceptual']);
  const [difficultyLevels, setDifficultyLevels] = useState<string[]>(['easy', 'medium', 'hard']);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);

  const allUnitsSelected = selectedUnits.length === subject.units.length;

  const handleToggleAllUnits = () => {
    if (allUnitsSelected) {
      setSelectedUnits([]);
      setSelectedTopics([]);
    } else {
      setSelectedUnits(subject.units.map(u => u.id));
      const allTopics = subject.units.flatMap(u => u.topics.map(t => t.id));
      setSelectedTopics(allTopics);
    }
  };

  const handleUnitToggle = (unitId: string) => {
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;

    const isSelected = selectedUnits.includes(unitId);
    
    if (isSelected) {
      setSelectedUnits(prev => prev.filter(id => id !== unitId));
      const unitTopicIds = unit.topics.map(t => t.id);
      setSelectedTopics(prev => prev.filter(id => !unitTopicIds.includes(id)));
    } else {
      setSelectedUnits(prev => [...prev, unitId]);
      const unitTopicIds = unit.topics.map(t => t.id);
      setSelectedTopics(prev => [...new Set([...prev, ...unitTopicIds])]);
      // Auto-expand the unit when selected
      if (!expandedUnits.includes(unitId)) {
        setExpandedUnits(prev => [...prev, unitId]);
      }
    }
  };

  const handleTopicToggle = (topicId: string, unitId: string) => {
    const isSelected = selectedTopics.includes(topicId);
    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;

    if (isSelected) {
      const newSelectedTopics = selectedTopics.filter(id => id !== topicId);
      setSelectedTopics(newSelectedTopics);
      // Check if any topic from this unit is still selected
      const unitTopicIds = unit.topics.map(t => t.id);
      const hasSelectedTopics = unitTopicIds.some(id => newSelectedTopics.includes(id));
      if (!hasSelectedTopics) {
        setSelectedUnits(prev => prev.filter(id => id !== unitId));
      }
    } else {
      setSelectedTopics(prev => [...prev, topicId]);
      // Auto-select the unit
      if (!selectedUnits.includes(unitId)) {
        setSelectedUnits(prev => [...prev, unitId]);
      }
    }
  };

  const handleUnitExpand = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleQuestionTypeToggle = (typeId: string) => {
    setQuestionTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleDifficultyToggle = (levelId: string) => {
    setDifficultyLevels(prev => 
      prev.includes(levelId) 
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  const handleStartQuiz = () => {
    const config: QuizConfig = {
      subjectId: subject.id,
      subjectName: subject.name,
      isEntranceExam,
      questionTypes,
      difficultyLevels,
      selectedUnits,
      selectedTopics,
    };
    onStartQuiz(config);
  };

  const canStart = selectedTopics.length > 0 && questionTypes.length > 0 && difficultyLevels.length > 0;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Objective Paper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entrance Exam Toggle */}
          <div className="flex flex-wrap gap-8">
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Select Entrance Exam</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={isEntranceExam} 
                    onCheckedChange={setIsEntranceExam}
                  />
                  <span className="text-sm text-foreground">{isEntranceExam ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Question Type Selection */}
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Select Question Type</Label>
              <div className="flex flex-wrap gap-4">
                {questionTypeOptions.map(type => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`type-${type.id}`}
                      checked={questionTypes.includes(type.id)}
                      onCheckedChange={() => handleQuestionTypeToggle(type.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`type-${type.id}`} className="text-sm text-foreground cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Level Selection */}
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Select Difficulty Level</Label>
              <div className="flex flex-wrap gap-4">
                {difficultyOptions.map(level => (
                  <div key={level.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`difficulty-${level.id}`}
                      checked={difficultyLevels.includes(level.id)}
                      onCheckedChange={() => handleDifficultyToggle(level.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`difficulty-${level.id}`} className="text-sm text-foreground cursor-pointer">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unit and Topic Selection */}
          <div className="space-y-3">
            <Label className="text-primary font-semibold text-base">Select units and topics</Label>
            
            {/* All Units Checkbox */}
            <div className="flex items-center gap-3 py-2">
              <Checkbox
                id="all-units"
                checked={allUnitsSelected}
                onCheckedChange={handleToggleAllUnits}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="all-units" className="text-primary font-medium cursor-pointer">
                All Units
              </Label>
            </div>

            {/* Units List */}
            <div className="space-y-2">
              {subject.units.map(unit => {
                const isUnitSelected = selectedUnits.includes(unit.id);
                const isExpanded = expandedUnits.includes(unit.id);
                const selectedTopicsInUnit = unit.topics.filter(t => selectedTopics.includes(t.id)).length;
                
                return (
                  <div key={unit.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Unit Header */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50">
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={isUnitSelected}
                        onCheckedChange={() => handleUnitToggle(unit.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <button
                        onClick={() => handleUnitExpand(unit.id)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <Label className="text-primary font-medium cursor-pointer">
                          {unit.name}
                          {selectedTopicsInUnit > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({selectedTopicsInUnit}/{unit.topics.length} selected)
                            </span>
                          )}
                        </Label>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Topics */}
                    {isExpanded && (
                      <div className="p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {unit.topics.map(topic => (
                          <div key={topic.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={selectedTopics.includes(topic.id)}
                              onCheckedChange={() => handleTopicToggle(topic.id, unit.id)}
                              className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label 
                              htmlFor={`topic-${topic.id}`} 
                              className="text-sm text-foreground cursor-pointer"
                            >
                              {topic.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={handleStartQuiz} 
              disabled={!canStart}
              className="gap-2"
              size="lg"
            >
              <Play className="h-4 w-4" />
              Start Preparation
            </Button>
            {!canStart && (
              <p className="text-sm text-muted-foreground mt-2">
                Please select at least one topic, question type, and difficulty level.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ObjectivePaperSelector;
