const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnose')
        .setDescription('Diagnoses music player issues'),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            // Check if player is initialized
            if (!client.player) {
                return interaction.editReply('❌ | Music player is not initialized!');
            }

            // Get information about extractors without using getAll()
            let extractorInfo = "Unknown";
            try {
                // Safely check for extractors without calling any methods
                if (client.player.extractors) {
                    // Don't use getAll() method which might not exist in this version
                    const extractorCount = client.player.extractors.size || 0;
                    extractorInfo = `Extractors API available (${extractorCount} registered)`;
                } else if (client.player.extractor) {
                    extractorInfo = client.player.extractor.name || "Default extractor";
                } else {
                    extractorInfo = "Built-in extractors";
                }
            } catch (err) {
                console.error("Error getting extractor info:", err);
                extractorInfo = "Error getting extractor info";
            }

            // Test a simple YouTube search and direct URL
            let ytSearchResult;
            let ytError = null;
            let ytDirectResult;
            let ytDirectError = null;

            try {
                console.log('[Diagnose] Attempting YouTube search...');
                ytSearchResult = await client.player.search('never gonna give you up', {
                    requestedBy: interaction.user
                });
                console.log('[Diagnose] Search result:',
                    ytSearchResult ?
                    `Found ${ytSearchResult.tracks?.length || 0} tracks` :
                    'No results');
            } catch (error) {
                console.error('[Diagnose] Search error:', error);
                ytError = error.stack || error.message || 'Unknown error';
            }

            // Also try with a direct YouTube URL
            try {
                console.log('[Diagnose] Attempting direct YouTube URL...');
                ytDirectResult = await client.player.search('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
                    requestedBy: interaction.user
                });
                console.log('[Diagnose] Direct URL result:',
                    ytDirectResult ?
                    `Found ${ytDirectResult.tracks?.length || 0} tracks` :
                    'No results');
            } catch (error) {
                console.error('[Diagnose] Direct URL error:', error);
                ytDirectError = error.stack || error.message || 'Unknown error';
            }

            // Create diagnostic embed
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🔍 Music Player Diagnostics')
                .addFields(
                    { name: 'Player Version', value: client.player.version || 'Unknown', inline: true },
                    { name: 'Discord.js Version', value: require('discord.js').version || 'Unknown', inline: true },
                    { name: 'Extractors', value: extractorInfo, inline: false },
                    {
                        name: 'YouTube Search Test',
                        value: ytSearchResult?.tracks?.length > 0
                            ? '✅ Working'
                            : `❌ Failed${ytError ? `\nError: ${ytError}` : ''}`,
                        inline: false
                    },
                    {
                        name: 'YouTube Direct URL Test',
                        value: ytDirectResult?.tracks?.length > 0
                            ? '✅ Working'
                            : `❌ Failed${ytDirectError ? `\nError: ${ytDirectError}` : ''}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'If search is failing, check your index.js file and dependencies' });

            // Add environment variables status (without revealing secrets)
            const envVars = [
                { name: 'YOUTUBE_COOKIE', value: process.env.YOUTUBE_COOKIE ? '✅ Set' : '❌ Not set' },
                { name: 'SPOTIFY_CLIENT_ID', value: process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Not set' },
                { name: 'SPOTIFY_CLIENT_SECRET', value: process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Not set' }
            ];

            embed.addFields({ name: 'Environment Variables', value: envVars.map(v => `${v.name}: ${v.value}`).join('\n'), inline: false });

            // Check if Spotify extractor is registered
            const spotifyExtractor = client.player.extractors.store.get('com.discord-player.spotifyextractor');
            const spotifyStatus = spotifyExtractor ? '✅ Registered' : '❌ Not registered';
            embed.addFields({ name: 'Spotify Extractor', value: spotifyStatus, inline: true });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in diagnose command:', error);
            await interaction.editReply(`❌ | Diagnostic error: ${error.message}`);
        }
    },
};


