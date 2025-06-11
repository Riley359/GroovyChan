const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lofi')
        .setDescription('Toggle lofi filter for a chill, relaxed sound')
        .addBooleanOption(option =>
            option.setName('enabled')
                .setDescription('Enable or disable the lofi filter')
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

            // Get the lofi filter state from the command options
            const enabled = interaction.options.getBoolean('enabled');

            // Apply or remove the lofi filter
            await queue.filters.ffmpeg.setFilters({
                lofi: enabled
            });

            // Create an embed to display the lofi filter change
            const embed = new EmbedBuilder()
                .setColor(0x6A5ACD) // SlateBlue color for lofi aesthetic
                .setTitle('🎵 Lofi Filter')
                .setDescription(`Lofi filter has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            // Add a description of the lofi effect
            if (enabled) {
                embed.addFields({
                    name: '🎧 Effect',
                    value: 'The lofi filter adds a warm, nostalgic quality to the audio with subtle imperfections that create a relaxed, chill atmosphere.'
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in lofi command:', error);
            await interaction.editReply(`❌ | Error: ${error.message}`);
        }
    },
};
