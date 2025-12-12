import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PasswordProtection from '@/components/PasswordProtection';
import MinutesPlayedInput from '@/components/MinutesPlayedInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats } from '@/contexts/StatsContext';
import { MinutesService } from '@/lib/minutesService';
import { DataDebug } from '@/lib/dataDebug';
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
    playersNeedingMinutes: number;
    totalPlayers: number;
  }>>([]);
  const [loadingMinutes, setLoadingMinutes] = useState(true);
  const { games, loading } = useStats();
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
              Spieltag {selectedGame}: {games.find(g => g.gameNumber === selectedGame)?.homeTeam} vs {games.find(g => g.gameNumber === selectedGame)?.awayTeam}
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

        {loading || loadingMinutes ? (
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
                    .filter(game => game.playersNeedingMinutes > 0)
                    .map((game) => {
                      const gameDetails = games.find(g => g.gameNumber === game.gameNumber);
                      return (
                        <Card 
                          key={game.gameNumber}
                          className="hover:shadow-md transition-all duration-200 cursor-pointer border-orange-200 bg-orange-50/30"
                          onClick={() => handleGameSelect(game.gameNumber)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>Spiel {game.gameNumber}</span>
                              <Button variant="outline" size="sm" className="border-orange-300">
                                <Clock className="h-4 w-4 mr-2" />
                                {game.playersNeedingMinutes} Spieler
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {gameDetails?.homeTeam || 'Heimteam'} vs {gameDetails?.awayTeam || 'Gastteam'}
                                </p>
                                <p className="text-sm text-muted-foreground">{gameDetails?.date || 'Kein Datum'}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-orange-600 font-medium">
                                  {game.playersNeedingMinutes} von {game.totalPlayers} Spielern
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  brauchen Minuten
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
            {gamesNeedingMinutes.filter(game => game.playersNeedingMinutes === 0).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600">
                  <Clock className="h-5 w-5" />
                  Spiele mit vollständigen Minuten
                </h3>
                <div className="space-y-3">
                  {gamesNeedingMinutes
                    .filter(game => game.playersNeedingMinutes === 0)
                    .map((game) => {
                      const gameDetails = games.find(g => g.gameNumber === game.gameNumber);
                      return (
                        <Card 
                          key={game.gameNumber}
                          className="hover:shadow-md transition-all duration-200 cursor-pointer border-green-200 bg-green-50/30"
                          onClick={() => handleGameSelect(game.gameNumber)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>Spiel {game.gameNumber}</span>
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
                                  {gameDetails?.homeTeam || 'Heimteam'} vs {gameDetails?.awayTeam || 'Gastteam'}
                                </p>
                                <p className="text-sm text-muted-foreground">{gameDetails?.date || 'Kein Datum'}</p>
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

            {/* Games without any boxscore data */}
            {games
              .filter(game => !gamesNeedingMinutes.some(g => g.gameNumber === game.gameNumber))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((game) => (
                <Card 
                  key={game.gameNumber}
                  className="opacity-60"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{game.date}</span>
                      <Button variant="outline" size="sm" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Keine Daten
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{game.homeTeam} vs {game.awayTeam}</p>
                        <p className="text-sm text-muted-foreground">{game.date}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Keine Boxscore-Daten verfügbar
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Database games that don't exist in CSV */}
            {gamesNeedingMinutes
              .filter(dbGame => !games.some(csvGame => csvGame.gameNumber === dbGame.gameNumber))
              .map((game) => (
                <Card 
                  key={`db-${game.gameNumber}`}
                  className="border-blue-200 bg-blue-50/30"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Spiel {game.gameNumber}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-300"
                        onClick={() => handleGameSelect(game.gameNumber)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {game.playersNeedingMinutes > 0 ? 'Minuten eintragen' : 'Bearbeiten'}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Nur in Datenbank vorhanden</p>
                        <p className="text-sm text-muted-foreground">Keine CSV-Daten</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${game.playersNeedingMinutes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {game.playersNeedingMinutes > 0 ? `${game.playersNeedingMinutes} fehlen` : 'Vollständig'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          von {game.totalPlayers} Spielern
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GamesMinutesManager;
