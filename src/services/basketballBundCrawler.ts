import { QuarterScores } from '@/data/games';

export interface ParsedGameResult {
  homeTeam: string;
  awayTeam: string;
  date: string;
  quarterScores: QuarterScores;
}

export class BasketballBundCrawler {
  /**
   * Extract quarter scores from basketball-bund.net game details page
   */
  static extractQuarterScores(html: string): ParsedGameResult | null {
    try {
      // Parse the HTML to extract game information and quarter scores
      const gameResult = this.parseGameDetails(html);
      return gameResult;
    } catch (error) {
      console.error('Error extracting quarter scores:', error);
      return null;
    }
  }

  /**
   * Parse game details from the HTML content
   */
  private static parseGameDetails(html: string): ParsedGameResult | null {
    // Look for the main results table
    const tableRegex = /<table[^>]*class="sportView"[^>]*>[\s\S]*?<\/table>/g;
    const tables = html.match(tableRegex);

    if (!tables || tables.length === 0) {
      return null;
    }

    // Find the results table (should be the first one with quarter data)
    const resultsTable = tables.find(table =>
      table.includes('1.&nbsp;Viertel') &&
      table.includes('Halbzeit') &&
      table.includes('3.&nbsp;Viertel')
    );

    if (!resultsTable) {
      return null;
    }

    return this.extractGameDataFromTable(resultsTable);
  }

  /**
   * Extract game data from the results table
   */
  private static extractGameDataFromTable(tableHtml: string): ParsedGameResult | null {
    // Find all data rows in the table
    const rowRegex = /<tr[^>]*class="sportItem(Even|Odd)"[^>]*>[\s\S]*?<\/tr>/g;
    const rows = tableHtml.match(rowRegex);

    if (!rows || rows.length === 0) {
      return null;
    }

    // Process each row to extract game data
    for (const row of rows) {
      const gameData = this.parseRowData(row);
      if (gameData) {
        return gameData;
      }
    }

    return null;
  }

  /**
   * Parse individual row data
   */
  private static parseRowData(rowHtml: string): ParsedGameResult | null {
    // Extract all cell data
    const cellRegex = /<td[^>]*class="sportItem(Even|Odd)"[^>]*><NOBR>&nbsp;([^<]*)<\/NOBR><\/td>/g;
    const cells = [];
    let match;

    while ((match = cellRegex.exec(rowHtml)) !== null) {
      cells.push(match[2].trim());
    }

    // We need at least: game number, match day, date, home team, away team, final score, Q1, halftime, Q3
    if (cells.length < 9) {
      return null;
    }

    const [, , date, homeTeam, awayTeam, finalScore, firstQuarter, halftime, thirdQuarter] = cells;

    // Parse the score pairs (format: "home : away")
    const final = this.parseScorePair(finalScore);
    const q1 = this.parseScorePair(firstQuarter);
    const ht = this.parseScorePair(halftime);
    const q3 = this.parseScorePair(thirdQuarter);

    if (!final || !q1 || !ht || !q3) {
      return null;
    }

    return {
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      date: this.parseDate(date),
      quarterScores: {
        firstQuarter: q1,
        halftime: ht,
        thirdQuarter: q3,
        final: final
      }
    };
  }

  /**
   * Parse score pair in format "home : away"
   */
  private static parseScorePair(scoreText: string): { home: number; away: number } | null {
    const match = scoreText.match(/(\d+)\s*:\s*(\d+)/);
    if (!match) {
      return null;
    }

    return {
      home: parseInt(match[1], 10),
      away: parseInt(match[2], 10)
    };
  }

  /**
   * Parse date from format "DD.MM.YYYY HH:MM"
   */
  private static parseDate(dateText: string): string {
    const match = dateText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
    if (!match) {
      return dateText; // Return original if parsing fails
    }

    const [, day, month, year, hours, minutes] = match;
    // Convert to ISO format
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }

  /**
   * Fetch and extract quarter scores from a basketball-bund.net URL
   */
  static async fetchQuarterScores(url: string): Promise<ParsedGameResult | null> {
    try {
      // For now, we'll use a simple fetch approach
      // In a real implementation, you might need to use a proxy or server-side scraping
      const response = await fetch(url);
      const html = await response.text();

      return this.extractQuarterScores(html);
    } catch (error) {
      console.error('Error fetching quarter scores:', error);
      return null;
    }
  }
}
