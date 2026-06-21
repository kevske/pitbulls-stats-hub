import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Trophy, Flame } from 'lucide-react';
import { NewsService, LeagueNewsItem, PlayerNewsItem } from '@/services/newsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Layout from '@/components/Layout';
import PageHeader from '@/components/vision/PageHeader';

type NewsItem = (LeagueNewsItem | PlayerNewsItem) & { kind: 'league' | 'player' };

const News = () => {
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
            <div className="container mx-auto max-w-4xl pb-20">
                <PageHeader title="News Feed" subtitle="Highlights & Überraschungen — letzte 90 Tage" right="Liga & Spieler" />

                {/* Filter + Legende */}
                <div className="flex flex-wrap items-center gap-4 border-y border-border py-4 mb-10">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="pitbulls-only"
                            checked={onlyPitbulls}
                            onCheckedChange={setOnlyPitbulls}
                        />
                        <Label htmlFor="pitbulls-only" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nur Pitbulls-Spieler</Label>
                    </div>
                    <div className="hidden md:flex gap-3 md:ml-auto">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">
                            <Trophy className="w-3 h-3" /> Liga
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
                            <Flame className="w-3 h-3" /> Spieler
                        </span>
                    </div>
                </div>

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
                                            <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full border-2 border-background bg-brand-orange" />
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{formatDate(leagueItem.date)}</div>
                                            <Card className="transition-all duration-300 hover:border-brand-orange/40 hover:shadow-md">
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="space-y-1 w-full">
                                                        <Badge variant="outline" className="bg-brand-orange/10 text-brand-orange border-brand-orange/30 mb-1 text-[10px] font-black uppercase tracking-wider">
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
                                            <div className="absolute -left-[5px] top-5 w-3 h-3 rounded-full border-2 border-background bg-brand-blue" />
                                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{formatDate(playerItem.date)}</div>
                                            <Card className="transition-all duration-300 hover:border-brand-blue/40 hover:shadow-md overflow-hidden">
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
                                                                    <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue border-brand-blue/30 text-[10px] font-black uppercase tracking-wider">
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
