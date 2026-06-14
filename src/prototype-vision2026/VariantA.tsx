// PROTOTYPE Vision 2026 v2 — Variante A „Bento Arena"
// Glass-Cards + Bento-Grid (Weiterentwicklung des bisherigen Vision-Looks),
// aber in Vereinsfarben: TSV-Blau als Basis, Orange als Kontrast-Akzent.
import { useNavigate } from 'react-router-dom';
import { ProtoData, isWin } from './types';

const VariantA = ({ data }: { data: ProtoData }) => {
    const navigate = useNavigate();
    const { homeTeam, awayTeam, homeScore, awayScore, streak, topPerformers, gameNumber, date, seasonName } = data;

    return (
        <div className="relative">
            {/* Hintergrund: Navy mit Blau/Orange-Verlaufs-Orbs + Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-[#050B18]">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[130px] bg-[#1E4395]/40" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[130px] bg-[#E87722]/25" />
                <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] rounded-full blur-[100px] bg-[#2E63D4]/20" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-7xl px-4 pb-20">
                {/* Hero */}
                <div className="pt-10 pb-10 text-center">
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
                        Pitbulls <span className="bg-gradient-to-r from-[#FF8C2E] to-[#E87722] bg-clip-text text-transparent block md:inline">Stats</span> Hub
                    </h1>
                    <div className="mt-5 flex items-center justify-center gap-4">
                        <div className="h-[2px] w-14 bg-gradient-to-r from-transparent to-[#E87722]" />
                        <span className="text-[10px] font-bold tracking-[0.5em] text-white/40 uppercase">Mehr als nur Zahlen</span>
                        <div className="h-[2px] w-14 bg-gradient-to-l from-transparent to-[#1E4395]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* Scoreboard Bento */}
                    <div className="md:col-span-8">
                        <div className="h-full rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1E4395] via-[#2E63D4] to-[#E87722]" />
                            <div className="absolute top-0 right-0 p-6 text-[9rem] font-black text-white/[0.03] leading-none select-none">{gameNumber}</div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#1E4395] to-[#2E63D4] shadow-lg shadow-[#1E4395]/40">
                                        Letztes Ergebnis
                                    </span>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{date}</span>
                                </div>

                                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-2">Heim</h4>
                                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{homeTeam}</h2>
                                        <div className="text-7xl font-black mt-4 select-none bg-gradient-to-b from-[#FF8C2E] to-[#E87722] bg-clip-text text-transparent">{homeScore}</div>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-[2px] bg-white/10" />
                                        <div className="text-xl font-black text-white/20 italic">VS</div>
                                        <div className="w-12 h-[2px] bg-white/10" />
                                    </div>
                                    <div className="flex-1 text-center md:text-right">
                                        <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-2">Gast</h4>
                                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{awayTeam}</h2>
                                        <div className="text-7xl font-black text-white/90 mt-4 select-none">{awayScore}</div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-center">
                                    <button
                                        onClick={() => navigate(`/games/${gameNumber}`)}
                                        className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white border border-white/10 bg-white/5 hover:bg-gradient-to-r hover:from-[#1E4395] hover:to-[#E87722] hover:border-transparent transition-all duration-500"
                                    >
                                        Zum Spielbericht →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Streak Bento */}
                    <div className="md:col-span-4">
                        <div className="h-full rounded-[2rem] border border-white/10 backdrop-blur-xl p-8 relative overflow-hidden bg-gradient-to-br from-[#E87722]/25 via-[#0A1428]/60 to-[#1E4395]/30">
                            <h4 className="text-[10px] font-black uppercase text-white/50 tracking-[0.3em] mb-6">Aktuelle Serie</h4>
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className={`text-8xl font-black italic ${streak?.type === 'win' ? 'text-[#FF8C2E]' : 'text-red-400'}`}>
                                    {streak?.count ?? '–'}
                                </div>
                                <div className="text-xs font-black uppercase tracking-[0.4em] text-white/60 mt-3">
                                    {streak?.type === 'win' ? 'Siege in Folge' : 'Niederlagen'}
                                </div>
                                {/* Letzte 5 als Punkte */}
                                <div className="flex gap-2 mt-6">
                                    {data.recentGames.slice(0, 5).map(g => (
                                        <span key={g.gameNumber} className={`w-2.5 h-2.5 rounded-full ${isWin(g) ? 'bg-[#FF8C2E]' : 'bg-white/15'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/30">
                                <span>Saison {seasonName}</span>
                                <span className="text-[#FF8C2E]">TSV 1892</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="md:col-span-12">
                        <div className="flex items-center justify-between mb-4 mt-2">
                            <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">Top-Leistungsträger</h3>
                            <button onClick={() => navigate('/players')} className="text-[10px] font-black uppercase tracking-widest text-[#FF8C2E]/80 hover:text-[#FF8C2E]">Alle Spieler →</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {topPerformers.map((p, idx) => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/players/${p.id}`)}
                                    className="group cursor-pointer rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 transition-all duration-500 hover:scale-[1.02] hover:border-[#E87722]/40 hover:shadow-2xl hover:shadow-[#E87722]/10"
                                >
                                    <div className="flex items-start justify-between mb-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border transition-colors ${idx === 0
                                            ? 'bg-gradient-to-br from-[#FF8C2E] to-[#E87722] text-white border-transparent'
                                            : 'bg-white/5 border-white/10 text-[#2E63D4] group-hover:text-white'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Punkte/Spiel</div>
                                            <div className="text-2xl font-black text-[#FF8C2E]">{p.pointsPerGame.toFixed(1)}</div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-5 group-hover:translate-x-1 transition-transform">
                                        {p.firstName} <span className="text-[#2E63D4]">{p.lastName}</span>
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Punkte', val: p.totalPoints },
                                            { label: 'Spiele', val: p.gamesPlayed },
                                            { label: 'FW %', val: p.freeThrowPercentage },
                                        ].map(s => (
                                            <div key={s.label} className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{s.label}</div>
                                                <div className="text-sm font-bold text-white">{s.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schnellzugriff */}
                    <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Spielplan', to: '/spielplan' },
                            { label: 'Statistiken', to: '/stats' },
                            { label: 'Ergebnisse', to: '/games' },
                            { label: 'Videos', to: '/videos' },
                        ].map(l => (
                            <button
                                key={l.to}
                                onClick={() => navigate(l.to)}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl px-6 py-5 text-xs font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-gradient-to-r hover:from-[#1E4395]/40 hover:to-[#E87722]/30 transition-all duration-300"
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantA;
