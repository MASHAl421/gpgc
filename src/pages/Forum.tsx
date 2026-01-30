import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  ThumbsUp, 
  MessageCircle,
  Plus,
  Search,
  Clock
} from 'lucide-react';

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const discussions = [
    {
      id: 1,
      title: "Can someone explain Gauss's Law in simple terms?",
      author: 'Ahmed K.',
      subject: 'Physics',
      replies: 12,
      likes: 24,
      time: '2 hours ago',
    },
    {
      id: 2,
      title: 'Best study technique for memorizing chemical formulas?',
      author: 'Sara M.',
      subject: 'Chemistry',
      replies: 8,
      likes: 15,
      time: '4 hours ago',
    },
    {
      id: 3,
      title: 'Tips for solving integration problems quickly',
      author: 'Ali R.',
      subject: 'Mathematics',
      replies: 20,
      likes: 35,
      time: '1 day ago',
    },
    {
      id: 4,
      title: 'Understanding cell division - mitosis vs meiosis',
      author: 'Fatima A.',
      subject: 'Biology',
      replies: 15,
      likes: 28,
      time: '2 days ago',
    },
  ];

  const popularTags = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Exam Tips', 'Past Papers'];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Discussion Forum
            </h1>
            <p className="text-muted-foreground mt-1">
              Ask questions and help fellow students
            </p>
          </div>
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            New Discussion
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                className="pl-10 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Discussion List */}
            {discussions.map((discussion) => (
              <Card key={discussion.id} className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {discussion.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">{discussion.subject}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {discussion.time}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                        {discussion.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">by {discussion.author}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          {discussion.likes}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {discussion.replies} replies
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Question</CardTitle>
                <CardDescription>Ask a quick question</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Type your question..."
                  className="resize-none bg-background"
                  rows={3}
                />
                <Button className="w-full">Submit</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Forum;
