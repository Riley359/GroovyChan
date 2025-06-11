const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('Perform memory cleanup and optimization')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of cleanup to perform')
                .setRequired(false)
                .addChoices(
                    { name: 'Memory', value: 'memory' },
                    { name: 'Cache', value: 'cache' },
                    { name: 'History', value: 'history' },
                    { name: 'All', value: 'all' }
                )
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const cleanupType = interaction.options.getString('type') || 'all';
            const queue = client.player.nodes.get(interaction.guildId);
            
            // Check permissions (only allow server admins or bot owner)
            if (!interaction.member.permissions.has('ADMINISTRATOR') && 
                interaction.user.id !== process.env.BOT_OWNER_ID) {
                return interaction.editReply('❌ | You need administrator permissions to use this command.');
            }

            const beforeMemory = process.memoryUsage();
            let cleanupActions = [];

            // Memory cleanup
            if (cleanupType === 'memory' || cleanupType === 'all') {
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    cleanupActions.push('✅ Forced garbage collection');
                } else {
                    cleanupActions.push('⚠️ Garbage collection not available (run with --expose-gc)');
                }
            }

            // Cache cleanup
            if (cleanupType === 'cache' || cleanupType === 'all') {
                // Clear Discord.js caches (be careful with this)
                const beforeCacheSize = client.guilds.cache.size + client.users.cache.size + client.channels.cache.size;
                
                // Only clear non-essential caches
                client.users.cache.sweep(user => user.id !== client.user.id && !user.bot);
                
                const afterCacheSize = client.guilds.cache.size + client.users.cache.size + client.channels.cache.size;
                cleanupActions.push(`✅ Cleared ${beforeCacheSize - afterCacheSize} cache entries`);
            }

            // History cleanup
            if (cleanupType === 'history' || cleanupType === 'all') {
                if (queue) {
                    const historySize = queue.history.tracks.length;
                    queue.history.clear();
                    cleanupActions.push(`✅ Cleared ${historySize} tracks from history`);
                } else {
                    cleanupActions.push('ℹ️ No active queue to clean history');
                }
            }

            // Additional optimizations for 'all' cleanup
            if (cleanupType === 'all') {
                // Clear any stuck connections
                let clearedConnections = 0;
                for (const [guildId, node] of client.player.nodes.cache) {
                    if (!node.connection || node.connection.state.status === 'destroyed') {
                        client.player.nodes.delete(guildId);
                        clearedConnections++;
                    }
                }
                if (clearedConnections > 0) {
                    cleanupActions.push(`✅ Cleared ${clearedConnections} inactive voice connections`);
                }
            }

            const afterMemory = process.memoryUsage();
            const memoryFreed = (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024;

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🧹 Cleanup Complete')
                .setDescription(`Performed **${cleanupType}** cleanup`)
                .addFields(
                    {
                        name: '📊 Memory Impact',
                        value: [
                            `**Before:** ${(beforeMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
                            `**After:** ${(afterMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
                            `**Freed:** ${memoryFreed > 0 ? '+' : ''}${memoryFreed.toFixed(1)}MB`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🔧 Actions Performed',
                        value: cleanupActions.length > 0 ? cleanupActions.join('\n') : 'No actions performed',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            // Add recommendations
            const recommendations = [];
            if (afterMemory.heapUsed > 200 * 1024 * 1024) {
                recommendations.push('• Consider restarting the bot for optimal performance');
            }
            if (client.player.nodes.cache.size > 10) {
                recommendations.push('• High number of voice connections detected');
            }
            if (queue && queue.tracks.size > 100) {
                recommendations.push('• Consider clearing the queue if it\'s very large');
            }

            if (recommendations.length > 0) {
                embed.addFields({
                    name: '💡 Recommendations',
                    value: recommendations.join('\n'),
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in cleanup command:', error);
            await interaction.editReply('❌ | Error performing cleanup. Please try again.');
        }
    },
};
