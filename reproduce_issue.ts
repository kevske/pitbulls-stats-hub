
import { differenceInCalendarDays, setYear } from 'date-fns';

// Mock PlayerStats interface
interface PlayerStats {
    id: string;
    firstName: string;
    lastName?: string;
    birthDate?: string;
    position?: string;
    jerseyNumber?: number;
}

interface BirthdayInfo {
    player: PlayerStats;
    daysUntil: number; // Positive for future, negative for past
    age: number;
}

function calculateBirthdayInfos(players: PlayerStats[], mockToday?: Date): BirthdayInfo[] {
    const today = mockToday || new Date();
    const currentYear = today.getFullYear();

    return players
        .filter(player => player.birthDate && player.firstName !== 'Gesamtsumme')
        .map(player => {
            const birthDate = new Date(player.birthDate!);
            if (isNaN(birthDate.getTime())) return null;

            // Check birthdays for previous, current, and next year to find the closest one
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

            // Calculate age based on that year
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
}

// Test cases
console.log("--- Reproduction Test (date-fns) ---");

// Mock Today: Jan 31st, 2026. 16:32
// Use a fixed date to ensure consistency
const mockToday = new Date('2026-01-31T16:32:00');
console.log(`Mock Today: ${mockToday.toString()}`);

// Player birthday yesterday: Jan 30th
const playerYesterday: PlayerStats = {
    id: '1',
    firstName: 'Yesterday',
    lastName: 'Player',
    birthDate: '1990-01-30' // 1990 is birth year, so in 2026 they turn 36
};

// Player birthday today: Jan 31st
const playerToday: PlayerStats = {
    id: '2',
    firstName: 'Today',
    lastName: 'Player',
    birthDate: '1990-01-31'
};

// Player birthday tomorrow: Feb 1st
const playerTomorrow: PlayerStats = {
    id: '3',
    firstName: 'Tomorrow',
    lastName: 'Player',
    birthDate: '1990-02-01'
};

// Player birthday "way back" - e.g. Dec 31st (handled as previous year or end of year?)
// Today is Jan 31st. Dec 31st is ~30 days ago. Not shown.
const playerDec: PlayerStats = {
    id: '4',
    firstName: 'December',
    lastName: 'Player',
    birthDate: '1990-12-31'
};

// Player birthday "next year" close - e.g. Jan 1st? No, Jan 1st was 30 days ago.
// What about Dec 25th 2025 vs Dec 25 2026? Both far.

const players = [playerYesterday, playerToday, playerTomorrow, playerDec];

const results = calculateBirthdayInfos(players, mockToday);

console.log("Results:");
results.forEach(r => {
    console.log(`Player: ${r.player.firstName}, DaysUntil: ${r.daysUntil}, Age: ${r.age}`);
});

if (results.find(r => r.player.firstName === 'Yesterday' && r.daysUntil === -1)) {
    console.log("SUCCESS: Yesterday Player found with daysUntil = -1.");
} else {
    console.error("FAILURE: Yesterday Player logic incorrect.");
}

if (results.find(r => r.player.firstName === 'Today' && r.daysUntil === 0)) {
    console.log("SUCCESS: Today Player found with daysUntil = 0.");
} else {
    console.error("FAILURE: Today Player logic incorrect.");
}

if (results.find(r => r.player.firstName === 'Tomorrow' && r.daysUntil === 1)) {
    console.log("SUCCESS: Tomorrow Player found with daysUntil = 1.");
} else {
    console.error("FAILURE: Tomorrow Player logic incorrect.");
}
