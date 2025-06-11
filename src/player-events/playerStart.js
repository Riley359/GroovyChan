// File: src/player-events/playerStart.js
// Example event: when a track starts playing

const { EmbedBuilder } = require('discord.js');
const { formatTrackDuration } = require('../utils/formatDuration');

module.exports = {
    name: 'playerStart', // Event name from discord-player
    async execute(queue, track) {
        // queue.metadata contains the channel and client if you set it up in play.js
        if (queue.metadata && queue.metadata.channel) {
            // Enhanced embed with better artwork and information
            const embed = new EmbedBuilder()
                .setColor(0x1DB954) // Spotify green for music
                .setTitle('🎵 Now Playing')
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: '🎤 Artist', value: track.author || 'Unknown Artist', inline: true },
                    { name: '⏱️ Duration', value: formatTrackDuration(track.duration) || 'Unknown', inline: true },
                    { name: '🎬 Source', value: track.source || 'Unknown', inline: true },
                    { name: '👤 Requested by', value: `${track.requestedBy || 'Unknown'}`, inline: true },
                    { name: '📊 Queue Position', value: `${queue.tracks.size + 1} track${queue.tracks.size !== 0 ? 's' : ''} in queue`, inline: true },
                    { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true }
                )
                .setTimestamp();

            // Enhanced thumbnail handling - prioritize original source artwork
            let thumbnailUrl = null;

            // Priority 1: Preserved original artwork (from Spotify, etc.)
            if (track.originalArtwork) {
                thumbnailUrl = track.originalArtwork;
                console.log(`[Player] Using preserved ${track.originalSource || 'original'} artwork: ${thumbnailUrl}`);
            }
            // Priority 2: Non-YouTube thumbnails (higher quality)
            else if (track.thumbnail && track.thumbnail.includes('http') && !track.thumbnail.includes('i.ytimg.com')) {
                thumbnailUrl = track.thumbnail;
            }
            // Priority 3: Raw thumbnails that aren't YouTube
            else if (track.raw && track.raw.thumbnail && !track.raw.thumbnail.includes('i.ytimg.com')) {
                thumbnailUrl = track.raw.thumbnail;
            }
            // Priority 4: Raw image data
            else if (track.raw && track.raw.image && !track.raw.image.includes('i.ytimg.com')) {
                thumbnailUrl = track.raw.image;
            }
            // Priority 5: Metadata thumbnails
            else if (track.metadata && track.metadata.thumbnail && !track.metadata.thumbnail.includes('i.ytimg.com')) {
                thumbnailUrl = track.metadata.thumbnail;
            }
            // Priority 6: Any thumbnail as fallback
            else if (track.thumbnail && track.thumbnail.includes('http')) {
                thumbnailUrl = track.thumbnail;
            }

            // Set the thumbnail or use bot avatar as fallback
            if (thumbnailUrl) {
                embed.setThumbnail(thumbnailUrl);
            } else {
                embed.setThumbnail(queue.metadata.client.user.displayAvatarURL({ size: 512 }));
            }

            try {
                 await queue.metadata.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error("Error sending 'Now Playing' message:", error);
            }
        }
        console.log(`[Player] Started playing: ${track.title} in guild ${queue.guild.name}`);
    }
};