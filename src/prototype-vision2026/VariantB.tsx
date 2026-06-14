// PROTOTYPE Vision 2026 v2 — Variante B „Gameday Broadcast"
// TV-Sportgrafik-Look: keine Glass-Cards, sondern solide Panels, harte Kanten,
// Diagonalen/Skews, Stat-Balken und W/L-Form — Blau als Fläche, Orange als Schnitt.
import { useNavigate } from 'react-router-dom';
import { ProtoData, isWin, isPitbulls } from './types';

const VariantB = ({ data }: { data: ProtoData }) => {
    const navigate = useNavigate();
    const { homeTeam, awayTeam, homeScore, awayScore, streak, topPerformers, gameNumber, date, seasonName, recentGames } = data;
    const maxPpg = Math.max(...topPerformers.map(p => p.pointsPerGame), 1);
    const pitbullsHome = isPitbulls(homeTeam);

    return (
        <div className="relative">
            {/* Hintergrund: flaches Navy mit feinen Diagonalstreifen */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-[#060D1D]">
                <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(135deg,#fff_0px,#fff_1px,transparent_1px,transparent_14px)]" />
                <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#1E4395]/25 to-transparent" />
            </div>

            <div className="relative z-10 container mx-auto max-w-6xl px-4 pb-20">
                {/* Topline */}
                <div className="pt-8 flex items-center justify-between border-b-2 border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#E87722] text-[#060D1D] text-[10px] font-black uppercase tracking-widest px-3 py-1 -skew-x-12">
                            <span className="inline-block skew-x-12">Gameday</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Saison {seasonName}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Spiel #{gameNumber} · {date}</span>
                </div>

                {/* Titel */}
                <div className="pt-8 pb-6">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] text-white">
                        Pitbulls<br />
                        <span className="text-transparent [-webkit-text-stroke:2px_#E87722]">Stats Hub</span>
                    </h1>
                </div>

                {/* Broadcast-Scoreboard */}
                <div className="relative -mx-4 md:mx-0">
                    <div className="bg-[#0C1A38] border-y-4 md:border-4 border-[#1E4395] md:-skew-x-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                        <div className="md:skew-x-3 grid grid-cols-[1fr_auto_1fr] items-stretch">
                            {/* Heim */}
                            <div className={`p-6 md:p-10 flex flex-col justify-center ${pitbullsHome ? 'bg-gradient-to-r from-[#1E4395]/60 to-transparent' : ''}`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Heim</span>
                                <span className="text-xl md:text-3xl font-black uppercase text-white leading-tight">{homeTeam}</span>
                            </div>
                            {/* Score-Block */}
                            <div className="relative flex items-center">
                                <div className="bg-[#E87722] -skew-x-12 px-6 md:px-10 py-6 md:py-8 flex items-center gap-3 md:gap-5 shadow-[0_0_50px_rgba(232,119,34,0.35)]">
                                    <span className="skew-x-12 text-5xl md:text-7xl font-black text-white tabular-nums">{homeScore}</span>
                                    <span className="skew-x-12 text-2xl font-black text-[#060D1D]/50">:</span>
                                    <span className="skew-x-12 text-5xl md:text-7xl font-black text-[#060D1D] tabular-nums">{awayScore}</span>
                                </div>
                            </div>
                            {/* Gast */}
                            <div className={`p-6 md:p-10 flex flex-col justify-center text-right ${!pitbullsHome ? 'bg-gradient-to-l from-[#1E4395]/60 to-transparent' : ''}`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Gast</span>
                                <span className="text-xl md:text-3xl font-black uppercase text-white leading-tight">{awayTeam}</span>
                            </div>
                        </div>
                        {/* Unterzeile mit Form + CTA */}
                        <div className="md:skew-x-3 flex flex-wrap items-center justify-between gap-4 border-t-2 border-white/10 px-6 md:px-10 py-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mr-2">Form</span>
                                {recentGames.slice(0, 5).map(g => {
                                    const w = isWin(g);
                                    return (
                                        <span key={g.gameNumber} className={`w-7 h-7 flex items-center justify-center text-xs font-black -skew-x-12 ${w ? 'bg-[#E87722] text-[#060D1D]' : 'bg-white/10 text-white/40'}`}>
                                            <span className="skew-x-12">{w ? 'W' : 'L'}</span>
                                        </span>
                                    );
                                })}
                                {streak && (
                                    <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-white/50">
                                        {streak.count} {streak.type === 'win' ? 'Siege' : 'Niederlagen'} in Folge
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/games/${gameNumber}`)}
                                className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF8C2E] hover:text-white transition-colors"
                            >
                                Spielbericht ▶
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ticker */}
                <div className="mt-10 -mx-4 md:mx-0 bg-[#1E4395] py-2.5 px-4 md:-skew-x-3 overflow-hidden">
                    <div className="md:skew-x-3 flex gap-8 whitespace-nowrap text-[11px] font-black uppercase tracking-[0.2em] text-white/90 overflow-x-auto [scrollbar-width:none]">
                        {topPerformers.map(p => (
                            <span key={p.id}>
                                {p.firstName} {p.lastName} <span className="text-[#FF8C2E]">{p.pointsPerGame.toFixed(1)} PPG</span>
                            </span>
                        ))}
                        <span>Saison {seasonName}</span>
                        <span className="text-[#FF8C2E]">TSV Neuenstadt Pitbulls</span>
                    </div>
                </div>

                {/* Leader-Board als Zeilen mit Stat-Balken */}
                <div className="mt-12">
                    <div className="flex items-end justify-between mb-6">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            Scoring <span className="text-[#FF8C2E]">Leaders</span>
                        </h3>
                        <button onClick={() => navigate('/stats')} className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 hover:text-[#FF8C2E] transition-colors">
                            Alle Statistiken ▶
                        </button>
                    </div>

                    <div className="space-y-px bg-white/10 border border-white/10">
                        {topPerformers.map((p, idx) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/players/${p.id}`)}
                                className="group cursor-pointer bg-[#0A1428] hover:bg-[#0E1E42] transition-colors grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_16rem_1fr_auto] items-center gap-4 px-4 md:px-6 py-4 border-l-4 border-transparent hover:border-[#E87722]"
                            >
                                <span className={`text-3xl font-black italic tabular-nums ${idx === 0 ? 'text-[#FF8C2E]' : 'text-white/20'}`}>
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <div className="font-black text-white uppercase tracking-tight">{p.firstName} {p.lastName}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                                        {p.gamesPlayed} Spiele · {p.totalPoints} Punkte · FW {p.freeThrowPercentage}
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="h-3 bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#1E4395] via-[#2E63D4] to-[#E87722]"
                                            style={{ width: `${(p.pointsPerGame / maxPpg) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-white tabular-nums">{p.pointsPerGame.toFixed(1)}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">PPG</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schnellzugriff als Broadcast-Kacheln */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
                    {[
                        { label: 'Spielplan', to: '/spielplan' },
                        { label: 'Ergebnisse', to: '/games' },
                        { label: 'Spieler', to: '/players' },
                        { label: 'Videos', to: '/videos' },
                    ].map(l => (
                        <button
                            key={l.to}
                            onClick={() => navigate(l.to)}
                            className="bg-[#0A1428] hover:bg-[#1E4395] px-4 py-6 text-xs font-black uppercase tracking-[0.25em] text-white/60 hover:text-white transition-colors"
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VariantB;
