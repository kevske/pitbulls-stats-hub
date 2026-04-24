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
  switch (id) {
    case 'mvp': return <Trophy className={cn(iconClass, "text-amber-400")} />;
    case 'dpoy': return <Shield className={cn(iconClass, "text-blue-400")} />;
    case 'improved': return <TrendingUp className={cn(iconClass, "text-green-400")} />;
    case 'shooter': return <Target className={cn(iconClass, "text-red-400")} />;
    case 'enforcer': return <Zap className={cn(iconClass, "text-orange-400")} />;
    case 'leader': return <Heart className={cn(iconClass, "text-pink-400")} />;
    case 'market': return <Rocket className={cn(iconClass, "text-indigo-400")} />;
    case 'ironman': return <Timer className={cn(iconClass, "text-cyan-400")} />;
    case 'architect': return <PenTool className={cn(iconClass, "text-emerald-400")} />;
    case 'clutch': return <Snowflake className={cn(iconClass, "text-sky-300")} />;
    case 'vacuum': return <Hand className={cn(iconClass, "text-orange-400")} />;
    case 'efficiency': return <Cpu className={cn(iconClass, "text-purple-400")} />;
    case 'support': return <Coffee className={cn(iconClass, "text-[#A67B5B]")} />;
    case 'sixthman': return <Users className={cn(iconClass, "text-rose-400")} />;
    case 'builder': return <Hammer className={cn(iconClass, "text-stone-400")} />;
    case 'baumeister': return <HardHat className={cn(iconClass, "text-orange-500")} />;
    case 'travel': return <Car className={cn(iconClass, "text-yellow-400")} />;
    case 'safety': return <Anchor className={cn(iconClass, "text-cyan-400")} />;
    default: return <Star className={cn(iconClass, "text-primary")} />;
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
          ? "bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 shadow-2xl shadow-amber-500/10 scale-100 md:scale-105 z-10" 
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      )}
    >
      {isWinner && (
        <div className="absolute -top-3 md:-top-4 left-4 md:left-1/2 md:-translate-x-1/2 bg-amber-500 text-black text-[8px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-20">
          Gewinner
        </div>
      )}
      
      <div className={cn(
        "relative mb-0 md:mb-4 overflow-hidden rounded-full border-2 shrink-0",
        isWinner ? "w-16 h-16 md:w-32 md:h-32 border-amber-400" : "w-12 h-12 md:w-20 md:h-20 border-white/20"
      )}>
        <img 
          src={nominee.imageUrl} 
          alt={`${nominee.firstName} ${nominee.lastName}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/players/placeholder.jpg';
          }}
        />
        {isWinner && <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />}
      </div>

      <div className="flex-1 text-left md:text-center min-w-0">
        <div className="mb-2 md:mb-4">
          <h3 className={cn(
            "font-bold leading-tight truncate",
            isWinner ? "text-base md:text-xl text-amber-100" : "text-sm text-white/80"
          )}>
            {nominee.firstName} {nominee.lastName}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-1 md:gap-2 w-full">
          {Object.entries(nominee.stats).map(([label, value]) => (
            <div key={label} className="bg-black/20 rounded-lg p-1 md:p-2 text-center">
              <div className="text-[8px] md:text-[10px] uppercase text-white/40 font-medium truncate">{label}</div>
              <div className={cn(
                "font-bold truncate",
                isWinner ? "text-amber-400 text-sm md:text-lg" : "text-white/90 text-[10px] md:text-sm"
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
    <div className={cn("vision-2026 w-full max-w-4xl mx-auto", className)}>
      <div className="glass-card p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 md:gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-2">
            <div className="p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner shrink-0">
              {getIcon(category.id)}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase italic leading-none mb-2 md:mb-0">
                {category.title}
              </h2>
              <p className="text-white/60 text-sm md:text-lg max-w-xl">
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
