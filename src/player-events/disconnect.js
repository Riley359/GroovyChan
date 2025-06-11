// File: src/player-events/disconnect.js
// Example event: when the bot is disconnected from the voice channel

module.exports = {
    name: 'disconnect',
    async execute(queue) {
        if (queue.metadata && queue.metadata.channel) {
            try {
                // Don't send if the bot left due to 'stop' command or leaveOnEnd/leaveOnEmpty
                // This event can be noisy, so be careful with notifications.
                // await queue.metadata.channel.send('👋 | Disconnected from the voice channel.');
            } catch (error) {
                console.error("Error sending 'Disconnected' message:", error);
            }
        }
        console.log(`[Player] Disconnected from voice channel in guild ${queue.guild.name}.`);
    }
};