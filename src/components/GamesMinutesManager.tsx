import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PasswordProtection from '@/components/PasswordProtection';
import MinutesPlayedInput from '@/components/MinutesPlayedInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MinutesService } from '@/services/minutesService';
import { ArrowLeft, Settings, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GamesMinutesManagerProps {
  gameNumber?: number;
}

const GamesMinutesManager: React.FC<GamesMinutesManagerProps> = ({ gameNumber }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedGame, setSelectedGame] = useState<number | null>(gameNumber || null);
  const [gamesNeedingMinutes, setGamesNeedingMinutes] = useState<Array<{
    gameNumber: number;
    gameDate?: string;
    homeTeam?: string;
    awayTeam?: string;
    playersNeedingMinutes: number;
    totalPlayers: number;
  }>>([]);
  const [loadingMinutes, setLoadingMinutes] = useState(true);
  const navigate = useNavigate();

  // Load games that need minutes data
  useEffect(() => {
    const loadGamesNeedingMinutes = async () => {
      try {
        setLoadingMinutes(true);
        const gamesData = await MinutesService.getGamesNeedingMinutes();
        setGamesNeedingMinutes(gamesData);
      } catch (error) {
        console.error('Error loading games needing minutes:', error);
        toast.error('Fehler beim Laden der Spieldaten');
      } finally {
        setLoadingMinutes(false);
      }
    };

    if (hasAccess) {
      loadGamesNeedingMinutes();
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <PasswordProtection
            onSuccess={() => setHasAccess(true)}
            correctPassword={import.meta.env.VITE_ADMIN_PASSWORD}
          />
        </div>
      </Layout>
    );
  }

  const handleGameSelect = (gameNum: number) => {
    setSelectedGame(gameNum);
  };

  const handleBackToGameList = () => {
    setSelectedGame(null);
  };

  const handleSuccess = () => {
    toast.success('Minuten erfolgreich gespeichert!');
    // Optionally navigate back to the main games page
    setTimeout(() => {
      navigate('/games');
    }, 2000);
  };

  if (selectedGame) {
    const selectedGameData = gamesNeedingMinutes.find(g => g.gameNumber === selectedGame);
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl p-4">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleBackToGameList}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Spielauswahl
            </Button>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Minuten eintragen</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              {selectedGameData?.gameDate || `Spiel ${selectedGame}`}: {selectedGameData?.homeTeam || 'Heimteam'} vs {selectedGameData?.awayTeam || 'Gastteam'}
            </p>
          </div>

          <MinutesPlayedInput
            gameNumber={selectedGame}
            onSuccess={handleSuccess}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Minuten-Verwaltung</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Wählen Sie ein Spiel, um die gespielten Minuten der TSV Neuenstadt Spieler einzutragen
          </p>
        </div>

        {loadingMinutes ? (
          <div className="text-center py-8">Lade Spiele...</div>
        ) : (
          <div className="space-y-4">
            {/* Games needing minutes first */}
            {gamesNeedingMinutes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-5 w-5" />
                  Spiele mit fehlenden Minuten
                </h3>
                <div className="space-y-3">
                  {gamesNeedingMinutes
                    .filter(game => game.totalPlayers === 0 || game.playersNeedingMinutes > 0)
                    .map((game) => {
                      const displayText = game.totalPlayers === 0 ? 'Keine Daten' : `${game.playersNeedingMinutes} Spieler`;
                      return (
                        <Card
                          key={game.gameNumber}
                          className="hover:shadow-md transition-all duration-200 cursor-pointer border-orange-200 bg-orange-50/30"
                          onClick={() => handleGameSelect(game.gameNumber)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{game.gameDate || `Spiel ${game.gameNumber}`}</span>
                              <Button variant="outline" size="sm" className="border-orange-300">
                                <Clock className="h-4 w-4 mr-2" />
                                {displayText}
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {game.homeTeam || 'Heimteam'} vs {game.awayTeam || 'Gastteam'}
                                </p>
                                <p className="text-sm text-muted-foreground">{game.gameDate || 'Kein Datum'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-orange-600 font-medium">
                                  {game.totalPlayers === 0 ? 'Boxscore fehlt' : `${game.playersNeedingMinutes} von ${game.totalPlayers} Spielern`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {game.totalPlayers === 0 ? 'Spielerdaten benötigt' : 'brauchen Minuten'}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Games with complete minutes */}
            {gamesNeedingMinutes.filter(game => game.totalPlayers > 0 && game.playersNeedingMinutes === 0).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                  <Clock className="h-5 w-5" />
                  Spiele mit vollständigen Minuten
                </h3>
                <div className="space-y-3">
                  {gamesNeedingMinutes
                    .filter(game => game.totalPlayers > 0 && game.playersNeedingMinutes === 0)
                    .map((game) => {
                      return (
                        <Card
                          key={game.gameNumber}
                          className="hover:shadow-md transition-all duration-200 cursor-pointer border-green-200 bg-green-50/30"
                          onClick={() => handleGameSelect(game.gameNumber)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{game.gameDate || `Spiel ${game.gameNumber}`}</span>
                              <Button variant="outline" size="sm" className="border-green-300">
                                <Clock className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {game.homeTeam || 'Heimteam'} vs {game.awayTeam || 'Gastteam'}
                                </p>
                                <p className="text-sm text-muted-foreground">{game.gameDate || 'Kein Datum'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-green-600 font-medium">
                                  Alle {game.totalPlayers} Spieler
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  haben Minuten
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default GamesMinutesManager;
