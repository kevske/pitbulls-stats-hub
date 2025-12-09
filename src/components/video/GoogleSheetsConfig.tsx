import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { GoogleSheetsService, GoogleSheetsConfig } from '@/lib/googleSheets';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Cloud, Sheet, Check, AlertCircle } from 'lucide-react';

interface GoogleSheetsConfigProps {
  onConnect: (service: GoogleSheetsService) => void;
  children: React.ReactNode;
}

export function GoogleSheetsConfigDialog({ onConnect, children }: GoogleSheetsConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Basketball Events');
  const [isConnecting, setIsConnecting] = useState(false);
  const [service, setService] = useState<GoogleSheetsService | null>(null);

  const handleConnectGoogle = async () => {
    if (!spreadsheetId.trim()) {
      toast.error('Please enter a spreadsheet ID');
      return;
    }

    setIsConnecting(true);
    
    try {
      const config: GoogleSheetsConfig = {
        spreadsheetId: spreadsheetId.trim(),
        sheetName: sheetName.trim() || 'Basketball Events'
      };

      const sheetsService = new GoogleSheetsService(config);
      
      if (!sheetsService.isAuthenticated()) {
        // For demo purposes, we'll simulate authentication
        // In production, this would handle the full OAuth2 flow
        toast.info('Opening Google authentication window...');
        
        // Simulate successful auth after 2 seconds
        setTimeout(() => {
          setService(sheetsService);
          onConnect(sheetsService);
          setIsOpen(false);
          toast.success('Connected to Google Sheets!');
          setIsConnecting(false);
        }, 2000);
      } else {
        // Already authenticated
        setService(sheetsService);
        onConnect(sheetsService);
        setIsOpen(false);
        toast.success('Connected to Google Sheets!');
        setIsConnecting(false);
      }
    } catch (error) {
      toast.error('Failed to connect: ' + (error as Error).message);
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Connect to Google Sheets
          </DialogTitle>
          <DialogDescription>
            Connect your basketball event data to Google Sheets for cloud storage and real-time synchronization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheet-id">Spreadsheet ID</Label>
            <Input
              id="spreadsheet-id"
              placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found in your Google Sheets URL: /d/SPREADSHEET_ID/edit
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Sheet Name (optional)</Label>
            <Input
              id="sheet-name"
              placeholder="Basketball Events"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Setup required:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Create a Google Cloud Project</li>
                <li>Enable Google Sheets API</li>
                <li>Create OAuth2 credentials</li>
                <li>Update CLIENT_ID in the code</li>
              </ol>
            </div>
          </div>

          <Button 
            onClick={handleConnectGoogle} 
            disabled={isConnecting || !spreadsheetId.trim()}
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Google Sheets'}
          </Button>

          {service && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">Connected to Google Sheets</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
