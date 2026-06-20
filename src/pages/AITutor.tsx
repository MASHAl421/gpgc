import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MeshChat } from '@/components/ai-workspace/MeshChat';
import { VTNotes } from '@/components/ai-workspace/VTNotes';
import { Sparkles, MessageSquare, NotebookPen, FileEdit } from 'lucide-react';

const ComingSoon = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 animate-fade-in">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-2xl opacity-30" aria-hidden="true" />
      <div className="relative h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
        <Icon className="h-9 w-9 text-primary-foreground" aria-hidden="true" />
      </div>
    </div>
    <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 tracking-tight">{title}</h2>
    <p className="text-muted-foreground max-w-md text-sm sm:text-base mb-6 leading-relaxed">
      {description}
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 text-accent-foreground text-sm font-medium">
      <div className="thinking-shimmer">Coming Soon</div>
    </div>
  </div>
);

const AIWorkspace = () => {
  const [tab, setTab] = useState('mesh-chat');

  return (
    <MainLayout>
      <div className="h-full flex flex-col overflow-hidden relative">
        {/* Ambient gradient backdrop */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-glow"
          aria-hidden="true"
        />

        <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col relative">
          <div className="border-b border-border/60 bg-background/70 backdrop-blur-xl px-3 sm:px-6 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
                <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight leading-tight">
                  AI Workspace
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Chat, capture voice notes, and craft assignments — powered by AI
                </p>
              </div>
            </div>

            <TabsList
              className="grid w-full grid-cols-3 max-w-2xl h-11 p-1 bg-muted/60 rounded-xl"
              aria-label="AI Workspace tools"
            >
              <TabsTrigger
                value="mesh-chat"
                className="gap-1.5 text-xs sm:text-sm rounded-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant transition-all"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span className="hidden xs:inline">Mesh Chat</span>
                <span className="xs:hidden">Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="vt-notes"
                className="gap-1.5 text-xs sm:text-sm rounded-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant transition-all"
              >
                <NotebookPen className="h-4 w-4" aria-hidden="true" />
                <span className="hidden xs:inline">VT Notes</span>
                <span className="xs:hidden">Notes</span>
              </TabsTrigger>
              <TabsTrigger
                value="assignment"
                className="gap-1.5 text-xs sm:text-sm rounded-lg font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elegant transition-all"
              >
                <FileEdit className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Assignment Creator</span>
                <span className="sm:hidden">Assign</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="mesh-chat" className="flex-1 min-h-0 m-0 overflow-hidden">
            <MeshChat />
          </TabsContent>

          <TabsContent value="vt-notes" className="flex-1 min-h-0 m-0 overflow-hidden">
            <VTNotes />
          </TabsContent>

          <TabsContent value="assignment" className="flex-1 min-h-0 m-0 overflow-y-auto">
            <ComingSoon
              icon={FileEdit}
              title="Unique Assignment Creator"
              description="Generate one-of-a-kind assignments tailored to your subject, topic, and difficulty — complete with original questions and structured formatting."
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AIWorkspace;
