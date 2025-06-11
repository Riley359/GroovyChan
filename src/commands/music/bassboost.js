const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { AudioFilters } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bassboost')
        .setDescription('Apply bass boost effect to the music')
        .addStringOption(option =>
            option.setName('level')
                .setDescription('Bass boost level')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Low', value: 'low' },
                    { name: 'Medium', value: 'medium' },
                    { name: 'High', value: 'high' },
                    { name: 'Insane', value: 'insane' }
                )
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Check if the player exists and is playing
            const queue = client.player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return interaction.editReply('❌ | Nothing is currently playing!');
            }

            // Get the bass boost level from the command options
            const level = interaction.options.getString('level');

            // Define the bass boost filters for different levels
            const filters = {
                off: { bassboost_low: false, bassboost: false, bassboost_high: false, earrape: false },
                low: { bassboost_low: true, bassboost: false, bassboost_high: false, earrape: false },
                medium: { bassboost_low: false, bassboost: true, bassboost_high: false, earrape: false },
                high: { bassboost_low: false, bassboost: false, bassboost_high: true, earrape: false },
                insane: { bassboost_low: false, bassboost: false, bassboost_high: false, earrape: true }
            };

            // Store the current track and its position
            const currentTrack = queue.currentTrack;
            const currentPosition = queue.node.getTimestamp();

            // Apply the selected filter
            await queue.filters.ffmpeg.setFilters(filters[level]);

            // Create an embed to display the bass boost change
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🔊 Bass Boost')
                .setDescription(`Bass boost level set to **${level.charAt(0).toUpperCase() + level.slice(1)}**`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            // Add a warning for insane level
            if (level === 'insane') {
                embed.addFields({
                    name: '⚠️ Warning',
                    value: 'Insane bass boost level may cause audio distortion and could be harmful at high volumes!'
                });
            }

            // Add a visual representation of the bass boost level
            embed.addFields({
                name: 'Level',
                value: createBassBoostBar(level)
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in bassboost command:', error);
            await interaction.editReply(`❌ | Error: ${error.message}`);
        }
    },
};

/**
 * Creates a visual representation of the bass boost level
 * @param {string} level - The bass boost level
 * @returns {string} - A string representing the bass boost level
 */
function createBassBoostBar(level) {
    const levels = ['off', 'low', 'medium', 'high', 'insane'];
    const index = levels.indexOf(level);

    let bar = '';

    for (let i = 0; i < levels.length; i++) {
        if (i === index) {
            bar += '🔵 '; // Current level
        } else if (i < index) {
            bar += '🟣 '; // Levels below current
        } else {
            bar += '⚪ '; // Levels above current
        }
    }

    return bar;
}
