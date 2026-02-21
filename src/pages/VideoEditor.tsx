import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { VideoControls } from '@/components/video/VideoControls';
import { EventInput } from '@/components/video/EventInput';
import { EventList } from '@/components/video/EventList';
import { PlayerManager } from '@/components/video/PlayerManager';
import { Statistics } from '@/components/video/Statistics';
import { ExportPanel } from '@/components/video/ExportPanel';
import { VideoStatsIntegration } from '@/components/video/VideoStatsIntegration';
import { PlaylistSideMenu } from '@/components/video/PlaylistSideMenu';
import { CurrentPlayersOnField } from '@/components/video/CurrentPlayersOnField';
import { LearningDialog } from '@/components/video/LearningDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { generateSaveData } from '@/services/saveLoad';
import Layout from '@/components/Layout';
import { useVideoEditor } from '@/hooks/useVideoEditor';
import { VideoEditorWelcome } from '@/components/video/VideoEditorWelcome';
import { VideoEditorHeader } from '@/components/video/VideoEditorHeader';

const VideoEditor = () => {
  const {
    state,
    handlers,
    refs,
    computed
  } = useVideoEditor();

  const {
    videoId,
    playlistId,
    players,
    events,
    isSideMenuOpen,
    currentPlayersOnCourt,
    shouldResetPlayers,
    isSkippingEnabled,
    isLearningDialogOpen,
    currentTime,
    isPlaying,
    lastSavedData,
    timestampConflict,
    isPlaylistMode,
    playlistVideos,
    currentPlaylistIndex,
    gameNumber,
  } = state;

  const {
    setIsSideMenuOpen,
    setCurrentPlayersOnCourt,
    setIsSkippingEnabled,
    setIsLearningDialogOpen,
    setPendingLearningEvent,
    handleLoadData,
    handleLoadFile,
    handleFileSelect,
    handleSaveToStorage,
    handleVideoSelect,
    handleVideoChange,
    handleAddPlayer,
    handleRemovePlayer,
    handleQuickAction,
    handleSaveLearning,
    handleAddEvent,
    handleDeleteEvent,
    handlePlayPause,
    handleSeekBackward,
    handleSeekForward,
    handleRestart,
    handleSeekTo,
    handleTimeUpdate,
    handleStateChange,
    handleAddToQueue,
    handleRemoveFromQueue,
    handleSelectPlaylistVideo,
    handlePlaylistReady,
    navigate
  } = handlers;

  const { availablePlayers } = computed;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
        <VideoEditorHeader
          isPlaylistMode={isPlaylistMode}
          isSideMenuOpen={isSideMenuOpen}
          setIsSideMenuOpen={setIsSideMenuOpen}
          onClose={() => navigate('/videos')}
        />

        <main className="container mx-auto px-4 py-6">
          {!videoId && !playlistId ? (
            <VideoEditorWelcome
              onLoadFile={handleLoadFile}
              fileInputRef={refs.fileInputRef}
              onFileSelect={handleFileSelect}
              onVideoSelect={handleVideoSelect}
              onAddToQueue={handleAddToQueue}
              showQueueOption={true}
            />
          ) : (
            <div className="space-y-6">
              <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                onPlayPause={handlePlayPause}
                onSeekBackward={handleSeekBackward}
                onSeekForward={handleSeekForward}
                onRestart={handleRestart}
                onQuickAction={handleQuickAction}
                isSkipping={isSkippingEnabled}
                onToggleSkip={() => setIsSkippingEnabled(!isSkippingEnabled)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <YouTubePlayer
                    ref={refs.youtubePlayerRef}
                    videoId={videoId || undefined}
                    playlistId={playlistId}
                    onTimeUpdate={handleTimeUpdate}
                    onStateChange={handleStateChange}
                    onPlaylistReady={handlePlaylistReady}
                    onVideoChange={handleVideoChange}
                  />

                  <Button onClick={handleSaveToStorage} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save to Cloud Storage
                  </Button>

                  {timestampConflict && timestampConflict.hasConflict && (
                    <Card className={`border-2 ${timestampConflict.localIsNewer
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                      : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
                      }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${timestampConflict.localIsNewer ? 'bg-blue-500' : 'bg-orange-500'
                            }`} />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${timestampConflict.localIsNewer
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-orange-800 dark:text-orange-200'
                              }`}>
                              {timestampConflict.localIsNewer ? 'Local Version is Newer' : 'Remote Version is Newer'}
                            </div>
                            <div className={`text-xs mt-1 ${timestampConflict.localIsNewer
                              ? 'text-blue-600 dark:text-blue-300'
                              : 'text-orange-600 dark:text-orange-300'
                              }`}>
                              {timestampConflict.comparison.summary}
                            </div>
                            {timestampConflict.localIsNewer ? (
                              <div className="text-xs text-muted-foreground mt-2">
                                Your local changes are newer than the cloud version. Saving will overwrite the remote version.
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground mt-2">
                                The cloud version is newer. Consider loading the latest version before making changes.
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <ExportPanel
                    events={events}
                    players={players}
                    videoId={videoId}
                    playlistId={playlistId}
                    onLoadData={handleLoadData}
                    lastSavedData={lastSavedData}
                  />

                  <VideoStatsIntegration
                    saveData={generateSaveData(players, events, videoId, playlistId)}
                    gameNumber={gameNumber}
                    onIntegrationComplete={(result) => {
                      console.log('Video stats integrated:', result);
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <CurrentPlayersOnField
                    players={players}
                    events={events}
                    onAddEvent={handleAddEvent}
                    currentTime={currentTime}
                    availablePlayers={availablePlayers}
                    onCurrentPlayersChange={setCurrentPlayersOnCourt}
                    resetOnLoad={shouldResetPlayers}
                  />

                  <Tabs defaultValue="events" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                      <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
                      <TabsTrigger value="players" className="flex-1">Players</TabsTrigger>
                    </TabsList>
                    <TabsContent value="events" className="mt-3">
                      <EventInput
                        players={players}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        onAddEvent={handleAddEvent}
                      />
                      <div className="mt-4">
                        <EventList
                          events={events}
                          onDeleteEvent={handleDeleteEvent}
                          onSeekTo={handleSeekTo}
                          currentTime={currentTime}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="stats" className="mt-3">
                      <Statistics events={events} players={players} />
                    </TabsContent>
                    <TabsContent value="players" className="mt-3">
                      <PlayerManager
                        players={players}
                        onAddPlayer={handleAddPlayer}
                        onRemovePlayer={handleRemovePlayer}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </main>

        {isPlaylistMode && (
          <PlaylistSideMenu
            videos={playlistVideos}
            currentIndex={currentPlaylistIndex}
            onSelectVideo={handleSelectPlaylistVideo}
            onAddToQueue={handleAddToQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            isOpen={isSideMenuOpen}
            onToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
          />
        )}

        <LearningDialog
          isOpen={isLearningDialogOpen}
          onOpenChange={(open) => {
            setIsLearningDialogOpen(open);
            if (!open) setPendingLearningEvent(null);
          }}
          onSave={handleSaveLearning}
          onCancel={() => {
            setIsLearningDialogOpen(false);
            setPendingLearningEvent(null);
          }}
        />
      </div>
    </Layout>
  );
};

export default VideoEditor;
