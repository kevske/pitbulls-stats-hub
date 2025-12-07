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
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="text-4xl font-bold text-primary mb-2">{playerData.name}</h1>
        <div className="w-20 h-1 bg-primary mb-8"></div>
        
        {/* Player Info Section */}
        <div className="bg-secondary p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Spielerinformationen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-semibold">Name:</span> {playerData.name}</p>
              {/* Add more player details here */}
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
