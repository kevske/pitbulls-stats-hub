import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Trophy, Flame } from 'lucide-react';
import { useModernTheme } from '@/contexts/ModernThemeContext';
import { NewsService, LeagueNewsItem, PlayerNewsItem } from '@/services/newsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Layout from '@/components/Layout';

type NewsItem = (LeagueNewsItem | PlayerNewsItem) & { kind: 'league' | 'player' };

const News = () => {
    const { isModernMode } = useModernTheme();
    const [loading, setLoading] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [onlyPitbulls, setOnlyPitbulls] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const [leagueData, playerData] = await Promise.all([
                    NewsService.getLeagueNews(),
                    NewsService.getPlayerNews()
                ]);

                // Merge and sort by date descending
                const combinedNews: NewsItem[] = [
                    ...leagueData.map(item => ({ ...item, kind: 'league' } as NewsItem)),
                    ...playerData.map(item => ({ ...item, kind: 'player' } as NewsItem))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setNewsItems(combinedNews);
            } catch (error) {
                console.error('Failed to fetch news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredItems = newsItems.filter(item => {
        if (!onlyPitbulls) return true;
        if (item.kind === 'league') return true; // League news always relevant? Or filter by teamId? Let's keep league news.
        // For player news, check if teamId is 'tsv-neuenstadt' (assuming that's the ID for Pitbulls)
        // The teamId is now passed in the item
        return 'teamId' in item && item.teamId === 'tsv-neuenstadt';
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-[50vh]">
                    <LoadingSpinner />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto max-w-4xl space-y-8 animate-fade-in">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isModernMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                            <Newspaper className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">News Feed</h1>
                            <p className="text-muted-foreground">Highlights & Überraschungen (Letzte 90 Tage)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Filter Toggle */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="pitbulls-only"
                                checked={onlyPitbulls}
                                onCheckedChange={setOnlyPitbulls}
                            />
                            <Label htmlFor="pitbulls-only">Nur Pitbulls-Spieler</Label>
                        </div>

                        {/* Legend */}
                        <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded-lg hidden md:flex">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                                    <Trophy className="w-3 h-3 mr-1" /> Liga
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                                    <Flame className="w-3 h-3 mr-1" /> Spieler
                                </Badge>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                        <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        Keine News gefunden.
                    </div>
                ) : (
                    <div className="relative border-l-2 border-muted/50 ml-4 md:ml-6 space-y-8 pb-12">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredItems.map((item, index) => {
                                if (item.kind === 'league') {
                                    const leagueItem = item as LeagueNewsItem & { kind: 'league' };
                                    return (
                                        <motion.div key={`league-${leagueItem.id}`} variants={itemVariants} className="mb-4 relative pl-8 md:pl-12">
                                            <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full border-2 border-background bg-orange-500" />
                                            <div className="text-xs text-muted-foreground font-medium mb-1">{formatDate(leagueItem.date)}</div>
                                            <Card className="hover:shadow-md transition-shadow transition-colors duration-300 hover:border-orange-200">
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="space-y-1 w-full">
                                                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 mb-1">
                                                            <Trophy className="w-3 h-3 mr-1" /> Liga Überraschung
                                                        </Badge>
                                                        <CardTitle className="text-lg leading-tight">{leagueItem.title}</CardTitle>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-1">
                                                    <CardDescription className="text-sm text-foreground/80 leading-relaxed">
                                                        {leagueItem.description}
                                                    </CardDescription>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                } else {
                                    // Player News
                                    const playerItem = item as PlayerNewsItem & { kind: 'player' };
                                    let comparisonText = '';
                                    if (playerItem.statValue && playerItem.seasonAverage && playerItem.seasonAverage > 0) {
                                        const diff = playerItem.statValue - playerItem.seasonAverage;
                                        if (diff > 0) {
                                            comparisonText = `(+${diff.toFixed(1)} vs Ø ${playerItem.seasonAverage.toFixed(1)})`;
                                        }
                                    }

                                    return (
                                        <motion.div key={`player-${playerItem.id}`} variants={itemVariants} className="mb-4 relative pl-8 md:pl-12">
                                            <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full border-2 border-background bg-blue-500" />
                                            <div className="text-xs text-muted-foreground font-medium mb-1">{formatDate(playerItem.date)}</div>
                                            <Card className="hover:shadow-md transition-shadow transition-colors duration-300 hover:border-blue-200 overflow-hidden">
                                                <div className="flex flex-row h-full">
                                                    {playerItem.playerImage && (
                                                        <div className="w-24 md:w-28 shrink-0 relative bg-muted/30">
                                                            <img
                                                                src={playerItem.playerImage}
                                                                alt={playerItem.playerName}
                                                                className="w-full h-full object-cover object-[center_15%] absolute inset-0"
                                                                onError={(e) => {
                                                                    e.currentTarget.parentElement!.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 p-4 pb-3">
                                                        <div className="space-y-1 w-full">
                                                            <div className="flex justify-between items-start w-full">
                                                                <div className="space-y-1">
                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                                        <Flame className="w-3 h-3 mr-1" /> Spieler
                                                                    </Badge>
                                                                    <CardTitle className="text-lg font-bold leading-tight">
                                                                        {playerItem.playerName}
                                                                        {playerItem.teamName && (
                                                                            <span className="text-muted-foreground font-normal text-base ml-1">
                                                                                ({playerItem.teamName})
                                                                            </span>
                                                                        )}
                                                                    </CardTitle>
                                                                </div>

                                                                <div className="text-xl font-black text-primary/80">
                                                                    {playerItem.statValue} <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                                                        {playerItem.type === 'points' ? 'PTS' :
                                                                            playerItem.type === 'three_pointers' ? '3PM' : 'FTM'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 pt-1 text-sm">
                                                                <span className="font-semibold text-primary">
                                                                    {playerItem.type === 'points' ? 'Punkte Explosion' :
                                                                        playerItem.type === 'three_pointers' ? 'Dreier Hagel' : 'Freiwurf Maschine'}
                                                                </span>
                                                                {comparisonText && (
                                                                    <span className="text-green-600 font-medium text-xs">
                                                                        {comparisonText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                }
                            })}
                        </motion.div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default News;
