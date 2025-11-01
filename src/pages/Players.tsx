import Layout from "@/components/Layout";
import PlayerCard from "@/components/PlayerCard";
import { players } from "@/data/players";

const Players = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-primary mb-8">Unsere Spieler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Players;
