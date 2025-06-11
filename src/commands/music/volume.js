const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the volume of the music player')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-250%)')
                .setMinValue(0)
                .setMaxValue(250)
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

            // Get the volume level from the command options
            const volumeLevel = interaction.options.getInteger('level');

            // Validate volume level for optimal performance
            if (volumeLevel > 150) {
                const confirmEmbed = new EmbedBuilder()
                    .setColor(0xFF6B35)
                    .setTitle('⚠️ High Volume Warning')
                    .setDescription(`Volume level ${volumeLevel}% may cause audio distortion and increased CPU usage.\n\nRecommended maximum: 150%\nOptimal range: 50-100%`)
                    .setFooter({ text: 'Volume set anyway as requested' });

                await interaction.editReply({ embeds: [confirmEmbed] });

                // Add a small delay to show the warning
                setTimeout(async () => {
                    queue.node.setVolume(volumeLevel);
                    // Continue with normal volume display after warning
                }, 2000);
            } else {
                // Set the volume immediately for normal levels
                queue.node.setVolume(volumeLevel);
            }

            // Create a visual representation of the volume level
            const volumeBar = createVolumeBar(volumeLevel);

            // Create an embed to display the volume change
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🔊 Volume Adjusted')
                .setDescription(`Volume set to **${volumeLevel}%**\n\n${volumeBar}`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in volume command:', error);
            await interaction.editReply(`❌ | Error: ${error.message}`);
        }
    },
};

/**
 * Creates a visual representation of the volume level
 * @param {number} volume - The volume level (0-250)
 * @returns {string} - A string representing the volume bar
 */
function createVolumeBar(volume) {
    // Normalize volume to a 0-20 scale for the bar
    const normalizedVolume = Math.round((volume / 250) * 20);

    // Create the filled part of the bar
    const filledBars = '█'.repeat(normalizedVolume);

    // Create the empty part of the bar
    const emptyBars = '░'.repeat(20 - normalizedVolume);

    // Determine the emoji based on volume level
    let emoji;
    if (volume === 0) {
        emoji = '🔇';
    } else if (volume < 50) {
        emoji = '🔈';
    } else if (volume < 150) {
        emoji = '🔉';
    } else {
        emoji = '🔊';
    }

    // Return the formatted volume bar
    return `${emoji} ${filledBars}${emptyBars} ${volume}%`;
}
