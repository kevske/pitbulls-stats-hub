/**
 * Shared video-related type definitions
 */
import { Player, TaggedEvent } from './basketball';

/**
 * Metadata for exported save files.
 * Contains summary information about the tagged events.
 */
export interface SaveDataMetadata {
    totalEvents?: number;
    totalTimeSpan?: number;
    exportFormat?: 'youtube-timestamps';
    /** Source application that created the save */
    source?: string;
    /** When the save was created */
    addedAt?: string;
    /** Additional notes */
    note?: string;
    /** Any other metadata */
    [key: string]: unknown;
}

/**
 * Unified save data format for video tagging projects.
 * 
 * Used for:
 * - Exporting video tagging sessions
 * - Storing video projects in Supabase
 * - Importing/exporting between sessions
 */
export interface SaveData {
    /** Schema version for compatibility checking */
    version: string;

    /** When the save was created */
    timestamp: string;

    /** When the save was last modified (for conflict detection) */
    lastModified?: string;

    /** YouTube video ID */
    videoId?: string;

    /** YouTube playlist ID (if part of a playlist) */
    playlistId?: string;

    /** List of players in the session */
    players: Player[];

    /** Tagged events from the video */
    events: TaggedEvent[];

    /** Optional metadata about the save */
    metadata?: SaveDataMetadata;

    // Game-specific fields (optional, used when tied to a game)

    /** Game number this video is associated with */
    gameNumber?: number;

    /** Index of this video within a game (for multi-video games) */
    videoIndex?: number;
}
