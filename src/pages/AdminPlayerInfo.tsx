import React, { useState, useEffect } from 'react';
import { PlayerInfo } from '../types/supabase';
import { PlayerInfoService } from '../lib/playerInfoService';
import AuthGuard from '../components/AuthGuard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Pencil, Trophy, Plus, Save, X, User, Users, Settings, History, Database, RefreshCw } from 'lucide-react';

interface PlayerFormProps {
  formData: Partial<PlayerInfo>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PlayerInfo>>>;
  isEdit?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({
  formData,
  setFormData,
  isEdit = false,
  onCancel,
  onSubmit
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="player_slug">Spieler-Slug *</Label>
        <Input
          id="player_slug"
          value={formData.player_slug || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, player_slug: e.target.value }))}
          placeholder="z.B., abdullah-ari"
          disabled={isEdit}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="first_name">Vorname *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            placeholder="Vorname"
          />
        </div>
        <div>
          <Label htmlFor="last_name">Nachname *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            placeholder="Nachname"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="email">E-Mail (für Login)</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="spieler@example.com"
        />
      </div>
      <div>
        <Label htmlFor="jersey_number">Trikotnummer</Label>
        <Input
          id="jersey_number"
          type="number"
          value={formData.jersey_number || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value ? parseInt(e.target.value) : undefined }))}
          placeholder="23"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="position">Position</Label>
        <Select value={formData.position || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value || undefined }))}>
          <SelectTrigger>
            <SelectValue placeholder="Position auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PG">Point Guard</SelectItem>
            <SelectItem value="SG">Shooting Guard</SelectItem>
            <SelectItem value="SF">Small Forward</SelectItem>
            <SelectItem value="PF">Power Forward</SelectItem>
            <SelectItem value="C">Center</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="height">Größe</Label>
        <Input
          id="height"
          value={formData.height || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
          placeholder="6'2&quot;"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="weight">Gewicht (kg)</Label>
        <Input
          id="weight"
          type="number"
          value={formData.weight || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value ? parseInt(e.target.value) : undefined }))}
          placeholder="80"
        />
      </div>
      <div>
        <Label htmlFor="birth_date">Geburtsdatum</Label>
        <Input
          id="birth_date"
          type="date"
          value={formData.birth_date || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value || undefined }))}
        />
      </div>
      <div>
        <Label htmlFor="nationality">Nationalität</Label>
        <Input
          id="nationality"
          value={formData.nationality || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
          placeholder="Deutsch"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="bio">Biografie</Label>
      <Textarea
        id="bio"
        value={formData.bio || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
        placeholder="Spielerbiografie..."
        rows={4}
      />
    </div>


    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          value={formData.social_links?.instagram || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            social_links: { ...prev.social_links, instagram: e.target.value }
          }))}
          placeholder="@username"
        />
      </div>
      <div>
        <Label htmlFor="twitter">Twitter</Label>
        <Input
          id="twitter"
          value={formData.social_links?.twitter || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            social_links: { ...prev.social_links, twitter: e.target.value }
          }))}
          placeholder="@username"
        />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.social_links?.website || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            social_links: { ...prev.social_links, website: e.target.value }
          }))}
          placeholder="https://example.com"
        />
      </div>
    </div>

    <div className="flex items-center space-x-2">
      <Switch
        id="is_active"
        checked={formData.is_active ?? true}
        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
      />
      <Label htmlFor="is_active">Aktiver Spieler</Label>
    </div>

    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>
        Abbrechen
      </Button>
      <Button onClick={onSubmit}>
        <Save className="h-4 w-4 mr-2" />
        {isEdit ? 'Spieler aktualisieren' : 'Neuen Spieler erstellen'}
      </Button>
    </div>
  </div>
);

const AdminPlayerInfo: React.FC = () => {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<PlayerInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PlayerInfo>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await PlayerInfoService.getAllPlayers();
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
      toast({
        title: 'Error',
        description: 'Failed to load players. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    try {
      if (!formData.player_slug || !formData.first_name || !formData.last_name) {
        toast({
          title: 'Validation Error',
          description: 'Player slug, first name, and last name are required.',
          variant: 'destructive',
        });
        return;
      }

      const playerData = {
        player_slug: formData.player_slug!,
        first_name: formData.first_name!,
        last_name: formData.last_name!,
        jersey_number: formData.jersey_number || null,
        position: formData.position || null,
        height: formData.height || null,
        weight: formData.weight || null,
        birth_date: formData.birth_date || null,
        nationality: formData.nationality || null,
        bio: formData.bio || null,
        social_links: formData.social_links || {},
        is_active: formData.is_active ?? true,
      };

      await PlayerInfoService.createPlayer(playerData);
      setIsCreateDialogOpen(false);
      setFormData({});
      loadPlayers();

      toast({
        title: 'Success',
        description: 'Player created successfully.',
      });
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: 'Error',
        description: 'Failed to create player. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      await PlayerInfoService.updatePlayer(editingPlayer.id, formData);
      setEditingPlayer(null);
      setFormData({});
      loadPlayers();

      toast({
        title: 'Success',
        description: 'Player updated successfully.',
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: 'Error',
        description: 'Failed to update player. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAchievePlayer = async (id: string) => {
    try {
      await PlayerInfoService.updatePlayer(id, { is_active: false });
      loadPlayers();

      toast({
        title: 'Erfolg',
        description: 'Spieler archiviert.',
      });
    } catch (error) {
      console.error('Error achieving player:', error);
      toast({
        title: 'Fehler',
        description: 'Fehler beim Archivieren. Bitte versuche es erneut.',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (player: PlayerInfo) => {
    setEditingPlayer(player);
    setFormData(player);
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setFormData({});
  };



  // Migration State
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);

  const handleMigration = async () => {
    setMigrationStatus('running');
    setMigrationLogs(['Starting migration...']);

    try {
      const { MigrationService } = await import('../lib/migrationService');
      await MigrationService.migrateAllData((msg) => {
        setMigrationLogs(prev => [...prev, msg]);
      });
      setMigrationStatus('completed');
      toast({
        title: 'Migration Completed',
        description: 'Video projects migrated successfully.',
      });
    } catch (error) {
      setMigrationStatus('error');
      setMigrationLogs(prev => [...prev, `Error: ${(error as Error).message}`]);
      toast({
        title: 'Migration Failed',
        description: 'Check logs for details.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Spieler werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Spieler-Informationen</h1>
              <p className="text-gray-600">Spielerprofile und Informationen verwalten</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isMigrationOpen} onOpenChange={setIsMigrationOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Database className="h-4 w-4 mr-2" />
                    Migrate Videos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Migrate Video Projects from JSONBin to Supabase</DialogTitle>
                    <DialogDescription>
                      This will read all video data from JSONBin and save it to the new Supabase table.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 my-4">
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
                      {migrationLogs.length === 0 ? (
                        <span className="text-muted-foreground">Ready to start migration...</span>
                      ) : (
                        migrationLogs.map((log, i) => (
                          <div key={i} className="mb-1">{log}</div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={handleMigration}
                      disabled={migrationStatus === 'running'}
                    >
                      {migrationStatus === 'running' ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Migrating...
                        </>
                      ) : 'Start Migration'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/audit-logs'}
              >
                <History className="h-4 w-4 mr-2" />
                Audit-Logs ansehen
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Spieler
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Neuen Spieler erstellen</DialogTitle>
                    <DialogDescription>
                      Füge einen neuen Spieler zur Datenbank hinzu. Gib seine Informationen unten ein.
                    </DialogDescription>
                  </DialogHeader>
                  <PlayerForm
                    formData={formData}
                    setFormData={setFormData}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    onSubmit={handleCreatePlayer}
                    isEdit={false}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {players.map((player) => (
            <Card key={player.id}>
              <CardContent className="p-6">
                {editingPlayer?.id === player.id ? (
                  <PlayerForm
                    formData={formData}
                    setFormData={setFormData}
                    onCancel={cancelEdit}
                    onSubmit={handleUpdatePlayer}
                    isEdit={true}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-xl font-semibold">
                          {player.first_name} {player.last_name}
                        </h3>
                        <Badge variant={player.is_active ? "default" : "secondary"}>
                          {player.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        {player.jersey_number && (
                          <Badge variant="outline">#{player.jersey_number}</Badge>
                        )}
                        {player.position && (
                          <Badge variant="outline">{player.position}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {player.height && (
                          <div>
                            <span className="font-medium">Größe:</span> {player.height}
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <span className="font-medium">Gewicht:</span> {player.weight} kg
                          </div>
                        )}
                        {player.birth_date && (
                          <div>
                            <span className="font-medium">Geburtsdatum:</span> {new Date(player.birth_date).toLocaleDateString()}
                          </div>
                        )}
                        {player.email && (
                          <div>
                            <span className="font-medium">E-Mail:</span> {player.email}
                          </div>
                        )}
                        {player.nationality && (
                          <div>
                            <span className="font-medium">Nationalität:</span> {player.nationality}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Slug:</span> {player.player_slug}
                        </div>
                      </div>

                      {player.bio && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">{player.bio}</p>
                        </div>
                      )}


                      {(player.social_links?.instagram || player.social_links?.twitter || player.social_links?.website) && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">Soziale Links:</h4>
                          <div className="flex gap-4 text-sm">
                            {player.social_links.instagram && (
                              <span>IG: {player.social_links.instagram}</span>
                            )}
                            {player.social_links.twitter && (
                              <span>Twitter: {player.social_links.twitter}</span>
                            )}
                            {player.social_links.website && (
                              <span>Web: {player.social_links.website}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(player)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trophy className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Spieler archivieren</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchtest du {player.first_name} {player.last_name} archivieren? Der Spieler wird inaktiv, aber die Daten bleiben erhalten.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAchievePlayer(player.id)}>
                              Archivieren
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {players.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Keine Spieler gefunden</h3>
                <p className="text-gray-600 mb-4">
                  Beginne damit, deinen ersten Spieler zur Datenbank hinzuzufügen.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Spieler hinzufügen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPlayerInfo;
