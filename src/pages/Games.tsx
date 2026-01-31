import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useStats } from '@/contexts/StatsContext';
import { PlayerGameLog, PlayerStats } from '@/types/stats';
import { parse } from 'date-fns';
import Layout from '@/components/Layout';
import { Clock, Settings, Loader2, CalendarX } from 'lucide-react';
import GameCard from '@/components/GameCard';

const Games: React.FC = () => {
  const { games, gameLogs, players, loading, error } = useStats();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<string>('TSV Neuenstadt');
  const [hideUpcoming, setHideUpcoming] = useState<boolean>(true); // Hide upcoming games by default

  // Extract unique teams from games data
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    games.forEach(game => {
      if (game.homeTeam) teams.add(game.homeTeam);
      if (game.awayTeam) teams.add(game.awayTeam);
    });
    return Array.from(teams).sort();
  }, [games]);

  // Pre-compute player map for faster lookups (O(1))
  const playerMap = useMemo(() => {
    const map = new Map<string, PlayerStats>();
    players.forEach(player => {
      map.set(player.id, player);
    });
    return map;
  }, [players]);

  // Pre-compute top scorers for each game
  const gamesTopScorersMap = useMemo(() => {
    const map = new Map<number, PlayerGameLog[]>();

    // First, group logs by game
    const logsByGame = new Map<number, PlayerGameLog[]>();
    gameLogs.forEach(log => {
        if (!logsByGame.has(log.gameNumber)) {
            logsByGame.set(log.gameNumber, []);
        }
        logsByGame.get(log.gameNumber)!.push(log);
    });

    // Then sort for each game
    logsByGame.forEach((logs, gameNumber) => {
        // We only need top scorers, so sort by points descending
        const sorted = [...logs].sort((a, b) => b.points - a.points);
        map.set(gameNumber, sorted);
    });

    return map;
  }, [gameLogs]);

  // Filter games based on selected team and upcoming games toggle
  const filteredGames = useMemo(() => {
    let filtered = games.filter(game =>
      game.homeTeam === selectedTeam || game.awayTeam === selectedTeam
    );

    // Filter out upcoming games if toggle is enabled
    if (hideUpcoming) {
      filtered = filtered.filter(game => {
        // First check if game has a final score (indicating it's been played)
        if (!game.finalScore || game.finalScore.trim() === '' || game.finalScore === '-' || game.finalScore === '-:-') {
          return false; // No valid score means game hasn't been played
        }

        // Additionally check if the game date is in the past or today
        try {
          // Format is typically "dd.MM.yyyy, HH:mm" or similar from de-DE locale
          const [datePart, timePart] = game.date.split(', ');

          let gameDate: Date;
          if (datePart && timePart) {
            const [day, month, year] = datePart.split('.').map(Number);
            const [hour, minute] = timePart.split(':').map(Number);
            gameDate = new Date(year, month - 1, day, hour, minute);
          } else {
            // Fallback to existing logic if format differs
            if (game.date.includes('T') || game.date.includes('-')) {
              gameDate = new Date(game.date);
            } else {
              gameDate = parse(game.date, 'dd.MM.yyyy HH:mm', new Date());
            }
          }

          // Check if date is valid and not in the future
          if (isNaN(gameDate.getTime())) {
            return true; // If we can't parse the date, include it (it has a score, so assume played)
          }

          const now = new Date();
          // Include games that have already happened or are happening today
          return gameDate <= now;
        } catch (e) {
          return true; // If date parsing fails, include it
        }
      });
    }

    return filtered;
  }, [games, selectedTeam, hideUpcoming]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 min-h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <div className="text-muted-foreground">Lade Spielplan...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden des Spielplans: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Spiele</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-upcoming"
                checked={hideUpcoming}
                onCheckedChange={(checked) => setHideUpcoming(checked as boolean)}
              />
              <label
                htmlFor="hide-upcoming"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Zukünftige Spiele ausblenden
              </label>
            </div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Team auswählen" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => navigate('/games/minutes')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <Clock className="h-4 w-4" />
              Minuten verwalten
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => (
              <GameCard
                key={game.gameNumber}
                game={game}
                topScorers={gamesTopScorersMap.get(game.gameNumber) || []}
                playerMap={playerMap}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-lg border border-dashed border-muted-foreground/25">
              <CalendarX className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">Keine Spiele gefunden</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Versuche die Filter anzupassen oder "Zukünftige Spiele ausblenden" zu deaktivieren.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Games;
