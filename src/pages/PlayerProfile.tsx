import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import PlayerGallery from '@/components/PlayerGallery';

const PlayerProfile = () => {
  const { playerName } = useParams<{ playerName: string }>();
  
  // In a real app, you would fetch player data here
  const playerData = {
    name: playerName || 'Spieler',
    // Add more player data as needed
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl px-4 pb-20 pt-10">
        <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-3">
          {playerData.name}<span className="text-brand-orange">.</span>
        </h1>
        <div className="w-16 h-1 bg-brand-orange mb-8"></div>

        {/* Player Info Section */}
        <div className="bg-card border border-border p-6 mb-8">
          <h2 className="font-display text-xl font-black uppercase tracking-tight mb-4">Spielerinformationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm"><span className="font-black uppercase tracking-wider text-muted-foreground text-[10px]">Name:</span> {playerData.name}</p>
            </div>
            <div>
              {/* Add player stats or other information */}
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <PlayerGallery playerName={playerData.name} />
      </div>
    </Layout>
  );
};

export default PlayerProfile;
