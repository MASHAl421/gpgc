import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PenTool, ChevronRight, ArrowRight } from 'lucide-react';

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

interface SubjectivePaperSelectorProps {
  subject: Subject;
  onNext: (config: SubjectiveConfig) => void;
}

export interface SubjectiveConfig {
  subjectId: string;
  subjectName: string;
  isEntranceExam: boolean;
  questionTypes: string[];
  difficultyLevels: string[];
  selectedUnits: string[];
  selectedTopics: string[];
  topicNames: string[];
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

const SubjectivePaperSelector = ({ subject, onNext }: SubjectivePaperSelectorProps) => {
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
      const unitTopicIds = unit.topics.map(t => t.id);
      const hasSelectedTopics = unitTopicIds.some(id => newSelectedTopics.includes(id));
      if (!hasSelectedTopics) {
        setSelectedUnits(prev => prev.filter(id => id !== unitId));
      }
    } else {
      setSelectedTopics(prev => [...prev, topicId]);
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

  const handleNext = () => {
    // Get topic names for the selected topics
    const topicNames: string[] = [];
    subject.units.forEach(unit => {
      unit.topics.forEach(topic => {
        if (selectedTopics.includes(topic.id)) {
          topicNames.push(topic.name);
        }
      });
    });

    const config: SubjectiveConfig = {
      subjectId: subject.id,
      subjectName: subject.name,
      isEntranceExam,
      questionTypes,
      difficultyLevels,
      selectedUnits,
      selectedTopics,
      topicNames,
    };
    onNext(config);
  };

  const canProceed = selectedTopics.length > 0 && questionTypes.length > 0 && difficultyLevels.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-foreground flex items-center gap-2">
            <PenTool className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Subjective Paper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
          {/* Options Row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 lg:gap-8">
            {/* Entrance Exam Toggle */}
            <div className="space-y-2">
              <Label className="text-primary font-semibold text-xs sm:text-sm">Select Entrance Exam</Label>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={isEntranceExam} 
                    onCheckedChange={setIsEntranceExam}
                    className="scale-90 sm:scale-100"
                  />
                  <span className="text-xs sm:text-sm text-foreground">{isEntranceExam ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Question Type Selection */}
            <div className="space-y-2">
              <Label className="text-primary font-semibold text-xs sm:text-sm">Select Question Type</Label>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {questionTypeOptions.map(type => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`subj-type-${type.id}`}
                      checked={questionTypes.includes(type.id)}
                      onCheckedChange={() => handleQuestionTypeToggle(type.id)}
                      className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`subj-type-${type.id}`} className="text-xs sm:text-sm text-foreground cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Level Selection */}
            <div className="space-y-2">
              <Label className="text-primary font-semibold text-xs sm:text-sm">Select Difficulty Level</Label>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {difficultyOptions.map(level => (
                  <div key={level.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`subj-difficulty-${level.id}`}
                      checked={difficultyLevels.includes(level.id)}
                      onCheckedChange={() => handleDifficultyToggle(level.id)}
                      className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor={`subj-difficulty-${level.id}`} className="text-xs sm:text-sm text-foreground cursor-pointer">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unit and Topic Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-primary font-semibold text-sm sm:text-base">Select units and topics</Label>
            
            {/* All Units Checkbox */}
            <div className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2">
              <Checkbox
                id="subj-all-units"
                checked={allUnitsSelected}
                onCheckedChange={handleToggleAllUnits}
                className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="subj-all-units" className="text-primary font-medium cursor-pointer text-sm">
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
                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-muted/50">
                      <Checkbox
                        id={`subj-unit-${unit.id}`}
                        checked={isUnitSelected}
                        onCheckedChange={() => handleUnitToggle(unit.id)}
                        className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                      />
                      <button
                        onClick={() => handleUnitExpand(unit.id)}
                        className="flex-1 flex items-center justify-between text-left min-w-0"
                      >
                        <Label className="text-primary font-medium cursor-pointer text-xs sm:text-sm truncate">
                          {unit.name}
                          {selectedTopicsInUnit > 0 && (
                            <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-muted-foreground">
                              ({selectedTopicsInUnit}/{unit.topics.length})
                            </span>
                          )}
                        </Label>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Topics */}
                    {isExpanded && (
                      <div className="p-2.5 sm:p-4 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                        {unit.topics.map(topic => (
                          <div key={topic.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`subj-topic-${topic.id}`}
                              checked={selectedTopics.includes(topic.id)}
                              onCheckedChange={() => handleTopicToggle(topic.id, unit.id)}
                              className="h-4 w-4 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                            />
                            <Label 
                              htmlFor={`subj-topic-${topic.id}`} 
                              className="text-xs sm:text-sm text-foreground cursor-pointer truncate"
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

          {/* Next Button */}
          <div className="pt-3 sm:pt-4 border-t border-border">
            <Button 
              onClick={handleNext} 
              disabled={!canProceed}
              className="gap-2 h-10 sm:h-11 text-sm sm:text-base"
              size="lg"
            >
              Start Preparation
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!canProceed && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Please select at least one topic, question type, and difficulty level.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectivePaperSelector;
