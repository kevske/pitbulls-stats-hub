import React, { useState, useEffect, useMemo } from 'react';
import { differenceInCalendarDays, setYear } from 'date-fns';
import { Link } from 'react-router-dom';
import { X, Cake, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerStats } from '@/types/stats';
import { useModernTheme } from '@/contexts/ModernThemeContext';

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
        // Debug individual player
        // console.log(`Checking ${player.firstName} ${player.lastName}: ${player.birthDate}`);

        if (!player.birthDate) return null;

        // Handle potential German date format DD.MM.YYYY
        let birthDate: Date;
        if (player.birthDate.includes('.')) {
          const parts = player.birthDate.split('.');
          // Assuming DD.MM.YYYY
          if (parts.length === 3) {
            birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            birthDate = new Date(player.birthDate);
          }
        } else {
          birthDate = new Date(player.birthDate);
        }

        if (isNaN(birthDate.getTime())) {
          console.log(`Invalid date for ${player.firstName}: ${player.birthDate}`);
          return null;
        }

        // Check birthdays for previous, current, and next year to find the closest one
        // This handles wrap-arounds (e.g. Dec 31 to Jan 1) correctly
        const candidates = [
          setYear(birthDate, currentYear - 1),
          setYear(birthDate, currentYear),
          setYear(birthDate, currentYear + 1)
        ];

        // Find the candidate with the smallest absolute difference in days
        const closestBirthday = candidates.reduce((closest, candidate) => {
          const diffClosest = Math.abs(differenceInCalendarDays(closest, today));
          const diffCandidate = Math.abs(differenceInCalendarDays(candidate, today));
          return diffCandidate < diffClosest ? candidate : closest;
        });

        const daysUntil = differenceInCalendarDays(closestBirthday, today);

        // Calculate age
        // Since we found the closest birthday, we can calculate age based on that year
        let age = closestBirthday.getFullYear() - birthDate.getFullYear();

        // If the closest birthday is in the future (or today), they are turning that age.
        // If it was in the past, they already turned that age. 
        // Logic check:
        // Born 1990. Current Year 2026.
        // Birthday Jan 30. Today Jan 31.
        // Closest birthday: Jan 30, 2026. (Days until: -1).
        // Age = 2026 - 1990 = 36.
        // Did they turn 36 yesterday? Yes.

        // Born 1990. Current Year 2026.
        // Birthday Feb 20. Today Jan 31.
        // Closest birthday: Feb 20, 2026. (Days until: +20).
        // Age = 2026 - 1990 = 36.
        // Will they turn 36? Yes.

        // Wait, what if closest birthday is next year (e.g. today Dec 31, birthday Jan 1)?
        // Born 1990. Today Dec 30, 2025.
        // Closest birthday: Jan 1, 2026.
        // Age = 2026 - 1990 = 36.
        // They will turn 36 in 2 days. Correct.

        // What if closest birthday was last year? (unlikely with +- 10 days filter but possible logic-wise)
        // Born 1990. Today Jan 2, 2026. Birthday Dec 30.
        // Closest birthday: Dec 30, 2025.
        // Age = 2025 - 1990 = 35. 
        // They turned 35 recently. Correct.

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

  // Show notification if there are birthdays
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
    if (daysUntil === 0) return <Cake className="w-5 h-5 text-pink-500" />;
    if (daysUntil > 0) return <Calendar className="w-5 h-5 text-blue-500" />;
    return <Gift className="w-5 h-5 text-green-500" />;
  };

  const getCardClass = (daysUntil: number) => {
    // Force dark styles if in modern mode, regardless of system preference
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
    <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {birthdayInfos.map((info, index) => (
              <div key={info.player.id} className={`flex items-start gap-3 ${index > 0 ? 'pt-2 border-t border-border' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {getBirthdayIcon(info.daysUntil)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
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
