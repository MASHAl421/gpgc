import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type Message = { role: 'user' | 'assistant'; content: string };

interface ChatSession {
  id: string;
  title: string | null;
  subject_id: string | null;
  topic_id: string | null;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export const useChatHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Type assertion for the messages field
      const typedData = (data || []).map(session => ({
        ...session,
        messages: (session.messages as unknown as Message[]) || []
      }));
      
      setChatSessions(typedData);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createNewSession = useCallback(async (
    subjectId?: string | null, 
    topicId?: string | null
  ): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          subject_id: subjectId || null,
          topic_id: topicId || null,
          messages: [],
          title: 'New Chat',
        })
        .select()
        .single();

      if (error) throw error;
      
      const newSession: ChatSession = {
        ...data,
        messages: []
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat session',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  const updateSession = useCallback(async (
    sessionId: string, 
    messages: Message[], 
    title?: string
  ) => {
    if (!user) return;
    
    try {
      const updateData: { messages: Message[]; title?: string } = { messages };
      if (title) updateData.title = title;
      
      const { error } = await supabase
        .from('chat_history')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setChatSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, messages, ...(title && { title }) }
          : session
      ));
    } catch (error) {
      console.error('Error updating chat session:', error);
    }
  }, [user]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat session',
        variant: 'destructive',
      });
    }
  }, [user, currentSessionId, toast]);

  const loadSession = useCallback((sessionId: string): Message[] => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      return session.messages;
    }
    return [];
  }, [chatSessions]);

  return {
    chatSessions,
    currentSessionId,
    isLoading,
    fetchChatHistory,
    createNewSession,
    updateSession,
    deleteSession,
    loadSession,
    setCurrentSessionId,
  };
};
