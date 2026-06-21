import { useNavigate } from "react-router-dom";
import { PlayerGameLog, PlayerStats } from "@/types/stats";
import { PlayerTrendIndicator } from "./PlayerTrendIndicator";
import { useMemo, memo, useState } from "react";
import { getPlayerImageUrl } from "@/utils/playerUtils";
import { calculateAge } from "@/utils/dateUtils";
import { BASE_PATH } from "@/config";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

// Vision 2026 v2 — "Editorial Court": eine einzige theme-aware Spielerkarte.
interface PlayerCardProps {
  player: PlayerStats;
  gameLogs?: PlayerGameLog[];
  playerLogs?: PlayerGameLog[];
  currentGameNumber?: number;
  gameFilter?: 'all' | 'home' | 'away';
}

const PlayerCard = memo(({ player, gameLogs = [], playerLogs, currentGameNumber = 0, gameFilter = 'all' }: PlayerCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

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

    const logsToFilter = playerLogs || gameLogs;
    const playerGameLogs = logsToFilter.filter(log =>
      (playerLogs ? true : log.playerId === player.id) &&
      (filter === 'home' ? log.gameType === 'Heim' : log.gameType === 'Auswärts')
    );

    if (playerGameLogs.length === 0) {
      return { points: 0, threePointers: 0, freeThrowsMade: 0, fouls: 0, minutesPlayed: 0, gamesPlayed: 0, freeThrowPercentage: '' };
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

  const handleCardClick = () => navigate(`/players/${player.id}`);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') e.preventDefault();
      handleCardClick();
    }
  };

  const imageSrc = player.imageUrl || getPlayerImageUrl(player.firstName, player.lastName);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden glass-card border-l-4 border-l-transparent hover:border-l-brand-orange transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Bild */}
        <div className="sm:w-52 h-72 sm:h-auto flex-shrink-0 relative overflow-hidden bg-muted">
          <img
            src={imageSrc}
            alt={`${player.firstName} ${player.lastName}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 scale-105 group-hover:scale-110 transition-all duration-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placeholder-player.png')) {
                target.src = `${BASE_PATH}/placeholder-player.png`;
              }
            }}
          />
          {/* Position-Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white">
              {player.position || 'G/F'}
            </span>
          </div>
          {/* Nummer-Overlay */}
          {player.jerseyNumber && (
            <div className="absolute top-2 right-3 font-display text-5xl font-black text-white/15 italic select-none">
              {player.jerseyNumber}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground flex items-center">
              {player.firstName} <span className="text-brand-orange ml-1.5">{player.lastName}</span>
              {currentGameNumber > 1 && (playerLogs || gameLogs).length > 1 && (
                <PlayerTrendIndicator
                  playerId={player.id}
                  currentGameNumber={currentGameNumber}
                  playerLogs={playerLogs || gameLogs}
                  className="ml-2"
                />
              )}
            </h3>
            {player.jerseyNumber && player.jerseyNumber > 0 && (
              <div className="px-2 py-1 bg-brand-blue text-white font-black text-xs min-w-[2.25rem] text-center">
                #{player.jerseyNumber}
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {player.height && <span>{player.height} cm</span>}
            {(player.age || calculateAge(player.birthDate)) && <span>{player.age || calculateAge(player.birthDate)} Jahre</span>}
            {player.weight && player.weight > 0 && !isNaN(player.weight) && <span>{player.weight} kg</span>}
          </div>

          {/* Stats-Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { val: filteredStats.points, label: 'PTS' },
              { val: filteredStats.threePointers, label: '3P' },
              { val: filteredStats.freeThrowsMade, label: 'FTM' },
              { val: filteredStats.fouls, label: 'FLS' }
            ].map((stat, i) => (
              <div key={i} className="p-2 bg-muted/60 border border-border">
                <p className="font-display text-lg font-black text-foreground leading-none">{typeof stat.val === 'number' ? stat.val.toFixed(1) : stat.val}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-brand-orange" />
              <span>{typeof filteredStats.minutesPlayed === 'number' ? filteredStats.minutesPlayed.toFixed(1) : filteredStats.minutesPlayed} Min</span>
            </div>
            <span>{filteredStats.gamesPlayed} Spiele{filteredStats.freeThrowPercentage && ` · FW ${filteredStats.freeThrowPercentage}`}</span>
          </div>

          {/* Bio */}
          {player.bio && player.bio.trim() !== '' && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-orange mb-2">Bio</p>
              <p
                className={`text-xs leading-relaxed text-muted-foreground transition-all ${expanded ? '' : 'line-clamp-2'}`}
              >
                {player.bio}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(prev => !prev);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {expanded ? 'Weniger' : 'Mehr'}
                <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
