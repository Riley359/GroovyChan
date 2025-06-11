const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('Comprehensive bot health check and optimization report'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);
            
            // Gather comprehensive health metrics
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const ping = client.ws.ping;
            
            // Health scores
            const memoryHealth = memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'Excellent' : 
                               memoryUsage.heapUsed < 200 * 1024 * 1024 ? 'Good' : 
                               memoryUsage.heapUsed < 300 * 1024 * 1024 ? 'Fair' : 'Poor';
            
            const connectionHealth = ping < 100 ? 'Excellent' : 
                                   ping < 200 ? 'Good' : 
                                   ping < 500 ? 'Fair' : 'Poor';
            
            // Calculate overall health score
            let healthScore = 100;
            if (memoryUsage.heapUsed > 100 * 1024 * 1024) healthScore -= 20;
            if (memoryUsage.heapUsed > 200 * 1024 * 1024) healthScore -= 20;
            if (ping > 100) healthScore -= 15;
            if (ping > 200) healthScore -= 15;
            if (client.player.nodes.cache.size > 5) healthScore -= 10;
            
            const healthColor = healthScore >= 80 ? 0x00FF00 : 
                              healthScore >= 60 ? 0xFFFF00 : 
                              healthScore >= 40 ? 0xFF8000 : 0xFF0000;
            
            const healthEmoji = healthScore >= 80 ? '🟢' : 
                              healthScore >= 60 ? '🟡' : 
                              healthScore >= 40 ? '🟠' : '🔴';

            const embed = new EmbedBuilder()
                .setColor(healthColor)
                .setTitle(`${healthEmoji} Bot Health Check`)
                .setDescription(`**Overall Health Score: ${healthScore}/100**`)
                .addFields(
                    {
                        name: '💾 Memory Health',
                        value: [
                            `**Status:** ${memoryHealth}`,
                            `**Heap Used:** ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
                            `**Heap Total:** ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
                            `**RSS:** ${(memoryUsage.rss / 1024 / 1024).toFixed(1)}MB`,
                            `**External:** ${(memoryUsage.external / 1024 / 1024).toFixed(1)}MB`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🌐 Connection Health',
                        value: [
                            `**Status:** ${connectionHealth}`,
                            `**WebSocket Ping:** ${ping}ms`,
                            `**Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
                            `**Guilds:** ${client.guilds.cache.size}`,
                            `**Voice Connections:** ${client.player.nodes.cache.size}`
                        ].join('\n'),
                        inline: true
                    }
                );

            // Music system health
            if (queue) {
                const queueHealth = queue.tracks.size < 50 ? 'Good' : 
                                  queue.tracks.size < 100 ? 'Fair' : 'High Load';
                
                const volumeHealth = queue.node.volume <= 100 ? 'Optimal' : 
                                   queue.node.volume <= 150 ? 'Acceptable' : 'High';

                embed.addFields({
                    name: '🎵 Music System Health',
                    value: [
                        `**Queue Health:** ${queueHealth} (${queue.tracks.size} tracks)`,
                        `**Volume Level:** ${volumeHealth} (${queue.node.volume}%)`,
                        `**Connection:** ${queue.connection?.state?.status || 'Unknown'}`,
                        `**Playing:** ${queue.isPlaying() ? 'Yes' : 'No'}`,
                        `**History Size:** ${queue.history?.tracks?.length || 0} tracks`
                    ].join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '🎵 Music System Health',
                    value: 'No active music session',
                    inline: false
                });
            }

            // Health recommendations
            const recommendations = [];
            
            if (memoryUsage.heapUsed > 200 * 1024 * 1024) {
                recommendations.push('🔄 **High Memory Usage** - Consider restarting the bot');
            }
            
            if (ping > 200) {
                recommendations.push('🌐 **High Latency** - Check internet connection');
            }
            
            if (queue && queue.tracks.size > 100) {
                recommendations.push('📝 **Large Queue** - Consider clearing old tracks');
            }
            
            if (queue && queue.node.volume > 150) {
                recommendations.push('🔊 **High Volume** - Reduce volume for better audio quality');
            }
            
            if (client.player.nodes.cache.size > 5) {
                recommendations.push('🎤 **Multiple Connections** - Monitor voice connection usage');
            }
            
            if (uptime > 7 * 24 * 3600) { // 7 days
                recommendations.push('⏰ **Long Uptime** - Consider periodic restarts for optimal performance');
            }

            if (recommendations.length > 0) {
                embed.addFields({
                    name: '💡 Health Recommendations',
                    value: recommendations.join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '✅ Health Status',
                    value: 'All systems are running optimally! No recommendations at this time.',
                    inline: false
                });
            }

            // Quick actions
            embed.addFields({
                name: '⚡ Quick Actions',
                value: [
                    '• `/cleanup all` - Perform memory cleanup',
                    '• `/performance` - View detailed performance metrics',
                    '• `/volume 80` - Set optimal volume level',
                    '• `/queue clear` - Clear large queues'
                ].join('\n'),
                inline: false
            });

            embed.setFooter({ 
                text: `Health check by ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in health command:', error);
            await interaction.editReply('❌ | Error performing health check. Please try again.');
        }
    },
};
