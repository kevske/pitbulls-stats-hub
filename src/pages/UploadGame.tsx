import { useState } from "react";
import Layout from "@/components/Layout";
import PasswordProtection from "@/components/PasswordProtection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { players } from "@/data/players";
import { toast } from "sonner";

const UploadGame = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [location, setLocation] = useState<"home" | "away">("home");
  const [result, setResult] = useState<"win" | "loss">("win");
  const [playerStats, setPlayerStats] = useState(
    players.map((p) => ({
      playerId: p.id,
      points: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      minutes: 0,
    }))
  );

  const handleStatChange = (playerId: string, field: string, value: string) => {
    setPlayerStats((prev) =>
      prev.map((ps) =>
        ps.playerId === playerId
          ? { 
              ...ps, 
              [field]: parseFloat(value) || 0 // Parse as float to handle decimal minutes
            }
          : ps
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In einer echten Implementierung würde hier die CSV-Datei aktualisiert werden
    const newGame = {
      id: `game-${Date.now()}`,
      date,
      opponent,
      location,
      result,
      playerStats,
    };
    
    console.log("Neues Spiel:", newGame);
    toast.success("Spiel erfolgreich gespeichert! (Demo-Modus)");
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto max-w-6xl py-12">
          <PasswordProtection
            onSuccess={() => setIsAuthenticated(true)}
            correctPassword="pitbulls2025"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-primary mb-8">Neues Spiel hochladen</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h3 className="text-2xl font-bold text-primary mb-4">Spielinformationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="opponent">Gegner</Label>
                <Input
                  id="opponent"
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="z.B. Rot-Weiß Stuttgart"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="location">Ort</Label>
                <Select value={location} onValueChange={(v) => setLocation(v as "home" | "away")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Heimspiel</SelectItem>
                    <SelectItem value="away">Auswärtsspiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="result">Ergebnis</Label>
                <Select value={result} onValueChange={(v) => setResult(v as "win" | "loss")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Sieg</SelectItem>
                    <SelectItem value="loss">Niederlage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-2xl font-bold text-primary mb-4">Spieler Statistiken</h3>
            <div className="space-y-4">
              {players.map((player) => {
                const stats = playerStats.find((ps) => ps.playerId === player.id);
                return (
                  <div key={player.id} className="border border-border rounded-lg p-4">
                    <h4 className="font-bold text-lg mb-3">{player.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div>
                        <Label htmlFor={`points-${player.id}`} className="text-xs">Punkte</Label>
                        <Input
                          id={`points-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.points || 0}
                          onChange={(e) => handleStatChange(player.id, "points", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`assists-${player.id}`} className="text-xs">Assists</Label>
                        <Input
                          id={`assists-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.assists || 0}
                          onChange={(e) => handleStatChange(player.id, "assists", e.target.value)}
                          />
                      </div>
                      <div>
                        <Label htmlFor={`rebounds-${player.id}`} className="text-xs">Rebounds</Label>
                        <Input
                          id={`rebounds-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.rebounds || 0}
                          onChange={(e) => handleStatChange(player.id, "rebounds", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`steals-${player.id}`} className="text-xs">Steals</Label>
                        <Input
                          id={`steals-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.steals || 0}
                          onChange={(e) => handleStatChange(player.id, "steals", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`blocks-${player.id}`} className="text-xs">Blocks</Label>
                        <Input
                          id={`blocks-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.blocks || 0}
                          onChange={(e) => handleStatChange(player.id, "blocks", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`minutes-${player.id}`} className="text-xs">Minuten</Label>
                        <Input
                          id={`minutes-${player.id}`}
                          type="number"
                          min="0"
                          value={stats?.minutes || 0}
                          onChange={(e) => handleStatChange(player.id, "minutes", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full">
            Spiel speichern
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default UploadGame;
