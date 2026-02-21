import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateAge } from './dateUtils';

describe('calculateAge', () => {
  beforeEach(() => {
    // Set a fixed date for consistent testing: June 15, 2024
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined for undefined input', () => {
    expect(calculateAge(undefined)).toBeUndefined();
  });

  it('should return undefined for empty string input', () => {
    expect(calculateAge('')).toBeUndefined();
  });

  it('should return undefined for invalid date strings', () => {
    expect(calculateAge('invalid-date')).toBeUndefined();
    expect(calculateAge('2020-13-45')).toBeUndefined(); // Invalid month/day
  });

  it('should calculate correct age when birthday has already passed this year', () => {
    // Born 2000-01-01, Today 2024-06-15 -> Age 24
    expect(calculateAge('2000-01-01')).toBe(24);
  });

  it('should calculate correct age when birthday is today', () => {
    // Born 2000-06-15, Today 2024-06-15 -> Age 24
    expect(calculateAge('2000-06-15')).toBe(24);
  });

  it('should calculate correct age when birthday has not passed this year', () => {
    // Born 2000-12-31, Today 2024-06-15 -> Age 23
    expect(calculateAge('2000-12-31')).toBe(23);
  });

  it('should calculate correct age when birthday is tomorrow', () => {
    // Born 2000-06-16, Today 2024-06-15 -> Age 23
    expect(calculateAge('2000-06-16')).toBe(23);
  });

  it('should handle leap year birthdays correctly (Feb 29)', () => {
    // Born Feb 29, 2000
    const birthDate = '2000-02-29';

    // Case 1: Non-leap year, after birthday (Mar 1, 2023)
    vi.setSystemTime(new Date('2023-03-01'));
    // 2023 - 2000 = 23. Month diff (2 - 1) = 1 > 0. Age 23.
    expect(calculateAge(birthDate)).toBe(23);

    // Case 2: Non-leap year, before birthday (Feb 28, 2023)
    vi.setSystemTime(new Date('2023-02-28'));
    // 2023 - 2000 = 23. Month diff (1 - 1) = 0. Day diff (28 < 29). Age 22.
    expect(calculateAge(birthDate)).toBe(22);

    // Case 3: Leap year, on birthday (Feb 29, 2024)
    vi.setSystemTime(new Date('2024-02-29'));
    // 2024 - 2000 = 24. Month diff (1 - 1) = 0. Day diff (29 < 29) is false. Age 24.
    expect(calculateAge(birthDate)).toBe(24);
  });

  it('should return 0 for babies born today', () => {
    // Born Today 2024-06-15, Today 2024-06-15 -> Age 0
    expect(calculateAge('2024-06-15')).toBe(0);
  });

  it('should handle different date formats if supported by Date constructor', () => {
      // ISO format is primary, but checking localized formats depends on browser/environment locale.
      // However, typically 'MM/DD/YYYY' works in most environments.
      // 2000-01-01 -> Age 24
      expect(calculateAge('01/01/2000')).toBe(24);
  });
});
