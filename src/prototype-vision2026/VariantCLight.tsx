// PROTOTYPE Vision 2026 v2 — Variante CL „Editorial Court · Light"
// Premiumzeitung / Sportmagazin im hellen Modus:
// Papierweißer Grund, TSV-Blau als Haupt-Schriftfarbe,
// Orange-Kachel als Hingucker, dasselbe S/W-Foto mit Blau-Overlay.
import { useNavigate } from 'react-router-dom';
import { ProtoData, isWin, isPitbulls } from './types';
import { BASE_PATH } from '@/config';

const VariantCLight = ({ data }: { data: ProtoData }) => {
    const navigate = useNavigate();
    const { homeTeam, awayTeam, homeScore, awayScore, streak, topPerformers, gameNumber, date, seasonName, recentGames } = data;

    const homeIsPitbulls = isPitbulls(homeTeam);
    const opponent = homeIsPitbulls ? awayTeam : homeTeam;

    return (
        <div className="relative min-h-screen bg-[#F4F6FB]">
            {/* Dezenter Hintergrundverlauf: leichter Blauschimmer oben links */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_0%_0%,rgba(30,67,149,0.06),transparent_60%)]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-5xl px-4 pb-24">
                {/* Vertikale Randspalte */}
                <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 origin-center -rotate-90">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#1E4395]/25 whitespace-nowrap">
                        TSV Neuenstadt · Pitbulls · Saison {seasonName}
                    </span>
                </div>

                {/* Kopfzeile */}
                <div className="pt-10 flex items-baseline justify-between border-b-2 border-[#1E4395] pb-3">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#1E4395]">Pitbulls Stats Hub</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1E4395]/40">Ausgabe · Spieltag {gameNumber}</span>
                </div>

                {/* Orange-Kachel als Eyebrow */}
                <div className="pt-12 pb-5">
                    <span className="inline-block bg-[#E87722] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.4em] text-white">
                        {date} — gegen {opponent}
                    </span>
                </div>

                {/* Hero: der Endstand selbst ist die Riesen-Typografie */}
                <div className="flex items-baseline gap-3 md:gap-8 leading-[0.8]">
                    <span className={`text-[clamp(4.5rem,15vw,12rem)] font-black tabular-nums tracking-tighter ${homeIsPitbulls ? 'text-[#E87722]' : 'text-[#0A1428]'}`}>{homeScore}</span>
                    <span className="text-[clamp(2rem,6vw,5rem)] font-light text-[#1E4395]/25">:</span>
                    <span className={`text-[clamp(4.5rem,15vw,12rem)] font-black tabular-nums tracking-tighter ${homeIsPitbulls ? 'text-[#0A1428]' : 'text-[#E87722]'}`}>{awayScore}</span>
                </div>

                {/* Blaue Meta-Leiste: Teams + Serie + Button */}
                <div className="mt-6 bg-[#1E4395] px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-white/85">
                        <span className={homeIsPitbulls ? 'text-[#FF8C2E]' : 'text-white'}>●</span> {homeTeam}
                    </span>
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-white/85">
                        <span className={homeIsPitbulls ? 'text-white' : 'text-[#FF8C2E]'}>●</span> {awayTeam}
                    </span>
                    {streak && (
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 md:ml-auto">
                            Serie <span className={`text-lg tracking-tight ${streak.type === 'win' ? 'text-[#FF8C2E]' : 'text-red-300'}`}>{streak.count}{streak.type === 'win' ? 'W' : 'L'}</span>
                        </span>
                    )}
                    <button
                        onClick={() => navigate(`/games/${gameNumber}`)}
                        className="text-[10px] font-black uppercase tracking-[0.3em] text-white border-b-2 border-[#FF8C2E] pb-1 hover:text-[#FF8C2E] transition-colors"
                    >
                        Spielbericht lesen →
                    </button>
                </div>

                <p className="mt-8 max-w-xl text-sm leading-relaxed text-[#1E4395]/60">
                    {homeTeam} gegen {awayTeam} — alle Zahlen, Trends und Leistungsträger des Spieltags.
                    Mehr als nur Zahlen: die Geschichte der Saison {seasonName}, erzählt in Daten.
                </p>

                {/* Zwei Spalten: Performer-Liste + Foto */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 pt-14">
                    {/* Liste */}
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1E4395]/40 mb-8">
                            Leistungsträger <span className="text-[#E87722]">/ Punkte pro Spiel</span>
                        </h3>
                        <ol>
                            {topPerformers.map((p, idx) => (
                                <li
                                    key={p.id}
                                    onClick={() => navigate(`/players/${p.id}`)}
                                    className="group cursor-pointer border-b border-[#1E4395]/12 py-6 first:pt-0 flex items-baseline gap-6 hover:border-[#E87722]/60 transition-colors"
                                >
                                    <span className="text-sm font-black tabular-nums text-[#1E4395] w-8">0{idx + 1}</span>
                                    <div className="flex-1">
                                        <div className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#0A1428] group-hover:translate-x-2 transition-transform duration-300">
                                            {p.firstName} <span className="text-[#1E4395]/35 group-hover:text-[#E87722] transition-colors">{p.lastName}</span>
                                        </div>
                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#1E4395]/40">
                                            {p.totalPoints} Pkt · {p.gamesPlayed} Spiele · FW {p.freeThrowPercentage}
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black tabular-nums text-[#E87722]">{p.pointsPerGame.toFixed(1)}</span>
                                </li>
                            ))}
                        </ol>
                        <button
                            onClick={() => navigate('/players')}
                            className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#1E4395]/40 hover:text-[#1E4395] transition-colors"
                        >
                            → Alle Spieler ansehen
                        </button>
                    </div>

                    {/* Foto: S/W + Blau-Overlay — wirkt auf hellem Grund noch stärker */}
                    <div>
                        <div className="relative border-l-4 border-[#E87722] overflow-hidden">
                            <img
                                src={`${BASE_PATH}/photos/Team-01.jpeg`}
                                alt="Team TSV Neuenstadt Pitbulls"
                                className="w-full aspect-[4/5] object-cover grayscale contrast-110"
                            />
                            {/* Blauer Overlay — wirkt auf hellem Ground besonders stark */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1E4395]/90 via-[#1E4395]/30 to-transparent mix-blend-multiply" />
                            <div className="absolute bottom-0 inset-x-0 p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8C2E]">Das Team</p>
                                <p className="text-2xl font-black uppercase tracking-tight text-white">Pitbulls {seasonName}</p>
                            </div>
                        </div>
                        {/* Form */}
                        <div className="mt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#1E4395]/40">
                            <span>Form</span>
                            <span className="tracking-[0.5em] text-sm">
                                {recentGames.slice(0, 5).map(g => (
                                    <span key={g.gameNumber} className={isWin(g) ? 'text-[#E87722]' : 'text-[#1E4395]/25'}>
                                        {isWin(g) ? 'W' : 'L'}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Schlusszeile — jetzt auf hellem Grund mit blauem Farbblock */}
                <div className="mt-20">
                    {/* Blauer Akzentbalken */}
                    <div className="h-0.5 w-full bg-[#1E4395]" />
                    <div className="pt-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <p className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-[#0A1428]">
                            Mehr als<br />
                            <span>nur Zahlen<span className="text-[#E87722]">.</span></span>
                        </p>
                        <nav className="flex gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-[#1E4395]/40">
                            {[
                                { label: 'Spielplan', to: '/spielplan' },
                                { label: 'Stats', to: '/stats' },
                                { label: 'Videos', to: '/videos' },
                            ].map(l => (
                                <button key={l.to} onClick={() => navigate(l.to)} className="hover:text-[#E87722] transition-colors">
                                    {l.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariantCLight;
