const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get lyrics for the currently playing song or search for a specific song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Search for lyrics of a specific song (optional)')
                .setRequired(false)
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);
            let searchQuery = interaction.options.getString('query');

            // If no query provided, use current playing song
            if (!searchQuery) {
                if (!queue || !queue.currentTrack) {
                    return interaction.editReply('❌ | No song is currently playing and no search query provided!');
                }
                searchQuery = `${queue.currentTrack.author} ${queue.currentTrack.title}`;
            }

            // Try to get lyrics using multiple methods
            let lyricsData = null;
            let searchAttempts = [];

            // Method 1: Try @discord-player/extractor first (most reliable)
            try {
                const { lyricsExtractor } = require('@discord-player/extractor');
                const lyricsClient = lyricsExtractor();
                const result = await lyricsClient.search(searchQuery);

                if (result && result.lyrics) {
                    lyricsData = {
                        title: result.title,
                        artist: result.artist?.name || 'Unknown Artist',
                        lyrics: result.lyrics,
                        url: result.url,
                        thumbnail: result.thumbnail || result.image
                    };
                    searchAttempts.push('✅ Discord Player Extractor');
                } else {
                    searchAttempts.push('❌ Discord Player Extractor (no results)');
                }
            } catch (error) {
                console.error('Extractor lyrics error:', error);
                searchAttempts.push('❌ Discord Player Extractor (error)');
            }

            // Method 2: Try genius-lyrics with multiple search patterns
            if (!lyricsData) {
                try {
                    const { Client: GeniusClient } = require('genius-lyrics');
                    const genius = new GeniusClient(); // Works without API key (scraping mode)

                    // Try different search patterns
                    const searchPatterns = [
                        searchQuery, // Original query
                        searchQuery.replace(/\s+/g, ' ').trim(), // Clean whitespace
                        searchQuery.toLowerCase(), // Lowercase
                        searchQuery.replace(/[^\w\s]/g, ''), // Remove special characters
                    ];

                    // If the query looks like "artist song", try "song artist" too
                    const words = searchQuery.split(' ');
                    if (words.length >= 2) {
                        searchPatterns.push(words.reverse().join(' '));
                    }

                    for (const pattern of searchPatterns) {
                        try {
                            const searches = await genius.songs.search(pattern);
                            if (searches && searches.length > 0) {
                                const song = searches[0];
                                const lyrics = await song.lyrics();

                                if (lyrics && lyrics.trim()) {
                                    lyricsData = {
                                        title: song.title,
                                        artist: song.artist.name,
                                        lyrics: lyrics,
                                        url: song.url,
                                        thumbnail: song.thumbnail
                                    };
                                    searchAttempts.push(`✅ Genius Lyrics (pattern: "${pattern}")`);
                                    break;
                                }
                            }
                        } catch (patternError) {
                            // Continue to next pattern
                            continue;
                        }
                    }

                    if (!lyricsData) {
                        searchAttempts.push('❌ Genius Lyrics (tried multiple patterns, no results)');
                    }
                } catch (error) {
                    console.error('Genius lyrics error:', error);
                    searchAttempts.push('❌ Genius Lyrics (error)');
                }
            }

            // Method 3: Try discord-player's built-in lyrics as last resort
            if (!lyricsData) {
                try {
                    if (client.player.lyrics) {
                        const result = await client.player.lyrics.search({
                            q: searchQuery
                        });

                        if (result && result.lyrics) {
                            lyricsData = {
                                title: result.title || searchQuery,
                                artist: result.artist || 'Unknown Artist',
                                lyrics: result.lyrics,
                                url: result.url,
                                thumbnail: result.thumbnail
                            };
                            searchAttempts.push('✅ Discord Player Built-in');
                        } else {
                            searchAttempts.push('❌ Discord Player Built-in (no results)');
                        }
                    } else {
                        searchAttempts.push('❌ Discord Player Built-in (not available)');
                    }
                } catch (error) {
                    console.error('Discord-player lyrics error:', error);
                    searchAttempts.push('❌ Discord Player Built-in (error)');
                }
            }

            if (!lyricsData || !lyricsData.lyrics) {
                // Create a detailed error message with debug info
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF6B6B) // Red color
                    .setTitle('❌ Lyrics Not Found')
                    .setDescription(`Could not find lyrics for **"${searchQuery}"**`)
                    .addFields({
                        name: '🔍 Search Attempts',
                        value: searchAttempts.join('\n') || 'No attempts made',
                        inline: false
                    })
                    .addFields({
                        name: '💡 Suggestions',
                        value: [
                            '• Try a different search format: `artist - song title`',
                            '• Use the exact song title without extra words',
                            '• Try searching for a more popular version of the song',
                            '• Some songs may not have lyrics available online'
                        ].join('\n'),
                        inline: false
                    })
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Clean and format lyrics
            let lyrics = lyricsData.lyrics;

            // Remove common metadata patterns from lyrics
            lyrics = lyrics
                .replace(/^\d+\s*Contributors.*$/gm, '') // Remove contributor lines
                .replace(/^Translations.*$/gm, '') // Remove translation lines
                .replace(/^[A-Za-z]+Embed$/gm, '') // Remove embed lines
                .replace(/^You might also like.*$/gm, '') // Remove "You might also like"
                .replace(/^See.*Live.*$/gm, '') // Remove "See X Live" lines
                .replace(/^Get tickets.*$/gm, '') // Remove ticket lines
                .replace(/^\d+K?$/gm, '') // Remove standalone numbers (like view counts)
                .replace(/^[A-Z][a-z]+\s*$/gm, '') // Remove standalone language names
                .replace(/^\s*\n/gm, '\n') // Remove empty lines with spaces
                .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
                .trim();

            // Find the actual start of lyrics (after metadata)
            const lines = lyrics.split('\n');
            let startIndex = 0;

            // Skip lines that look like metadata
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length === 0) continue;

                // Skip if line contains metadata indicators
                if (line.match(/^\d+\s*(Contributors?|Translations?)/i) ||
                    line.match(/^(Dansk|Español|Português|Français|Ελληνικά|Cymraeg|Italiano|Deutsch|Українська)/i) ||
                    line.match(/^[A-Z][a-z]+Embed$/i) ||
                    line.match(/^\d+K?$/)) {
                    startIndex = i + 1;
                    continue;
                }

                // If we find a line that looks like actual lyrics, stop skipping
                if (line.length > 10 && !line.match(/^[A-Z\s]+$/)) {
                    break;
                }
            }

            if (startIndex > 0 && startIndex < lines.length) {
                lyrics = lines.slice(startIndex).join('\n').trim();
            }

            // If lyrics are still empty after cleaning, show raw lyrics
            if (!lyrics || lyrics.length < 10) {
                lyrics = lyricsData.lyrics.trim();
            }

            const maxLength = 4000; // Discord embed description limit is 4096

            if (lyrics.length > maxLength) {
                lyrics = lyrics.substring(0, maxLength - 50) + '\n\n... [Lyrics truncated]';
            }

            // If lyrics are still too short or seem to be just metadata, show an error
            if (lyrics.length < 50 && lyrics.includes('Contributors')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFFA500) // Orange color for warning
                    .setTitle('⚠️ Lyrics Found But May Be Incomplete')
                    .setDescription(`Found lyrics for **"${lyricsData.title}"** by **${lyricsData.artist}**, but they appear to contain mostly metadata.`)
                    .addFields({
                        name: '🔗 View Full Lyrics',
                        value: lyricsData.url ? `[Click here to view on Genius](${lyricsData.url})` : 'No direct link available',
                        inline: false
                    })
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });

                if (lyricsData.thumbnail) {
                    errorEmbed.setThumbnail(lyricsData.thumbnail);
                }

                return interaction.editReply({ embeds: [errorEmbed] });
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(0xFF1493) // Deep pink color
                .setTitle(`🎵 ${lyricsData.title}`)
                .setDescription(lyrics)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                });

            if (lyricsData.artist) {
                embed.setAuthor({ name: lyricsData.artist });
            }

            if (lyricsData.thumbnail) {
                embed.setThumbnail(lyricsData.thumbnail);
            }

            if (lyricsData.url) {
                embed.addFields({
                    name: '🔗 Source',
                    value: `[View on Genius](${lyricsData.url})`,
                    inline: true
                });
            }

            // Add current track info if lyrics are for current song
            if (!interaction.options.getString('query') && queue && queue.currentTrack) {
                embed.addFields({
                    name: '🎧 Currently Playing',
                    value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in lyrics command:', error);
            await interaction.editReply(`❌ | Error fetching lyrics: ${error.message}`);
        }
    },
};
