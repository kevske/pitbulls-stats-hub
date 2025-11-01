import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { players } from "@/data/players";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
                  <Input defaultValue={player.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Biografie</label>
                  <Textarea defaultValue={player.bio} rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profilbild URL</label>
                  <Input defaultValue={player.image} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Spiele</label>
                    <Input type="number" defaultValue={player.stats.games} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Punkte</label>
                    <Input type="number" defaultValue={player.stats.points} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Assists</label>
                    <Input type="number" defaultValue={player.stats.assists} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rebounds</label>
                    <Input type="number" defaultValue={player.stats.rebounds} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Steals</label>
                    <Input type="number" defaultValue={player.stats.steals} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Blocks</label>
                    <Input type="number" defaultValue={player.stats.blocks} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      toast.success("Änderungen gespeichert (Demo-Modus)");
                      setIsEditing(false);
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
