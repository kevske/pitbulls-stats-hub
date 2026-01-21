import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import { GameWithDangerousPlayers } from '@/types/supabase';
import { formatGameDate } from '@/utils/spielplanUtils';
import DangerousPlayersTable from './DangerousPlayersTable';
import GameInsights from './GameInsights';

interface GameCardProps {
    game: GameWithDangerousPlayers;
    leagueComparison?: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, leagueComparison }) => {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span>{formatGameDate(game.game_date, game.game_time)}</span>
                    </div>
                    <Badge variant={game.status === 'scheduled' ? 'default' : 'secondary'}>
                        {game.status === 'scheduled' ? 'Bevorstehend' :
                            game.status === 'live' ? 'Live' :
                                game.status === 'finished' ? 'Beendet' : game.status}
                    </Badge>
                </CardTitle>
                <div className="flex items-center justify-between text-lg font-semibold">
                    <span className={game.home_team_name === 'TSV Neuenstadt' ? 'text-primary' : ''}>
                        {game.home_team_name}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className={game.away_team_name === 'TSV Neuenstadt' ? 'text-primary' : ''}>
                        {game.away_team_name}
                    </span>
                </div>
                {game.venue && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{game.venue}</span>
                    </div>
                )}
            </CardHeader>

            {game.dangerous_players.length > 0 && (
                <CardContent className="pt-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Gefährliche Spieler
                        </h3>

                        <DangerousPlayersTable
                            players={game.dangerous_players}
                            extendedPlayers={game.dangerous_players_extended}
                        />

                        <GameInsights
                            players={game.dangerous_players_extended || game.dangerous_players}
                            leagueComparison={leagueComparison}
                        />
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default GameCard;
