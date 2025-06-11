// File: src/player-events/audioTrackAdd.js
// Example event: when a track is added to the queue

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'audioTrackAdd', // Event name from discord-player
    async execute(queue, track) {
        if (queue.metadata && queue.metadata.channel && queue.isPlaying()) { // Only send if already playing
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('➕ Track Added')
                .setDescription(`[${track.title}](${track.url}) has been added to the queue.`)
                .addFields(
                    { name: 'Position in queue', value: `${queue.tracks.size}`, inline: true }, // .size includes the new track
                    { name: 'Duration', value: `\`${track.duration}\``, inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setTimestamp();
             try {
                // Avoid sending this if the "play" command itself is handling the feedback for the first track
                if (queue.tracks.size > 1 || (queue.currentTrack && queue.currentTrack.id !== track.id)) {
                     await queue.metadata.channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error("Error sending 'Track Added' message:", error);
            }
        }
        console.log(`[Player] Track added: ${track.title} to queue in guild ${queue.guild.name}`);
    }
};