// File: src/player-events/emptyQueue.js
// Example event: when the queue becomes empty

module.exports = {
    name: 'emptyQueue',
    async execute(queue) {
        if (queue.metadata && queue.metadata.channel) {
             try {
                await queue.metadata.channel.send('✅ | Queue finished! No more songs to play. Leaving voice channel if configured.');
            } catch (error) {
                console.error("Error sending 'Empty Queue' message:", error);
            }
        }
        console.log(`[Player] Queue is empty in guild ${queue.guild.name}.`);
    }
};