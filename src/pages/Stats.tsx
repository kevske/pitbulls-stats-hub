import Layout from "@/components/Layout";
import StatsTable from "@/components/StatsTable";
import { players } from "@/data/players";

const Stats = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-primary mb-8">Spieler Statistiken</h2>
        <StatsTable players={players} />
      </div>
    </Layout>
  );
};

export default Stats;
