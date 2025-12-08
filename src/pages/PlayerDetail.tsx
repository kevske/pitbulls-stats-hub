import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useEffect } from 'react';

import { PlayerStats, PlayerGameLog } from '@/types/stats';
import playerImagesData from '@/data/playerImages.json';

// Custom CSS for scrolling animation is now in index.css

interface GalleryImage {
  src: string;
  alt: string;
  date?: string;
}

interface PlayerImagesData {
  [playerSlug: string]: {
    src: string;
    alt: string;
    filename: string;
  }[];
}

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { player, gameLogs } = usePlayerStats(id) as { player: PlayerStats | null; gameLogs: PlayerGameLog[] };
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [randomImageStream, setRandomImageStream] = useState<GalleryImage[]>([]);
  const navigate = useNavigate();

  // Scroll to gallery function
  const scrollToGallery = () => {
    const galleryElement = document.getElementById('photo-gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Gallery navigation functions
  const openImageAtIndex = (index: number) => {
    setCurrentGalleryIndex(index);
    setSelectedImage(galleryImages[index].src);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (galleryImages.length === 0) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentGalleryIndex === 0 ? galleryImages.length - 1 : currentGalleryIndex - 1;
    } else {
      newIndex = currentGalleryIndex === galleryImages.length - 1 ? 0 : currentGalleryIndex + 1;
    }

    setCurrentGalleryIndex(newIndex);
    setSelectedImage(galleryImages[newIndex].src);
  };

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
      // Extract the filename and remove .png extension if present
      const match = player.imageUrl.match(/players\/([^/]+)/);
      if (!match) return '';
      // Remove .png extension if it exists in the filename
      return match[1].replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
    };

    const playerSlug = getPlayerSlug();
    if (!playerSlug) {
      console.log('No player slug found');
      return;
    }

    console.log('Loading gallery images for player:', playerSlug);

    // Use the pre-generated image data
    const playerImages = (playerImagesData as PlayerImagesData)[playerSlug];

    if (playerImages && playerImages.length > 0) {
      console.log(`Found ${playerImages.length} images for ${playerSlug}`);
      setGalleryImages(playerImages.map(img => ({
        src: img.src,
        alt: img.alt
      })));
    } else {
      console.log(`No gallery images found for ${playerSlug}`);
      setGalleryImages([]);
    }
  }, [player]);

  // Create random stream of images for banner
  const createRandomImageStream = (images: GalleryImage[]) => {
    if (images.length === 0) return [];

    // Create a shuffled array and repeat it multiple times for continuous scrolling
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const stream = [];

    // Repeat the shuffled array 2 times for seamless scrolling
    for (let i = 0; i < 2; i++) {
      stream.push(...shuffled);
    }

    return stream;
  };

  // Update random stream when gallery images change
  useEffect(() => {
    if (galleryImages.length > 0) {
      setRandomImageStream(createRandomImageStream(galleryImages));
    }
  }, [galleryImages]);

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

  // Calculate per 40 min stats
  const pointsPer40 = totalMinutes > 0 ? ((totalPoints / totalMinutes) * 40).toFixed(1) : '0.0';
  const threePointersPer40 = totalMinutes > 0 ? ((totalThreePointers / totalMinutes) * 40).toFixed(1) : '0.0';
  const foulsPer40 = totalMinutes > 0 ? ((totalFouls / totalMinutes) * 40).toFixed(1) : '0.0';

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
          <div className="relative h-64 md:h-80 overflow-hidden cursor-pointer" onClick={scrollToGallery}>
            {randomImageStream.length > 0 ? (
              <>
                <div className="absolute inset-0 flex">
                  <div
                    className="flex animate-scroll hover:pause"
                    style={{
                      '--scroll-duration': `${galleryImages.length * 15}s`
                    } as React.CSSProperties}
                  >
                    {/* Use the random stream of different images */}
                    {randomImageStream.map((image, index) => (
                      <img
                        key={`${image.src}-${index}`}
                        src={image.src}
                        alt={image.alt}
                        className="h-full w-auto max-w-none object-cover flex-shrink-0"
                        onError={(e) => {
                          console.error('Failed to load banner image:', image.src);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 text-sm font-medium">
                  Zur Galerie
                </div>
              </>
            ) : (
              // Fallback to light blue background
              <div className="absolute inset-0 bg-accent" />
            )}

            {/* Player info overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-background rounded-full overflow-hidden border-4 border-background shadow-elegant mx-auto mb-4">
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {player.firstName} <span className="text-primary">{player.lastName}</span>
                </h1>
                <div className="flex flex-wrap justify-center gap-4 text-white/90">
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
              <StatCard label="Fouls/Spiel" value={fpg} />
              <StatCard label="Freiwurfquote" value={freeThrowPercentage} />
              <StatCard label="Punkte/40 Min" value={pointsPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
              <StatCard label="3er/40 Min" value={threePointersPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
              <StatCard label="Fouls/40 Min" value={foulsPer40} className="bg-stone-100 text-stone-800 hover:bg-stone-200" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pkt/40</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">3er/40</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fouls/40</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.pointsPer40?.toFixed(1) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.threePointersPer40?.toFixed(1) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {game.foulsPer40?.toFixed(1) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div id="photo-gallery" className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Galerie</h2>
          {player ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.length > 0 ? (
                galleryImages.map((image, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-border"
                      onClick={() => openImageAtIndex(index)}
                      onError={(e) => {
                        console.error(`Failed to load image: ${image.src}`);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 bg-muted/50 rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Keine Galeriebilder für diesen Spieler gefunden.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                Lade Spielerdaten...
              </p>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Left Arrow */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigateImage('prev');
                }}
                className="absolute left-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Right Arrow */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigateImage('next');
                }}
                className="absolute right-4 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div
              className="max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
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
              {galleryImages.length > 1 && (
                <div className="text-center text-white mt-2">
                  {currentGalleryIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className={`bg-accent p-4 rounded-lg text-center transition-elegant hover:bg-accent/70 ${className || ''}`}>
    <div className="text-sm text-muted-foreground mb-1">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default PlayerDetail;
