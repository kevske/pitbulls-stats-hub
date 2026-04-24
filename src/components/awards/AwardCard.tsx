import React from 'react';
import { motion } from 'framer-motion';
import { AwardNominee, AwardCategory } from '@/utils/awardUtils';
import { Trophy, Star, TrendingUp, Shield, Target, Zap, Heart, Rocket, Timer, PenTool, Snowflake, Hand, Cpu, Coffee, Users, Hammer, Car, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AwardCardProps {
  category: AwardCategory;
  className?: string;
}

const getIcon = (id: string) => {
  switch (id) {
    case 'mvp': return <Trophy className="w-8 h-8 text-amber-400" />;
    case 'dpoy': return <Shield className="w-8 h-8 text-blue-400" />;
    case 'improved': return <TrendingUp className="w-8 h-8 text-green-400" />;
    case 'shooter': return <Target className="w-8 h-8 text-red-400" />;
    case 'enforcer': return <Zap className="w-8 h-8 text-orange-400" />;
    case 'leader': return <Heart className="w-8 h-8 text-pink-400" />;
    case 'market': return <Rocket className="w-8 h-8 text-indigo-400" />;
    case 'ironman': return <Timer className="w-8 h-8 text-cyan-400" />;
    case 'architect': return <PenTool className="w-8 h-8 text-emerald-400" />;
    case 'clutch': return <Snowflake className="w-8 h-8 text-sky-300" />;
    case 'vacuum': return <Hand className="w-8 h-8 text-orange-400" />;
    case 'efficiency': return <Cpu className="w-8 h-8 text-purple-400" />;
    case 'support': return <Coffee className="w-8 h-8 text-[#A67B5B]" />;
    case 'sixthman': return <Users className="w-8 h-8 text-rose-400" />;
    case 'builder': return <Hammer className="w-8 h-8 text-stone-400" />;
    case 'travel': return <Car className="w-8 h-8 text-yellow-400" />;
    case 'safety': return <Anchor className="w-8 h-8 text-cyan-400" />;
    default: return <Star className="w-8 h-8 text-primary" />;
  }
};

const NomineeSection = ({ nominee, isWinner = false }: { nominee: AwardNominee, isWinner?: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-2xl transition-all duration-500",
        isWinner 
          ? "bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 shadow-2xl shadow-amber-500/10 scale-105 z-10" 
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      )}
    >
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
          Gewinner
        </div>
      )}
      
      <div className={cn(
        "relative mb-4 overflow-hidden rounded-full border-2",
        isWinner ? "w-32 h-32 border-amber-400" : "w-20 h-20 border-white/20"
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

      <div className="text-center mb-4">
        <h3 className={cn(
          "font-bold leading-tight",
          isWinner ? "text-xl text-amber-100" : "text-sm text-white/80"
        )}>
          {nominee.firstName} {nominee.lastName}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {Object.entries(nominee.stats).map(([label, value]) => (
          <div key={label} className="bg-black/20 rounded-lg p-2 text-center">
            <div className="text-[10px] uppercase text-white/40 font-medium">{label}</div>
            <div className={cn(
              "font-bold",
              isWinner ? "text-amber-400 text-lg" : "text-white/90 text-sm"
            )}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const AwardCard: React.FC<AwardCardProps> = ({ category, className }) => {
  return (
    <div className={cn("vision-2026 w-full max-w-4xl mx-auto", className)}>
      <div className="glass-card p-8 rounded-[2rem] overflow-hidden relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex items-center gap-6 mb-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
              {getIcon(category.id)}
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase italic">
                {category.title}
              </h2>
              <p className="text-white/60 text-lg max-w-xl">
                {category.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mt-4">
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
