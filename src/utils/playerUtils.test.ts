import { describe, it, expect } from 'vitest';
import { getPlayerImageUrl } from '@/utils/playerUtils';

describe('getPlayerImageUrl', () => {
  it('should generate correct URL for standard names', () => {
    expect(getPlayerImageUrl('Max', 'Mustermann')).toBe('/players/max-mustermann.jpg');
    expect(getPlayerImageUrl('John', 'Doe')).toBe('/players/john-doe.jpg');
  });

  it('should use manual mapping for specific players', () => {
    // These mappings are defined in PLAYER_IMAGE_MAP inside playerUtils.ts
    expect(getPlayerImageUrl('Tobias', 'Thury')).toBe('/players/tobi-thury.jpg');
    expect(getPlayerImageUrl('Nino', 'De Bortoli')).toBe('/players/nino-de-bortoli.jpg');
    expect(getPlayerImageUrl('Gregor', 'Arapidis')).toBe('/players/gregor-arapidis.jpg');
    expect(getPlayerImageUrl('David', 'Scheja')).toBe('/players/david-scheja.png'); // Note extension change
  });

  it('should strip umlauts and special characters for unmapped names', () => {
    // Current implementation strips non-alphanumeric characters
    expect(getPlayerImageUrl('Christoph', 'Mörsch')).toBe('/players/christoph-mrsch.jpg');
    expect(getPlayerImageUrl('Jürgen', 'Müller')).toBe('/players/jrgen-mller.jpg');
    expect(getPlayerImageUrl('André', 'Schürrle')).toBe('/players/andr-schrrle.jpg');
  });

  it('should handle extra spaces correctly', () => {
    expect(getPlayerImageUrl(' Max ', ' Mustermann ')).toBe('/players/max-mustermann.jpg');
    expect(getPlayerImageUrl('Max  ', '  Mustermann')).toBe('/players/max-mustermann.jpg');
  });

  it('should handle missing or empty last name', () => {
    expect(getPlayerImageUrl('Max')).toBe('/players/max.jpg');
    expect(getPlayerImageUrl('Max', '')).toBe('/players/max.jpg');
  });

  it('should handle hyphens in names', () => {
    expect(getPlayerImageUrl('Hans-Peter', 'Müller')).toBe('/players/hans-peter-mller.jpg');
    expect(getPlayerImageUrl('Jean-Luc', 'Picard')).toBe('/players/jean-luc-picard.jpg');
  });

  it('should be case insensitive', () => {
    expect(getPlayerImageUrl('MAX', 'MUSTERMANN')).toBe('/players/max-mustermann.jpg');
    expect(getPlayerImageUrl('max', 'mustermann')).toBe('/players/max-mustermann.jpg');
  });

  it('should handle empty inputs gracefully', () => {
    // This documents the current behavior, even if potentially weird
    expect(getPlayerImageUrl('', '')).toBe('/players/.jpg');
  });
});
