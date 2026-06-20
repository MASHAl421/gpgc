import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MeshChat } from '@/components/ai-workspace/MeshChat';
import { VTNotes } from '@/components/ai-workspace/VTNotes';
import { Sparkles, MessageSquare, NotebookPen, FileEdit } from 'lucide-react';

const ComingSoon = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
      {title}
    </h2>
    <p className="text-muted-foreground max-w-md text-sm sm:text-base mb-6">{description}</p>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
      <div className="thinking-shimmer">Thinking...</div>
      Coming Soon
    </div>
  </div>
);

const AIWorkspace = () => {
  const [tab, setTab] = useState('mesh-chat');

  return (
    <MainLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
          <div className="border-b border-border bg-background px-2 sm:px-4 py-2 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-base sm:text-lg">AI Workspace</h1>
            </div>
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="mesh-chat" className="gap-1.5 text-xs sm:text-sm">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Mesh Chat</span>
                <span className="xs:hidden">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="vt-notes" className="gap-1.5 text-xs sm:text-sm">
                <NotebookPen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">VT Notes</span>
                <span className="xs:hidden">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="assignment" className="gap-1.5 text-xs sm:text-sm">
                <FileEdit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Unique Assignment Creator</span>
                <span className="sm:hidden">Assignment</span>
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
