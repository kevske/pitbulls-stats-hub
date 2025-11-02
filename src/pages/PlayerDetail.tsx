import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { players } from "@/data/players";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import PasswordProtection from "@/components/PasswordProtection";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PlayerDetail = () => {
  const { id } = useParams();
  const player = players.find((p) => p.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [formData, setFormData] = useState<Player | null>(null);

  // Initialize form data when player is loaded or changes
  useEffect(() => {
    if (player) {
      setFormData({ ...player });
    }
  }, [player]);

  if (!player) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-primary">Spieler nicht gefunden</h2>
        </div>
      </Layout>
    );
  }

  const handleEditAccess = () => {
    setShowPasswordPrompt(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setIsEditing(true);
  };

  if (showPasswordPrompt) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <PasswordProtection
            onSuccess={handlePasswordSuccess}
            correctPassword="editor123"
          />
        </div>
      </Layout>
    );
  }

  if (isEditing) {
    return (
      <Layout>
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-primary mb-6">Spielerprofil bearbeiten</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input 
                    value={formData?.name || ''} 
                    onChange={(e) => setFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Biografie</label>
                  <Textarea 
                    value={formData?.bio || ''} 
                    onChange={(e) => setFormData(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    rows={4} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profilbild URL</label>
                  <Input 
                    value={formData?.image || ''} 
                    onChange={(e) => setFormData(prev => prev ? { ...prev, image: e.target.value } : null)}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Spiele</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.games || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            games: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Punkte</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.points || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            points: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Assists</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.assists || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            assists: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rebounds</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.rebounds || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            rebounds: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Steals</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.steals || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            steals: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Blocks</label>
                    <Input 
                      type="number" 
                      value={formData?.stats.blocks || 0}
                      onChange={(e) => setFormData(prev => {
                        if (!prev) return null;
                        return {
                          ...prev,
                          stats: {
                            ...prev.stats,
                            blocks: parseInt(e.target.value) || 0
                          }
                        };
                      })}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      if (!formData || !player) return;
                      
                      // Find the player index
                      const playerIndex = players.findIndex(p => p.id === player.id);
                      if (playerIndex !== -1) {
                        // Update the player data
                        players[playerIndex] = { ...formData };
                        toast.success("Änderungen gespeichert");
                        setIsEditing(false);
                      } else {
                        toast.error("Spieler nicht gefunden");
                      }
                    }}
                  >
                    Speichern
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={handleEditAccess}>
            Profil bearbeiten
          </Button>
        </div>
        
        <Card className="border-primary/20">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h2 className="text-4xl font-bold text-primary mb-4">{player.name}</h2>
                  <p className="text-lg text-muted-foreground">{player.bio}</p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-4">Statistiken</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.games}</div>
                      <div className="text-sm text-muted-foreground">Spiele</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.points}</div>
                      <div className="text-sm text-muted-foreground">Punkte</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.assists}</div>
                      <div className="text-sm text-muted-foreground">Assists</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.rebounds}</div>
                      <div className="text-sm text-muted-foreground">Rebounds</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.steals}</div>
                      <div className="text-sm text-muted-foreground">Steals</div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{player.stats.blocks}</div>
                      <div className="text-sm text-muted-foreground">Blocks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlayerDetail;
