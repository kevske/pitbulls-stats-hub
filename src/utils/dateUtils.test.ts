import { describe, it, expect } from 'vitest';
import { calculateAge } from '@/utils/dateUtils';

describe('calculateAge', () => {
    it('should return correct age for a past birthday', () => {
        // Assume today is 2024 (mocking date would be better but simple logic test is fine)
        // Or better, calculate expected age relative to today
        const today = new Date();
        const pastYear = today.getFullYear() - 20;
        const birthDate = new Date(pastYear, today.getMonth(), today.getDate() - 1); // Birthday was yesterday
        expect(calculateAge(birthDate.toISOString())).toBe(20);
    });

    it('should return correct age for a future birthday this year', () => {
        const today = new Date();
        const pastYear = today.getFullYear() - 20;
        const birthDate = new Date(pastYear, today.getMonth(), today.getDate() + 1); // Birthday is tomorrow
        expect(calculateAge(birthDate.toISOString())).toBe(19);
    });

    it('should return undefined for invalid date string', () => {
        expect(calculateAge('invalid-date')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
        expect(calculateAge('')).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
        expect(calculateAge(undefined)).toBeUndefined();
    });
});
