import { supabase } from '@/lib/supabase';

export interface Season {
    id: number;
    name: string;            // z. B. '2025/26'
    league_id: string;
    our_team_id: string | null;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export class SeasonService {
    /**
     * Alle Saisons, neueste zuerst.
     * Liefert [] wenn die seasons-Tabelle (noch) nicht existiert, damit das
     * Frontend vor Anwendung der Migration weiter funktioniert.
     */
    static async getSeasons(): Promise<Season[]> {
        try {
            const { data, error } = await supabase
                .from('seasons')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) {
                console.warn('Could not fetch seasons (table missing?):', error.message);
                return [];
            }
            return (data as Season[]) || [];
        } catch (error) {
            console.warn('Could not fetch seasons:', error);
            return [];
        }
    }

    /** Die aktuelle Saison (is_current = true), oder null als Fallback. */
    static async getCurrentSeason(): Promise<Season | null> {
        const seasons = await SeasonService.getSeasons();
        return seasons.find(s => s.is_current) ?? seasons[0] ?? null;
    }
}
