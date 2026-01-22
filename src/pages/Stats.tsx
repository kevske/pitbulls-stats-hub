import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
import { useStats } from "@/contexts/StatsContext";
import { useModernTheme } from "@/contexts/ModernThemeContext";
import { motion } from "framer-motion";

const Stats = () => {
  const { players, loading, error } = useStats();
  const { isModernMode } = useModernTheme();

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
            <StatsTable players={players} />
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
      </div>
    </Layout>
  );
};

export default Stats;
