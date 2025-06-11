// File: src/player-events/error.js
// Example event: general error from discord-player (not specific to a queue)
// Note: discord-player v6 uses 'playerError' for queue-specific errors and 'error' for general errors.

module.exports = {
    name: 'error', // General error
    async execute(queue, error) { // queue can be null here if it's a general player error
        console.error(`[Player General ERROR] ${queue ? `Guild: ${queue.guild.id}` : 'No specific guild'}, Error: ${error.message}`);
        console.error(error);
        if (queue && queue.metadata && queue.metadata.channel) {
            try {
                await queue.metadata.channel.send(`❌ | A general player error occurred: ${error.message}.`);
            } catch (e) {
                console.error("Error sending general player error message to channel:", e);
            }
        }
    }
};