import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
import { useStats } from "@/contexts/StatsContext";

const Stats = () => {
  const { players, loading, error } = useStats();

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
