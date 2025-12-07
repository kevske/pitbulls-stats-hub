import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Home, Plane } from "lucide-react";
import { PlayerGameLog, PlayerStats } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";
import { useStats } from "@/contexts/StatsContext";
import { useState, useMemo, useEffect } from "react";
import { generateImageFilename } from "@/data/api/statsService";
import playerImagesData from "@/data/playerImages.json";

interface PlayerCardProps {
  player: PlayerStats;
  gameLogs?: PlayerGameLog[];
  currentGameNumber?: number;
  gameFilter?: 'all' | 'home' | 'away';
}

const PlayerCard = ({ player, gameLogs = [], currentGameNumber = 0, gameFilter = 'all' }: PlayerCardProps) => {
  const navigate = useNavigate();
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [currentBannerImageIndex, setCurrentBannerImageIndex] = useState(0);
  // Game filter is now controlled by parent component
  
  // Get player slug for gallery images
  const getPlayerSlug = () => {
    if (!player.imageUrl) {
      console.log('No imageUrl for player:', player.firstName, player.lastName);
      return '';
    }
    // Extract the filename and remove extension
    const match = player.imageUrl.match(/players\/([^/]+)/);
    if (!match) {
      console.log('No match in imageUrl:', player.imageUrl);
      return '';
    }
    const slug = match[1].replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
    console.log('Player slug:', slug);
    return slug;
  };

  // Get gallery images for this player
  const getGalleryImages = () => {
    const playerSlug = getPlayerSlug();
    if (!playerSlug) return [];
    
    const playerImages = (playerImagesData as any)[playerSlug];
    console.log('Gallery images for', playerSlug, ':', playerImages?.length || 0);
    return playerImages || [];
  };

  // Get alternating banner image from gallery
  const getBannerImage = () => {
    const galleryImages = getGalleryImages();
    if (galleryImages.length === 0) return null;
    
    // Use current index to cycle through images
    const imageIndex = currentBannerImageIndex % galleryImages.length;
    return galleryImages[imageIndex];
  };

  // Cycle through gallery images
  useEffect(() => {
    const galleryImages = getGalleryImages();
    if (galleryImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerImageIndex(prev => prev + 1);
      }, 3000); // Change image every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [player]);
  
  // Calculate filtered stats based on game type
  const filteredStats = useMemo(() => {
    const filter = gameFilter || 'all';
    if (filter === 'all') {
      return {
        points: player.pointsPerGame,
        threePointers: player.threePointersPerGame,
        freeThrowsMade: player.freeThrowsMadePerGame,
        fouls: player.foulsPerGame,
        minutesPlayed: player.minutesPerGame,
        gamesPlayed: player.gamesPlayed,
        freeThrowPercentage: player.freeThrowPercentage
      };
    }
    
    // Filter game logs by type
    const playerGameLogs = gameLogs.filter(log => 
      log.playerId === player.id && 
      (filter === 'home' ? log.gameType === 'Heim' : log.gameType === 'Auswärts')
    );
    
    if (playerGameLogs.length === 0) {
      return {
        points: 0,
        threePointers: 0,
        freeThrowsMade: 0,
        fouls: 0,
        minutesPlayed: 0,
        gamesPlayed: 0,
        freeThrowPercentage: ''
      };
    }
    
    const totalPoints = playerGameLogs.reduce((sum, log) => sum + log.points, 0);
    const totalThreePointers = playerGameLogs.reduce((sum, log) => sum + log.threePointers, 0);
    const totalFreeThrowsMade = playerGameLogs.reduce((sum, log) => sum + log.freeThrowsMade, 0);
    const totalFreeThrowAttempts = playerGameLogs.reduce((sum, log) => sum + log.freeThrowAttempts, 0);
    const totalFouls = playerGameLogs.reduce((sum, log) => sum + log.fouls, 0);
    const totalMinutes = playerGameLogs.reduce((sum, log) => sum + log.minutesPlayed, 0);
    const games = playerGameLogs.length;
    
    return {
      points: parseFloat((totalPoints / games).toFixed(1)),
      threePointers: parseFloat((totalThreePointers / games).toFixed(1)),
      freeThrowsMade: parseFloat((totalFreeThrowsMade / games).toFixed(1)),
      fouls: parseFloat((totalFouls / games).toFixed(1)),
      minutesPlayed: parseFloat((totalMinutes / games).toFixed(1)),
      gamesPlayed: games,
      freeThrowPercentage: totalFreeThrowAttempts > 0 
        ? `${Math.round((totalFreeThrowsMade / totalFreeThrowAttempts) * 100)}%` 
        : ''
    };
  }, [player, gameLogs, gameFilter]);

const renderStats = () => (
    <div className="grid grid-cols-4 gap-3 text-center">
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.points}</p>
        <p className="text-xs text-muted-foreground">PTS</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.threePointers}</p>
        <p className="text-xs text-muted-foreground">3P</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">
          {filteredStats.freeThrowsMade}
        </p>
        <p className="text-xs text-muted-foreground">FTM</p>
      </div>
      <div>
        <p className="text-xl font-bold text-primary">{filteredStats.fouls}</p>
        <p className="text-xs text-muted-foreground">FLS</p>
      </div>
    </div>
  );

  // Handle navigation with base path
  const handleCardClick = () => {
    // Use absolute path with base path included
    navigate(`/players/${player.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border overflow-hidden"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Player Image */}
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0 relative overflow-hidden group">
            {(() => {
              const bannerImage = getBannerImage();
              if (bannerImage) {
                return (
                  <>
                    <img
                      src={bannerImage.src}
                      alt={bannerImage.alt}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground rounded-full p-1.5 transform transition-transform duration-300 group-hover:scale-110">
                      <TrendingUp size={20} />
                    </div>
                  </>
                );
              } else {
                // Fallback to light blue background with player image
                return (
                  <>
                    <div className="absolute inset-0 bg-secondary" />
                    <img
                      src={`/pitbulls-stats-hub/players/${generateImageFilename(player.firstName, player.lastName).replace(/\.jpg$/, '.png')}`}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-full h-full object-cover object-top relative z-10"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // If PNG fails, try JPG
                        if (target.src.endsWith('.png')) {
                          target.src = `/pitbulls-stats-hub/players/${generateImageFilename(player.firstName, player.lastName)}`;
                        } else {
                          // If both fail, use placeholder with base path
                          target.src = '/pitbulls-stats-hub/placeholder-player.png';
                        }
                      }}
                    />
                    <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground rounded-full p-1.5 relative z-20">
                      <TrendingUp size={20} />
                    </div>
                  </>
                );
              }
            })()}
          </div>

          {/* Right side - Player Info */}
          <div className="flex-1 p-6">
            {/* Header with Name and Position */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {player.firstName} {player.lastName}
                    {currentGameNumber > 1 && gameLogs.length > 1 && (
                      <PlayerTrendIndicator 
                        playerId={player.id}
                        currentGameNumber={currentGameNumber}
                        allGameLogs={gameLogs}
                        className="ml-2 -mt-1"
                      />
                    )}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">{player.position || 'Position nicht angegeben'}</p>
              </div>
              {player.jerseyNumber && player.jerseyNumber > 0 && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 text-blue-600 border-blue-200 text-lg font-bold"
                >
                  #{player.jerseyNumber}
                </Badge>
              )}
            </div>

{/* Physical Stats */}
            <div className="flex gap-6 mb-4">
              {player.height && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Größe</div>
                  <div className="text-sm font-semibold text-foreground">{player.height} cm</div>
                </div>
              )}
              {player.age && player.age > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Alter</div>
                  <div className="text-sm font-semibold text-foreground">{player.age}</div>
                </div>
              )}
            </div>

            {/* Bio */}
            {player.bio && (
              <div className="mb-4">
                <p className={`text-sm text-muted-foreground ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                  {player.bio}
                </p>
                {player.bio.length > 150 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBioExpanded(!isBioExpanded);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-1 focus:outline-none"
                  >
                    {isBioExpanded ? 'Weniger anzeigen' : '...mehr'}
                  </button>
                )}
              </div>
            )}


            {/* Stats */}
            <div className="mt-4">
              {renderStats()}
              <div className="mt-2 text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  ⏱️ {filteredStats.minutesPlayed} Min/Spiel
                  {filteredStats.gamesPlayed > 0 && ` (${filteredStats.gamesPlayed} Spiele)`}
                </p>
                {filteredStats.freeThrowPercentage && (
                  <p className="text-sm text-muted-foreground">
                    🏀 FW-Quote: {filteredStats.freeThrowPercentage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
