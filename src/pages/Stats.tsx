import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
// import VideoStatsTable from "@/components/VideoStatsTable";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStats } from "@/contexts/StatsContext";
import { useModernTheme } from "@/contexts/ModernThemeContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Stats = () => {
  const { players, videoStats, loading, error } = useStats();
  const { isModernMode } = useModernTheme();
  const [showVideoStats, setShowVideoStats] = useState(false);

  // Aggregate video stats by player
  const aggregatedVideoStats = useMemo(() => {
    const agg: Record<string, any> = {};

    videoStats.forEach(stat => {
      if (!agg[stat.playerId]) {
        agg[stat.playerId] = {
          games: 0,
          twoPointersMade: 0,
          twoPointersAttempted: 0,
          threePointersMade: 0,
          threePointersAttempted: 0,
          steals: 0,
          blocks: 0,
          assists: 0,
          rebounds: 0,
          turnovers: 0
        };
      }

      const playerAgg = agg[stat.playerId];
      playerAgg.games += 1;
      playerAgg.twoPointersMade += stat.twoPointersMade;
      playerAgg.twoPointersAttempted += stat.twoPointersAttempted;
      playerAgg.threePointersMade += stat.threePointersMade;
      playerAgg.threePointersAttempted += stat.threePointersAttempted;
      playerAgg.steals += stat.steals;
      playerAgg.blocks += stat.blocks;
      playerAgg.assists += stat.assists;
      playerAgg.rebounds += stat.rebounds;
      playerAgg.turnovers += stat.turnovers;
    });

    // Calculate averages and percentages
    Object.keys(agg).forEach(playerId => {
      const stats = agg[playerId];
      stats.twoPointerPercentage = stats.twoPointersAttempted > 0 ? stats.twoPointersMade / stats.twoPointersAttempted : 0;
      stats.threePointerPercentage = stats.threePointersAttempted > 0 ? stats.threePointersMade / stats.threePointersAttempted : 0;

      stats.stealsPerGame = stats.games > 0 ? stats.steals / stats.games : 0;
      stats.blocksPerGame = stats.games > 0 ? stats.blocks / stats.games : 0;
      stats.assistsPerGame = stats.games > 0 ? stats.assists / stats.games : 0;
      stats.reboundsPerGame = stats.games > 0 ? stats.rebounds / stats.games : 0;
      stats.turnoversPerGame = stats.games > 0 ? stats.turnovers / stats.games : 0;
    });

    return agg;
  }, [videoStats]);

  const taggedGamesCount = useMemo(() => {
    const uniqueGames = new Set(videoStats.map(s => s.gameNumber));
    return uniqueGames.size;
  }, [videoStats]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Lade Spielerdaten...</div>
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

  if (isModernMode) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pb-20">
          <div className="pt-10 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
                Kern <span className="text-primary">Statistiken</span>
              </h1>
              <p className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">Leistungskennzahlen // Datenvisualisierung</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[2.5rem] p-4 md:p-8"
          >
            <div className="flex justify-end mb-4 items-center space-x-2">
              <Switch
                id="video-stats-mode"
                checked={showVideoStats}
                onCheckedChange={setShowVideoStats}
              />
              <Label htmlFor="video-stats-mode" className="text-white">Video Stats (Beta)</Label>
            </div>

            <StatsTable
              players={players}
              videoStatsData={aggregatedVideoStats}
              showVideoStats={showVideoStats}
            />

            {/* Video Stats Info */}
            {showVideoStats && (
              <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold mb-1">Hinweis zu Video-Stats (V)</p>
                  <p>Die <strong>(V)</strong> markierten Spalten basieren ausschließlich auf <strong>{taggedGamesCount} getaggten Spielen</strong>. Sie können von den offiziellen Spielberichten abweichen.</p>
                  <p className="mt-2 text-yellow-200/60">Detaillierte Auswertungen findest du unter <Link to="/videos" className="underline hover:text-yellow-100">Videos</Link>.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-primary">Statistiken</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="video-stats-mode-std"
              checked={showVideoStats}
              onCheckedChange={setShowVideoStats}
            />
            <Label htmlFor="video-stats-mode-std">Video Stats</Label>
          </div>
        </div>

        <StatsTable
          players={players}
          videoStatsData={aggregatedVideoStats}
          showVideoStats={showVideoStats}
        />

        {/* Video Stats Info */}
        {showVideoStats && (
          <div className="mt-6 p-4 bg-yellow-50/50 border border-yellow-200 rounded-lg text-yellow-800 text-sm flex items-start gap-3 dark:bg-yellow-900/10 dark:text-yellow-200/80 dark:border-yellow-800/50">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold mb-1">Hinweis zu Video-Stats (V)</p>
              <p>Die <strong>(V)</strong> markierten Spalten basieren ausschließlich auf <strong>{taggedGamesCount} getaggten Spielen</strong> und sind unvollständig.</p>
              <p className="mt-2 opacity-80">Detaillierte Auswertungen findest du unter <Link to="/videos" className="underline">Videos</Link>.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Stats;
