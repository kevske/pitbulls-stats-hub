import { TaggedEvent, Player } from '@/types/basketball';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Check, Upload, Save, FolderOpen } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  SaveData,
  generateSaveData,
  downloadSaveFile,
  downloadYouTubeTimestamps,
  loadSaveFile,
  hasUnsavedChanges
} from '@/services/saveLoad';

interface ExportPanelProps {
  events: TaggedEvent[];
  players: Player[];
  videoId?: string;
  playlistId?: string;
  onLoadData?: (saveData: SaveData) => void;
  lastSavedData?: SaveData | null;
}

export function ExportPanel({
  events,
  players,
  videoId,
  playlistId,
  onLoadData,
  lastSavedData
}: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const timestampList = sortedEvents
    .map((event) => `${event.formattedTime} - ${event.description}`)
    .join('\n');

  const hasUnsaved = hasUnsavedChanges(players, events, lastSavedData || null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(timestampList);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadTimestamps = () => {
    downloadYouTubeTimestamps(events);
    toast.success('YouTube timestamps downloaded!');
  };

  const handleSaveProject = () => {
    const saveData = generateSaveData(players, events, videoId, playlistId);
    downloadSaveFile(saveData);
    toast.success('Project saved successfully!');
  };

  const handleLoadProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const saveData = await loadSaveFile(file);
      onLoadData?.(saveData);
      toast.success('Project loaded successfully!');
    } catch (error) {
      toast.error('Failed to load project: ' + (error as Error).message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Export & Save</h3>
          {hasUnsaved && (
            <span className="text-xs bg-orange-500/20 text-orange-600 px-2 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={handleLoadProject} className="w-full gap-1">
          <FolderOpen className="h-3 w-3" />
          Load File
        </Button>
        <Button variant="outline" size="sm" onClick={handleSaveProject} className="w-full gap-1">
          <Save className="h-3 w-3" />
          Save File
        </Button>
      </div>

      {/* Export Options */}
      <div className="flex gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={handleDownloadTimestamps} className="flex-1 gap-1">
          <Download className="h-3 w-3" />
          YouTube
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Textarea
        readOnly
        value={timestampList}
        className="font-mono text-xs h-32 bg-background/50 resize-none"
        placeholder="Your timestamps will appear here..."
      />

      <div className="mt-2 text-xs text-muted-foreground">
        {events.length} events • Total duration: {Math.floor((sortedEvents[sortedEvents.length - 1]?.timestamp || 0) / 60)}:{Math.floor((sortedEvents[sortedEvents.length - 1]?.timestamp || 0) % 60).toString().padStart(2, '0')}
      </div>
    </Card>
  );
}
