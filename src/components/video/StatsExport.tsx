import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Database } from 'lucide-react';
import { SaveData } from '@/services/saveLoad';
import { extractStatsFromVideoData, exportStatsToCSV } from '@/services/statsExtraction';
import { toast } from 'sonner';

interface StatsExportProps {
  saveData: SaveData;
}

export function StatsExport({ saveData }: StatsExportProps) {
  const handleExportCSV = () => {
    try {
      const extractedStats = extractStatsFromVideoData(saveData);
      const csvData = exportStatsToCSV(extractedStats);

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `basketball-stats-${saveData.videoId || 'game'}-${timestamp}.csv`;
      a.download = filename;

      a.click();
      URL.revokeObjectURL(url);

      toast.success('Stats exported to CSV successfully!');
    } catch (error) {
      toast.error('Failed to export stats: ' + (error as Error).message);
    }
  };

  const handleExportJSON = () => {
    try {
      const extractedStats = extractStatsFromVideoData(saveData);
      const jsonData = JSON.stringify(extractedStats, null, 2);

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `basketball-stats-${saveData.videoId || 'game'}-${timestamp}.json`;
      a.download = filename;

      a.click();
      URL.revokeObjectURL(url);

      toast.success('Stats exported to JSON successfully!');
    } catch (error) {
      toast.error('Failed to export stats: ' + (error as Error).message);
    }
  };

  const handleExportRawData = () => {
    try {
      const jsonData = JSON.stringify(saveData, null, 2);

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `basketball-raw-data-${saveData.videoId || 'game'}-${timestamp}.json`;
      a.download = filename;

      a.click();
      URL.revokeObjectURL(url);

      toast.success('Raw data exported successfully!');
    } catch (error) {
      toast.error('Failed to export raw data: ' + (error as Error).message);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={saveData.events.length === 0}
        >
          <FileText className="h-3 w-3 mr-2" />
          Export as CSV
          <span className="text-xs text-muted-foreground ml-auto">
            {saveData.events.length} events
          </span>
        </Button>

        <Button
          onClick={handleExportJSON}
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={saveData.events.length === 0}
        >
          <Database className="h-3 w-3 mr-2" />
          Export as JSON
          <span className="text-xs text-muted-foreground ml-auto">
            Processed stats
          </span>
        </Button>

        <Button
          onClick={handleExportRawData}
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={saveData.events.length === 0}
        >
          <Database className="h-3 w-3 mr-2" />
          Export Raw Data
          <span className="text-xs text-muted-foreground ml-auto">
            Original format
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
