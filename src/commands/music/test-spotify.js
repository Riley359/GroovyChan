// File: src/commands/music/test-spotify.js
// Test command to verify Spotify extractor functionality

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-spotify')
        .setDescription('Test Spotify extractor functionality')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Spotify URL to test (optional)')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const embed = new EmbedBuilder()
                .setTitle('🎵 Spotify Extractor Test')
                .setColor('#1DB954') // Spotify green
                .setTimestamp();

            // Check if Spotify extractor is registered
            const spotifyExtractor = client.player.extractors.store.get('com.discord-player.spotifyextractor');

            if (!spotifyExtractor) {
                embed.setDescription('❌ Spotify extractor is not registered!')
                    .setColor('#FF0000');
                return await interaction.editReply({ embeds: [embed] });
            }

            embed.addFields({
                name: 'Extractor Status',
                value: '✅ Spotify extractor is registered',
                inline: false
            });

            // Check credentials
            const hasCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;
            embed.addFields({
                name: 'Credentials',
                value: hasCredentials ? '✅ Spotify credentials are set' : '❌ Spotify credentials missing',
                inline: false
            });

            // Test URL provided by user or use default
            const testUrl = interaction.options.getString('url') || 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';

            try {
                console.log('[Spotify Test] Testing URL:', testUrl);

                // Import QueryResolver and QueryType from discord-player
                const { QueryResolver, QueryType } = require('discord-player');

                // Test URL format using discord-player's regex patterns
                let urlType = 'Unknown';
                let isValidSpotifyUrl = false;

                if (QueryResolver.regex.spotifySongRegex.test(testUrl)) {
                    urlType = 'Spotify Track';
                    isValidSpotifyUrl = true;
                } else if (QueryResolver.regex.spotifyPlaylistRegex.test(testUrl)) {
                    urlType = 'Spotify Playlist';
                    isValidSpotifyUrl = true;
                } else if (QueryResolver.regex.spotifyAlbumRegex.test(testUrl)) {
                    urlType = 'Spotify Album';
                    isValidSpotifyUrl = true;
                }

                embed.addFields({
                    name: 'URL Validation',
                    value: isValidSpotifyUrl ? `✅ Valid ${urlType}` : '❌ Not a valid Spotify URL',
                    inline: false
                });

                if (isValidSpotifyUrl && hasCredentials) {
                    // Try to extract metadata using discord-player search
                    console.log('[Spotify Test] Attempting to search with discord-player...');

                    const searchResult = await client.player.search(testUrl, {
                        requestedBy: interaction.user
                    });

                    if (searchResult && searchResult.tracks && searchResult.tracks.length > 0) {
                        const track = searchResult.tracks[0];
                        embed.addFields({
                            name: 'Extraction Test',
                            value: `✅ Successfully extracted: **${track.title}** by **${track.author}**\nDuration: ${track.duration}`,
                            inline: false
                        });
                        embed.setThumbnail(track.thumbnail);

                        // Test if we can get a playable stream
                        try {
                            const streamResult = await spotifyExtractor.stream(track);
                            embed.addFields({
                                name: 'Stream Test',
                                value: streamResult ? '✅ Stream source found' : '⚠️ No stream source',
                                inline: false
                            });
                        } catch (streamError) {
                            embed.addFields({
                                name: 'Stream Test',
                                value: `⚠️ Stream error: ${streamError.message}`,
                                inline: false
                            });
                        }
                    } else {
                        embed.addFields({
                            name: 'Extraction Test',
                            value: '⚠️ Could not extract track data',
                            inline: false
                        });
                    }
                } else if (isValidSpotifyUrl && !hasCredentials) {
                    embed.addFields({
                        name: 'Extraction Test',
                        value: '⚠️ Cannot test extraction without Spotify credentials',
                        inline: false
                    });
                }

            } catch (error) {
                console.error('[Spotify Test] Error testing URL:', error);
                embed.addFields({
                    name: 'Test Error',
                    value: `❌ Error: ${error.message}`,
                    inline: false
                });
            }

            // Add test URL info
            embed.addFields({
                name: 'Test URL',
                value: `\`${testUrl}\``,
                inline: false
            });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[Test Spotify] Error:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Test Failed')
                .setDescription(`An error occurred: ${error.message}`)
                .setColor('#FF0000')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
