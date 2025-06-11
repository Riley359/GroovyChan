const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show current music session and bot information'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);
            
            const embed = new EmbedBuilder()
                .setColor(0x1E90FF) // Dodger blue
                .setTitle('🎵 Music Bot Information')
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Current session info
            if (queue && queue.currentTrack) {
                const track = queue.currentTrack;
                const progress = queue.node.createProgressBar();
                
                embed.addFields({
                    name: '🎧 Currently Playing',
                    value: [
                        `**[${track.title}](${track.url})**`,
                        `**Artist:** ${track.author}`,
                        `**Duration:** ${track.duration}`,
                        `**Source:** ${track.source}`,
                        `**Progress:** ${progress}`
                    ].join('\n'),
                    inline: false
                });

                // Queue info
                embed.addFields({
                    name: '📋 Queue Status',
                    value: [
                        `**Volume:** ${queue.node.volume}%`,
                        `**Tracks in Queue:** ${queue.tracks.size}`,
                        `**Loop Mode:** ${queue.repeatMode ? 'Enabled' : 'Disabled'}`,
                        `**Paused:** ${queue.node.isPaused() ? 'Yes' : 'No'}`
                    ].join('\n'),
                    inline: true
                });

                // Audio filters
                const enabledFilters = queue.filters.ffmpeg.getFiltersEnabled();
                embed.addFields({
                    name: '🎛️ Active Filters',
                    value: enabledFilters.length > 0 ? enabledFilters.join(', ') : 'None',
                    inline: true
                });

            } else {
                embed.addFields({
                    name: '🎧 Music Status',
                    value: 'No music currently playing',
                    inline: false
                });
            }

            // Bot performance info
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            
            const formatUptime = (seconds) => {
                const days = Math.floor(seconds / 86400);
                const hours = Math.floor((seconds % 86400) / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                return `${days}d ${hours}h ${minutes}m`;
            };

            const formatBytes = (bytes) => {
                return Math.round(bytes / 1024 / 1024) + ' MB';
            };

            embed.addFields({
                name: '🤖 Bot Performance',
                value: [
                    `**Uptime:** ${formatUptime(uptime)}`,
                    `**Memory Usage:** ${formatBytes(memoryUsage.heapUsed)}`,
                    `**Ping:** ${client.ws.ping}ms`,
                    `**Servers:** ${client.guilds.cache.size}`
                ].join('\n'),
                inline: false
            });

            // Audio quality info
            embed.addFields({
                name: '🎵 Audio Quality',
                value: [
                    '**Source Quality:** Highest Available',
                    '**Discord Limit:** 128 kbps (256 kbps with Nitro)',
                    '**Sample Rate:** 48 kHz',
                    '**Codec:** Opus (optimized for Discord)'
                ].join('\n'),
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in info command:', error);
            await interaction.editReply('❌ | Error retrieving information. Please try again.');
        }
    },
};
