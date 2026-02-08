import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Home, Plane } from "lucide-react";
import { PlayerGameLog, PlayerStats } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";
import { useStats } from "@/contexts/StatsContext";
import { useState, useMemo, useRef, useEffect, memo } from "react";
import { getPlayerImageUrl } from "@/utils/playerUtils";
import { calculateAge } from "@/utils/dateUtils";
import { BASE_PATH } from "@/config";
import { useModernTheme } from "@/contexts/ModernThemeContext";
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: PlayerStats;
  gameLogs?: PlayerGameLog[];
  playerLogs?: PlayerGameLog[];
  currentGameNumber?: number;
  gameFilter?: 'all' | 'home' | 'away';
}

// Wrapped in React.memo to prevent unnecessary re-renders of all cards when filtering the list (e.g. searching).
// Props are stable references from context, so this ensures O(1) updates for unchanged items.
const PlayerCard = memo(({ player, gameLogs = [], playerLogs, currentGameNumber = 0, gameFilter = 'all' }: PlayerCardProps) => {

  const navigate = useNavigate();
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const { isModernMode } = useModernTheme();

  // calculateAge imported from @/utils/dateUtils

  useEffect(() => {
    const checkOverflow = () => {
      if (bioRef.current) {
        // If expanded, we don't check overflow to avoid hiding the "Show Less" button
        // when the container expands to fit the text.
        if (isBioExpanded) return;
        setShowExpandButton(bioRef.current.scrollHeight > bioRef.current.clientHeight);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (bioRef.current) {
      resizeObserver.observe(bioRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [player.bio, isBioExpanded]);
  // Game filter is now controlled by parent component

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
    // If playerLogs is provided (O(K)), use it. Otherwise fall back to filtering all gameLogs (O(M)).
    const logsToFilter = playerLogs || gameLogs;

    const playerGameLogs = logsToFilter.filter(log =>
      (playerLogs ? true : log.playerId === player.id) &&
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
  }, [player, gameLogs, playerLogs, gameFilter]);

  const renderStats = () => (
    <div className={`grid grid-cols-4 gap-3 text-center ${isModernMode ? 'mt-6' : ''}`}>
      {[
        { val: filteredStats.points, label: 'PTS' },
        { val: filteredStats.threePointers, label: '3P' },
        { val: filteredStats.freeThrowsMade, label: 'FTM' },
        { val: filteredStats.fouls, label: 'FLS' }
      ].map((stat, i) => (
        <div key={i} className={isModernMode ? 'p-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm' : ''}>
          <p className={`text-xl font-bold ${isModernMode ? 'text-white' : 'text-primary'}`}>{typeof stat.val === 'number' ? stat.val.toFixed(1) : stat.val}</p>
          <p className={`text-xs ${isModernMode ? 'text-white/40 font-medium' : 'text-muted-foreground'}`}>{stat.label}</p>
        </div>
      ))}
    </div>
  );

  // Handle navigation with base path
  const handleCardClick = () => {
    // Use absolute path with base path included
    navigate(`/players/${player.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation if the event target is not the card itself (e.g. inner buttons)
    if (e.target !== e.currentTarget) return;

    if (e.key === 'Enter' || e.key === ' ') {
      // Prevent scrolling for Space
      if (e.key === ' ') {
        e.preventDefault();
      }
      handleCardClick();
    }
  };

  const imageSrc = player.imageUrl || getPlayerImageUrl(player.firstName, player.lastName);

  if (isModernMode) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className="group relative cursor-pointer overflow-hidden rounded-[2rem] bg-card glass-card shadow-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-0 flex flex-col sm:flex-row relative z-10">
          {/* Left side - Player Image */}
          <div className="sm:w-48 h-56 sm:h-auto flex-shrink-0 relative overflow-hidden">
            <motion.img
              layoutId={`player-img-${player.id}`}
              src={imageSrc}
              alt={`${player.firstName} ${player.lastName}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top scale-110 group-hover:scale-125 transition-transform duration-700"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('placeholder-player.png')) {
                  target.src = `${BASE_PATH}/placeholder-player.png`;
                }
              }}
            />
            {/* Position Badge */}
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                {player.position || 'G/F'}
              </span>
            </div>
            {/* Number Overlay */}
            {player.jerseyNumber && (
              <div className="absolute top-4 right-4 text-4xl font-black text-white/10 italic">
                {player.jerseyNumber}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 relative">
            {/* Glow effect on hover */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start mb-1">
              <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors">
                {player.firstName} <span className="text-primary">{player.lastName}</span>
              </h3>
              {player.jerseyNumber && (
                <div className="p-2 bg-primary rounded-xl text-white font-black text-xs min-w-[2.5rem] text-center shadow-lg shadow-primary/30">
                  #{player.jerseyNumber}
                </div>
              )}
            </div>

            <div className="flex gap-4 mb-4 text-[11px] font-bold text-white/50 uppercase tracking-tighter">
              {player.height && <span>{player.height} CM</span>}
              {(player.age || calculateAge(player.birthDate)) && <span>{player.age || calculateAge(player.birthDate)} JAHRE</span>}
              {player.weight && <span>{player.weight} KG</span>}
            </div>

            {renderStats()}

            <div className="mt-6 flex items-center justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <span>{typeof filteredStats.minutesPlayed === 'number' ? filteredStats.minutesPlayed.toFixed(1) : filteredStats.minutesPlayed} MIN</span>
              </div>
              <span>{filteredStats.gamesPlayed} SPIELE</span>
            </div>
          </div>
        </CardContent>
      </motion.div>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Player Image */}
          <div className="md:w-48 h-48 md:h-auto flex-shrink-0 relative bg-secondary">
            <img
              src={imageSrc}
              alt={`${player.firstName} ${player.lastName}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('placeholder-player.png')) {
                  target.src = `${BASE_PATH}/placeholder-player.png`;
                }
              }}
            />
            <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground rounded-full p-1.5">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Right side - Player Info */}
          <div className="flex-1 p-6">
            {/* Header with Name and Position */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {player.firstName} {player.lastName}
                    {currentGameNumber > 1 && (playerLogs || gameLogs).length > 1 && (
                      <PlayerTrendIndicator
                        playerId={player.id}
                        currentGameNumber={currentGameNumber}
                        playerLogs={playerLogs || gameLogs}
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
                  aria-label={`Trikotnummer ${player.jerseyNumber}`}
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
              {(player.age || calculateAge(player.birthDate)) && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Alter</div>
                  <div className="text-sm font-semibold text-foreground">
                    {player.age || calculateAge(player.birthDate)}
                  </div>
                </div>
              )}
              {(() => {
                const shouldShowWeight = player.weight && player.weight > 0 && player.weight !== undefined && player.weight !== null && !isNaN(player.weight);
                return shouldShowWeight;
              })() && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Gewicht</div>
                    <div className="text-sm font-semibold text-foreground">{player.weight} kg</div>
                  </div>
                )}
            </div>


            {/* Bio */}
            {player.bio && (
              <div className="mb-4">
                <p
                  ref={bioRef}
                  id={`bio-${player.id}`}
                  className={`text-sm text-muted-foreground ${!isBioExpanded ? 'line-clamp-3' : ''}`}
                >
                  {player.bio}
                </p>
                {showExpandButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBioExpanded(!isBioExpanded);
                    }}
                    aria-expanded={isBioExpanded}
                    aria-controls={`bio-${player.id}`}
                    aria-label={isBioExpanded ? `Weniger über ${player.firstName} anzeigen` : `Mehr über ${player.firstName} anzeigen`}
                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                  ⏱️ {typeof filteredStats.minutesPlayed === 'number' ? filteredStats.minutesPlayed.toFixed(1) : filteredStats.minutesPlayed} Min/Spiel
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
});

export default PlayerCard;

PlayerCard.displayName = 'PlayerCard';
