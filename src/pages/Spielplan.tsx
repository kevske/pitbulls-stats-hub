import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { useSpielplanData } from '@/hooks/useSpielplanData';
import GameCard from '@/components/spielplan/GameCard';

const Spielplan: React.FC = () => {
  const { games, loading, error, leagueComparisons } = useSpielplanData();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">Lade Spielplan...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-center py-8">
            Fehler beim Laden des Spielplans: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Spielplan</h1>
        </div>

        {games.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Keine kommenden Spiele gefunden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                leagueComparison={leagueComparisons.get(game.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Spielplan;
