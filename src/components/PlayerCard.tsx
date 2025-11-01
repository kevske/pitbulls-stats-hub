import { Player } from "@/data/players";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PlayerCardProps {
  player: Player;
}

const PlayerCard = ({ player }: PlayerCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20"
      onClick={() => navigate(`/player/${player.id}`)}
    >
      <CardContent className="p-6">
        <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-secondary">
          <img
            src={player.image}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl font-bold text-primary mb-2">{player.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{player.bio}</p>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
