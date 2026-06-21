import React from 'react';
import Layout from '@/components/Layout';
import { useSpielplanData } from '@/hooks/useSpielplanData';
import GameCard from '@/components/spielplan/GameCard';
import PageHeader from '@/components/vision/PageHeader';

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
          <div className="text-destructive text-center py-8">
            Fehler beim Laden des Spielplans: {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 pb-20">
        <PageHeader title="Spielplan" subtitle="Kommende Spiele & Termine" right="Vorschau" />

        {games.length === 0 ? (
          <div className="border border-dashed border-border py-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Keine kommenden Spiele gefunden.</p>
          </div>
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
