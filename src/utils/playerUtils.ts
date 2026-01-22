// Mapping of player names to their exact filenames
const PLAYER_IMAGE_MAP: Record<string, string> = {
  'nino de bortoli': 'nino-de-bortoli.jpg',
  'tobias thury': 'tobi-thury.jpg',
  'gregor arapidis': 'gregor-arapidis.jpg',
  'david scheja': 'david-scheja.png',
  'alexander rib': 'alexander-rib.png',
  'jan strobel': 'jan-strobel.png',
  'tim krause': 'tim-krause.jpg',
  'sven bader': 'sven-bader.jpg',
  'stefan anselm': 'stefan-anselm.jpg',
  'christoph mörsch': 'christoph-mrsch.jpg',
  'abdullah ari': 'abdullah-ari.jpg',
  'kevin rassner': 'kevin-rassner.jpg',
  'marius scholl': 'marius-scholl.jpg',
  'jan crocoll': 'jan-crocoll.jpg',
  'marcus hayes': 'marcus-hayes.jpg',
  'danny seitz': 'danny-seitz.jpg',
  'markus maurer': 'markus-maurer.jpeg'
};

import { BASE_PATH } from '@/config';

export function getPlayerImageUrl(firstName: string, lastName: string = ''): string {
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
  let filename = '';

  if (PLAYER_IMAGE_MAP[fullName]) {
    filename = PLAYER_IMAGE_MAP[fullName];
  } else {
    const baseName = `${firstName}${lastName ? ' ' + lastName : ''}`
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    filename = baseName + '.jpg';
  }

  return `${BASE_PATH}/players/${filename}`;
}

/**
 * @deprecated Use getPlayerImageUrl instead
 */
export function generateImageFilename(firstName: string, lastName: string = ''): string {
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

  if (PLAYER_IMAGE_MAP[fullName]) {
    return PLAYER_IMAGE_MAP[fullName];
  }

  const baseName = `${firstName}${lastName ? ' ' + lastName : ''}`
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return baseName + '.jpg';
}
