import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStats } from '@/contexts/StatsContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from "lucide-react";

import { PlayerStats, PlayerGameLog } from '@/types/stats';
import { calculateAge } from '@/utils/dateUtils';
import { BASE_PATH } from '@/config';
import {
  usePlayerGallery,
  usePlayerAggregatedStats,
  useBoxScoreAvailability,
  StatCard,
  PhotoGallery,
  ImageModal,
  PlayerHeader,
  StatsGrid,
  StatsTrends,
  GameLogTable
} from '@/features/player-detail';

// Custom CSS for scrolling animation is now in index.css

/** Extract player slug from imageUrl for gallery lookup */
const getPlayerSlugFromUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  const match = imageUrl.match(/players\/([^/]+)/);
  if (!match) return undefined;
  return match[1].replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
};

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { games, gameLogs: allGameLogs } = useStats();
  const { player, gameLogs } = usePlayerStats(id) as { player: PlayerStats | null; gameLogs: PlayerGameLog[] };
  const navigate = useNavigate();

  // Get player slug for gallery hook
  const playerSlug = useMemo(() => getPlayerSlugFromUrl(player?.imageUrl), [player?.imageUrl]);

  // Feature hooks
  const {
    loadedImages,
    selectedImage,
    currentGalleryIndex,
    randomImageStream,
    openImageAtIndex,
    navigateImage,
    handleImageError,
    closeModal,
    scrollToGallery
  } = usePlayerGallery({ playerSlug });

  const {
    ppg,
    threePointersPerGame,
    freeThrowPercentage,
    fpg,
    averageMinutes,
    pointsPer40,
    threePointersPer40,
    foulsPer40
  } = usePlayerAggregatedStats(gameLogs);

  const { hasBoxScoreData, getOpponentName } = useBoxScoreAvailability(games, allGameLogs);

  if (!player || !player.firstName) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800">Spieler nicht gefunden</h2>
            <p className="text-gray-500 mt-2">Der angeforderte Spieler konnte nicht gefunden werden.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>

        <div className="bg-card rounded-lg shadow-elegant overflow-hidden">
          <PlayerHeader
            player={player}
            randomImageStream={randomImageStream}
            loadedImages={loadedImages}
            scrollToGallery={scrollToGallery}
          />

          {/* Player Bio */}
          {player.bio && (
            <div className="p-6 border-b border-border">
              <p className="text-muted-foreground italic">"{player.bio}"</p>
            </div>
          )}

          <StatsGrid
            averageMinutes={averageMinutes}
            ppg={ppg}
            threePointersPerGame={threePointersPerGame}
            fpg={fpg}
            freeThrowPercentage={freeThrowPercentage}
            pointsPer40={pointsPer40}
            threePointersPer40={threePointersPer40}
            foulsPer40={foulsPer40}
          />

          <StatsTrends
            gameLogs={gameLogs}
            hasBoxScoreData={hasBoxScoreData}
            getOpponentName={getOpponentName}
          />

          <GameLogTable
            gameLogs={gameLogs}
            hasBoxScoreData={hasBoxScoreData}
            getOpponentName={getOpponentName}
          />
        </div>

        {/* Photo Gallery Section */}
        <PhotoGallery
          images={loadedImages}
          isLoading={!player}
          onImageClick={openImageAtIndex}
          onImageError={handleImageError}
        />

        {/* Image Modal */}
        <ImageModal
          selectedImage={selectedImage}
          onClose={closeModal}
          onNavigate={navigateImage}
          currentIndex={currentGalleryIndex}
          totalImages={loadedImages.length}
        />
      </div>
    </Layout>
  );
};

export default PlayerDetail;
