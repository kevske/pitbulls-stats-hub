// PROTOTYPE Vision 2026 v2 — schwebende Umschaltleiste (kein Teil des Designs).
// Pfeile oder ←/→ wechseln die Variante; ?variant= bleibt teil- und reload-stabil.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SwitcherProps {
    variants: { key: string; name: string }[];
    current: string;
}

const PrototypeSwitcher = ({ variants, current }: SwitcherProps) => {
    const [, setSearchParams] = useSearchParams();

    const idx = Math.max(0, variants.findIndex(v => v.key === current));
    const go = (dir: number) => {
        const next = variants[(idx + dir + variants.length) % variants.length];
        setSearchParams({ variant: next.key }, { replace: true });
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (import.meta.env.PROD) return null;

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 rounded-full bg-white text-black shadow-[0_4px_24px_rgba(0,0,0,0.5)] px-2 py-1.5 font-mono text-sm select-none">
            <button onClick={() => go(-1)} className="px-3 py-1 rounded-full hover:bg-black/10" aria-label="Vorherige Variante">‹</button>
            <span className="px-2 font-bold whitespace-nowrap">
                {variants[idx].key} — {variants[idx].name}
                <span className="ml-2 text-black/40 font-normal">({idx + 1}/{variants.length})</span>
            </span>
            <button onClick={() => go(1)} className="px-3 py-1 rounded-full hover:bg-black/10" aria-label="Nächste Variante">›</button>
        </div>
    );
};

export default PrototypeSwitcher;
