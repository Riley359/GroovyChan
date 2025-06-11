// File: src/commands/music/queue.js

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.'),
    async execute(interaction, client) {
        const queue = client.player.nodes.get(interaction.guildId);

        if (!queue || !queue.tracks.size) { // Check queue.tracks.size instead of !queue.tracks
            return interaction.reply({ content: '❌ | The queue is currently empty!', ephemeral: true });
        }

        const tracks = queue.tracks.toArray(); // Get all tracks, including the current one if playing
        const currentTrack = queue.currentTrack;
        const tracksPerPage = 10;
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * tracksPerPage;
            const end = start + tracksPerPage;
            const currentTracksPage = tracks.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🎶 Music Queue 🎶')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            if (currentTrack) {
                embed.addFields({ name: '▶️ Now Playing', value: `[${currentTrack.title}](${currentTrack.url}) - \`${currentTrack.duration}\` | Requested by: ${currentTrack.requestedBy}` });
            } else if (page === 0 && tracks.length > 0) {
                 embed.addFields({ name: '▶️ Next Up', value: `[${tracks[0].title}](${tracks[0].url}) - \`${tracks[0].duration}\` | Requested by: ${tracks[0].requestedBy}` });
            }


            if (currentTracksPage.length > 0) {
                 const queueString = currentTracksPage.map((track, index) => {
                    return `**${start + index + 1}.** [${track.title}](${track.url}) - \`${track.duration}\` | Req: ${track.requestedBy}`;
                }).join('\n');
                embed.addFields({ name: '📜 Up Next', value: queueString || 'No more songs in queue.' });
            } else if (!currentTrack) {
                 embed.setDescription('The queue is empty.');
            }


            embed.setFooter({ text: `Page ${page + 1}/${Math.ceil(tracks.length / tracksPerPage)} | Total Songs: ${tracks.length}` });
            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= Math.ceil(tracks.length / tracksPerPage) - 1)
            );

        const message = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [row],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 1 minute
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
            }

            if (i.customId === 'prev_page') {
                currentPage--;
            } else if (i.customId === 'next_page') {
                currentPage++;
            }

            row.components[0].setDisabled(currentPage === 0); // Previous button
            row.components[1].setDisabled(currentPage >= Math.ceil(tracks.length / tracksPerPage) - 1); // Next button

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [row]
            });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    row.components[0].setDisabled(true),
                    row.components[1].setDisabled(true)
                );
            message.edit({ components: [disabledRow] }).catch(console.error);
        });
    },
};