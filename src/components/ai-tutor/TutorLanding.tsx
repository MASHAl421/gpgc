import { useState } from 'react';
import { TutorCard } from './TutorCard';
import { Button } from '@/components/ui/button';
import { Video, MessageSquare, Sparkles, Zap, BookOpen, Brain, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const TUTORS = [
  {
    id: 'einstein',
    name: 'Albert Einstein',
    title: 'Physics Master',
    subject: 'Physics',
    avatar: '🧑‍🔬',
    gradientFrom: 'hsl(200, 98%, 39%)',
    gradientTo: 'hsl(215, 24%, 26%)'
  },
  {
    id: 'khwarizmi',
    name: 'Al-Khwarizmi',
    title: 'Math Genius',
    subject: 'Mathematics',
    avatar: '🧮',
    gradientFrom: 'hsl(142, 76%, 36%)',
    gradientTo: 'hsl(160, 84%, 25%)'
  },
  {
    id: 'curie',
    name: 'Marie Curie',
    title: 'Chemistry Expert',
    subject: 'Chemistry',
    avatar: '⚗️',
    gradientFrom: 'hsl(280, 65%, 50%)',
    gradientTo: 'hsl(300, 75%, 40%)'
  },
  {
    id: 'darwin',
    name: 'Charles Darwin',
    title: 'Biology Professor',
    subject: 'Biology',
    avatar: '🧬',
    gradientFrom: 'hsl(50, 90%, 45%)',
    gradientTo: 'hsl(35, 95%, 50%)'
  },
  {
    id: 'shakespeare',
    name: 'Shakespeare',
    title: 'English Master',
    subject: 'English',
    avatar: '📜',
    gradientFrom: 'hsl(0, 70%, 50%)',
    gradientTo: 'hsl(15, 80%, 45%)'
  },
  {
    id: 'turing',
    name: 'Alan Turing',
    title: 'CS Pioneer',
    subject: 'Programming',
    avatar: '💻',
    gradientFrom: 'hsl(220, 90%, 55%)',
    gradientTo: 'hsl(250, 85%, 60%)'
  },
  {
    id: 'allama',
    name: 'Allama Iqbal',
    title: 'Urdu Poet',
    subject: 'Urdu',
    avatar: '✨',
    gradientFrom: 'hsl(45, 93%, 47%)',
    gradientTo: 'hsl(30, 100%, 50%)'
  },
  {
    id: 'custom',
    name: 'Custom Tutor',
    title: 'Your Choice',
    subject: 'All Subjects',
    avatar: '🤖',
    gradientFrom: 'hsl(var(--primary))',
    gradientTo: 'hsl(var(--secondary))'
  }
];

interface TutorLandingProps {
  onSelectTutor: (tutorId: string, mode: 'text' | 'video') => void;
}

export const TutorLanding = ({ onSelectTutor }: TutorLandingProps) => {
  const [selectedTutor, setSelectedTutor] = useState<string>('custom');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Pakistan's First AI Video Tutor Platform</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Learn with{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Legends
            </span>
          </h1>

          {/* Subtitle in Urdu and English */}
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">
              Get personalized tutoring from Einstein, Al-Khwarizmi, and 6 other legendary teachers
            </p>
            <p className="text-lg text-muted-foreground font-urdu" dir="rtl">
              آئن سٹالن، الخوارزمی اور 6 دیگر عظیم اساتذہ سے ذاتی تعلیم حاصل کریں
            </p>
          </div>
        </div>
      </div>

      {/* Tutor Selection */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Section title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Choose Your Legendary Teacher
            </h2>
            <p className="text-muted-foreground">Select a tutor that matches your learning needs</p>
          </div>

          {/* Tutor grid */}
          <div className="flex flex-wrap justify-center gap-4">
            {TUTORS.map((tutor) => (
              <TutorCard
                key={tutor.id}
                name={tutor.name}
                title={tutor.title}
                subject={tutor.subject}
                avatar={tutor.avatar}
                gradientFrom={tutor.gradientFrom}
                gradientTo={tutor.gradientTo}
                isSelected={selectedTutor === tutor.id}
                onClick={() => setSelectedTutor(tutor.id)}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              onClick={() => onSelectTutor(selectedTutor, 'video')}
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
            >
              <Video className="h-5 w-5 mr-3" />
              Learn from AI Live →
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSelectTutor(selectedTutor, 'text')}
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl border-2 hover:bg-primary/5"
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              Try Text Chat
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Smart Learning</h3>
                <p className="text-xs text-muted-foreground">AI adapts to your level</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">All Subjects</h3>
                <p className="text-xs text-muted-foreground">Physics, Math, Bio & more</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Live Voice</h3>
                <p className="text-xs text-muted-foreground">Talk like real teachers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
