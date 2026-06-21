import React from 'react';
import { motion } from 'framer-motion';
import { AwardNominee, AwardCategory } from '@/utils/awardUtils';
import { Trophy, Star, TrendingUp, Shield, Target, Zap, Heart, Rocket, Timer, PenTool, Snowflake, Hand, Cpu, Coffee, Users, Hammer, Car, Anchor, HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AwardCardProps {
  category: AwardCategory;
  className?: string;
}

const getIcon = (id: string, className?: string) => {
  const iconClass = cn("w-8 h-8 md:w-10 md:h-10 transition-all duration-300", className);
  // Vereinsfarben: Orange für Offensiv-/Haupt-Awards, Blau für Defensiv-/Struktur-Awards,
  // Grün/Rot nur semantisch (Verbesserung / Treffsicherheit).
  switch (id) {
    case 'mvp': return <Trophy className={cn(iconClass, "text-brand-orange-bright")} />;
    case 'dpoy': return <Shield className={cn(iconClass, "text-brand-blue")} />;
    case 'improved': return <TrendingUp className={cn(iconClass, "text-green-400")} />;
    case 'shooter': return <Target className={cn(iconClass, "text-brand-orange")} />;
    case 'enforcer': return <Zap className={cn(iconClass, "text-brand-orange")} />;
    case 'leader': return <Heart className={cn(iconClass, "text-brand-orange")} />;
    case 'market': return <Rocket className={cn(iconClass, "text-brand-blue")} />;
    case 'ironman': return <Timer className={cn(iconClass, "text-brand-blue")} />;
    case 'architect': return <PenTool className={cn(iconClass, "text-brand-blue")} />;
    case 'clutch': return <Snowflake className={cn(iconClass, "text-brand-blue")} />;
    case 'vacuum': return <Hand className={cn(iconClass, "text-brand-orange")} />;
    case 'efficiency': return <Cpu className={cn(iconClass, "text-brand-blue")} />;
    case 'support': return <Coffee className={cn(iconClass, "text-brand-blue")} />;
    case 'sixthman': return <Users className={cn(iconClass, "text-brand-orange")} />;
    case 'builder': return <Hammer className={cn(iconClass, "text-brand-blue")} />;
    case 'baumeister': return <HardHat className={cn(iconClass, "text-brand-orange")} />;
    case 'travel': return <Car className={cn(iconClass, "text-brand-orange")} />;
    case 'safety': return <Anchor className={cn(iconClass, "text-brand-blue")} />;
    default: return <Star className={cn(iconClass, "text-brand-orange")} />;
  }
};

const NomineeSection = ({ nominee, isWinner = false }: { nominee: AwardNominee, isWinner?: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative flex flex-row md:flex-col items-center gap-4 md:gap-0 p-3 md:p-4 rounded-2xl transition-all duration-500",
        isWinner
          ? "bg-gradient-to-br from-brand-orange/20 to-brand-blue/30 border border-brand-orange/40 shadow-2xl shadow-brand-orange/10 scale-100 md:scale-105 z-10"
          : "bg-muted/60 border border-border hover:bg-muted"
      )}
    >
      {isWinner && (
        <div className="absolute -top-3 md:-top-4 left-4 md:left-1/2 md:-translate-x-1/2 bg-brand-orange text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-20">
          Gewinner
        </div>
      )}

      <div className={cn(
        "relative mb-0 md:mb-4 overflow-hidden rounded-full border-2 shrink-0",
        isWinner ? "w-16 h-16 md:w-32 md:h-32 border-brand-orange" : "w-12 h-12 md:w-20 md:h-20 border-border"
      )}>
        <img
          src={nominee.imageUrl}
          alt={`${nominee.firstName} ${nominee.lastName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/players/placeholder.jpg';
          }}
        />
        {isWinner && <div className="absolute inset-0 bg-gradient-to-t from-brand-orange/20 to-transparent" />}
      </div>

      <div className="flex-1 text-left md:text-center min-w-0">
        <div className="mb-2 md:mb-4">
          <h3 className={cn(
            "font-bold leading-tight truncate",
            isWinner ? "text-base md:text-xl text-foreground" : "text-sm text-foreground/80"
          )}>
            {nominee.firstName} {nominee.lastName}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-1 md:gap-2 w-full">
          {Object.entries(nominee.stats).map(([label, value]) => (
            <div key={label} className="bg-background/40 rounded-lg p-1 md:p-2 text-center">
              <div className="text-[8px] md:text-[10px] uppercase text-muted-foreground font-medium truncate">{label}</div>
              <div className={cn(
                "font-bold truncate",
                isWinner ? "text-brand-orange text-sm md:text-lg" : "text-foreground/90 text-[10px] md:text-sm"
              )}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const AwardCard: React.FC<AwardCardProps> = ({ category, className }) => {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="glass-card p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-2">
            <div className="p-3 md:p-4 bg-muted/60 rounded-2xl border border-border shadow-inner shrink-0">
              {getIcon(category.id)}
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none mb-2 md:mb-0">
                {category.title}
              </h2>
              <p className="text-muted-foreground text-sm md:text-lg max-w-xl">
                {category.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 items-center md:items-end mt-2 md:mt-4">
            {/* Honorable Mention 1 */}
            <div className="order-2 md:order-1">
              {category.honorableMentions[0] && (
                <NomineeSection nominee={category.honorableMentions[0]} />
              )}
            </div>

            {/* Winner */}
            <div className="order-1 md:order-2">
              <NomineeSection nominee={category.winner} isWinner />
            </div>

            {/* Honorable Mention 2 */}
            <div className="order-3">
              {category.honorableMentions[1] && (
                <NomineeSection nominee={category.honorableMentions[1]} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
