import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useStats } from '@/contexts/StatsContext';
import { MinutesService, PlayerMinutesData } from '@/services/minutesService';
import { Save, Clock, Users, AlertCircle } from 'lucide-react';
import TimeInput from '@/components/TimeInput';

interface PlayerMinutes {
  playerId: string;
  seconds: number;
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
      if (!gameNumber || gameNumber <= 0) {
        console.error('Invalid gameNumber:', gameNumber);
        toast.error('Ungültige Spielnummer');
        setLoading(false);
        return;
      }

      try {
        console.log('Starting to load player minutes for game:', gameNumber);
        setLoading(true);

        // Get players who need minutes data for this game
        const playersData = await MinutesService.getPlayersNeedingMinutes(gameNumber);
        console.log('Raw players data:', playersData);

        // Get summary data
        const summaryData = await MinutesService.getGameMinutesSummary(gameNumber);
        console.log('Summary data:', summaryData);
        setSummary(summaryData);

        // Convert to our component format, filter out null playerIds
        const componentData = playersData
          .filter(player => player.playerSlug != null) // Filter out null playerSlugs
          .map(player => ({
            playerId: player.playerSlug,
            seconds: Math.round((player.minutes || 0) * 60) // Convert decimal minutes to exact seconds, handle null
          }));

        console.log('Original player data (minutes):', playersData.map(p => ({ id: p.playerSlug, minutes: p.minutes })));
        console.log('Converted component data (seconds):', componentData);
        console.log('Players filtered out:', playersData.length - componentData.length);

        setPlayerMinutes(componentData);
        console.log('Player minutes state set');
      } catch (error) {
        console.error('Error loading player minutes:', error);
        toast.error('Fehler beim Laden der Spielerdaten');
        // Set empty data to prevent infinite loading
        setPlayerMinutes([]);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
        console.log('Loading state set to false');
      }
    };

    console.log('useEffect triggered for gameNumber:', gameNumber);
    loadPlayerMinutes();
  }, [gameNumber]);

  const handleMinutesChange = (playerId: string, seconds: number) => {
    // Validate individual player time
    const minutes = seconds / 60;
    if (minutes < 0 || minutes > 60) {
      toast.error('Spielzeit muss zwischen 0 und 60 Minuten liegen');
      return;
    }

    setPlayerMinutes(prev =>
      prev.map(pm =>
        pm.playerId === playerId ? { ...pm, seconds: seconds } : pm
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate that at least one player has time > 0
      const hasValidTime = playerMinutes.some(pm => pm.seconds > 0);
      if (!hasValidTime) {
        toast.error('Mindestens ein Spieler muss mehr als 0 Minuten haben');
        setSaving(false);
        return;
      }

      // Validate total time (should be reasonable for a basketball game)
      // Standard game: 200 mins. OT: +25 mins. Allow range 190-300 to cover variances and multiple OTs.
      const totalMinutes = getTotalMinutes();
      if (totalMinutes < 190 || totalMinutes > 300) {
        toast.error(`Gesamtspielzeit (${totalMinutes.toFixed(1)} Min.) ist ungültig. Sie sollte zwischen 190 und 300 Minuten liegen.`);
        setSaving(false);
        return;
      }

      // Save to database using the service (store exact seconds as integer)
      const serviceData = playerMinutes.map(pm => ({
        playerId: pm.playerId,
        seconds: pm.seconds // Store exact seconds as integer
      }));
      const success = await MinutesService.updatePlayerMinutes(gameNumber, serviceData);

      if (success) {
        toast.success(`Minuten für Spiel ${gameNumber} erfolgreich gespeichert!`);

        // Reload player minutes data to reflect saved values
        try {
          const playersData = await MinutesService.getPlayersNeedingMinutes(gameNumber);
          const componentData = playersData
            .filter(player => player.playerSlug != null)
            .map(player => ({
              playerId: player.playerSlug,
              seconds: Math.round((player.minutes || 0) * 60) // Use same conversion as initial load
            }));
          setPlayerMinutes(componentData);
          console.log('Reloaded player minutes after save:', componentData);
        } catch (error) {
          console.error('Error reloading player minutes after save:', error);
        }

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
    const player = players.find(p => p.id === playerId);
    if (player) {
      return `${player.firstName} ${player.lastName}`;
    }

    // If not found in local data, try to extract from slug
    if (playerId && playerId.includes('-')) {
      const parts = playerId.split('-');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
      }
    }

    return playerId || 'Unbekannter Spieler';
  };

  const getPlayerJerseyNumber = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.jerseyNumber || '?';
  };

  const getTotalMinutes = () => {
    return playerMinutes.reduce((sum, pm) => sum + (pm.seconds / 60), 0);
  };

  const getTotalMinutesStatus = () => {
    const total = getTotalMinutes();
    const expected = 200; // 5 players * 40 minutes
    const deviation = Math.abs(total - expected);

    if (deviation > 1) {
      return 'red';
    } else if (deviation <= 1 && total !== expected) {
      return 'yellow';
    } else {
      return 'green';
    }
  };

  const getTotalMinutesColor = () => {
    const status = getTotalMinutesStatus();
    switch (status) {
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'green': return 'text-green-600';
      default: return '';
    }
  };

  if (loading) {
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

  if (playerMinutes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Spielerdaten für dieses Spiel gefunden.</p>
            <p className="text-sm mb-4">Dieses Spiel hat möglicherweise keine Boxscore-Daten in der Datenbank.</p>
            {/* Fallback was handled in service, but if it returned nothing, give explicit manual option? 
                Currently service handles fallback. If we are here, literally no players exist in DB for this team ever.
            */}
            <Button variant="outline" onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
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
          Spielminuten - Spiel {gameNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playerMinutes.filter(pm => pm.playerId != null).map(({ playerId, seconds }) => (
            <div key={playerId || `unknown-${Math.random()}`} className="space-y-2">
              <Label htmlFor={`minutes-${playerId}`} className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                    #{getPlayerJerseyNumber(playerId)}
                  </span>
                  {getPlayerName(playerId)}
                </div>
              </Label>
              <div className="flex items-center gap-2">
                <TimeInput
                  id={`minutes-${playerId}`}
                  value={seconds} // Already in seconds
                  onChange={(seconds) => handleMinutesChange(playerId, seconds)}
                  className=""
                />
                <span className="text-sm text-muted-foreground">mm:ss</span>
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
                <div className={`font-semibold ${getTotalMinutesColor()}`}>{summary.totalMinutes}</div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
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
