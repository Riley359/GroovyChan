const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8d')
        .setDescription('Toggle 8D audio effect for spatial surround sound experience')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable the 8D audio effect')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Check if the player exists and is playing
            const queue = client.player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return interaction.editReply('❌ | Nothing is currently playing!');
            }

            // Get the 8D filter state from the command options
            const enabled = interaction.options.getBoolean('enabled');

            // Apply or remove the 8D filter
            await queue.filters.ffmpeg.setFilters({
                '8D': enabled
            });

            // Create an embed to display the 8D filter change
            const embed = new EmbedBuilder()
                .setColor(0x9932CC) // Dark orchid color for 8D effect
                .setTitle('🎧 8D Audio Effect')
                .setDescription(`8D audio effect has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            // Add description of the 8D effect
            if (enabled) {
                embed.addFields({
                    name: '🌀 Effect Description',
                    value: 'The 8D audio effect creates a spatial surround sound experience that makes it feel like the music is moving around your head. Best experienced with headphones!'
                });
                
                embed.addFields({
                    name: '🎧 Pro Tip',
                    value: 'For the best 8D experience, use good quality headphones and close your eyes to fully immerse yourself in the spatial audio.',
                    inline: false
                });
            }

            // Add a visual representation
            const statusIcon = enabled ? '🟢' : '🔴';
            const statusText = enabled ? 'Active' : 'Inactive';
            
            embed.addFields({
                name: '📊 Status',
                value: `${statusIcon} 8D Effect: **${statusText}**`,
                inline: true
            });

            // Add current track info
            if (queue.currentTrack) {
                embed.addFields({
                    name: '🎵 Current Track',
                    value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in 8d command:', error);
            await interaction.editReply(`❌ | Error applying 8D effect: ${error.message}`);
        }
    },
};
