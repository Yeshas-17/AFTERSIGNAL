import { describe, it, expect } from 'vitest';
import { extractDeadlinesFromText } from './chronoParser';

describe('chronoParser Module', () => {
  it('should parse relative date expressions ("tomorrow 5pm") anchored to message ISO timestamp', () => {
    const messageIso = '2026-10-09T10:00:00.000Z'; // Friday, Oct 9, 2026
    const text = 'Please complete the parser by tomorrow 5pm.';

    const deadlines = extractDeadlinesFromText(text, messageIso);
    expect(deadlines.length).toBeGreaterThan(0);
    expect(deadlines[0].isRelative).toBe(true);

    const extractedDate = deadlines[0].date;
    // Expected next day: Oct 10, 2026
    expect(extractedDate.getUTCDate()).toBe(10);
    expect(extractedDate.getUTCMonth()).toBe(9); // 0-indexed October is 9
  });

  it('should parse "in 2 hours" relative to message timestamp', () => {
    const messageIso = '2026-10-09T14:00:00.000Z'; // 2 PM UTC
    const text = 'Submit the report in 2 hours.';

    const deadlines = extractDeadlinesFromText(text, messageIso);
    expect(deadlines.length).toBeGreaterThan(0);
    expect(deadlines[0].isRelative).toBe(true);
    expect(deadlines[0].date.getUTCHours()).toBe(16); // 4 PM UTC
  });

  it('should return empty list when no date or deadline expression is present', () => {
    const messageIso = '2026-10-09T10:00:00.000Z';
    const text = 'Hello team, how is the project going?';

    const deadlines = extractDeadlinesFromText(text, messageIso);
    expect(deadlines.length).toBe(0);
  });

  it('should handle invalid message timestamp gracefully by falling back to valid date without crashing', () => {
    const invalidIso = 'not-a-valid-date';
    const text = 'Finish task tomorrow';

    expect(() => extractDeadlinesFromText(text, invalidIso)).not.toThrow();
    const deadlines = extractDeadlinesFromText(text, invalidIso);
    expect(deadlines.length).toBeGreaterThan(0);
  });
});
