import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Season, SeasonService } from '@/services/seasonService';

interface SeasonContextType {
    /** Alle bekannten Saisons, neueste zuerst. Leer solange die DB-Migration fehlt. */
    seasons: Season[];
    /** Die im UI gewählte Saison (Default: aktuelle Saison). */
    selectedSeason: Season | null;
    setSelectedSeasonId: (id: number) => void;
    /** true solange die Saisons noch geladen werden. */
    loading: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export const SeasonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        SeasonService.getSeasons().then(loaded => {
            if (cancelled) return;
            setSeasons(loaded);
            const current = loaded.find(s => s.is_current) ?? loaded[0];
            setSelectedId(current?.id ?? null);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const value = useMemo(() => ({
        seasons,
        selectedSeason: seasons.find(s => s.id === selectedId) ?? null,
        setSelectedSeasonId: setSelectedId,
        loading
    }), [seasons, selectedId, loading]);

    return (
        <SeasonContext.Provider value={value}>
            {children}
        </SeasonContext.Provider>
    );
};

export const useSeason = (): SeasonContextType => {
    const context = useContext(SeasonContext);
    if (!context) {
        throw new Error('useSeason must be used within a SeasonProvider');
    }
    return context;
};
