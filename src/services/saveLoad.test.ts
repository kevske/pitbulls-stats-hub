import { describe, it, expect } from 'vitest';
import {
  compareTimestamps,
  generateSaveData,
  hasUnsavedChanges,
  generateYouTubeTimestamps
} from './saveLoad';
import { Player, TaggedEvent } from '@/types/basketball';

describe('compareTimestamps', () => {
  it('identifies identical timestamps', () => {
    const ts = '2023-01-01T12:00:00.000Z';
    const result = compareTimestamps(ts, ts);
    expect(result.isSame).toBe(true);
    expect(result.isNewer).toBe(false);
    expect(result.isOlder).toBe(false);
    expect(result.timeDifference).toBe(0);
    expect(result.summary).toBe('Versions are identical');
  });

  it('identifies newer local version', () => {
    const ts1 = '2023-01-01T12:05:00.000Z';
    const ts2 = '2023-01-01T12:00:00.000Z';
    const result = compareTimestamps(ts1, ts2);
    expect(result.isNewer).toBe(true);
    expect(result.isSame).toBe(false);
    expect(result.timeDifference).toBe(300000); // 5 minutes
    expect(result.summary).toBe('Local version is 5 minute(s) newer');
  });

  it('identifies older local version (newer remote)', () => {
    const ts1 = '2023-01-01T12:00:00.000Z';
    const ts2 = '2023-01-01T12:10:00.000Z';
    const result = compareTimestamps(ts1, ts2);
    expect(result.isOlder).toBe(true);
    expect(result.isSame).toBe(false);
    expect(result.timeDifference).toBe(-600000); // -10 minutes
    expect(result.summary).toBe('Remote version is 10 minute(s) newer');
  });

  it('handles invalid timestamps', () => {
    const result = compareTimestamps('invalid', '2023-01-01T12:00:00.000Z');
    expect(result.isNewer).toBe(false);
    expect(result.isOlder).toBe(false);
    expect(result.isSame).toBe(false);
    expect(result.summary).toBe('Invalid timestamp(s)');
  });

  it('rounds down minutes correctly', () => {
    const ts1 = '2023-01-01T12:01:59.000Z';
    const ts2 = '2023-01-01T12:00:00.000Z';
    const result = compareTimestamps(ts1, ts2);
    expect(result.summary).toBe('Local version is 1 minute(s) newer');
  });
});

describe('hasUnsavedChanges', () => {
  const mockPlayers: Player[] = [{ id: '1', name: 'Player 1', jerseyNumber: 1, position: 'G' }];
  const mockEvents: TaggedEvent[] = [{
    id: 'e1',
    timestamp: 10,
    formattedTime: '0:10',
    type: 'shot',
    description: 'Shot',
    player: 'Player 1'
  }];

  it('returns false when data matches last saved data', () => {
    const lastSavedData = generateSaveData(mockPlayers, mockEvents);
    expect(hasUnsavedChanges(mockPlayers, mockEvents, lastSavedData)).toBe(false);
  });

  it('returns true when there is no last saved data and there are events', () => {
    expect(hasUnsavedChanges(mockPlayers, mockEvents, null)).toBe(true);
  });

  it('returns false when there is no last saved data and no events', () => {
    expect(hasUnsavedChanges(mockPlayers, [], null)).toBe(false);
  });

  it('returns true when player count differs', () => {
    const lastSavedData = generateSaveData(mockPlayers, mockEvents);
    expect(hasUnsavedChanges([], mockEvents, lastSavedData)).toBe(true);
  });

  it('returns true when player data differs', () => {
    const lastSavedData = generateSaveData(mockPlayers, mockEvents);
    const modifiedPlayers = [{ ...mockPlayers[0], name: 'Modified Name' }];
    expect(hasUnsavedChanges(modifiedPlayers, mockEvents, lastSavedData)).toBe(true);
  });

  it('returns true when event count differs', () => {
    const lastSavedData = generateSaveData(mockPlayers, mockEvents);
    expect(hasUnsavedChanges(mockPlayers, [], lastSavedData)).toBe(true);
  });

  it('returns true when event data differs', () => {
    const lastSavedData = generateSaveData(mockPlayers, mockEvents);
    const modifiedEvents = [{ ...mockEvents[0], description: 'Modified Shot' }];
    expect(hasUnsavedChanges(mockPlayers, modifiedEvents, lastSavedData)).toBe(true);
  });
});

describe('generateYouTubeTimestamps', () => {
  it('generates correct timestamp string', () => {
    const events: TaggedEvent[] = [
      { id: '1', timestamp: 10, formattedTime: '00:10', type: 'shot', description: 'Shot 1' },
      { id: '2', timestamp: 60, formattedTime: '01:00', type: 'shot', description: 'Shot 2' },
    ];
    const result = generateYouTubeTimestamps(events);
    expect(result).toBe('00:10 - Shot 1\n01:00 - Shot 2');
  });

  it('sorts events by timestamp before generating', () => {
    const events: TaggedEvent[] = [
      { id: '2', timestamp: 60, formattedTime: '01:00', type: 'shot', description: 'Shot 2' },
      { id: '1', timestamp: 10, formattedTime: '00:10', type: 'shot', description: 'Shot 1' },
    ];
    const result = generateYouTubeTimestamps(events);
    expect(result).toBe('00:10 - Shot 1\n01:00 - Shot 2');
  });
});
