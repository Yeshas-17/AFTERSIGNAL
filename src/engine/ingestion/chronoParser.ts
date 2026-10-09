import * as chrono from 'chrono-node';

export interface ParsedDeadline {
  text: string;           // The matched text phrase (e.g. "by tomorrow 5pm")
  date: Date;             // The calculated absolute Date object
  isoString: string;      // The absolute ISO timestamp
  isRelative: boolean;    // Whether extracted from relative wording
}

/**
 * Parses natural language dates and deadlines from message text,
 * explicitly using the message's ISO timestamp as the temporal reference ground truth.
 */
export function extractDeadlinesFromText(text: string, messageTimestampIso: string): ParsedDeadline[] {
  const referenceDate = new Date(messageTimestampIso);
  const validReference = isNaN(referenceDate.getTime()) ? new Date() : referenceDate;

  // Parse using chrono with reference context
  const parsedResults = chrono.parse(text, validReference, { forwardDate: true });

  const results: ParsedDeadline[] = [];

  for (const result of parsedResults) {
    const matchedText = result.text;
    const parsedDate = result.date();

    // Ensure date is valid and reasonable
    if (!isNaN(parsedDate.getTime())) {
      results.push({
        text: matchedText,
        date: parsedDate,
        isoString: parsedDate.toISOString(),
        isRelative: isRelativeExpression(matchedText),
      });
    }
  }

  return results;
}

function isRelativeExpression(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('tomorrow') ||
    lower.includes('today') ||
    lower.includes('tonight') ||
    lower.includes('next') ||
    lower.includes('in ') ||
    lower.includes('eod') ||
    lower.includes('cob') ||
    lower.includes('monday') ||
    lower.includes('tuesday') ||
    lower.includes('wednesday') ||
    lower.includes('thursday') ||
    lower.includes('friday') ||
    lower.includes('saturday') ||
    lower.includes('sunday')
  );
}
