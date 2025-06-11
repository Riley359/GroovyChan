const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display bot statistics and performance information'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Get bot statistics
            const stats = client.player.generateStatistics();
            
            // Get system information
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            
            // Calculate uptime in a readable format
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            
            // Format memory usage
            const formatBytes = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            // Create main stats embed
            const embed = new EmbedBuilder()
                .setColor(0x00AE86) // Teal color
                .setTitle('📊 Bot Statistics')
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            // Bot Information
            embed.addFields(
                {
                    name: '🤖 Bot Information',
                    value: [
                        `**Name:** ${client.user.tag}`,
                        `**ID:** ${client.user.id}`,
                        `**Uptime:** ${uptimeString}`,
                        `**Ping:** ${client.ws.ping}ms`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎵 Music Statistics',
                    value: [
                        `**Active Queues:** ${stats.queuesCount}`,
                        `**Total Servers:** ${client.guilds.cache.size}`,
                        `**Voice Connections:** ${client.voice?.adapters?.size || 0}`,
                        `**Cache Enabled:** ${stats.queryCacheEnabled ? 'Yes' : 'No'}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💾 Memory Usage',
                    value: [
                        `**RSS:** ${formatBytes(memoryUsage.rss)}`,
                        `**Heap Used:** ${formatBytes(memoryUsage.heapUsed)}`,
                        `**Heap Total:** ${formatBytes(memoryUsage.heapTotal)}`,
                        `**External:** ${formatBytes(memoryUsage.external)}`
                    ].join('\n'),
                    inline: true
                }
            );

            // Add performance information
            if (client.player.eventLoopLag !== undefined) {
                embed.addFields({
                    name: '⚡ Performance',
                    value: [
                        `**Event Loop Lag:** ${client.player.eventLoopLag.toFixed(2)}ms`,
                        `**Node.js Version:** ${process.version}`,
                        `**Platform:** ${process.platform}`,
                        `**Architecture:** ${process.arch}`
                    ].join('\n'),
                    inline: false
                });
            }

            // Add queue details if there are active queues
            if (stats.queues && stats.queues.length > 0) {
                const queueInfo = stats.queues.slice(0, 5).map((queue, index) => {
                    const guild = client.guilds.cache.get(queue.guildId);
                    const guildName = guild ? guild.name : 'Unknown Guild';
                    return `**${index + 1}.** ${guildName} - ${queue.tracksCount} tracks`;
                }).join('\n');

                embed.addFields({
                    name: `🎶 Active Queues ${stats.queues.length > 5 ? `(Showing 5/${stats.queues.length})` : ''}`,
                    value: queueInfo || 'No active queues',
                    inline: false
                });
            }

            // Add library versions
            const packageJson = require('../../../package.json');
            embed.addFields({
                name: '📚 Library Versions',
                value: [
                    `**Discord.js:** ${packageJson.dependencies['discord.js']?.replace('^', '') || 'Unknown'}`,
                    `**Discord-Player:** ${packageJson.dependencies['discord-player']?.replace('^', '') || 'Unknown'}`,
                    `**Node.js:** ${process.version}`,
                    `**Bot Version:** ${packageJson.version}`
                ].join('\n'),
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in stats command:', error);
            
            // Fallback basic stats if detailed stats fail
            const basicEmbed = new EmbedBuilder()
                .setColor(0xFF6B6B) // Red color for error state
                .setTitle('📊 Basic Bot Statistics')
                .addFields(
                    {
                        name: '🤖 Bot Info',
                        value: [
                            `**Servers:** ${client.guilds.cache.size}`,
                            `**Uptime:** ${Math.floor(process.uptime() / 60)} minutes`,
                            `**Ping:** ${client.ws.ping}ms`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💾 Memory',
                        value: `**Used:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                        inline: true
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [basicEmbed] });
        }
    },
};
