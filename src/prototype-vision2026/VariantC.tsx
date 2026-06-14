// PROTOTYPE Vision 2026 v2 — Variante C „Editorial Court"
// Magazin-Look: typografiegetrieben, asymmetrisch, Linien statt Cards,
// nummerierte Listen, Team-Foto mit Blau-Duotone und Orange-Kante.
import { useNavigate } from 'react-router-dom';
import { ProtoData, isWin, isPitbulls } from './types';
import { BASE_PATH } from '@/config';

const VariantC = ({ data }: { data: ProtoData }) => {
    const navigate = useNavigate();
    const { homeTeam, awayTeam, homeScore, awayScore, streak, topPerformers, gameNumber, date, seasonName, recentGames } = data;

    const lastWin = recentGames.length > 0 && isWin(recentGames[0]);
    const opponent = isPitbulls(homeTeam) ? awayTeam : homeTeam;

    return (
        <div className="relative">
            {/* Hintergrund: ruhiges, tiefes Navy mit einem einzigen Verlauf */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-[#040912]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgba(30,67,149,0.35),transparent_60%)]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-5xl px-4 pb-24">
                {/* Vertikale Randspalte */}
                <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 origin-center -rotate-90">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 whitespace-nowrap">
                        TSV Neuenstadt · Pitbulls · Saison {seasonName}
                    </span>
                </div>

                {/* Kopfzeile */}
                <div className="pt-10 flex items-baseline justify-between border-b border-white/15 pb-3">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Pitbulls Stats Hub</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Ausgabe · Spieltag {gameNumber}</span>
                </div>

                {/* Headline-Block */}
                <div className="pt-14 pb-10">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#FF8C2E] mb-5">
                        {date} — gegen {opponent}
                    </p>
                    <h1 className="text-[clamp(4rem,14vw,11rem)] font-black uppercase leading-[0.85] tracking-tighter">
                        <span className={lastWin ? 'text-white' : 'text-white/80'}>
                            {lastWin ? 'Sieg' : 'Niederlage'}
                        </span>
                        <span className="text-[#E87722]">.</span>
                    </h1>
                    <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/50">
                        {homeTeam} gegen {awayTeam} — alle Zahlen, Trends und Leistungsträger des Spieltags.
                        Mehr als nur Zahlen: die Geschichte der Saison {seasonName}, erzählt in Daten.
                    </p>
                </div>

                {/* Ergebnis als reine Typografie */}
                <div className="border-y border-white/15 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
                    <div>
                        <div className="flex items-baseline gap-6">
                            <span className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter text-[#FF8C2E]">{homeScore}</span>
                            <span className="text-3xl font-light text-white/25">/</span>
                            <span className="text-7xl md:text-8xl font-black tabular-nums tracking-tighter text-white">{awayScore}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                            <span><span className="text-[#FF8C2E]">●</span> {homeTeam}</span>
                            <span><span className="text-white">●</span> {awayTeam}</span>
                        </div>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end gap-4">
                        {streak && (
                            <p className="text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                                Serie<br />
                                <span className={`text-4xl tracking-tight ${streak.type === 'win' ? 'text-[#2E63D4]' : 'text-red-400'}`}>
                                    {streak.count} {streak.type === 'win' ? 'W' : 'L'}
                                </span>
                            </p>
                        )}
                        <button
                            onClick={() => navigate(`/games/${gameNumber}`)}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-white border-b-2 border-[#E87722] pb-1 hover:text-[#FF8C2E] transition-colors"
                        >
                            Spielbericht lesen
                        </button>
                    </div>
                </div>

                {/* Zwei Spalten: Performer-Liste + Team-Foto */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 pt-14">
                    {/* Nummerierte Editorial-Liste */}
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-8">
                            Leistungsträger <span className="text-[#E87722]">/ Punkte pro Spiel</span>
                        </h3>
                        <ol>
                            {topPerformers.map((p, idx) => (
                                <li
                                    key={p.id}
                                    onClick={() => navigate(`/players/${p.id}`)}
                                    className="group cursor-pointer border-b border-white/10 py-6 first:pt-0 flex items-baseline gap-6 hover:border-[#E87722]/50 transition-colors"
                                >
                                    <span className="text-sm font-black tabular-nums text-[#2E63D4] w-8">0{idx + 1}</span>
                                    <div className="flex-1">
                                        <div className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:translate-x-2 transition-transform duration-300">
                                            {p.firstName} <span className="text-white/40 group-hover:text-[#FF8C2E] transition-colors">{p.lastName}</span>
                                        </div>
                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                                            {p.totalPoints} Pkt · {p.gamesPlayed} Spiele · FW {p.freeThrowPercentage}
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black tabular-nums text-[#FF8C2E]">{p.pointsPerGame.toFixed(1)}</span>
                                </li>
                            ))}
                        </ol>
                        <button
                            onClick={() => navigate('/players')}
                            className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                        >
                            → Alle Spieler ansehen
                        </button>
                    </div>

                    {/* Team-Foto mit Duotone + Orange-Kante */}
                    <div>
                        <div className="relative border-l-4 border-[#E87722] pl-0 overflow-hidden">
                            <img
                                src={`${BASE_PATH}/photos/Team-01.jpeg`}
                                alt="Team TSV Neuenstadt Pitbulls"
                                className="w-full aspect-[4/5] object-cover grayscale contrast-125"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E4395]/80 via-[#1E4395]/20 to-transparent mix-blend-multiply" />
                            <div className="absolute bottom-0 inset-x-0 p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8C2E]">Das Team</p>
                                <p className="text-2xl font-black uppercase tracking-tight text-white">Pitbulls {seasonName}</p>
                            </div>
                        </div>
                        {/* Form als Textzeile */}
                        <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                            <span>Form</span>
                            <span className="tracking-[0.5em] text-sm">
                                {recentGames.slice(0, 5).map(g => (
                                    <span key={g.gameNumber} className={isWin(g) ? 'text-[#FF8C2E]' : 'text-white/25'}>
                                        {isWin(g) ? 'W' : 'L'}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Editorial-Schlusszeile */}
                <div className="mt-20 border-t border-white/15 pt-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                        <span className="text-white/30">Mehr als</span><br />
                        <span className="text-white">nur Zahlen<span className="text-[#E87722]">.</span></span>
                    </p>
                    <nav className="flex gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        {[
                            { label: 'Spielplan', to: '/spielplan' },
                            { label: 'Stats', to: '/stats' },
                            { label: 'Videos', to: '/videos' },
                        ].map(l => (
                            <button key={l.to} onClick={() => navigate(l.to)} className="hover:text-[#FF8C2E] transition-colors">
                                {l.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default VariantC;
