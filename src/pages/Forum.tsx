import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  ThumbsUp, 
  MessageCircle,
  Plus,
  Search,
  Clock,
  Loader2,
  CheckCircle,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

interface Subject {
  id: string;
  name: string;
}

interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject_id: string | null;
  upvotes: number;
  is_answered: boolean;
  created_at: string;
  username?: string;
  reply_count?: number;
}

interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_accepted_answer: boolean;
  upvotes: number;
  created_at: string;
  username?: string;
}

const Forum = () => {
  const { user } = useAuth();
  const { profileData } = useSemesterOnboarding();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostSubject, setNewPostSubject] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profileData?.semester]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch subjects
      let subjectQuery = supabase.from('subjects').select('id, name');
      if (profileData?.semester) {
        subjectQuery = subjectQuery.eq('semester', profileData.semester);
      }
      const { data: subjectsData } = await subjectQuery;
      setSubjects(subjectsData || []);

      // Fetch posts with user info
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get unique user IDs
      const userIds = [...new Set((postsData || []).map((p) => p.user_id))];
      
      // Fetch usernames
      let profiles: { id: string; username: string }[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      // Fetch reply counts
      const { data: replyCounts } = await supabase
        .from('forum_replies')
        .select('post_id');

      const replyCountMap: Record<string, number> = {};
      (replyCounts || []).forEach((r) => {
        replyCountMap[r.post_id] = (replyCountMap[r.post_id] || 0) + 1;
      });

      // Combine data
      const enrichedPosts = (postsData || []).map((post) => ({
        ...post,
        username: profiles.find((p) => p.id === post.user_id)?.username || 'Unknown',
        reply_count: replyCountMap[post.id] || 0,
      }));

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching forum data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (postId: string) => {
    setLoadingReplies(true);
    try {
      const { data: repliesData, error } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get usernames
      const userIds = [...new Set((repliesData || []).map((r) => r.user_id))];
      let profiles: { id: string; username: string }[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      const enrichedReplies = (repliesData || []).map((reply) => ({
        ...reply,
        username: profiles.find((p) => p.id === reply.user_id)?.username || 'Unknown',
      }));

      setReplies(enrichedReplies);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handlePostClick = (post: ForumPost) => {
    setSelectedPost(post);
    fetchReplies(post.id);
  };

  const handleCreatePost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: newPostTitle,
        content: newPostContent,
        subject_id: newPostSubject || null,
      });

      if (error) throw error;

      toast.success('Post created successfully!');
      setNewPostOpen(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostSubject('');
      fetchData();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) {
      toast.error('Please write a reply');
      return;
    }

    setSubmittingReply(true);
    try {
      const { error } = await supabase.from('forum_replies').insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: replyContent,
      });

      if (error) throw error;

      toast.success('Reply posted!');
      setReplyContent('');
      fetchReplies(selectedPost.id);
      fetchData();
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast.error(error.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'General';
    return subjects.find((s) => s.id === subjectId)?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              Discussion Forum
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Ask questions and help fellow students
            </p>
          </div>
          <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What's your question?"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (optional)</Label>
                  <Select value={newPostSubject} onValueChange={setNewPostSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Details</Label>
                  <Textarea
                    id="content"
                    placeholder="Provide more details about your question..."
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreatePost} disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Post Discussion
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedPost ? (
          /* Post Detail View */
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedPost(null)}>
              ← Back to discussions
            </Button>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="hidden sm:flex">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {selectedPost.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{getSubjectName(selectedPost.subject_id)}</Badge>
                      {selectedPost.is_answered && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Answered
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(selectedPost.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">{selectedPost.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">by {selectedPost.username}</p>
                    <p className="text-foreground mt-4 whitespace-pre-wrap">{selectedPost.content}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        {selectedPost.upvotes}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageCircle className="h-4 w-4" />
                        {replies.length} replies
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Replies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingReplies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No replies yet. Be the first to help!
                  </p>
                ) : (
                  replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {reply.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">{reply.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                          </span>
                          {reply.is_accepted_answer && (
                            <Badge className="bg-green-500 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Answer
                            </Badge>
                          )}
                        </div>
                        <p className="text-foreground text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {/* Reply Input */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleSubmitReply} disabled={submittingReply}>
                    {submittingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Post List View */
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
              {filteredPosts.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No discussions yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">Be the first to start a discussion!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="bg-card border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="hidden sm:flex">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {post.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary">{getSubjectName(post.subject_id)}</Badge>
                            {post.is_answered && (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Answered
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(post.created_at), 'MMM d')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">by {post.username}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ThumbsUp className="h-4 w-4" />
                              {post.upvotes}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageCircle className="h-4 w-4" />
                              {post.reply_count} replies
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Popular Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge key={subject.id} variant="outline" className="cursor-pointer hover:bg-muted">
                        {subject.name}
                      </Badge>
                    ))}
                    {subjects.length === 0 && (
                      <p className="text-sm text-muted-foreground">No subjects available</p>
                    )}
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
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  <Button className="w-full" onClick={() => setNewPostOpen(true)}>
                    Submit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Forum;
