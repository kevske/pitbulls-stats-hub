import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useStats } from '@/contexts/StatsContext';
import { MinutesService, PlayerMinutesData } from '@/lib/minutesService';
import { Save, Clock, Users, AlertCircle } from 'lucide-react';

interface PlayerMinutes {
  playerId: string;
  minutes: number;
}

interface MinutesPlayedInputProps {
  gameNumber: number;
  onSuccess?: () => void;
}

const MinutesPlayedInput: React.FC<MinutesPlayedInputProps> = ({ gameNumber, onSuccess }) => {
  const { players } = useStats();
  const [playerMinutes, setPlayerMinutes] = useState<PlayerMinutes[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{
    totalMinutes: number;
    playersWithMinutes: number;
    playersNeedingMinutes: number;
  } | null>(null);

  // Load player minutes data when component loads
  useEffect(() => {
    const loadPlayerMinutes = async () => {
      try {
        setLoading(true);
        
        // Get players who need minutes data for this game
        const playersData = await MinutesService.getPlayersNeedingMinutes(gameNumber);
        
        // Get summary data
        const summaryData = await MinutesService.getGameMinutesSummary(gameNumber);
        setSummary(summaryData);
        
        // Convert to our component format
        const componentData = playersData.map(player => ({
          playerId: player.playerSlug,
          minutes: player.minutes
        }));
        
        setPlayerMinutes(componentData);
      } catch (error) {
        console.error('Error loading player minutes:', error);
        toast.error('Fehler beim Laden der Spielerdaten');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerMinutes();
  }, [gameNumber]);

  const handleMinutesChange = (playerId: string, minutes: string) => {
    const minutesNum = parseInt(minutes) || 0;
    
    // Validate minutes (should be between 0 and 60 for a basketball game with possible overtime)
    if (minutesNum < 0 || minutesNum > 60) {
      toast.error('Minuten müssen zwischen 0 und 60 liegen');
      return;
    }

    setPlayerMinutes(prev => 
      prev.map(pm => 
        pm.playerId === playerId ? { ...pm, minutes: minutesNum } : pm
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Validate that at least one player has minutes > 0
      const hasValidMinutes = playerMinutes.some(pm => pm.minutes > 0);
      if (!hasValidMinutes) {
        toast.error('Mindestens ein Spieler muss mehr als 0 Minuten haben');
        setSaving(false);
        return;
      }

      // Save to database using the service
      const success = await MinutesService.updatePlayerMinutes(gameNumber, playerMinutes);
      
      if (success) {
        toast.success(`Minuten für Spiel ${gameNumber} erfolgreich gespeichert!`);
        
        // Refresh summary data
        const updatedSummary = await MinutesService.getGameMinutesSummary(gameNumber);
        setSummary(updatedSummary);
        
        onSuccess?.();
      } else {
        toast.error('Fehler beim Speichern der Minuten');
      }
      
    } catch (error) {
      console.error('Error saving minutes:', error);
      toast.error('Fehler beim Speichern der Minuten');
    } finally {
      setSaving(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    // Try to get player name from our local players data first
    const player = players.find(p => p.id === playerId || p.slug === playerId);
    if (player) {
      return `${player.firstName} ${player.lastName}`;
    }
    
    // If not found in local data, try to extract from slug
    const parts = playerId.split('-');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
    }
    
    return playerId;
  };

  const getPlayerJerseyNumber = (playerId: string) => {
    const player = players.find(p => p.id === playerId || p.slug === playerId);
    return player?.jerseyNumber || '?';
  };

  const getTotalMinutes = () => {
    return playerMinutes.reduce((sum, pm) => sum + pm.minutes, 0);
  };

  if (playerMinutes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Lade Spielerdaten...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Spielminuten - Spieltag {gameNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playerMinutes.map(({ playerId, minutes }) => (
            <div key={playerId} className="space-y-2">
              <Label htmlFor={`minutes-${playerId}`} className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                    #{getPlayerJerseyNumber(playerId)}
                  </span>
                  {getPlayerName(playerId)}
                </div>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`minutes-${playerId}`}
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  value={minutes || ''}
                  onChange={(e) => handleMinutesChange(playerId, e.target.value)}
                  placeholder="Minuten"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">Min</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Status Übersicht
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Spieler mit Minuten</div>
                <div className="font-semibold text-green-600">{summary.playersWithMinutes}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Spieler ohne Minuten</div>
                <div className="font-semibold text-orange-600">{summary.playersNeedingMinutes}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Gesamtminuten</div>
                <div className="font-semibold">{summary.totalMinutes}</div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Gesamtminuten: {getTotalMinutes()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              (Basketballspiel: 40 Minuten regulär + mögliche Verlängerung bis 60 Minuten)
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichern...' : 'Minuten speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinutesPlayedInput;
