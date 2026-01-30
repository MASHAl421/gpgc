import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSemesterOnboarding } from '@/hooks/useSemesterOnboarding';
import { createNotification } from '@/hooks/useNotifications';
import { useForumPoints, FORUM_POINTS } from '@/hooks/useForumPoints';
import { ForumSidebar } from '@/components/forum/ForumSidebar';
import { ForumUserBadge } from '@/components/forum/ForumUserBadge';
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
  Send,
  MoreVertical,
  Trash2,
  Edit,
  Flag,
  Share2,
  Check
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
  const { user, profile } = useAuth();
  const { profileData } = useSemesterOnboarding();
  const { awardPoints, refetch: refetchPoints } = useForumPoints();
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
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [userPostUpvotes, setUserPostUpvotes] = useState<Set<string>>(new Set());
  const [userReplyUpvotes, setUserReplyUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [profileData?.semester]);

  useEffect(() => {
    if (user) {
      fetchUserUpvotes();
    }
  }, [user]);

  const fetchUserUpvotes = async () => {
    if (!user) return;
    
    try {
      const { data: postUpvotes } = await supabase
        .from('forum_post_upvotes')
        .select('post_id')
        .eq('user_id', user.id);
      
      const { data: replyUpvotes } = await supabase
        .from('forum_reply_upvotes')
        .select('reply_id')
        .eq('user_id', user.id);
      
      setUserPostUpvotes(new Set((postUpvotes || []).map(u => u.post_id)));
      setUserReplyUpvotes(new Set((replyUpvotes || []).map(u => u.reply_id)));
    } catch (error) {
      console.error('Error fetching user upvotes:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      let subjectQuery = supabase.from('subjects').select('id, name');
      if (profileData?.semester) {
        subjectQuery = subjectQuery.eq('semester', profileData.semester);
      }
      const { data: subjectsData } = await subjectQuery;
      setSubjects(subjectsData || []);

      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const userIds = [...new Set((postsData || []).map((p) => p.user_id))];
      
      let profiles: { id: string; username: string }[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      const { data: replyCounts } = await supabase
        .from('forum_replies')
        .select('post_id');

      const replyCountMap: Record<string, number> = {};
      (replyCounts || []).forEach((r) => {
        replyCountMap[r.post_id] = (replyCountMap[r.post_id] || 0) + 1;
      });

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
      const { data, error } = await supabase.from('forum_posts').insert({
        user_id: user.id,
        title: newPostTitle,
        content: newPostContent,
        subject_id: newPostSubject === 'general' ? null : newPostSubject || null,
      }).select().single();

      if (error) throw error;

      // Award points for creating a post
      await awardPoints('new_post', FORUM_POINTS.NEW_POST, data?.id, 'Created a new discussion');

      toast.success('Post created successfully! +' + FORUM_POINTS.NEW_POST + ' points');
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
      const { data, error } = await supabase.from('forum_replies').insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: replyContent,
      }).select().single();

      if (error) throw error;

      // Award points for adding a reply
      await awardPoints('new_reply', FORUM_POINTS.NEW_REPLY, data?.id, 'Added a reply to a discussion');

      // Send notification to post owner (only if not replying to own post)
      if (selectedPost.user_id !== user.id) {
        await createNotification(
          selectedPost.user_id,
          'new_reply',
          'New reply on your discussion',
          `${profile?.username || 'Someone'} replied to "${selectedPost.title.substring(0, 50)}${selectedPost.title.length > 50 ? '...' : ''}"`,
          selectedPost.id,
          user.id
        );
      }

      toast.success('Reply posted! +' + FORUM_POINTS.NEW_REPLY + ' points');
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

  const handleDeletePost = async (postId: string) => {
    try {
      // First delete all replies
      await supabase.from('forum_replies').delete().eq('post_id', postId);
      
      // Then delete the post
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      
      if (error) throw error;
      
      toast.success('Discussion deleted');
      setSelectedPost(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete discussion');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const { error } = await supabase.from('forum_replies').delete().eq('id', replyId);
      
      if (error) throw error;
      
      toast.success('Reply deleted');
      if (selectedPost) {
        fetchReplies(selectedPost.id);
      }
      fetchData();
    } catch (error: any) {
      console.error('Error deleting reply:', error);
      toast.error(error.message || 'Failed to delete reply');
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !editTitle.trim() || !editContent.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .update({ title: editTitle, content: editContent })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast.success('Post updated!');
      setEditingPost(null);
      fetchData();
      if (selectedPost?.id === editingPost.id) {
        setSelectedPost({ ...selectedPost, title: editTitle, content: editContent });
      }
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error(error.message || 'Failed to update post');
    }
  };

  const handleUpvotePost = async (postId: string, currentUpvotes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to upvote');
      return;
    }

    const hasUpvoted = userPostUpvotes.has(postId);
    const post = posts.find(p => p.id === postId);

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase.from('forum_post_upvotes').delete().eq('post_id', postId).eq('user_id', user.id);
        await supabase.from('forum_posts').update({ upvotes: Math.max(0, currentUpvotes - 1) }).eq('id', postId);
        
        setUserPostUpvotes(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: Math.max(0, p.upvotes - 1) } : p));
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, upvotes: Math.max(0, selectedPost.upvotes - 1) });
        }
      } else {
        // Add upvote
        await supabase.from('forum_post_upvotes').insert({ post_id: postId, user_id: user.id });
        await supabase.from('forum_posts').update({ upvotes: currentUpvotes + 1 }).eq('id', postId);
        
        setUserPostUpvotes(prev => new Set(prev).add(postId));
        setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
        if (selectedPost?.id === postId) {
          setSelectedPost({ ...selectedPost, upvotes: selectedPost.upvotes + 1 });
        }

        // Send notification to post owner (only if not upvoting own post)
        if (post && post.user_id !== user.id) {
          await createNotification(
            post.user_id,
            'post_upvote',
            'Someone liked your discussion',
            `${profile?.username || 'Someone'} liked "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}"`,
            postId,
            user.id
          );
        }
      }
    } catch (error: any) {
      console.error('Error toggling upvote:', error);
    }
  };

  const handleUpvoteReply = async (replyId: string, currentUpvotes: number) => {
    if (!user) {
      toast.error('Please login to upvote');
      return;
    }

    const hasUpvoted = userReplyUpvotes.has(replyId);
    const reply = replies.find(r => r.id === replyId);

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase.from('forum_reply_upvotes').delete().eq('reply_id', replyId).eq('user_id', user.id);
        await supabase.from('forum_replies').update({ upvotes: Math.max(0, currentUpvotes - 1) }).eq('id', replyId);
        
        setUserReplyUpvotes(prev => {
          const next = new Set(prev);
          next.delete(replyId);
          return next;
        });
        setReplies(replies.map(r => r.id === replyId ? { ...r, upvotes: Math.max(0, r.upvotes - 1) } : r));
      } else {
        // Add upvote
        await supabase.from('forum_reply_upvotes').insert({ reply_id: replyId, user_id: user.id });
        await supabase.from('forum_replies').update({ upvotes: currentUpvotes + 1 }).eq('id', replyId);
        
        setUserReplyUpvotes(prev => new Set(prev).add(replyId));
        setReplies(replies.map(r => r.id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r));

        // Send notification to reply owner (only if not upvoting own reply)
        if (reply && reply.user_id !== user.id) {
          await createNotification(
            reply.user_id,
            'reply_upvote',
            'Someone liked your reply',
            `${profile?.username || 'Someone'} liked your reply`,
            selectedPost?.id || replyId,
            user.id
          );
        }
      }
    } catch (error: any) {
      console.error('Error toggling reply upvote:', error);
    }
  };

  const handleMarkAsAnswer = async (replyId: string) => {
    if (!selectedPost || selectedPost.user_id !== user?.id) {
      toast.error('Only the post author can mark answers');
      return;
    }

    const reply = replies.find(r => r.id === replyId);

    try {
      // Unmark all other replies first
      await supabase
        .from('forum_replies')
        .update({ is_accepted_answer: false })
        .eq('post_id', selectedPost.id);

      // Mark this reply as answer
      const { error: replyError } = await supabase
        .from('forum_replies')
        .update({ is_accepted_answer: true })
        .eq('id', replyId);

      if (replyError) throw replyError;

      // Mark post as answered
      const { error: postError } = await supabase
        .from('forum_posts')
        .update({ is_answered: true })
        .eq('id', selectedPost.id);

      if (postError) throw postError;

      // Award points to the user whose answer was accepted (if not the post author)
      if (reply && reply.user_id !== selectedPost.user_id) {
        // Award points via their own transaction (they need to do it themselves due to RLS)
        // For now, we'll just show the notification - in production, you'd use a database function
        await createNotification(
          reply.user_id,
          'best_answer',
          'Your answer was accepted!',
          `Your reply on "${selectedPost.title.substring(0, 50)}${selectedPost.title.length > 50 ? '...' : ''}" was marked as the best answer! +${FORUM_POINTS.BEST_ANSWER} points`,
          selectedPost.id,
          user.id
        );
      }

      toast.success('Marked as answer!');
      setSelectedPost({ ...selectedPost, is_answered: true });
      fetchReplies(selectedPost.id);
      fetchData();
    } catch (error: any) {
      console.error('Error marking answer:', error);
      toast.error(error.message || 'Failed to mark as answer');
    }
  };

  const handleShare = async (post: ForumPost) => {
    const url = `${window.location.origin}/forum?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
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

  const openEditPost = (post: ForumPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
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
                      <SelectItem value="general">General</SelectItem>
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
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">{getSubjectName(selectedPost.subject_id)}</Badge>
                        {selectedPost.is_answered && (
                          <Badge className="bg-emerald-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(selectedPost.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      
                      {/* Post Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleShare(selectedPost)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          {user?.id === selectedPost.user_id && (
                            <>
                              <DropdownMenuItem onClick={(e) => openEditPost(selectedPost, e)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingPostId(selectedPost.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {user?.id !== selectedPost.user_id && (
                            <DropdownMenuItem>
                              <Flag className="h-4 w-4 mr-2" />
                              Report
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-foreground">{selectedPost.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">by {selectedPost.username}</span>
                      <ForumUserBadge userId={selectedPost.user_id} />
                    </div>
                    <p className="text-foreground mt-4 whitespace-pre-wrap">{selectedPost.content}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 hover:text-primary ${userPostUpvotes.has(selectedPost.id) ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={(e) => handleUpvotePost(selectedPost.id, selectedPost.upvotes, e)}
                      >
                        <ThumbsUp className={`h-4 w-4 ${userPostUpvotes.has(selectedPost.id) ? 'fill-primary' : ''}`} />
                        {selectedPost.upvotes}
                      </Button>
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
                    <div 
                      key={reply.id} 
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        reply.is_accepted_answer ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {reply.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm">{reply.username}</span>
                            <ForumUserBadge userId={reply.user_id} />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                            </span>
                            {reply.is_accepted_answer && (
                              <Badge className="bg-emerald-500 text-white text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Answer
                              </Badge>
                            )}
                          </div>
                          
                          {/* Reply Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              {user?.id === selectedPost.user_id && !reply.is_accepted_answer && (
                                <DropdownMenuItem onClick={() => handleMarkAsAnswer(reply.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Mark as Answer
                                </DropdownMenuItem>
                              )}
                              {user?.id === reply.user_id && (
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeletingReplyId(reply.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {user?.id !== reply.user_id && (
                                <DropdownMenuItem>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Report
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-foreground text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 gap-1 text-xs hover:text-primary ${userReplyUpvotes.has(reply.id) ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => handleUpvoteReply(reply.id, reply.upvotes)}
                          >
                            <ThumbsUp className={`h-3 w-3 ${userReplyUpvotes.has(reply.id) ? 'fill-primary' : ''}`} />
                            {reply.upvotes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Reply Input */}
                {user ? (
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
                ) : (
                  <p className="text-center text-muted-foreground py-4 border-t border-border">
                    Please login to reply
                  </p>
                )}
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
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary">{getSubjectName(post.subject_id)}</Badge>
                              {post.is_answered && (
                                <Badge className="bg-emerald-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Answered
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(post.created_at), 'MMM d')}
                              </span>
                            </div>
                            
                            {/* Quick Actions */}
                            {user?.id === post.user_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={(e) => openEditPost(post, e)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingPostId(post.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">by {post.username}</span>
                            <ForumUserBadge userId={post.user_id} />
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 gap-1 text-sm p-0 hover:text-primary ${userPostUpvotes.has(post.id) ? 'text-primary' : 'text-muted-foreground'}`}
                              onClick={(e) => handleUpvotePost(post.id, post.upvotes, e)}
                            >
                              <ThumbsUp className={`h-4 w-4 ${userPostUpvotes.has(post.id) ? 'fill-primary' : ''}`} />
                              {post.upvotes}
                            </Button>
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

            {/* Sidebar - Replace old sidebar with ForumSidebar component */}
            <div className="space-y-4">
              <ForumSidebar />
              
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
                  <CardTitle className="text-foreground">Forum Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Discussions</span>
                    <span className="font-semibold text-foreground">{posts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Answered</span>
                    <span className="font-semibold text-primary">
                      {posts.filter(p => p.is_answered).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unanswered</span>
                    <span className="font-semibold text-destructive">
                      {posts.filter(p => !p.is_answered).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Discussion</DialogTitle>
            <DialogDescription>Make changes to your discussion post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Details</Label>
              <Textarea
                id="edit-content"
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
            <Button onClick={handleEditPost}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discussion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your discussion and all its replies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingPostId) handleDeletePost(deletingPostId);
                setDeletingPostId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Reply Confirmation */}
      <AlertDialog open={!!deletingReplyId} onOpenChange={() => setDeletingReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your reply. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingReplyId) handleDeleteReply(deletingReplyId);
                setDeletingReplyId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Forum;
