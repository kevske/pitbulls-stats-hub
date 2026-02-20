import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
import VideoStatsTable from "@/components/VideoStatsTable";
import { useMemo } from "react";
import { useStats } from "@/contexts/StatsContext";
import { useModernTheme } from "@/contexts/ModernThemeContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Video } from "lucide-react";

const Stats = () => {
  const { players, videoStats, loading, error } = useStats();
  const { isModernMode } = useModernTheme();

  const taggedGamesCount = useMemo(() => {
    return new Set(videoStats.map(s => s.gameNumber)).size;
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

          {/* Official Stats Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[2.5rem] p-4 md:p-8"
          >
            <StatsTable players={players} />
          </motion.div>

          {/* Video Stats Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-[2.5rem] p-4 md:p-8 mt-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Video className="h-5 w-5 text-orange-400" />
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">
                Video <span className="text-orange-400">Stats</span>
              </h2>
              <span className="text-[10px] font-bold tracking-widest text-orange-400/50 uppercase px-2 py-0.5 border border-orange-400/20 rounded-full">Beta</span>
              {taggedGamesCount > 0 && (
                <span className="text-xs text-white/40 ml-auto">Basiert auf {taggedGamesCount} {taggedGamesCount === 1 ? 'Spiel' : 'Spielen'}</span>
              )}
            </div>
            <VideoStatsTable stats={videoStats} players={players} />
            <p className="mt-4 text-xs text-white/30">
              Detaillierte Auswertungen findest du unter <Link to="/videos" className="underline hover:text-white/50 transition-colors">Videos</Link>.
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-primary mb-8">Statistiken</h2>

        <StatsTable players={players} />

        {/* Video Stats Section */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-4">
            <Video className="h-5 w-5 text-orange-500" />
            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">Video Stats</h3>
            <span className="text-[10px] font-bold tracking-widest text-orange-500/60 uppercase px-2 py-0.5 border border-orange-400/30 rounded-full">Beta</span>
            {taggedGamesCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">Basiert auf {taggedGamesCount} {taggedGamesCount === 1 ? 'Spiel' : 'Spielen'}</span>
            )}
          </div>
          <VideoStatsTable stats={videoStats} players={players} />
          <p className="mt-4 text-xs text-muted-foreground">
            Detaillierte Auswertungen findest du unter <Link to="/videos" className="underline hover:text-foreground transition-colors">Videos</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
