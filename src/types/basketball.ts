export type PositionType = 'Guard' | 'Forward' | 'Center';

export interface Position {
  x: number;
  y: number;
}

export interface PlaylistVideo {
  videoId: string;
  index: number;
  isCompleted: boolean;
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: PositionType;
}

export interface TaggedEvent {
  id: string;
  timestamp: number;
  formattedTime: string;
  type: EventType;
  player?: string;
  points?: number;
  missed?: boolean;
  andOne?: boolean;
  reboundPlayer?: string;
  substitutionOut?: string;
  description: string;
}

export type EventType =
  | 'start_of_quarter'
  | 'timeout'
  | 'substitution'
  | 'shot'
  | 'rebound'
  | 'foul'
  | 'assist'
  | 'steal'
  | 'block'
  | 'turnover'
  | 'highlight'
  | 'learning'
  | 'action_start'
  | 'action_end';

export interface EventTemplate {
  type: EventType;
  label: string;
  icon: string;
  requiresPlayer: boolean;
  requiresPoints?: boolean;
  requiresMissed?: boolean;
}

export const EVENT_TEMPLATES: EventTemplate[] = [

  { type: 'highlight', label: 'Highlight', icon: '⭐', requiresPlayer: false },
  { type: 'learning', label: 'Learning', icon: '💩', requiresPlayer: false },
  { type: 'action_start', label: 'Action Start', icon: '🎬', requiresPlayer: false },
  { type: 'action_end', label: 'Action Ende', icon: '🛑', requiresPlayer: false },
  { type: 'substitution', label: 'Substitution', icon: '🔄', requiresPlayer: true },
  { type: 'shot', label: 'Shot', icon: '🏀', requiresPlayer: true, requiresPoints: true, requiresMissed: true },
  { type: 'rebound', label: 'Rebound', icon: '📥', requiresPlayer: true },
  { type: 'foul', label: 'Foul', icon: '⚠️', requiresPlayer: true },
  { type: 'assist', label: 'Assist', icon: '🎯', requiresPlayer: true },
  { type: 'steal', label: 'Steal', icon: '🔥', requiresPlayer: true },
  { type: 'block', label: 'Block', icon: '🛡️', requiresPlayer: true },
  { type: 'turnover', label: 'Turnover', icon: '❌', requiresPlayer: true },
];

export const DEFAULT_PLAYERS: Player[] = [
  { id: '1', name: 'Kevin Rassner', jerseyNumber: 19, position: 'Forward' },
  { id: '2', name: 'Stefan Anselm', jerseyNumber: 30, position: 'Guard' },
  { id: '3', name: 'Gregor Arapidis', jerseyNumber: 77, position: 'Forward' },
  { id: '4', name: 'Abdullah Ari', jerseyNumber: 55, position: 'Forward' },
  { id: '5', name: 'Sven Bader', jerseyNumber: 17, position: 'Guard' },
  { id: '6', name: 'Jan Crocoll', jerseyNumber: 21, position: 'Center' },
  { id: '7', name: 'Nino de Bortoli', jerseyNumber: 7, position: 'Guard' },
  { id: '8', name: 'Marcus Hayes', jerseyNumber: 33, position: 'Center' },
  { id: '9', name: 'Tim Krause', jerseyNumber: 13, position: 'Guard' },
  { id: '10', name: 'Christoph Mörsch', jerseyNumber: 41, position: 'Center' },
  { id: '11', name: 'Alexander Rib', jerseyNumber: 11, position: 'Guard' },
  { id: '12', name: 'David Scheja', jerseyNumber: 69, position: 'Center' },
  { id: '13', name: 'Marius Scholl', jerseyNumber: 24, position: 'Guard' },
  { id: '14', name: 'Jan Strobel', jerseyNumber: 8, position: 'Forward' },
  { id: '15', name: 'Tobi Thury', jerseyNumber: 52, position: 'Forward' },
  { id: '16', name: 'Danny Seitz', jerseyNumber: 31, position: 'Forward' },
];

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateEventDescription(event: Omit<TaggedEvent, 'id' | 'description'>): string {
  const parts: string[] = [];

  switch (event.type) {
    case 'start_of_quarter':
      parts.push('Start of Quarter');
      break;
    case 'timeout':
      parts.push('Time Out');
      break;
    case 'substitution':
      parts.push(`Substitution ${event.player}`);
      if (event.substitutionOut) {
        parts.push(`Substitution out ${event.substitutionOut}`);
      }
      break;
    case 'shot':
      parts.push(`Shot ${event.player}: ${event.points === 3 ? 'three' : event.points === 2 ? 'two' : 'free throw'}`);
      if (event.missed) {
        parts.push('Missed');
        if (event.reboundPlayer) {
          parts.push(`Rebound ${event.reboundPlayer}`);
        }
      } else {
        parts.push('Made');
        if (event.andOne) {
          parts.push('And-1');
        }
      }
      break;
    case 'rebound':
      parts.push(`Rebound ${event.player}`);
      break;
    case 'foul':
      parts.push(`Foul ${event.player}`);
      break;
    case 'assist':
      parts.push(`Assist ${event.player}`);
      break;
    case 'steal':
      parts.push(`Steal ${event.player}`);
      break;
    case 'block':
      parts.push(`Block ${event.player}`);
      break;
    case 'turnover':
      parts.push(`Turnover ${event.player}`);
      break;
    case 'action_start':
      parts.push('Action Start');
      break;
    case 'action_end':
      parts.push('Action Ende');
      break;
  }

  return parts.join('. ');
}
