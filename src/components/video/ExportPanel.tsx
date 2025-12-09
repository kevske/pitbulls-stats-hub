import { TaggedEvent, Player } from '@/types/basketball';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Check, Upload, Save, FolderOpen, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { 
  SaveData, 
  generateSaveData, 
  downloadSaveFile, 
  downloadYouTubeTimestamps,
  loadSaveFile,
  hasUnsavedChanges
} from '@/lib/saveLoad';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { GoogleSheetsConfigDialog } from '@/components/video/GoogleSheetsConfig';

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
  const [sheetsService, setSheetsService] = useState<GoogleSheetsService | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSheetsConnect = (service: GoogleSheetsService) => {
    setSheetsService(service);
  };

  const handleSyncToSheets = async () => {
    if (!sheetsService) return;

    setIsSyncing(true);
    try {
      // Initialize spreadsheet if needed
      await sheetsService.initializeSpreadsheet();
      
      // Save events and players
      await sheetsService.saveEvents(events, videoId);
      await sheetsService.savePlayers(players);
      
      toast.success('Data synced to Google Sheets!');
    } catch (error) {
      toast.error('Failed to sync: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadFromSheets = async () => {
    if (!sheetsService) return;

    setIsSyncing(true);
    try {
      const { events: sheetsEvents, videoId: sheetsVideoId } = await sheetsService.loadEvents();
      const sheetsPlayers = await sheetsService.loadPlayers();
      
      const saveData: SaveData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        videoId: sheetsVideoId,
        players: sheetsPlayers,
        events: sheetsEvents,
        metadata: {
          totalEvents: sheetsEvents.length,
          totalTimeSpan: sheetsEvents.length > 0 
            ? Math.max(...sheetsEvents.map(e => e.timestamp))
            : 0,
          exportFormat: 'youtube-timestamps'
        }
      };
      
      onLoadData?.(saveData);
      toast.success('Data loaded from Google Sheets!');
    } catch (error) {
      toast.error('Failed to load: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportFromSheets = async () => {
    if (!sheetsService) return;

    try {
      const textData = await sheetsService.exportToText();
      
      // Download the exported text
      const blob = new Blob([textData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sheets-timestamps.txt';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Exported from Google Sheets!');
    } catch (error) {
      toast.error('Failed to export: ' + (error as Error).message);
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
          {sheetsService && (
            <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              Connected
            </span>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Local Storage */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" onClick={handleLoadProject} className="w-full gap-1">
            <FolderOpen className="h-3 w-3" />
            Load File
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveProject} className="w-full gap-1">
            <Save className="h-3 w-3" />
            Save File
          </Button>
        </div>
        
        {/* Google Sheets */}
        <div className="space-y-2">
          {!sheetsService ? (
            <GoogleSheetsConfigDialog onConnect={handleSheetsConnect}>
              <Button variant="outline" size="sm" className="w-full gap-1">
                <Cloud className="h-3 w-3" />
                Connect Sheets
              </Button>
            </GoogleSheetsConfigDialog>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncToSheets} 
                disabled={isSyncing}
                className="w-full gap-1"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Cloud className="h-3 w-3" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync to Sheets'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadFromSheets} 
                disabled={isSyncing}
                className="w-full gap-1"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Load from Sheets
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Export Options */}
      <div className="flex gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={handleDownloadTimestamps} className="flex-1 gap-1">
          <Download className="h-3 w-3" />
          YouTube
        </Button>
        {sheetsService && (
          <Button variant="outline" size="sm" onClick={handleExportFromSheets} className="flex-1 gap-1">
            <Download className="h-3 w-3" />
            Export Sheets
          </Button>
        )}
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
