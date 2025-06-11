const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the currently paused track'),
    async execute(interaction, client) {
        await interaction.deferReply();
        
        try {
            // Check if the player exists and is playing
            const queue = client.player.nodes.get(interaction.guildId);
            
            if (!queue) {
                return interaction.editReply('❌ | Nothing is in the queue!');
            }
            
            if (!queue.node.isPaused()) {
                return interaction.editReply('❌ | The music is already playing!');
            }
            
            // Resume the player
            queue.node.resume();
            
            // Create an embed to display the resume action
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71) // Green for resume
                .setTitle('▶️ Resumed')
                .setDescription(`Resumed playing **${queue.currentTrack.title}**`)
                .setThumbnail(queue.currentTrack.thumbnail)
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in resume command:', error);
            await interaction.editReply(`❌ | Error: ${error.message}`);
        }
    },
};
