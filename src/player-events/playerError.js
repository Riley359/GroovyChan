// File: src/player-events/playerError.js
// Example event: when there's an error with the player or a track

module.exports = {
    name: 'playerError', // General error
    async execute(queue, error) {
        console.error(`[Player ERROR] Guild: ${queue.guild.id}, Error: ${error.message}`);
        console.error(error);

        if (queue.metadata && queue.metadata.channel) {
            try {
                let errorMessage = '❌ | An error occurred while playing music.';

                // Handle common errors with helpful messages (but don't auto-skip)
                if (error.message.includes('403') || error.message.includes('Forbidden')) {
                    errorMessage = '❌ | YouTube temporarily blocked this request. Try a different song or wait a few minutes.';
                } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                    errorMessage = '❌ | This song is no longer available. Try searching for a different version.';
                } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
                    errorMessage = '❌ | Network connection issue. Please check your internet connection.';
                } else {
                    errorMessage = `❌ | Playback error: ${error.message}. Use \`/skip\` to try the next song.`;
                }

                await queue.metadata.channel.send(errorMessage);
            } catch (e) {
                console.error("Error sending playerError message to channel:", e);
            }
        }
    }
};