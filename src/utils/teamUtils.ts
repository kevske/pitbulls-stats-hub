/**
 * Zentrale Team-Erkennung für das Frontend.
 *
 * Bisher war "ist das unser Team?" an sechs Stellen unterschiedlich
 * implementiert (exakter Vergleich, verschiedene ILIKE-Muster, hartcodierte
 * team_id). Alle Aufrufer nutzen jetzt diese Funktionen; serverseitig
 * existiert das Pendant als SQL-Funktion is_our_team().
 */

const TEAM_NAME_PATTERNS = ['neuenstadt', 'pitbull'];

/** Prüft, ob ein Teamname unser Team bezeichnet (case-insensitiv, Teilstring). */
export function isPitbullsTeamName(teamName?: string | null): boolean {
    if (!teamName) return false;
    const normalized = teamName.toLowerCase();
    return TEAM_NAME_PATTERNS.some(pattern => normalized.includes(pattern));
}

interface TeamFields {
    home_team_id?: string;
    away_team_id?: string;
    home_team_name?: string;
    away_team_name?: string;
}

/**
 * Liefert Name und ID des Gegners aus einer games-Zeile.
 * `ourTeamId` (aus seasons.our_team_id) hat Vorrang vor dem Namens-Matching.
 */
export function getOpponent(game: TeamFields, ourTeamId?: string | null): { teamId: string; teamName: string } {
    const homeIsUs = ourTeamId
        ? game.home_team_id === ourTeamId
        : isPitbullsTeamName(game.home_team_name);

    return homeIsUs
        ? { teamId: game.away_team_id ?? '', teamName: game.away_team_name ?? '' }
        : { teamId: game.home_team_id ?? '', teamName: game.home_team_name ?? '' };
}

/** Prüft, ob unser Team in diesem Spiel Heimrecht hat. */
export function isHomeGame(game: TeamFields, ourTeamId?: string | null): boolean {
    return ourTeamId
        ? game.home_team_id === ourTeamId
        : isPitbullsTeamName(game.home_team_name);
}
