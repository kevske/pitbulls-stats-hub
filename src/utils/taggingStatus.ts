
export interface TaggingStatus {
    taggedPoints: number;
    targetScore: number;
    percentage: number;
    status: 'excellent' | 'good' | 'poor' | 'unknown';
}

export function calculateTaggingStatus(
    totalTaggedPoints: number,
    finalScore?: string,
    teams?: { home: string, away: string }
): TaggingStatus {
    if (!finalScore) {
        return {
            taggedPoints: totalTaggedPoints,
            targetScore: 0,
            percentage: 0,
            status: 'unknown'
        };
    }

    // Extract Pitbulls' score from final score
    // Handle both '-' and ':' separators
    const scoreParts = finalScore.split(/[-:]/);
    let pitbullsScore = 0;

    // Determine if Pitbulls/TSV Neuenstadt is home or away to pick correct score
    // Default to home (index 0) if teams not provided
    let isAway = false;

    if (teams) {
        isAway = teams.away.includes('Pitbulls') || teams.away.includes('Neuenstadt');
    } else {
        // Legacy fallback/heuristic: if we don't know teams, we might guess or just take first?
        // For now, let's assume if no teams provided, we can't reliably know. 
        // But usually this function is called with context.
    }

    if (scoreParts.length >= 2) {
        // If we are away, take the second score (assuming Home:Away format)
        // Otherwise take the first score
        pitbullsScore = parseInt(scoreParts[isAway ? 1 : 0]) || 0;
    } else {
        pitbullsScore = parseInt(scoreParts[0]) || 0;
    }

    // Calculate percentage accuracy
    const percentage = pitbullsScore > 0 ? Math.round((totalTaggedPoints / pitbullsScore) * 100) : 0;

    // Determine status
    let status: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
    if (percentage >= 90) status = 'excellent';
    else if (percentage >= 75) status = 'good';
    else status = 'poor';

    return {
        taggedPoints: totalTaggedPoints,
        targetScore: pitbullsScore,
        percentage,
        status
    };
}
