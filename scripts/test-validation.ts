
function validateGameNumber(gameNumber: any): boolean {
  if (gameNumber === undefined || gameNumber === null) return false;
  const gameNumberStr = String(gameNumber);
  // Allow alphanumeric, underscore, hyphen.
  // Must not be empty.
  return /^[a-zA-Z0-9_-]+$/.test(gameNumberStr);
}

function validateVideoIndex(videoIndex: any): boolean {
  if (typeof videoIndex !== 'number') return false;
  return Number.isInteger(videoIndex) && videoIndex >= 0;
}

function validateVideoId(videoId: any): boolean {
  if (!videoId || typeof videoId !== 'string') return false;
  // YouTube video IDs are 11 characters.
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

function validatePlaylistId(playlistId: any): boolean {
  if (playlistId === undefined || playlistId === null) return true; // Optional
  if (typeof playlistId !== 'string') return false;
  // YouTube playlist IDs are usually longer (e.g. PL...). Let's allow alphanumeric + _ + -.
  // They usually start with PL, but let's be flexible but safe.
  // Standard length seems to be roughly 34 chars for PL..., but let's just ensure characters are safe.
  return /^[a-zA-Z0-9_-]+$/.test(playlistId);
}

// Test cases
const testCases = [
  { name: 'Valid Game Number (number)', input: 123, validator: validateGameNumber, expected: true },
  { name: 'Valid Game Number (string)', input: '123-1', validator: validateGameNumber, expected: true },
  { name: 'Invalid Game Number (special chars)', input: '123$456', validator: validateGameNumber, expected: false },
  { name: 'Invalid Game Number (empty)', input: '', validator: validateGameNumber, expected: false },
  { name: 'Invalid Game Number (object)', input: {}, validator: validateGameNumber, expected: false },

  { name: 'Valid Video Index', input: 0, validator: validateVideoIndex, expected: true },
  { name: 'Valid Video Index (positive)', input: 5, validator: validateVideoIndex, expected: true },
  { name: 'Invalid Video Index (negative)', input: -1, validator: validateVideoIndex, expected: false },
  { name: 'Invalid Video Index (float)', input: 1.5, validator: validateVideoIndex, expected: false },
  { name: 'Invalid Video Index (string)', input: '1', validator: validateVideoIndex, expected: false },

  { name: 'Valid Video ID', input: 'dQw4w9WgXcQ', validator: validateVideoId, expected: true },
  { name: 'Invalid Video ID (short)', input: 'dQw4w9WgXc', validator: validateVideoId, expected: false },
  { name: 'Invalid Video ID (long)', input: 'dQw4w9WgXcQA', validator: validateVideoId, expected: false },
  { name: 'Invalid Video ID (special chars)', input: 'dQw4w9WgXc$', validator: validateVideoId, expected: false },

  { name: 'Valid Playlist ID (undefined)', input: undefined, validator: validatePlaylistId, expected: true },
  { name: 'Valid Playlist ID (null)', input: null, validator: validatePlaylistId, expected: true },
  { name: 'Valid Playlist ID (string)', input: 'PL1234567890abcdef', validator: validatePlaylistId, expected: true },
  { name: 'Invalid Playlist ID (special chars)', input: 'PL1234567890abcdef$', validator: validatePlaylistId, expected: false },
];

let passed = 0;
let failed = 0;

console.log('Running validation tests...');

testCases.forEach((test) => {
  const result = test.validator(test.input);
  if (result === test.expected) {
    // console.log(`✅ ${test.name}`);
    passed++;
  } else {
    console.error(`❌ ${test.name}: Expected ${test.expected}, got ${result}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
