import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRuntime,
  calculateEndsAt,
  formatCurrency,
  formatYear,
  formatRating,
  formatDateFull,
} from './formatters.ts';

test('formatRuntime handles hours and minutes', () => {
  assert.equal(formatRuntime(113), '1h 53m');
  assert.equal(formatRuntime(60), '1h');
  assert.equal(formatRuntime(45), '45m');
  assert.equal(formatRuntime(0), 'N/A');
  assert.equal(formatRuntime(null), 'N/A');
});

test('calculateEndsAt calculates future time correctly', () => {
  // Base: 2026-10-21 14:00 (2:00 PM)
  const baseDate = new Date(2026, 9, 21, 14, 0, 0);
  assert.equal(calculateEndsAt(113, baseDate), '3:53 PM');
  assert.equal(calculateEndsAt(60, baseDate), '3:00 PM');
  assert.equal(calculateEndsAt(0, baseDate), '');
});

test('formatCurrency formats USD correctly', () => {
  assert.equal(formatCurrency(10000005), '$10,000,005');
  assert.equal(formatCurrency(42776760), '$42,776,760');
  assert.equal(formatCurrency(0), '');
  assert.equal(formatCurrency(undefined), '');
});

test('formatYear extracts 4-digit release year', () => {
  assert.equal(formatYear('2026-05-14'), '2026');
  assert.equal(formatYear('1999-12-31'), '1999');
  assert.equal(formatYear(''), '');
  assert.equal(formatYear(null), '');
});

test('formatRating rounds to one decimal place', () => {
  assert.equal(formatRating(8.54), '8.5');
  assert.equal(formatRating(7.8), '7.8');
  assert.equal(formatRating(9), '9.0');
  assert.equal(formatRating(0), 'NR');
  assert.equal(formatRating(null), 'NR');
});

test('formatDateFull formats dates clearly', () => {
  assert.equal(formatDateFull('2001-07-04'), 'Jul 4, 2001');
  assert.equal(formatDateFull(''), 'N/A');
});
