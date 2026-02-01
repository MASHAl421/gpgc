import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, FileText, Download, ExternalLink, Image, ChevronRight } from 'lucide-react';

interface AcademicResourcesProps {
  subjectId: string;
  subjectName: string;
}

interface Note {
  id: string;
  title: string;
  file_url: string;
}

// Static data for subjects (can be moved to database later)
const academicData: Record<string, {
  courseContent: string;
  notes: Note[];
  externalLink?: { title: string; url: string };
}> = {
  'functional-english': {
    courseContent: '/academic/functional-english-course-content.jpg',
    notes: [
      { id: '1', title: 'Parts of Speech - Types', file_url: '/academic/notes/parts-of-speech-types.pdf' },
      { id: '2', title: 'Parts of Speech - Part 2', file_url: '/academic/notes/parts-of-speech-part-2.pdf' },
      { id: '3', title: 'Parts of Speech - Part 3', file_url: '/academic/notes/parts-of-speech-part-3.pdf' },
    ]
  },
  'programming-fundamentals': {
    courseContent: '/academic/programming-fundamentals-course-content.jpg',
    notes: [],
    externalLink: {
      title: 'Programming Fundamentals Notes - Google Drive',
      url: 'https://drive.google.com/file/d/11tj2KjO1K9v1io_P5RiKZ2nbk4FNzz6h/view?usp=drivesdk'
    }
  },
  'civics-&-community-engagement': {
    courseContent: '/academic/civics-community-engagement-course-content.jpg',
    notes: [
      { id: '1', title: 'Chapter 1: Meaning and Nature of Civics', file_url: '/academic/notes/meaning-and-nature-of-civics.pdf' },
      { id: '2', title: 'Chapter 2: Concept of Citizenship', file_url: '/academic/notes/concept-of-citizenship.pdf' },
      { id: '3', title: 'Chapter 3: Rights and Responsibilities', file_url: '/academic/notes/rights-and-responsibilities.pdf' },
      { id: '4', title: 'Chapter 4: State, Govt and Civil Society', file_url: '/academic/notes/state-govt-civil-society.pdf' },
    ]
  },
  'introduction-to-ict': {
    courseContent: '/academic/ict-course-content.jpg',
    notes: [
      { id: '1', title: 'Lecture 1 to 14: Complete ICT Notes', file_url: '/academic/notes/ict-lectures-1-to-14.pdf' },
    ]
  },
  'ict': {
    courseContent: '/academic/ict-course-content.jpg',
    notes: [
      { id: '1', title: 'Lecture 1 to 14: Complete ICT Notes', file_url: '/academic/notes/ict-lectures-1-to-14.pdf' },
    ]
  },
  'islamic-studies': {
    courseContent: '/academic/islamic-studies-course-content.pdf',
    notes: [
      { id: '1', title: 'تیس احادیث مبارکہ - 30 Hadiths', file_url: '/academic/notes/30-hadiths.pdf' },
    ],
    externalLink: {
      title: 'اسلامیات نوٹس - Google Drive',
      url: 'https://drive.google.com/file/d/16bSCn4cj52YtCt-SbKOJ0ssZC6sLjrIb/view?usp=sharing'
    }
  },
  'applied-physics': {
    courseContent: '/academic/applied-physics-course-content.pdf',
    notes: [
      { id: '1', title: 'Complete Applied Physics Notes (All Chapters)', file_url: '/academic/notes/applied-physics-complete-notes.pdf' },
    ],
    externalLink: {
      title: 'Applied Physics Notes - Google Drive',
      url: 'https://drive.google.com/file/d/1kKLywgz9KAwSA_MxYJf_I-4ElFIC-cFF/view?usp=sharing'
    }
  }
};

// Check if subject has academic resources
const hasAcademicResources = (subjectName: string): boolean => {
  const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '-');
  return subjectKey in academicData;
};

const AcademicResources = ({ subjectId, subjectName }: AcademicResourcesProps) => {
  const [selectedView, setSelectedView] = useState<'menu' | 'course-content' | 'notes'>('menu');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Get data for subject - only show if subject has data
  const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '-');
  const data = academicData[subjectKey];

  // If no data available for this subject, show message
  if (!data) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Academic resources for {subjectName} are not available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if course content is a PDF
  const isPdf = data.courseContent.toLowerCase().endsWith('.pdf');

  if (selectedView === 'course-content') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedView('menu')} className="gap-2">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Resources
        </Button>
        
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Course Content - {subjectName}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={data.courseContent} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(data.courseContent, `${subjectName}-course-content${isPdf ? '.pdf' : '.jpg'}`)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-lg overflow-hidden border border-border">
              {isPdf ? (
                <iframe 
                  src={`${data.courseContent}#toolbar=1`}
                  className="w-full h-[70vh] rounded-lg"
                  title={`${subjectName} Course Content`}
                />
              ) : (
                <img 
                  src={data.courseContent} 
                  alt={`${subjectName} Course Content`}
                  className="w-full h-auto"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedView === 'notes') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedView('menu')} className="gap-2">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Resources
        </Button>
        
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes - {subjectName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {data.notes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notes available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.notes.map(note => (
                  <Card 
                    key={note.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow bg-accent border-border"
                    onClick={() => setSelectedNote(note)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground text-sm">{note.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">PDF Document</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF Viewer Dialog */}
        <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {selectedNote?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {selectedNote && (
                <div className="h-full flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedNote.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedNote.file_url} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                  <iframe 
                    src={`${selectedNote.file_url}#toolbar=1`} 
                    className="flex-1 w-full rounded-lg border border-border" 
                    title={selectedNote.title} 
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Menu view
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-foreground">
              Academic Resources - {subjectName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Course content and study notes</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Course Content Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary"
            onClick={() => setSelectedView('course-content')}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">
                Course Content
              </h3>
              <p className="text-sm text-muted-foreground">
                View the official syllabus and course outline
              </p>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary"
            onClick={() => setSelectedView('notes')}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">
                Notes
              </h3>
              <p className="text-sm text-muted-foreground">
                {data.notes.length} PDF documents available
              </p>
            </CardContent>
          </Card>

          {/* External Link Card (for Islamic Studies Google Drive) */}
          {data.externalLink && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all bg-accent border-border group hover:border-primary"
              onClick={() => window.open(data.externalLink!.url, '_blank')}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-6 w-6 text-white" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1 font-urdu" dir="rtl">
                  {data.externalLink.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  External resource - opens in new tab
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicResources;
