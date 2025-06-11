// File: src/commands/music/test-youtube.js
// Test command to verify YouTube extractor functionality

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-youtube')
        .setDescription('Test YouTube extractor functionality (admin only)')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube URL to test (optional)')
                .setRequired(false)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        // Check if user has admin permissions
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.editReply({ 
                content: '❌ | This command requires Administrator permissions!', 
                ephemeral: true 
            });
        }

        try {
            const testUrl = interaction.options.getString('url') || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll as default test
            
            console.log(`[Test-YouTube] Testing URL: ${testUrl}`);
            
            // Test the search functionality
            const searchResult = await client.player.search(testUrl, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH
            });

            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🧪 YouTube Extractor Test Results')
                .setTimestamp();

            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                embed.setColor(0xFF0000)
                    .setDescription('❌ **Test Failed**\nNo tracks found. YouTube extractor may not be working properly.')
                    .addFields(
                        { name: 'Test URL', value: testUrl, inline: false },
                        { name: 'Result', value: 'No tracks returned', inline: true },
                        { name: 'Recommendation', value: 'Check console logs for errors', inline: true }
                    );
            } else {
                const track = searchResult.tracks[0];
                embed.setColor(0x00FF00)
                    .setDescription('✅ **Test Successful**\nYouTube extractor is working properly!')
                    .addFields(
                        { name: 'Test URL', value: testUrl, inline: false },
                        { name: 'Track Found', value: track.title, inline: false },
                        { name: 'Duration', value: track.duration || 'Unknown', inline: true },
                        { name: 'Source', value: track.source || 'YouTube', inline: true },
                        { name: 'Tracks Returned', value: searchResult.tracks.length.toString(), inline: true }
                    )
                    .setThumbnail(track.thumbnail);

                if (searchResult.playlist) {
                    embed.addFields({ name: 'Playlist Detected', value: `Yes - ${searchResult.playlist.title}`, inline: false });
                }
            }

            // Test extractor information
            const extractors = client.player.extractors.store;
            const youtubeExtractors = [];
            
            for (const [name, extractor] of extractors) {
                if (name.toLowerCase().includes('youtube') || name.toLowerCase().includes('youtubei')) {
                    youtubeExtractors.push(name);
                }
            }

            embed.addFields(
                { name: 'YouTube Extractors Loaded', value: youtubeExtractors.length > 0 ? youtubeExtractors.join(', ') : 'None', inline: false },
                { name: 'Total Extractors', value: extractors.size.toString(), inline: true }
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('[Test-YouTube] Error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🧪 YouTube Extractor Test - Error')
                .setDescription('❌ **Test Failed with Error**')
                .addFields(
                    { name: 'Error Message', value: error.message, inline: false },
                    { name: 'Error Type', value: error.constructor.name, inline: true },
                    { name: 'Recommendation', value: 'Check console logs for full error details', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
