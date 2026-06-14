// PROTOTYPE Vision 2026 v2 — Wegwerf-Code, löschen nach Design-Entscheid.
// Drei Varianten des neuen Designs (Vereinsfarben Blau/Orange) auf der
// bestehenden /-Route, umschaltbar via ?variant=A|B|C.

export interface ProtoPerformer {
    id: string;
    firstName: string;
    lastName: string;
    pointsPerGame: number;
    totalPoints: number;
    gamesPlayed: number;
    freeThrowPercentage: string;
    threePointersPerGame: number;
    imageUrl?: string;
}

export interface ProtoGame {
    gameNumber: number;
    date: string;
    finalScore?: string;
    homeTeam?: string;
    awayTeam?: string;
}

export interface ProtoData {
    gameNumber: number;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    streak: { type: 'win' | 'loss' | null; count: number } | null;
    topPerformers: ProtoPerformer[];
    recentGames: ProtoGame[];
    seasonName: string;
}

export const isPitbulls = (team?: string) => {
    const t = (team ?? '').toLowerCase();
    return t.includes('neuenstadt') || t.includes('pitbull');
};

export const isWin = (g: { finalScore?: string; homeTeam?: string }) => {
    const [h, a] = (g.finalScore ?? '').split(/[-:]/).map(s => parseInt(s.trim(), 10));
    if (isNaN(h) || isNaN(a)) return false;
    return isPitbulls(g.homeTeam) ? h > a : a > h;
};

// Vereinsfarben (Logo): TSV-Blau und Basketball-Orange
export const C = {
    navy: '#050B18',
    panel: '#0A1428',
    blue: '#1E4395',
    blueBright: '#2E63D4',
    orange: '#E87722',
    orangeBright: '#FF8C2E',
};
