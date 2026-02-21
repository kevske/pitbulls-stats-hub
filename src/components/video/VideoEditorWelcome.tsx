import { FileText, List, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoInput } from '@/components/video/VideoInput';

interface VideoEditorWelcomeProps {
  onLoadFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoSelect: (videoId: string, playlistId?: string) => void;
  onAddToQueue: (videoId: string) => void;
  showQueueOption: boolean;
}

export function VideoEditorWelcome({
  onLoadFile,
  fileInputRef,
  onFileSelect,
  onVideoSelect,
  onAddToQueue,
  showQueueOption
}: VideoEditorWelcomeProps) {
  return (
    <div className="max-w-2xl mx-auto mt-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Tag Basketball Events Live</h2>
        <p className="text-muted-foreground">
          Enter a YouTube URL, video ID, or playlist URL to start tagging, or load a saved project.
        </p>
      </div>

      {/* Input Options */}
      <div className="space-y-6">
        {/* Load File Option */}
        <div className="p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Load Saved Project</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Load a previously saved project to restore tags and video
          </p>
          <Button onClick={onLoadFile} className="w-full gap-2">
            <Upload className="h-4 w-4" />
            Load Project File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50"></div>
          <span className="text-sm text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border/50"></div>
        </div>

        {/* Video Input Option */}
        <div className="p-6 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <List className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Start New Project</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter a YouTube URL, video ID, or playlist URL to start tagging
          </p>
          <VideoInput
            onVideoSelect={onVideoSelect}
            onAddToQueue={onAddToQueue}
            showQueueOption={showQueueOption}
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="text-2xl mb-2">⏱️</div>
          <h3 className="font-semibold mb-1">Real-time Tagging</h3>
          <p className="text-xs text-muted-foreground">Tag events as they happen during playback</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold mb-1">Playlist Support</h3>
          <p className="text-xs text-muted-foreground">Process entire playlists with video queue</p>
        </div>
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-1">Easy Export</h3>
          <p className="text-xs text-muted-foreground">Copy timestamps for YouTube descriptions</p>
        </div>
      </div>
    </div>
  );
}
