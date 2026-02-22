import React, { useState, useEffect, useMemo } from 'react';
import { differenceInCalendarDays, setYear } from 'date-fns';
import { Link } from 'react-router-dom';
import { X, Cake, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerStats } from '@/types/stats';
import { useModernTheme } from '@/contexts/ModernThemeContext';
import { BASE_PATH } from '@/config';

interface BirthdayInfo {
  player: PlayerStats;
  daysUntil: number; // Positive for future, negative for past
  age: number;
}

interface BirthdayNotificationProps {
  players: PlayerStats[];
}

const BirthdayNotification: React.FC<BirthdayNotificationProps> = ({ players }) => {
  const { isModernMode } = useModernTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Calculate birthdays within ±10 days
  const birthdayInfos = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const results = players
      .filter(player => player.birthDate && player.firstName !== 'Gesamtsumme')
      .map(player => {
        if (!player.birthDate) return null;

        // Handle potential German date format DD.MM.YYYY
        let birthDate: Date;
        if (player.birthDate.includes('.')) {
          const parts = player.birthDate.split('.');
          if (parts.length === 3) {
            birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            birthDate = new Date(player.birthDate);
          }
        } else {
          birthDate = new Date(player.birthDate);
        }

        if (isNaN(birthDate.getTime())) {
          return null;
        }

        const candidates = [
          setYear(birthDate, currentYear - 1),
          setYear(birthDate, currentYear),
          setYear(birthDate, currentYear + 1)
        ];

        const closestBirthday = candidates.reduce((closest, candidate) => {
          const diffClosest = Math.abs(differenceInCalendarDays(closest, today));
          const diffCandidate = Math.abs(differenceInCalendarDays(candidate, today));
          return diffCandidate < diffClosest ? candidate : closest;
        });

        const daysUntil = differenceInCalendarDays(closestBirthday, today);
        let age = closestBirthday.getFullYear() - birthDate.getFullYear();

        return {
          player,
          daysUntil,
          age
        } as BirthdayInfo;
      })
      .filter((info): info is BirthdayInfo =>
        info !== null && Math.abs(info.daysUntil) <= 10
      )
      .sort((a, b) => Math.abs(a.daysUntil) - Math.abs(b.daysUntil));

    return results;
  }, [players]);

  useEffect(() => {
    setIsVisible(birthdayInfos.length > 0);
  }, [birthdayInfos]);

  const getBirthdayMessage = (info: BirthdayInfo): React.ReactNode => {
    const { player, daysUntil, age } = info;
    const playerLink = (
      <Link
        to={`/players/${player.id}`}
        className="font-semibold text-primary hover:underline"
      >
        {player.firstName} {player.lastName || ''}
      </Link>
    );

    if (daysUntil === 0) {
      return <>Heute feiert {playerLink} seinen {age}. Geburtstag! Alles Gute zum Geburtstag!</>;
    } else if (daysUntil > 0) {
      if (daysUntil === 1) {
        return <>Morgen feiert {playerLink} seinen {age}. Geburtstag!</>;
      } else {
        return <>In {daysUntil} Tagen feiert {playerLink} seinen {age}. Geburtstag!</>;
      }
    } else {
      const daysAgo = Math.abs(daysUntil);
      if (daysAgo === 1) {
        return <>Gestern hat {playerLink} seinen {age}. Geburtstag gefeiert! Nachträglich alles Gute!</>;
      } else {
        return <>Vor {daysAgo} Tagen hat {playerLink} seinen {age}. Geburtstag gefeiert!</>;
      }
    }
  };

  const getBirthdayIcon = (daysUntil: number) => {
    if (daysUntil === 0) return <Cake className="w-5 h-5 text-pink-500" aria-hidden="true" />;
    if (daysUntil > 0) return <Calendar className="w-5 h-5 text-blue-500" aria-hidden="true" />;
    return <Gift className="w-5 h-5 text-green-500" aria-hidden="true" />;
  };

  const getCardClass = (daysUntil: number) => {
    if (isModernMode) {
      if (daysUntil === 0) return 'border-pink-500 bg-gray-900 text-white shadow-xl shadow-pink-500/10';
      if (daysUntil > 0) return 'border-blue-500 bg-gray-900 text-white shadow-xl shadow-blue-500/10';
      return 'border-green-500 bg-gray-900 text-white shadow-xl shadow-green-500/10';
    }

    if (daysUntil === 0) return 'border-pink-200 bg-pink-50 !dark:bg-gray-900 dark:border-pink-500';
    if (daysUntil > 0) return 'border-blue-200 bg-blue-50 !dark:bg-gray-900 dark:border-blue-500';
    return 'border-green-200 bg-green-50 !dark:bg-gray-900 dark:border-green-500';
  };

  if (!isVisible || birthdayInfos.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-md animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <Card className={`${getCardClass(birthdayInfos[0].daysUntil)} shadow-lg border-2`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {getBirthdayIcon(birthdayInfos[0].daysUntil)}
              <h3 className="font-bold text-lg">
                {birthdayInfos.some(info => info.daysUntil === 0) ? 'Geburtstage heute!' : 'Geburtstage'}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0 hover:bg-transparent"
              aria-label="Benachrichtigung schließen"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="space-y-3">
            {birthdayInfos.map((info, index) => (
              <div key={info.player.id} className={`flex items-center gap-4 ${index > 0 ? 'pt-2 border-t border-border' : ''}`}>
                <div className="flex-shrink-0 relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm bg-muted flex items-center justify-center">
                    <img
                      src={info.player.imageUrl || `${BASE_PATH}/placeholder-player.png`}
                      alt={`${info.player.firstName} ${info.player.lastName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `${BASE_PATH}/placeholder-player.png`;
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border flex items-center justify-center">
                    {React.cloneElement(getBirthdayIcon(info.daysUntil) as React.ReactElement, { className: 'w-3 h-3' })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {getBirthdayMessage(info)}
                  </p>
                  {info.player.position && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {info.player.position} {info.player.jerseyNumber && `#${info.player.jerseyNumber}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {birthdayInfos.length > 1 && (
            <div className="mt-3 pt-3 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {birthdayInfos.filter(info => info.daysUntil === 0).length} Geburtstage heute,
                {birthdayInfos.filter(info => info.daysUntil > 0).length} in Kürze,
                {birthdayInfos.filter(info => info.daysUntil < 0).length} kürzlich
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BirthdayNotification;
