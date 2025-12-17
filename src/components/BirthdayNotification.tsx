import React, { useState, useEffect, useMemo } from 'react';
import { X, Cake, Gift, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerStats } from '@/types/stats';

interface BirthdayInfo {
  player: PlayerStats;
  daysUntil: number; // Positive for future, negative for past
  age: number;
}

interface BirthdayNotificationProps {
  players: PlayerStats[];
}

const BirthdayNotification: React.FC<BirthdayNotificationProps> = ({ players }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Calculate birthdays within ±10 days
  const birthdayInfos = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDayOfYear = Math.floor((today.getTime() - new Date(currentYear, 0, 0).getTime()) / 86400000);

    return players
      .filter(player => player.birthDate && player.firstName !== 'Gesamtsumme')
      .map(player => {
        const birthDate = new Date(player.birthDate);
        if (isNaN(birthDate.getTime())) return null;

        // Create birthday for current year
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        const thisYearDayOfYear = Math.floor((thisYearBirthday.getTime() - new Date(currentYear, 0, 0).getTime()) / 86400000);

        // Calculate days difference (wrap around for year end)
        let daysUntil = thisYearDayOfYear - currentDayOfYear;
        if (daysUntil < -182) {
          // Birthday was more than half a year ago, count towards next year
          daysUntil += 365;
        } else if (daysUntil > 182) {
          // Birthday is more than half a year away, count from previous year
          daysUntil -= 365;
        }

        // Calculate age
        let age = currentYear - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
          age--;
        }

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
  }, [players]);

  // Show notification if there are birthdays
  useEffect(() => {
    setIsVisible(birthdayInfos.length > 0);
  }, [birthdayInfos]);

  const getBirthdayMessage = (info: BirthdayInfo): string => {
    const { player, daysUntil, age } = info;
    const playerName = `${player.firstName} ${player.lastName || ''}`;

    if (daysUntil === 0) {
      return `🎉 Heute feiert ${playerName} seinen ${age}. Geburtstag! Alles Gute zum Geburtstag! 🎂`;
    } else if (daysUntil > 0) {
      if (daysUntil === 1) {
        return `🎈 Morgen feiert ${playerName} seinen ${age}. Geburtstag!`;
      } else {
        return `📅 In ${daysUntil} Tagen feiert ${playerName} seinen ${age}. Geburtstag!`;
      }
    } else {
      const daysAgo = Math.abs(daysUntil);
      if (daysAgo === 1) {
        return `🎊 Gestern hat ${playerName} seinen ${age}. Geburtstag gefeiert! Nachträglich alles Gute! 🎁`;
      } else {
        return `💫 Vor ${daysAgo} Tagen hat ${playerName} seinen ${age}. Geburtstag gefeiert!`;
      }
    }
  };

  const getBirthdayIcon = (daysUntil: number) => {
    if (daysUntil === 0) return <Cake className="w-5 h-5 text-pink-500" />;
    if (daysUntil > 0) return <Calendar className="w-5 h-5 text-blue-500" />;
    return <Gift className="w-5 h-5 text-green-500" />;
  };

  const getCardClass = (daysUntil: number) => {
    if (daysUntil === 0) return 'border-pink-200 bg-pink-50';
    if (daysUntil > 0) return 'border-blue-200 bg-blue-50';
    return 'border-green-200 bg-green-50';
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
                {birthdayInfos.some(info => info.daysUntil === 0) ? '🎉 Geburtstage heute!' : '📅 Geburtstage in der Nähe'}
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
              <div key={info.player.id} className={`flex items-start gap-3 ${index > 0 ? 'pt-2 border-t border-gray-200' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {getBirthdayIcon(info.daysUntil)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getBirthdayMessage(info)}
                  </p>
                  {info.player.position && (
                    <p className="text-xs text-gray-600 mt-1">
                      {info.player.position} {info.player.jerseyNumber && `#${info.player.jerseyNumber}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {birthdayInfos.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
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
