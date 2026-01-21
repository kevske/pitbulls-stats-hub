/**
 * Shared date utility functions
 */

/**
 * Calculate age from a birth date string.
 * @param birthDate - ISO date string or date-parseable string
 * @returns Age in years, or undefined if birth date is invalid
 */
export function calculateAge(birthDate?: string): number | undefined {
    if (!birthDate) return undefined;

    const birth = new Date(birthDate);
    const today = new Date();

    // Check if birth date is valid
    if (isNaN(birth.getTime())) return undefined;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}
