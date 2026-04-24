import React, { useMemo } from 'react';
import { useStats } from '@/contexts/StatsContext';
import { calculateAwards } from '@/utils/awardUtils';
import { AwardCarousel } from '@/components/awards/AwardCarousel';
import { motion } from 'framer-motion';
import { Trophy, Star, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';

const Awards = () => {
  const { players, gameLogs, videoStats, games, loading, error } = useStats();

  const categories = useMemo(() => {
    if (loading || players.length === 0) return [];
    return calculateAwards(players, gameLogs, videoStats, games);
  }, [players, gameLogs, videoStats, games, loading]);

  const isFinal = React.useMemo(() => {
    return true;
  }, []);

  // Force Vision 2026 theme and dark mode when on this page
  React.useEffect(() => {
    const html = document.documentElement;
    const hasVision = html.classList.contains('vision-2026');
    const hasDark = html.classList.contains('dark');
    
    if (!hasVision) html.classList.add('vision-2026');
    if (!hasDark) html.classList.add('dark');
    
    return () => {
      // Only remove if it wasn't there before
      if (!hasVision) html.classList.remove('vision-2026');
      if (!hasDark) html.classList.remove('dark');
    };
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <h2 className="text-2xl font-bold mb-4">Fehler beim Laden der Statistiken</h2>
        <p className="text-white/60">{error}</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="dark vision-2026 min-h-screen pt-24 pb-20 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-slate-950 -z-20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6",
                isFinal 
                  ? "bg-green-500/10 border-green-500/20 text-green-400" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}
            >
              {isFinal ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-xs font-bold uppercase tracking-widest">
                Saison 2025/26 {isFinal ? "Finale Ergebnisse" : "Prognose"}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic mb-6"
            >
              Pitbulls <span className="text-amber-400">Awards</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/40 text-sm max-w-2xl mx-auto mb-6"
            >
              * Einige Kategorien (z.B. Assists, Rebounds, Steals, Blocks) basieren ausschließlich auf den per Video-Analyse erfassten Spielen.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-white/60 max-w-2xl mx-auto"
            >
              Auszeichnungen für Exzellenz, Wachstum und den unermüdlichen Geist des TSV Neuenstadt. 
              Die Gewinner werden durch fortgeschrittene Saison-Analysen ermittelt.
            </motion.p>
          </div>

          {/* Awards Carousel */}
          {categories.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <AwardCarousel categories={categories} />
            </motion.div>
          ) : (
            <div className="text-center py-20 text-white/40">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Noch keine Award-Daten für diese Saison verfügbar.</p>
            </div>
          )}

          {/* Footer Decoration */}
          <div className="mt-20 text-center text-white/20 text-sm uppercase tracking-widest font-medium">
            Stats Hub &copy; 2026 • TSV Neuenstadt Pitbulls
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Awards;
