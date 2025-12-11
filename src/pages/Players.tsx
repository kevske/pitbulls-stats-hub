import React, { useMemo, useState } from 'react';
import { useStats } from '@/contexts/StatsContext';
import Layout from '@/components/Layout';
import PlayerCard from '@/components/PlayerCard';
import DataSourceToggle from '@/components/DataSourceToggle';
import { Home, Plane, Filter } from 'lucide-react';
import { SupabasePlayerService } from '@/lib/supabasePlayerService';
import { PlayerStats } from '@/types/stats';

type GameFilter = 'all' | 'home' | 'away';

const Players: React.FC = () => {
  const { players: googleSheetsPlayers, gameLogs, loading: googleSheetsLoading, error: googleSheetsError, games } = useStats();
  const [dataSource, setDataSource] = useState<'google-sheets' | 'supabase'>('google-sheets');
  const [supabasePlayers, setSupabasePlayers] = useState<PlayerStats[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Load Supabase data when data source changes
  React.useEffect(() => {
    if (dataSource === 'supabase') {
      loadSupabaseData();
    }
  }, [dataSource]);

  const loadSupabaseData = async () => {
    setSupabaseLoading(true);
    setSupabaseError(null);
    try {
      const players = await SupabasePlayerService.fetchAllPlayers();
      setSupabasePlayers(players);
    } catch (err) {
      console.error('Failed to load Supabase data:', err);
      setSupabaseError('Fehler beim Laden der Supabase-Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Determine which data to use
  const players = dataSource === 'supabase' ? supabasePlayers : googleSheetsPlayers;
  const loading = dataSource === 'supabase' ? supabaseLoading : googleSheetsLoading;
  const error = dataSource === 'supabase' ? supabaseError : googleSheetsError;

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            Lade Spielerdaten von {dataSource === 'supabase' ? 'Supabase' : 'Google Sheets'}...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden der Spielerdaten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  const [gameFilter, setGameFilter] = useState<GameFilter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Get the latest game number
  const latestGameNumber = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map(g => g.gameNumber)) : 0;
  }, [games]);

  // Toggle filter function
  const toggleFilter = (filter: GameFilter) => {
    setGameFilter(current => current === filter ? null : filter);
  };

  // Get unique positions
  const positions = useMemo(() => {
    const uniquePositions = new Set(players.map(p => p.position).filter(Boolean));
    return Array.from(uniquePositions).sort();
  }, [players]);

  // Debug: Log the players being received
  console.log('Players received in component:', players.map(p => ({
    name: `${p.firstName} ${p.lastName}`,
    gamesPlayed: p.gamesPlayed,
    id: p.id
  })));

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = players.filter(player => player.firstName && player.firstName.trim() !== '');

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.firstName.toLowerCase().includes(query) ||
        player.lastName.toLowerCase().includes(query) ||
        (player.jerseyNumber && player.jerseyNumber.toString().includes(query))
      );
    }

    // Apply position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    return filtered.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [players, searchQuery, positionFilter]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Filter Toggle - Positioned to not overlap with menu */}
      <div className="fixed top-4 left-20 right-4 z-50">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-1.5 max-w-max mx-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFilter('home')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${gameFilter === 'home'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              title="Heimspiele"
            >
              <Home size={14} className="mr-1" />
              Heim
            </button>
            <div className="h-6 w-px bg-border"></div>
            <button
              onClick={() => toggleFilter('away')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${gameFilter === 'away'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              title="Auswärtsspiele"
            >
              <Plane size={14} className="mr-1" />
              Auswärts
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to account for fixed header */}
      <div className="pt-4">
        <Layout>
          <div className="container mx-auto p-4">
            <div className="space-y-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Spieler</h1>
                <div className="flex items-center gap-4">
                  <DataSourceToggle
                    dataSource={dataSource}
                    onDataSourceChange={setDataSource}
                    disabled={loading}
                  />
                  {latestGameNumber > 1 && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Letzter Spieltag: {latestGameNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Suche nach Spieler..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]"
                >
                  <option value="all">Alle Positionen</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <p>Keine Spieler gefunden.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {players.length} Spieler von {dataSource === 'supabase' ? 'Supabase' : 'Google Sheets'} geladen, aber keiner erfüllt die Filterkriterien.
                  </p>
                </div>
              ) : (
                filteredPlayers.map((player) => {
                  return (
                    <div key={player.id} className="h-full">
                      <PlayerCard
                        player={player}
                        gameLogs={gameLogs}
                        currentGameNumber={latestGameNumber}
                        gameFilter={gameFilter}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Players;
