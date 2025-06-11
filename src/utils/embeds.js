// File: src/utils/embeds.js (Optional utility for creating consistent embeds)

const { EmbedBuilder } = require('discord.js');

function createBasicEmbed(title, description = '', color = 0x0099FF) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(0xFF0000) // Red for errors
        .setTitle('❌ Error')
        .setDescription(message)
        .setTimestamp();
}

module.exports = {
    createBasicEmbed,
    createErrorEmbed,
};