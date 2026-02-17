
const validateVideoPayload = (payload: any) => {
    const errors: string[] = [];
    const { gameNumber, videoIndex, videoId, playlistId } = payload;

    // Validate gameNumber
    if (gameNumber === undefined || gameNumber === null) {
        errors.push('gameNumber is required');
    } else {
        const gameNumberStr = String(gameNumber);
        if (!/^[a-zA-Z0-9]+$/.test(gameNumberStr)) {
             // Allow alphanumeric for gameNumber (e.g. "1", "1a")
             // Check if strict alphanumeric is too strict. Games are usually integers.
             // But existing code uses `toString()`.
             // Let's check `admin-update-minutes` uses `^[a-zA-Z0-9_-]+$`
             if (!/^[a-zA-Z0-9_-]+$/.test(gameNumberStr)) {
                 errors.push('Invalid gameNumber format');
             }
        }
    }

    // Validate videoIndex
    if (typeof videoIndex !== 'number' || !Number.isInteger(videoIndex)) {
        errors.push('videoIndex must be an integer');
    }

    // Validate videoId (if present)
    if (videoId) {
        if (typeof videoId !== 'string') {
             errors.push('videoId must be a string');
        } else if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
             errors.push('Invalid videoId format');
        }
    }

    // Validate playlistId (if present)
    if (playlistId) {
        if (typeof playlistId !== 'string') {
             errors.push('playlistId must be a string');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
             errors.push('Invalid playlistId format');
        }
    }

    return errors;
};

// Test cases
const testCases = [
    {
        name: 'Valid Payload',
        payload: { gameNumber: 1, videoIndex: 0, videoId: 'dQw4w9WgXcQ' },
        expected: 0
    },
    {
        name: 'Valid Payload with Playlist',
        payload: { gameNumber: '1A', videoIndex: 0, videoId: 'dQw4w9WgXcQ', playlistId: 'PL1234567890abcdef' },
        expected: 0
    },
    {
        name: 'Invalid gameNumber (Injection)',
        payload: { gameNumber: '1; DROP TABLE', videoIndex: 0, videoId: 'dQw4w9WgXcQ' },
        expected: 1
    },
    {
        name: 'Invalid videoIndex',
        payload: { gameNumber: 1, videoIndex: '0', videoId: 'dQw4w9WgXcQ' },
        expected: 1
    },
    {
        name: 'Invalid videoId (Too short)',
        payload: { gameNumber: 1, videoIndex: 0, videoId: 'short' },
        expected: 1
    },
    {
        name: 'Invalid videoId (Injection)',
        payload: { gameNumber: 1, videoIndex: 0, videoId: '<script>alert(1)</script>' },
        expected: 1
    },
    {
        name: 'Invalid playlistId (Injection)',
        payload: { gameNumber: 1, videoIndex: 0, playlistId: 'PL123; DELETE *' },
        expected: 1
    }
];

console.log('Running Validation Tests...\n');
let passed = 0;

testCases.forEach(test => {
    const errors = validateVideoPayload(test.payload);
    const isSuccess = errors.length === 0;
    const isExpected = (test.expected === 0 && isSuccess) || (test.expected > 0 && !isSuccess);

    if (isExpected) {
        console.log(`✅ ${test.name}: Passed`);
        passed++;
    } else {
        console.log(`❌ ${test.name}: Failed`);
        console.log(`   Expected errors: ${test.expected > 0 ? 'Yes' : 'No'}`);
        console.log(`   Actual errors: ${JSON.stringify(errors)}`);
    }
});

console.log(`\n${passed}/${testCases.length} tests passed.`);
