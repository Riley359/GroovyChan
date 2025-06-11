// File: src/utils/formatDuration.js
// Utility to format duration from milliseconds to human-readable format

/**
 * Format duration from milliseconds to human-readable format
 * @param {number|string} duration - Duration in milliseconds or already formatted string
 * @returns {string} Formatted duration (e.g., "3:45", "1:23:45", "2h 30m")
 */
function formatDuration(duration) {
    // If it's already a formatted string (contains colons), return as-is
    if (typeof duration === 'string' && duration.includes(':')) {
        return duration;
    }

    // If it's a string but not formatted, try to parse as number
    if (typeof duration === 'string') {
        const parsed = parseInt(duration);
        if (isNaN(parsed)) {
            return duration; // Return original if can't parse
        }
        duration = parsed;
    }

    // If it's not a number, return as-is
    if (typeof duration !== 'number' || duration <= 0) {
        return 'Unknown';
    }

    // Convert milliseconds to seconds
    const totalSeconds = Math.floor(duration / 1000);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        // For long durations, use "Xh Ym" format for playlists
        if (hours >= 1) {
            return `${hours}h ${minutes}m`;
        }
    }

    // For shorter durations, use "MM:SS" format
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration specifically for playlists (more compact)
 * @param {number|string} duration - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 30m", "45m", "3:45")
 */
function formatPlaylistDuration(duration) {
    // If it's already a formatted string, return as-is
    if (typeof duration === 'string' && (duration.includes(':') || duration.includes('h') || duration.includes('m'))) {
        return duration;
    }

    // Parse if string
    if (typeof duration === 'string') {
        const parsed = parseInt(duration);
        if (isNaN(parsed)) {
            return duration;
        }
        duration = parsed;
    }

    if (typeof duration !== 'number' || duration <= 0) {
        return 'Unknown';
    }

    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${totalSeconds}s`;
    }
}

/**
 * Format track duration (always in MM:SS format)
 * @param {number|string} duration - Duration in milliseconds or formatted string
 * @returns {string} Formatted duration (e.g., "3:45", "1:23:45")
 */
function formatTrackDuration(duration) {
    // If it's already a formatted string with colons, return as-is
    if (typeof duration === 'string' && duration.includes(':')) {
        return duration;
    }

    // Parse if string
    if (typeof duration === 'string') {
        const parsed = parseInt(duration);
        if (isNaN(parsed)) {
            return duration;
        }
        duration = parsed;
    }

    if (typeof duration !== 'number' || duration <= 0) {
        return 'Unknown';
    }

    const totalSeconds = Math.floor(duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = {
    formatDuration,
    formatPlaylistDuration,
    formatTrackDuration
};
