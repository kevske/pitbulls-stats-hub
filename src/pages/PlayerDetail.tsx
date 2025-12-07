import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from 'react';

import { PlayerStats, PlayerGameLog } from '@/types/stats';

interface GalleryImage {
  src: string;
  alt: string;
  date?: string;
}

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { player, gameLogs } = usePlayerStats(id) as { player: PlayerStats | null; gameLogs: PlayerGameLog[] };
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!player) {
      console.log('No player data yet');
      return;
    }

    // Get the player's slug from their image URL (e.g., 'alexander-rib' from 'alexander-rib.png')
    const getPlayerSlug = () => {
      if (!player.imageUrl) {
        console.log('No imageUrl for player:', player.firstName, player.lastName);
        return '';
      }
      // Extract the filename without extension
      const match = player.imageUrl.match(/players\/([^/.]+)/);
      return match ? match[1] : '';
    };

    const playerSlug = getPlayerSlug();
    if (!playerSlug) {
      console.log('No player slug found');
      return;
    }

    console.log('Loading gallery images for player:', playerSlug);
    
    // Gallery images are stored in the player's subfolder with pattern: YYYY-MM-DD-{slug}-##.ext
    // For example: /players/alexander-rib/2024-09-30-alexander-rib-03.jpeg
    const galleryImages = [
      `2024-09-30-${playerSlug}-03.jpeg`,
      `2024-09-30-${playerSlug}-04.jpeg`,
      `2024-09-30-${playerSlug}-05.jpeg`,
      `2025-04-06-${playerSlug}-01.jpeg`
    ].map(file => ({
      src: `/players/${playerSlug}/${file}`,
      alt: `${player.firstName} ${player.lastName} - ${file.split('-').slice(0, 3).join('-')}`
    }));
    
    console.log('Gallery images to display:', galleryImages);
    setGalleryImages(galleryImages);
  }, [player]);

  if (!player || !player.firstName) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800">Spieler nicht gefunden</h2>
            <p className="text-gray-500 mt-2">Der angeforderte Spieler konnte nicht gefunden werden.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const calculateTotal = (stat: keyof PlayerGameLog): number => {
    return gameLogs.reduce((sum, log) => {
      const value = log[stat];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  // Calculate stats
  const totalGames = gameLogs.length;
  const totalPoints = calculateTotal('points');
  const totalThreePointers = calculateTotal('threePointers');
  const totalFreeThrowsMade = calculateTotal('freeThrowsMade');
  const totalFreeThrowAttempts = calculateTotal('freeThrowAttempts');
  const totalFouls = calculateTotal('fouls');

  // Calculate per game averages
  const ppg = totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : '0.0';
  const threePointersPerGame = totalGames > 0 ? (totalThreePointers / totalGames).toFixed(1) : '0.0';
  const freeThrowPercentage = totalFreeThrowAttempts > 0
    ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%`
    : '0%';
  const fpg = totalGames > 0 ? (totalFouls / totalGames).toFixed(1) : '0.0';

  // Calculate total minutes played (now in decimal format)
  const totalMinutes = gameLogs.reduce((sum, game) => {
    return sum + (game.minutesPlayed || 0);
  }, 0);

  const averageMinutes = totalGames > 0 ? (totalMinutes / totalGames).toFixed(1) : '0.0';

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>

        <div className="bg-card rounded-lg shadow-elegant overflow-hidden">
          {/* Player Header */}
          <div className="bg-accent p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-background rounded-full overflow-hidden border-4 border-background shadow-elegant mb-4 md:mb-0 md:mr-8">
                <img
                  src={player.imageUrl || '/pitbulls-stats-hub/placeholder-player.png'}
                  alt={`${player.firstName} ${player.lastName}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/pitbulls-stats-hub/placeholder-player.png';
                  }}
                />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">
                  {player.firstName} <span className="text-primary">{player.lastName}</span>
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-muted-foreground">
                  {player.jerseyNumber && (
                    <span>
                      <span className="font-medium">#</span>{player.jerseyNumber}
                    </span>
                  )}
                  {player.position && (
                    <span>
                      <span className="font-medium">Position:</span> {player.position}
                    </span>
                  )}
                  {player.age && (
                    <span>
                      <span className="font-medium">Alter:</span> {player.age}
                    </span>
                  )}
                  {player.height && (
                    <span>
                      <span className="font-medium">Größe:</span> {player.height}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player Bio */}
          {player.bio && (
            <div className="p-6 border-b border-border">
              <p className="text-muted-foreground italic">"{player.bio}"</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Saisonstatistiken</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Minuten/Spiel" value={averageMinutes} />
              <StatCard label="Punkte/Spiel" value={ppg} />
              <StatCard label="3-Punkte/Spiel" value={threePointersPerGame} />
              <StatCard label="Freiwurfquote" value={freeThrowPercentage} />
              <StatCard label="Fouls/Spiel" value={fpg} />
            </div>

            {/* Stats Trend Charts */}
            {gameLogs.length > 1 && (
              <div className="space-y-8">
                <h4 className="text-md font-semibold text-muted-foreground">Statistik-Trends</h4>

                {/* Points Trend */}
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-3">Punkte pro Spiel</h5>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...gameLogs].sort((a, b) => a.gameNumber - b.gameNumber)}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="gameNumber"
                          tick={{ fill: '#666', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `Sp. ${value}`}
                        />
                        <YAxis
                          tick={{ fill: '#666', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            padding: '8px 12px'
                          }}
                          formatter={(value: number) => [value, 'Punkte']}
                          labelFormatter={(label) => `Spieltag ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Combined Stats Chart */}
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-3">Weitere Statistiken</h5>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...gameLogs].sort((a, b) => a.gameNumber - b.gameNumber)}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="gameNumber"
                          tick={{ fill: '#666', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `Sp. ${value}`}
                        />
                        <YAxis
                          tick={{ fill: '#666', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            padding: '8px 12px'
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line
                          type="monotone"
                          dataKey="threePointers"
                          name="3-Punkte"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#10b981' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="fouls"
                          name="Fouls"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#ef4444' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="minutesPlayed"
                          name="Minuten"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#f59e0b' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Game Log */}
          <div className="p-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Spielverlauf</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Spiel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Minuten</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Punkte</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">3P</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">FW</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fouls</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {gameLogs.map((game, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-card' : 'bg-accent/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        Spiel {game.gameNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.minutesPlayed.toFixed(1) || '0.0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {game.points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.threePointers || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.freeThrowsMade || 0}/{game.freeThrowAttempts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.fouls || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Galerie</h2>
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img, index) => {
                console.log(`Rendering image ${index}:`, img.src);
                return (
                  <div 
                    key={index} 
                    className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-border"
                    onClick={() => setSelectedImage(img.src)}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('Error loading image:', img.src, e);
                        target.src = '/pitbulls-stats-hub/placeholder-player.png';
                      }}
                      onLoad={() => console.log('Image loaded successfully:', img.src)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                {!player ? 'Lade Spielerdaten...' : 'Keine Bilder für diesen Spieler gefunden.'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Bitte überprüfen Sie die Browser-Konsole für weitere Informationen.
              </p>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-4xl w-full max-h-[90vh] flex flex-col">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="self-end text-white text-2xl mb-2 hover:text-primary transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="flex-1 flex items-center justify-center">
                <img 
                  src={selectedImage} 
                  alt="Enlarged view" 
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-accent p-4 rounded-lg text-center transition-elegant hover:bg-accent/70">
    <div className="text-sm text-muted-foreground mb-1">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default PlayerDetail;
