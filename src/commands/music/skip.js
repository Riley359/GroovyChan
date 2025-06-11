// File: src/commands/music/skip.js

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction, client) {
        const queue = client.player.nodes.get(interaction.guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ | No music is currently playing!', ephemeral: true });
        }

        if (interaction.member.voice.channelId !== queue.connection.joinConfig.channelId) {
            return interaction.reply({ content: '❌ | You need to be in the same voice channel as the bot to skip!', ephemeral: true });
        }
        
        const currentTrack = queue.currentTrack;
        const success = queue.node.skip();

        return interaction.reply({
            content: success ? `✅ | Skipped **${currentTrack?.title || 'the current song'}**!` : '❌ | Something went wrong while trying to skip!',
            ephemeral: !success // Make it ephemeral if skipping failed
        });
    },
};