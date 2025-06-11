const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('performance')
        .setDescription('Check bot performance and optimize settings safely'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);

            // Gather comprehensive performance metrics
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const ping = client.ws.ping;
            const cpuUsage = process.cpuUsage();

            // Calculate performance scores with better thresholds
            const memoryScore = memoryUsage.heapUsed < 80 * 1024 * 1024 ? '🟢 Excellent' :
                               memoryUsage.heapUsed < 150 * 1024 * 1024 ? '🟡 Good' :
                               memoryUsage.heapUsed < 250 * 1024 * 1024 ? '🟠 Fair' : '🔴 High';

            const pingScore = ping < 50 ? '🟢 Excellent' :
                             ping < 100 ? '🟡 Good' :
                             ping < 200 ? '🟠 Fair' : '🔴 Poor';

            // Calculate memory efficiency
            const memoryEfficiency = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1);
            const memoryEfficiencyScore = memoryEfficiency < 70 ? '🟢 Efficient' :
                                        memoryEfficiency < 85 ? '🟡 Moderate' : '🔴 High Usage';

            const embed = new EmbedBuilder()
                .setColor(0x32CD32) // Lime green
                .setTitle('⚡ Performance Monitor')
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            // Enhanced performance metrics
            embed.addFields({
                name: '📊 System Performance',
                value: [
                    `**Memory Usage:** ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)}MB ${memoryScore}`,
                    `**Memory Efficiency:** ${memoryEfficiency}% ${memoryEfficiencyScore}`,
                    `**RSS Memory:** ${(memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`,
                    `**External Memory:** ${(memoryUsage.external / 1024 / 1024).toFixed(1)}MB`,
                    `**WebSocket Ping:** ${ping}ms ${pingScore}`,
                    `**Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
                    `**Active Servers:** ${client.guilds.cache.size}`,
                    `**Voice Connections:** ${client.player.nodes.cache.size}`
                ].join('\n'),
                inline: false
            });

            // Music session performance
            if (queue) {
                const connectionStatus = queue.connection?.state?.status || 'Unknown';
                const connectionScore = connectionStatus === 'ready' ? '🟢 Connected' :
                                      connectionStatus === 'connecting' ? '🟡 Connecting' : '🔴 Disconnected';

                embed.addFields({
                    name: '🎵 Music Performance',
                    value: [
                        `**Connection:** ${connectionScore}`,
                        `**Queue Size:** ${queue.tracks.size} tracks`,
                        `**Volume:** ${queue.node.volume}%`,
                        `**Playing:** ${queue.isPlaying() ? '🟢 Yes' : '🔴 No'}`
                    ].join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🎵 Music Performance',
                    value: 'No active music session',
                    inline: false
                });
            }

            // Safe optimization suggestions
            const suggestions = [];

            if (memoryUsage.heapUsed > 150 * 1024 * 1024) {
                suggestions.push('• Consider restarting the bot to free memory');
            }

            if (ping > 200) {
                suggestions.push('• Check your internet connection');
                suggestions.push('• Consider moving bot to a closer server region');
            }

            if (queue && queue.tracks.size > 50) {
                suggestions.push('• Large queue detected - consider using `/queue clear` occasionally');
            }

            if (queue && queue.node.volume > 100) {
                suggestions.push('• Volume is above 100% - consider lowering for better quality');
            }

            if (suggestions.length > 0) {
                embed.addFields({
                    name: '💡 Optimization Suggestions',
                    value: suggestions.join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '✅ Status',
                    value: 'All systems running optimally!',
                    inline: false
                });
            }

            // Safe actions
            embed.addFields({
                name: '🔧 Safe Actions',
                value: [
                    '• Use `/volume 80` for optimal audio quality',
                    '• Use `/filters clear` if audio sounds distorted',
                    '• Use `/skip` if a track is stuck',
                    '• Restart bot if memory usage is very high'
                ].join('\n'),
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in performance command:', error);
            await interaction.editReply('❌ | Error checking performance. Please try again.');
        }
    },
};
