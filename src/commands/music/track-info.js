// File: src/commands/music/track-info.js
// Debug command to show detailed track information including artwork

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTrackDuration } = require('../../utils/formatDuration');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('track-info')
        .setDescription('Shows detailed information about the currently playing track'),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return interaction.editReply({
                    content: '❌ | No music is currently playing!',
                    ephemeral: true
                });
            }

            const track = queue.currentTrack;

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('🔍 Track Information')
                .setDescription(`**[${track.title}](${track.url})**`)
                .setTimestamp();

            // Basic track information
            embed.addFields(
                { name: '🎤 Artist', value: track.author || 'Unknown', inline: true },
                { name: '⏱️ Duration', value: formatTrackDuration(track.duration) || 'Unknown', inline: true },
                { name: '🎬 Source', value: track.source || 'Unknown', inline: true },
                { name: '👤 Requested by', value: `${track.requestedBy || 'Unknown'}`, inline: true },
                { name: '📊 Views', value: track.views ? track.views.toLocaleString() : 'Unknown', inline: true },
                { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true }
            );

            // Thumbnail information
            let thumbnailInfo = [];
            let displayThumbnail = null;

            if (track.originalArtwork) {
                thumbnailInfo.push(`**Original (${track.originalSource || 'preserved'}):** ${track.originalArtwork}`);
                displayThumbnail = track.originalArtwork;
            }
            if (track.thumbnail) {
                thumbnailInfo.push(`**Main:** ${track.thumbnail}`);
                if (!displayThumbnail) displayThumbnail = track.thumbnail;
            }
            if (track.raw && track.raw.thumbnail) {
                thumbnailInfo.push(`**Raw:** ${track.raw.thumbnail}`);
            }
            if (track.raw && track.raw.image) {
                thumbnailInfo.push(`**Image:** ${track.raw.image}`);
            }
            if (track.metadata && track.metadata.thumbnail) {
                thumbnailInfo.push(`**Metadata:** ${track.metadata.thumbnail}`);
            }

            if (displayThumbnail) {
                embed.setThumbnail(displayThumbnail);
            }

            if (thumbnailInfo.length > 0) {
                embed.addFields({
                    name: '🖼️ Available Artwork',
                    value: thumbnailInfo.join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🖼️ Available Artwork',
                    value: '❌ No artwork found',
                    inline: false
                });
            }

            // Queue information
            embed.addFields(
                { name: '📋 Queue Status', value: `${queue.tracks.size} track${queue.tracks.size !== 1 ? 's' : ''} remaining`, inline: true },
                { name: '🔄 Loop Mode', value: queue.repeatMode === 0 ? 'Off' : queue.repeatMode === 1 ? 'Track' : 'Queue', inline: true },
                { name: '⏯️ Player Status', value: queue.node.isPaused() ? 'Paused' : 'Playing', inline: true }
            );

            // Raw data for debugging (truncated)
            if (track.raw) {
                const rawKeys = Object.keys(track.raw).slice(0, 10); // Show first 10 keys
                embed.addFields({
                    name: '🔧 Raw Data Keys',
                    value: rawKeys.length > 0 ? rawKeys.join(', ') : 'None',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in track-info command:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription(`An error occurred: ${error.message}`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
