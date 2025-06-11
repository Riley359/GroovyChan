const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the currently playing track'),
    async execute(interaction, client) {
        await interaction.deferReply();
        
        try {
            // Check if the player exists and is playing
            const queue = client.player.nodes.get(interaction.guildId);
            
            if (!queue || !queue.node.isPlaying()) {
                return interaction.editReply('❌ | Nothing is currently playing!');
            }
            
            // Toggle the paused state
            const isPaused = queue.node.isPaused();
            
            if (isPaused) {
                queue.node.resume();
            } else {
                queue.node.pause();
            }
            
            // Create an embed to display the pause/resume action
            const embed = new EmbedBuilder()
                .setColor(isPaused ? 0x2ECC71 : 0xE74C3C) // Green for resume, red for pause
                .setTitle(isPaused ? '▶️ Resumed' : '⏸️ Paused')
                .setDescription(isPaused 
                    ? `Resumed playing **${queue.currentTrack.title}**` 
                    : `Paused **${queue.currentTrack.title}**`)
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in pause command:', error);
            await interaction.editReply(`❌ | Error: ${error.message}`);
        }
    },
};
