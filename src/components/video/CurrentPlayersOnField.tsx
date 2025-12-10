import { useState, useEffect, useRef } from 'react';
import { Player, TaggedEvent, EventType, EVENT_TEMPLATES, formatTime } from '@/types/basketball';
import { BasketballCourt } from '@/components/video/BasketballCourt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, RotateCcw, Plus, ChevronDown } from 'lucide-react';

interface CurrentPlayersOnFieldProps {
  players: Player[];
  events: TaggedEvent[];
  onAddEvent: (event: Omit<TaggedEvent, 'id' | 'description'>) => void;
  currentTime: number;
  availablePlayers: Player[];
  onCurrentPlayersChange?: (currentPlayers: Player[]) => void;
  resetOnLoad?: boolean;
}

interface CurrentPlayer {
  player: Player;
  enteredAt: number;
}

type TaggingStep = 'idle' | 'player-selected' | 'action-selected' | 'shot-type-selected' | 'shot-result-selected' | 'substitution-select-in' | 'substitution-select-out';
type SelectedAction = {
  type: EventType;
  label: string;
  icon: string;
};
type ShotType = 1 | 2 | 3;
type ShotResult = 'made' | 'missed';

export function CurrentPlayersOnField({ players, events, onAddEvent, currentTime, availablePlayers, onCurrentPlayersChange, resetOnLoad }: CurrentPlayersOnFieldProps) {
  const [currentPlayers, setCurrentPlayers] = useState<CurrentPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedAction, setSelectedAction] = useState<SelectedAction | null>(null);
  const [selectedShotType, setSelectedShotType] = useState<ShotType | null>(null);
  const [selectedShotResult, setSelectedShotResult] = useState<ShotResult | null>(null);
  const [playerComingIn, setPlayerComingIn] = useState<Player | null>(null);
  const [taggingStep, setTaggingStep] = useState<TaggingStep>('idle');
  const [showSubstitutionDropdown, setShowSubstitutionDropdown] = useState(false);
  const [isSelectingStartingFive, setIsSelectingStartingFive] = useState(true);
  const justLoadedRef = useRef(false);
  const hasProcessedLoadedEventsRef = useRef(false);

  // Reset current players when a file is loaded
  useEffect(() => {
    console.log('Reset useEffect triggered:', resetOnLoad);
    if (resetOnLoad) {
      console.log('Resetting players - setting empty court');
      setCurrentPlayers([]);
      setIsSelectingStartingFive(true);
      onCurrentPlayersChange?.([]);
      justLoadedRef.current = true;
      hasProcessedLoadedEventsRef.current = false; // Reset this flag
      // Clear the flag after a longer delay to ensure all useEffect cycles complete
      setTimeout(() => {
        justLoadedRef.current = false;
        console.log('Clearing justLoadedRef');
      }, 1000); // Increased from 200ms to 1000ms
    }
  }, [resetOnLoad, onCurrentPlayersChange]);

  // Calculate current players based on substitution events
  useEffect(() => {
    console.log('Substitution useEffect triggered:', { resetOnLoad, eventsLength: events.length, justLoaded: justLoadedRef.current, hasProcessedLoadedEvents: hasProcessedLoadedEventsRef.current, currentPlayersLength: currentPlayers.length });
    
    // Don't process substitutions if we just loaded a file - user will select manually
    if (justLoadedRef.current || resetOnLoad) {
      console.log('Skipping substitution processing - file was just loaded or reset triggered');
      return;
    }
    
    // IMPORTANT: Only process substitutions if we have user-selected current players
    // If we have loaded events but no current players, this means we loaded a file but haven't selected starting five yet
    if (events.length > 0 && currentPlayers.length === 0) {
      console.log('Skipping substitution processing - no user-selected current players (likely after file load)');
      return;
    }
    
    const substitutionEvents = events
      .filter(event => event.type === 'substitution')
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log('Substitution events found:', substitutionEvents.length);

    // If we have no current players and no substitution events, nothing to do
    if (currentPlayers.length === 0 && substitutionEvents.length === 0) {
      console.log('No current players and no substitution events - nothing to process');
      return;
    }

    // Start with the current players (user-selected starting five and any manual subs)
    let activePlayers = new Set<string>();
    const playerEntries: Record<string, number> = {};

    // Initialize with current players state (this preserves user-selected starting five)
    currentPlayers.forEach(cp => {
      activePlayers.add(cp.player.name);
      playerEntries[cp.player.name] = cp.enteredAt;
    });

    // Apply NEW substitution events only (events added after current timestamp)
    // This prevents reconstructing lineup from loaded historical substitution events
    const currentTimeThreshold = Math.max(...currentPlayers.map(cp => cp.enteredAt), 0);
    console.log('Current time threshold:', currentTimeThreshold);

    substitutionEvents.forEach(event => {
      // Only process substitution events that occurred after the latest current player entry
      if (event.timestamp > currentTimeThreshold) {
        console.log('Processing new substitution event:', event);
        if (event.player) {
          // Player enters
          activePlayers.add(event.player);
          playerEntries[event.player] = event.timestamp;
        }
        if (event.substitutionOut) {
          // Player exits
          activePlayers.delete(event.substitutionOut);
        }
      } else {
        console.log('Skipping old substitution event:', event);
      }
    });

    const updatedCurrentPlayers = Array.from(activePlayers)
      .map(playerName => {
        const player = players.find(p => p.name === playerName);
        if (player) {
          return {
            player,
            enteredAt: playerEntries[playerName] || 0
          };
        }
        return null;
      })
      .filter(Boolean) as CurrentPlayer[];

    console.log('Updated current players:', updatedCurrentPlayers.length);

    setCurrentPlayers(updatedCurrentPlayers);
    // Only exit starting five selection mode when we have exactly 5 players
    if (updatedCurrentPlayers.length === 5) {
      setIsSelectingStartingFive(false);
    }
    
    // Notify parent component of current players change
    onCurrentPlayersChange?.(updatedCurrentPlayers.map(cp => cp.player));
  }, [events, players, justLoadedRef.current, resetOnLoad, currentPlayers.length]);

  const handlePlayerSelect = (player: Player) => {
    if (isSelectingStartingFive) {
      // Add to starting five
      if (!currentPlayers.some(cp => cp.player.id === player.id)) {
        setCurrentPlayers(prev => [...prev, { player, enteredAt: currentTime }]);
        if (currentPlayers.length + 1 === 5) {
          setIsSelectingStartingFive(false);
        }
      }
    } else {
      // Start tagging workflow
      setSelectedPlayer(player);
      setTaggingStep('player-selected');
      setSelectedAction(null);
      setShowSubstitutionDropdown(false);
    }
  };

  const handleActionSelect = (eventType: EventType, label: string, icon: string) => {
    if (!selectedPlayer) return;

    setSelectedAction({ type: eventType, label, icon });
    
    if (eventType === 'shot') {
      setTaggingStep('shot-type-selected');
      setSelectedShotType(null);
      setSelectedShotResult(null);
    } else if (eventType === 'substitution') {
      // For substitution, start with selecting player coming IN from bench
      setTaggingStep('substitution-select-in');
      setPlayerComingIn(null);
    } else {
      // For other actions, create event immediately
      const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
        timestamp: currentTime,
        formattedTime: formatTime(currentTime),
        type: eventType,
        player: selectedPlayer.name,
      };

      onAddEvent(eventData);
      resetTaggingState();
    }
  };

  const handleSubstitutionSelectPlayerIn = (playerIn: Player) => {
    // Complete substitution immediately: playerIn is coming IN, selectedPlayer is going OUT
    const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: 'substitution',
      player: playerIn.name,
      substitutionOut: selectedPlayer?.name || '',
    };

    onAddEvent(eventData);
    resetTaggingState();
  };

  const handleSubstitutionComplete = (playerOut: Player) => {
    if (!playerComingIn) return;

    const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: 'substitution',
      player: playerComingIn.name,
      substitutionOut: playerOut.name,
    };

    onAddEvent(eventData);
    resetTaggingState();
  };

  const handleShotTypeSelect = (shotType: ShotType) => {
    setSelectedShotType(shotType);
    setTaggingStep('shot-result-selected');
  };

  const handleShotResultSelect = (result: ShotResult) => {
    setSelectedShotResult(result);
    
    if (!selectedPlayer || !selectedShotType) return;

    const eventData: Omit<TaggedEvent, 'id' | 'description'> = {
      timestamp: currentTime,
      formattedTime: formatTime(currentTime),
      type: 'shot',
      player: selectedPlayer.name,
      points: selectedShotType,
      missed: result === 'missed',
    };

    onAddEvent(eventData);
    resetTaggingState();
  };

  const resetTaggingState = () => {
    setSelectedPlayer(null);
    setSelectedAction(null);
    setSelectedShotType(null);
    setSelectedShotResult(null);
    setPlayerComingIn(null);
    setTaggingStep('idle');
    setShowSubstitutionDropdown(false);
  };

  const handleResetStartingFive = () => {
    setCurrentPlayers([]);
    setSelectedPlayer(null);
    setIsSelectingStartingFive(true);
  };

  // Sort available players by jersey number
  const sortedBenchPlayers = [...availablePlayers].sort((a, b) => a.jerseyNumber - b.jerseyNumber);

  const benchPlayers = sortedBenchPlayers;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <CardTitle className="text-sm">
              Currently on the court:
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {currentPlayers.length}/5
            </Badge>
          </div>
          {currentPlayers.length > 0 && !isSelectingStartingFive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetStartingFive}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isSelectingStartingFive ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Currently on the court:
            </p>
            
            {/* Current selection */}
            {currentPlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Selected ({currentPlayers.length}/5):</p>
                <div className="flex flex-wrap gap-1">
                  {currentPlayers.map(({ player }) => (
                    <Badge
                      key={player.id}
                      variant="default"
                      className="text-xs cursor-pointer"
                      onClick={() => {
                        setCurrentPlayers(prev => prev.filter(cp => cp.player.id !== player.id));
                      }}
                    >
                      #{player.jerseyNumber} {player.name} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available players */}
            <div className="space-y-2">
              <p className="text-xs font-medium">Available players:</p>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {benchPlayers.map(player => (
                  <Button
                    key={player.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayerSelect(player)}
                    className="h-7 text-xs justify-start"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    #{player.jerseyNumber} {player.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Basketball Court with current players */}
            <div>
              <BasketballCourt
                players={currentPlayers.map(cp => cp.player)}
                onPlayerSelect={handlePlayerSelect}
                selectedPlayerId={selectedPlayer?.id}
                disabled={false}
              />
            </div>

            <Separator />

            {/* Tagging Workflow */}
            {taggingStep === 'idle' && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Select a player or action:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {EVENT_TEMPLATES
                    .filter(template => template.requiresPlayer)
                    .map(template => (
                      <Button
                        key={template.type}
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionSelect(template.type, template.label, template.icon)}
                        className="h-7 text-xs justify-start"
                        disabled={!selectedPlayer}
                      >
                        <span className="mr-1">{template.icon}</span>
                        {template.label}
                      </Button>
                    ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTaggingState}
                  className="w-full h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Player-specific Actions */}
            {taggingStep === 'player-selected' && selectedPlayer && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Select action for #{selectedPlayer.jerseyNumber} {selectedPlayer.name}:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {EVENT_TEMPLATES
                    .filter(template => template.requiresPlayer)
                    .map(template => (
                      <Button
                        key={template.type}
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionSelect(template.type, template.label, template.icon)}
                        className="h-7 text-xs justify-start"
                      >
                        <span className="mr-1">{template.icon}</span>
                        {template.label}
                      </Button>
                    ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTaggingState}
                  className="w-full h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Shot Type Selection */}
            {taggingStep === 'shot-type-selected' && selectedPlayer && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Shot type for #{selectedPlayer.jerseyNumber} {selectedPlayer.name}:
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShotTypeSelect(1)}
                    className="h-7 text-xs"
                  >
                    1 pt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShotTypeSelect(2)}
                    className="h-7 text-xs"
                  >
                    2 pt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShotTypeSelect(3)}
                    className="h-7 text-xs"
                  >
                    3 pt
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTaggingState}
                  className="w-full h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Shot Result Selection */}
            {taggingStep === 'shot-result-selected' && selectedPlayer && selectedShotType && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  {selectedShotType} point shot for #{selectedPlayer.jerseyNumber} {selectedPlayer.name}:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShotResultSelect('made')}
                    className="h-7 text-xs"
                  >
                    Made
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShotResultSelect('missed')}
                    className="h-7 text-xs"
                  >
                    Missed
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTaggingState}
                  className="w-full h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Substitution: Select Player Coming IN */}
            {taggingStep === 'substitution-select-in' && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Who is substituting for #{selectedPlayer?.jerseyNumber} {selectedPlayer?.name}? (Select from bench)
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availablePlayers.map(player => (
                    <Button
                      key={player.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubstitutionSelectPlayerIn(player)}
                      className="w-full h-6 text-xs justify-start"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      #{player.jerseyNumber} {player.name}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTaggingState}
                  className="w-full h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Player-specific Quick Actions */}
            {taggingStep === 'idle' && !selectedPlayer && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Player Actions:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs justify-start"
                  disabled
                >
                  Select a player above to log a player action
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
