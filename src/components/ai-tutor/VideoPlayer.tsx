import { useState } from 'react';
import { Play, X, Youtube, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoPlayerProps {
  onClose?: () => void;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const suggestedVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Introduction to Programming' },
  { id: 'zOjov-2OZ0E', title: 'C++ Basics Tutorial' },
  { id: 'vLnPwxZdW4Y', title: 'English Grammar Essentials' },
];

export const VideoPlayer = ({ onClose }: VideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadVideo = () => {
    const id = extractYouTubeId(videoUrl);
    if (id) {
      setCurrentVideoId(id);
      setError(null);
    } else {
      setError('Invalid YouTube URL');
    }
  };

  const handleSuggestedVideo = (id: string) => {
    setCurrentVideoId(id);
    setVideoUrl(`https://youtube.com/watch?v=${id}`);
    setError(null);
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Youtube className="h-4 w-4 text-destructive" />
            Video Tutorials
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 overflow-auto">
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube link..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            className="text-sm"
          />
          <Button size="sm" onClick={handleLoadVideo}>
            <Play className="h-4 w-4" />
          </Button>
        </div>
        
        {error && <p className="text-sm text-destructive">{error}</p>}
        
        {currentVideoId ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-card">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="border-0"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Youtube className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Paste a YouTube link above</p>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Suggested Videos</p>
          {suggestedVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => handleSuggestedVideo(video.id)}
              className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-2 text-sm"
            >
              <LinkIcon className="h-3 w-3 text-muted-foreground" />
              {video.title}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
