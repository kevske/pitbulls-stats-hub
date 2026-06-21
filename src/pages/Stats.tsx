import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
import VideoStatsTable from "@/components/VideoStatsTable";
import { useMemo } from "react";
import { useStats } from "@/contexts/StatsContext";
import { Link } from "react-router-dom";
import { Video } from "lucide-react";
import PageHeader from "@/components/vision/PageHeader";

// Vision 2026 v2 — "Editorial Court", theme-aware (kein isModernMode-Fork).
const Stats = () => {
  const { players, videoStats, loading, error } = useStats();

  const taggedGamesCount = useMemo(() => {
    return new Set(videoStats.map(s => s.gameNumber)).size;
  }, [videoStats]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8 text-muted-foreground">Lade Spielerdaten...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-destructive text-center py-8">
            Fehler beim Laden der Spielerdaten: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl px-4 pb-20">
        <PageHeader title="Statistiken" subtitle="Leistungskennzahlen // Datenvisualisierung" right="Saisonwerte" />

        {/* Offizielle Statistik-Tabelle */}
        <div className="glass-card p-4 md:p-6">
          <StatsTable players={players} />
        </div>

        {/* Video-Statistiken */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Video className="h-5 w-5 text-brand-orange" />
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground">
              Video <span className="text-brand-orange">Stats</span>
            </h2>
            <span className="text-[10px] font-black tracking-widest text-brand-orange uppercase px-2 py-0.5 border border-brand-orange/30 rounded-full">Beta</span>
            {taggedGamesCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-auto">
                Basiert auf {taggedGamesCount} {taggedGamesCount === 1 ? 'Spiel' : 'Spielen'}
              </span>
            )}
          </div>
          <div className="glass-card p-4 md:p-6">
            <VideoStatsTable stats={videoStats} players={players} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Detaillierte Auswertungen findest du unter <Link to="/videos" className="text-brand-blue hover:text-brand-orange underline transition-colors">Videos</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Stats;
