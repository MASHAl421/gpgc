import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Camera, CameraOff, Mic, MicOff, Volume2, PhoneOff, Maximize2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tutor {
  id: string;
  name: string;
  avatar: string;
}

interface VideoChatProps {
  tutor: Tutor;
  isListening: boolean;
  onToggleMic: () => void;
  transcript: string;
  aiResponse: string;
  isAISpeaking: boolean;
  onEndCall: () => void;
}

export const VideoChat = ({
  tutor,
  isListening,
  onToggleMic,
  transcript,
  aiResponse,
  isAISpeaking,
  onEndCall
}: VideoChatProps) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState([75]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const speeds = [
    { label: 'Slow', value: 0.75 },
    { label: '1x', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
  ];

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (error) {
        console.error('Camera access denied:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Speed controls */}
      <div className="p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 max-w-xl mx-auto">
          <span className="text-sm text-muted-foreground font-medium">SPEED</span>
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            {speeds.map((speed) => (
              <Button
                key={speed.value}
                variant={playbackSpeed === speed.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPlaybackSpeed(speed.value)}
                className={cn(
                  "h-7 px-3 rounded-full text-xs",
                  playbackSpeed === speed.value && "shadow-md"
                )}
              >
                {speed.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative bg-secondary/20 overflow-hidden">
        {/* AI Tutor display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Animated background for AI */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-3xl transition-all duration-500",
              isAISpeaking && "scale-110 animate-pulse"
            )} />
            
            {/* AI Avatar */}
            <div className={cn(
              "relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-secondary to-card flex items-center justify-center text-8xl md:text-9xl shadow-2xl border-4 border-border transition-transform",
              isAISpeaking && "animate-bounce"
            )}>
              {tutor.avatar}
            </div>
            
            {/* Speaking indicator */}
            {isAISpeaking && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User camera preview */}
        <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-xl overflow-hidden border-2 border-border shadow-lg bg-card">
          {isCameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <CameraOff className="h-6 w-6 mb-1" />
              <span className="text-xs">Camera Off</span>
            </div>
          )}
        </div>

        {/* Conversation panel */}
        <div className="absolute bottom-4 left-4 right-52 max-w-lg">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border p-4 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              💬 Conversation
            </div>
            
            {/* Transcript */}
            {transcript && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-foreground">
                  <span className="font-medium">You: </span>
                  {transcript}
                </p>
              </div>
            )}
            
            {/* AI Response */}
            {aiResponse && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{tutor.name}: </span>
                  {aiResponse}
                </p>
              </div>
            )}
            
            {!transcript && !aiResponse && (
              <p className="text-sm text-muted-foreground italic">
                Click the microphone to start talking...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-center justify-center gap-3 max-w-xl mx-auto">
          {/* Camera toggle */}
          <Button
            variant={isCameraOn ? "default" : "outline"}
            size="lg"
            onClick={toggleCamera}
            className="h-12 w-12 rounded-full"
          >
            {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </Button>

          {/* Start Camera button */}
          <Button
            onClick={toggleCamera}
            className="h-12 px-6 rounded-full bg-primary text-primary-foreground"
          >
            {isCameraOn ? 'Stop Camera' : '▶ Start Camera'}
          </Button>

          {/* Mic toggle */}
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="lg"
            onClick={onToggleMic}
            className={cn(
              "h-12 w-12 rounded-full",
              isListening && "animate-pulse"
            )}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-24"
            />
          </div>

          {/* End call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="h-12 w-12 rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>

        {/* Live mode toggle */}
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <div className={cn(
              "w-3 h-3 rounded-full transition-colors",
              isListening ? "bg-success animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-sm font-medium text-foreground">Live Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};
