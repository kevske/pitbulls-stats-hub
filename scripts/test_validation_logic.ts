
// Mock implementation of the validation logic to be added to the Edge Function
function validateVideoInput(payload: any): string[] {
    const errors: string[] = [];
    const { gameNumber, videoIndex, videoId, playlistId } = payload;

    // gameNumber
    if (gameNumber === undefined || gameNumber === null) {
        errors.push('gameNumber is required');
    } else {
        const gameNumberStr = String(gameNumber);
        if (!/^[a-zA-Z0-9_-]+$/.test(gameNumberStr)) {
            errors.push('Invalid gameNumber format: must be alphanumeric (dashes/underscores allowed)');
        }
    }

    // videoId
    if (videoId === undefined || videoId === null) {
        errors.push('videoId is required');
    } else {
        if (typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
             errors.push('Invalid videoId format: must be an 11-character YouTube ID');
        }
    }

    // playlistId (optional)
    if (playlistId !== undefined && playlistId !== null) {
        if (typeof playlistId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(playlistId)) {
            errors.push('Invalid playlistId format: must be alphanumeric (dashes/underscores allowed)');
        }
    }

    // videoIndex (optional but good to check if present)
    if (videoIndex !== undefined && videoIndex !== null) {
        if (typeof videoIndex !== 'number' || !Number.isInteger(videoIndex) || videoIndex < 0) {
            errors.push('Invalid videoIndex: must be a non-negative integer');
        }
    }

    return errors;
}

// Test cases
const testCases = [
    {
        name: 'Valid Payload (Standard)',
        payload: {
            gameNumber: '1',
            videoIndex: 0,
            videoId: 'dQw4w9WgXcQ',
            playlistId: 'PLxA687tYuMWJk'
        },
        expectedValid: true
    },
    {
        name: 'Valid Payload (No Playlist)',
        payload: {
            gameNumber: '2023-01',
            videoIndex: 1,
            videoId: 'abcdefghijk'
        },
        expectedValid: true
    },
    {
        name: 'Invalid gameNumber (Spaces)',
        payload: {
            gameNumber: 'Game 1',
            videoId: 'dQw4w9WgXcQ'
        },
        expectedValid: false
    },
    {
        name: 'Invalid gameNumber (Injection Attempt)',
        payload: {
            gameNumber: '1; DROP TABLE users',
            videoId: 'dQw4w9WgXcQ'
        },
        expectedValid: false
    },
    {
        name: 'Invalid videoId (Too Short)',
        payload: {
            gameNumber: '1',
            videoId: 'short'
        },
        expectedValid: false
    },
    {
        name: 'Invalid videoId (Too Long)',
        payload: {
            gameNumber: '1',
            videoId: 'toolongtoolong'
        },
        expectedValid: false
    },
    {
        name: 'Invalid videoId (Special Chars)',
        payload: {
            gameNumber: '1',
            videoId: '<script>xss'
        },
        expectedValid: false
    },
    {
        name: 'Invalid playlistId (Special Chars)',
        payload: {
            gameNumber: '1',
            videoId: 'dQw4w9WgXcQ',
            playlistId: 'PL<script>'
        },
        expectedValid: false
    },
    {
        name: 'Invalid videoIndex (String)',
        payload: {
            gameNumber: '1',
            videoId: 'dQw4w9WgXcQ',
            videoIndex: '0'
        },
        expectedValid: false
    },
    {
        name: 'Invalid videoIndex (Negative)',
        payload: {
            gameNumber: '1',
            videoId: 'dQw4w9WgXcQ',
            videoIndex: -1
        },
        expectedValid: false
    }
];

// Run tests
console.log('Running Validation Logic Tests...\n');
let failed = false;

testCases.forEach(test => {
    const errors = validateVideoInput(test.payload);
    const isValid = errors.length === 0;

    if (isValid === test.expectedValid) {
        console.log(`✅ [PASS] ${test.name}`);
    } else {
        console.log(`❌ [FAIL] ${test.name}`);
        console.log(`   Expected valid: ${test.expectedValid}, Got: ${isValid}`);
        console.log(`   Errors: ${JSON.stringify(errors)}`);
        failed = true;
    }
});

if (failed) {
    console.log('\nSome tests failed!');
    process.exit(1);
} else {
    console.log('\nAll tests passed!');
}
