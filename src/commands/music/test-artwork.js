// File: src/commands/music/test-artwork.js
// Test command to verify Spotify artwork fetching

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const spotifyArtwork = require('../../utils/spotifyArtwork');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-artwork')
        .setDescription('Test Spotify artwork fetching')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Spotify URL to test')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const spotifyUrl = interaction.options.getString('url');
            
            const embed = new EmbedBuilder()
                .setTitle('🎨 Spotify Artwork Test')
                .setColor('#1DB954')
                .setTimestamp();

            // Test URL validation
            const parsed = spotifyArtwork.extractSpotifyId(spotifyUrl);
            if (!parsed) {
                embed.setDescription('❌ Invalid Spotify URL')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [embed] });
            }

            embed.addFields({
                name: 'URL Analysis',
                value: `**Type:** ${parsed.type}\n**ID:** ${parsed.id}`,
                inline: false
            });

            // Test artwork fetching
            try {
                console.log(`[Artwork Test] Fetching artwork for ${parsed.type}: ${parsed.id}`);
                const artworkUrl = await spotifyArtwork.getArtworkFromUrl(spotifyUrl);
                
                if (artworkUrl) {
                    embed.addFields({
                        name: 'Artwork Result',
                        value: '✅ High-quality artwork found!',
                        inline: false
                    });
                    embed.setThumbnail(artworkUrl);
                    embed.addFields({
                        name: 'Artwork URL',
                        value: `\`${artworkUrl}\``,
                        inline: false
                    });
                } else {
                    embed.addFields({
                        name: 'Artwork Result',
                        value: '❌ No artwork found',
                        inline: false
                    });
                }
            } catch (error) {
                console.error('[Artwork Test] Error:', error);
                embed.addFields({
                    name: 'Artwork Result',
                    value: `❌ Error: ${error.message}`,
                    inline: false
                });
            }

            // Test credentials
            const hasCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;
            embed.addFields({
                name: 'Credentials',
                value: hasCredentials ? '✅ Spotify API credentials available' : '❌ Missing credentials',
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in test-artwork command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Test Failed')
                .setDescription(`An error occurred: ${error.message}`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
