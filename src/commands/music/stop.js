// File: src/commands/music/stop.js

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue.'),
    async execute(interaction, client) {
        const queue = client.player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ | No music is currently playing!', ephemeral: true });
        }
        
        if (interaction.member.voice.channelId !== queue.connection.joinConfig.channelId) {
            return interaction.reply({ content: '❌ | You need to be in the same voice channel as the bot to stop the music!', ephemeral: true });
        }

        queue.delete(); // Stops the player, clears the queue, and leaves the channel.

        return interaction.reply({ content: '✅ | Music stopped and queue cleared. The bot has left the voice channel.' });
    },
};