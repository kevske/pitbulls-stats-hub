import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// Vision 2026 v2 — "Editorial Court" Seitenkopf.
// Wiederverwendbarer Header: Kicker-Zeile + riesige Display-Headline + Subline.
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    kicker?: string;
    /** Zusatzinfo rechts in der Kicker-Zeile (z. B. "Saison 2025/26"). */
    right?: ReactNode;
}

const PageHeader = ({ title, subtitle, kicker = 'Pitbulls Stats Hub', right }: PageHeaderProps) => (
    <>
        <div className="pt-10 border-b-2 border-border pb-3 flex items-baseline justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground whitespace-nowrap">{kicker}</span>
            {right && (
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground text-right">{right}</span>
            )}
        </div>
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-10 pb-8"
        >
            <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground leading-[0.9]">
                {title}<span className="text-brand-orange">.</span>
            </h1>
            {subtitle && (
                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">{subtitle}</p>
            )}
        </motion.div>
    </>
);

export default PageHeader;
