import { List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoEditorHeaderProps {
  isPlaylistMode: boolean;
  isSideMenuOpen: boolean;
  setIsSideMenuOpen: (open: boolean) => void;
  onClose: () => void;
}

export function VideoEditorHeader({
  isPlaylistMode,
  isSideMenuOpen,
  setIsSideMenuOpen,
  onClose
}: VideoEditorHeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <h1 className="text-xl font-bold">Basketball Event Tagger</h1>
          </div>
          <div className="flex items-center gap-2">
            {isPlaylistMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
                className="h-8 px-3 gap-2"
              >
                <List className="h-4 w-4" />
                Show Queue
              </Button>
            )}
            {/* Close Editor Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Editor schließen
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
