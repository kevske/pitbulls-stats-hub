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
import { Pencil, Trash2, Plus, Save, X, User, Users, Settings, History } from 'lucide-react';

const AdminPlayerInfo: React.FC = () => {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<PlayerInfo | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PlayerInfo>>({});
  const [newAchievement, setNewAchievement] = useState('');
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
        achievements: formData.achievements || [],
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

  const handleDeletePlayer = async (id: string) => {
    try {
      await PlayerInfoService.deletePlayer(id);
      loadPlayers();
      
      toast({
        title: 'Success',
        description: 'Player deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete player. Please try again.',
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

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || []
    }));
  };

  const PlayerForm: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="player_slug">Player Slug *</Label>
          <Input
            id="player_slug"
            value={formData.player_slug || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, player_slug: e.target.value }))}
            placeholder="e.g., abdullah-ari"
            disabled={isEdit}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="First name"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="Last name"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email (for login)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="player@example.com"
          />
        </div>
        <div>
          <Label htmlFor="jersey_number">Jersey Number</Label>
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
              <SelectValue placeholder="Select position" />
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
          <Label htmlFor="height">Height</Label>
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
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value ? parseInt(e.target.value) : undefined }))}
            placeholder="180"
          />
        </div>
        <div>
          <Label htmlFor="birth_date">Birth Date</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value || undefined }))}
          />
        </div>
        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
            placeholder="German"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Player biography..."
          rows={4}
        />
      </div>

      <div>
        <Label>Achievements</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              placeholder="Add achievement..."
              onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
            />
            <Button type="button" onClick={addAchievement} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.achievements?.map((achievement, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {achievement}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeAchievement(index)} />
              </Badge>
            ))}
          </div>
        </div>
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
        <Label htmlFor="is_active">Active Player</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={isEdit ? cancelEdit : () => setIsCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdatePlayer : handleCreatePlayer}>
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? 'Update' : 'Create'} Player
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Loading players...</p>
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
              <h1 className="text-3xl font-bold">Player Info Management</h1>
              <p className="text-gray-600">Manage player profiles and information</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/audit-logs'}
              >
                <History className="h-4 w-4 mr-2" />
                View Audit Logs
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Player
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Player</DialogTitle>
                    <DialogDescription>
                      Add a new player to the database. Fill in their information below.
                    </DialogDescription>
                  </DialogHeader>
                  <PlayerForm />
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
                <PlayerForm isEdit />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold">
                        {player.first_name} {player.last_name}
                      </h3>
                      <Badge variant={player.is_active ? "default" : "secondary"}>
                        {player.is_active ? "Active" : "Inactive"}
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
                          <span className="font-medium">Height:</span> {player.height}
                        </div>
                      )}
                      {player.weight && (
                        <div>
                          <span className="font-medium">Weight:</span> {player.weight} lbs
                        </div>
                      )}
                      {player.birth_date && (
                        <div>
                          <span className="font-medium">Birth Date:</span> {new Date(player.birth_date).toLocaleDateString()}
                        </div>
                      )}
                      {player.email && (
                        <div>
                          <span className="font-medium">Email:</span> {player.email}
                        </div>
                      )}
                      {player.nationality && (
                        <div>
                          <span className="font-medium">Nationality:</span> {player.nationality}
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

                    {player.achievements && player.achievements.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Achievements:</h4>
                        <div className="flex flex-wrap gap-2">
                          {player.achievements.map((achievement, index) => (
                            <Badge key={index} variant="secondary">
                              {achievement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(player.social_links?.instagram || player.social_links?.twitter || player.social_links?.website) && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Social Links:</h4>
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Player</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {player.first_name} {player.last_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePlayer(player.id)}>
                            Delete
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
              <h3 className="text-lg font-semibold mb-2">No players found</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first player to the database.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Player
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
