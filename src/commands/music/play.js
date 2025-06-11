// File: src/commands/music/play.js
// Example "play" command.

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QueryType, QueryResolver } = require('discord-player');
const spotifyArtwork = require('../../utils/spotifyArtwork');
const { formatPlaylistDuration, formatTrackDuration } = require('../../utils/formatDuration');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song or adds it to the queue.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or YouTube playlist URL')
                .setRequired(true)),
    async execute(interaction, client) {
        await interaction.deferReply();

        const member = interaction.member;
        if (!member.voice.channel) {
            return interaction.editReply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        const query = interaction.options.getString('query');

        try {
            // Determine if the query is a URL and what type
            const isURL = query.match(/^https?:\/\//i);
            const isSoundCloud = query.includes('soundcloud.com');
            const isSpotify = query.includes('spotify.com');
            const isYouTube = query.includes('youtube.com') || query.includes('youtu.be');

            // Check if it's a YouTube playlist URL
            const isYouTubePlaylist = isYouTube && (query.includes('list=') || query.includes('playlist?'));

            // Set appropriate search engine based on URL type
            let searchEngine = QueryType.AUTO;
            if (isURL) {
                if (isSoundCloud) {
                    searchEngine = QueryType.SOUNDCLOUD_SEARCH;
                } else if (isSpotify) {
                    // Determine specific Spotify query type based on URL
                    if (QueryResolver.regex.spotifySongRegex.test(query)) {
                        searchEngine = QueryType.SPOTIFY_SONG;
                    } else if (QueryResolver.regex.spotifyAlbumRegex.test(query)) {
                        searchEngine = QueryType.SPOTIFY_ALBUM;
                    } else if (QueryResolver.regex.spotifyPlaylistRegex.test(query)) {
                        searchEngine = QueryType.SPOTIFY_PLAYLIST;
                    } else {
                        searchEngine = QueryType.SPOTIFY_SEARCH; // Fallback for search queries
                    }
                } else if (isYouTubePlaylist) {
                    searchEngine = QueryType.YOUTUBE_PLAYLIST;
                } else if (isYouTube) {
                    searchEngine = QueryType.YOUTUBE_SEARCH;
                }
            }

            // Log the search attempt
            console.log(`[Player] Searching for "${query}" using ${searchEngine} engine`);

            // Perform the search with error handling
            let searchResult;
            try {
                searchResult = await client.player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: searchEngine
                });
            } catch (searchError) {
                // Check if it's a YouTube parsing error but search still worked
                if (searchError.message && searchError.message.includes('CompositeVideoPrimaryInfo')) {
                    console.warn(`[Player] YouTube parsing warning (non-fatal): ${searchError.message}`);
                    // Try to continue - the search might have still worked
                    searchResult = searchError.result || null;
                } else {
                    throw searchError; // Re-throw if it's a different error
                }
            }

            console.log(`[Player] Search result: ${searchResult ? `Found ${searchResult.tracks?.length || 0} tracks` : 'No results'}`);

            // Debug: Log thumbnail information for Spotify tracks
            if (searchResult && searchResult.tracks && searchResult.tracks.length > 0 && isSpotify) {
                const track = searchResult.tracks[0];
                console.log(`[Player] Spotify track thumbnail data:`, {
                    thumbnail: track.thumbnail,
                    rawThumbnail: track.raw?.thumbnail,
                    rawImage: track.raw?.image,
                    source: track.source
                });
            }

            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                // Provide more specific error messages based on the source
                if (isSoundCloud) {
                    return interaction.editReply({
                        content: `❌ | No tracks found on SoundCloud for "${query}"! Make sure the SoundCloud extractor is properly loaded.`,
                        ephemeral: true
                    });
                } else if (isSpotify) {
                    // Check if Spotify extractor is registered
                    const spotifyExtractor = client.player.extractors.store.get('com.discord-player.spotifyextractor');
                    const hasCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;

                    let errorMsg = `❌ | No tracks found on Spotify for "${query}"!`;
                    if (!spotifyExtractor) {
                        errorMsg += ' The Spotify extractor is not loaded.';
                    } else if (!hasCredentials) {
                        errorMsg += ' Spotify API credentials are missing.';
                    } else {
                        errorMsg += ' The track might be unavailable or the URL might be invalid.';
                    }

                    return interaction.editReply({
                        content: errorMsg,
                        ephemeral: true
                    });
                } else if (isYouTube) {
                    const errorMsg = isYouTubePlaylist
                        ? `❌ | Could not load YouTube playlist "${query}"! Make sure the playlist is public and the URL is correct.`
                        : `❌ | No tracks found on YouTube for "${query}"! Make sure the YouTube extractor is properly loaded.`;
                    return interaction.editReply({
                        content: errorMsg,
                        ephemeral: true
                    });
                } else {
                    return interaction.editReply({
                        content: `❌ | No tracks found for "${query}"! Try a different search term or URL. Use /diagnose to check player status.`,
                        ephemeral: true
                    });
                }
            }

            // Get the queue for the guild with optimized settings
            const queue = client.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: true,
                volume: 80, // Optimal volume level
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 60000, // 1 minute (reduced from 5)
                leaveOnEnd: true,
                leaveOnEndCooldown: 60000, // 1 minute (reduced from 5)
                // Enhanced performance optimizations
                bufferingTimeout: 2000, // 2 second buffer (reduced for faster response)
                connectionTimeout: 15000, // 15 second connection timeout (reduced)
                disableVolume: false, // Keep volume control
                // Memory optimizations
                maxSize: 500, // Limit queue to 500 tracks
                maxHistorySize: 10, // Keep only 10 tracks in history
                // Audio optimizations
                noEmitAddTrackOnRepeat: true, // Reduce event emissions
                pauseOnEmpty: false, // Don't pause when queue is empty
                // Connection optimizations
                ytdlOptions: {
                    highWaterMark: 1 << 23, // 8MB buffer for individual tracks
                    quality: 'highestaudio'
                }
            });

            // Try to connect to the voice channel
            if (!queue.connection) {
                try {
                    await queue.connect(member.voice.channel);
                } catch (e) {
                    console.error("Failed to connect to voice channel:", e);
                    client.player.nodes.delete(interaction.guildId);
                    return interaction.editReply({ content: '❌ | Could not join your voice channel!', ephemeral: true });
                }
            }

            // Add track(s) to the queue
            if (searchResult.playlist) {
                queue.addTrack(searchResult.tracks);
                if (!queue.isPlaying()) await queue.node.play();

                // Create a rich embed for playlist
                const trackCount = searchResult.tracks.length;
                const playlistEmbed = new EmbedBuilder()
                    .setColor(0x9146FF) // Purple for playlists
                    .setTitle(`✅ Playlist Added - ${trackCount} Track${trackCount !== 1 ? 's' : ''}`)
                    .setDescription(`**${searchResult.playlist.title}**\n🎵 Successfully loaded **${trackCount}** track${trackCount !== 1 ? 's' : ''} to the queue!`)
                    .addFields(
                        { name: '📊 Tracks Loaded', value: `${trackCount}`, inline: true },
                        { name: '🎬 Source', value: searchResult.playlist.source || 'YouTube', inline: true },
                        { name: '⏱️ Total Duration', value: formatPlaylistDuration(searchResult.playlist.estimatedDuration) || 'Unknown', inline: true }
                    )
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();

                // Enhanced thumbnail handling for playlists
                let playlistThumbnail = null;
                if (searchResult.playlist.thumbnail) {
                    playlistThumbnail = searchResult.playlist.thumbnail;
                } else if (searchResult.tracks[0]?.thumbnail) {
                    playlistThumbnail = searchResult.tracks[0].thumbnail;
                } else if (searchResult.tracks[0]?.raw?.thumbnail) {
                    playlistThumbnail = searchResult.tracks[0].raw.thumbnail;
                }

                if (playlistThumbnail) {
                    playlistEmbed.setThumbnail(playlistThumbnail);
                }

                await interaction.editReply({ embeds: [playlistEmbed] });
            } else {
                const track = searchResult.tracks[0];

                // Preserve original Spotify artwork before adding to queue
                if (isSpotify) {
                    // Try to get high-quality artwork from Spotify API
                    try {
                        const highQualityArtwork = await spotifyArtwork.getArtworkFromUrl(query);
                        if (highQualityArtwork) {
                            track.originalArtwork = highQualityArtwork;
                            track.originalSource = 'spotify-api';
                            console.log(`[Player] Fetched high-quality Spotify artwork: ${track.originalArtwork}`);
                        } else if (track.thumbnail && !track.thumbnail.includes('twitter_card-default')) {
                            track.originalArtwork = track.thumbnail;
                            track.originalSource = 'spotify';
                            console.log(`[Player] Preserved Spotify artwork: ${track.originalArtwork}`);
                        }
                    } catch (error) {
                        console.warn(`[Player] Failed to fetch Spotify artwork: ${error.message}`);
                        if (track.thumbnail && !track.thumbnail.includes('twitter_card-default')) {
                            track.originalArtwork = track.thumbnail;
                            track.originalSource = 'spotify';
                        }
                    }
                }

                queue.addTrack(track);
                if (!queue.isPlaying()) await queue.node.play();

                // Enhanced embed with better artwork and information
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Track Added to Queue')
                    .setDescription(`**[${track.title}](${track.url})**`)
                    .addFields(
                        { name: '🎤 Artist', value: track.author || 'Unknown Artist', inline: true },
                        { name: '⏱️ Duration', value: formatTrackDuration(track.duration) || 'Unknown', inline: true },
                        { name: '🎬 Source', value: track.source || 'Unknown', inline: true }
                    )
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();

                // Enhanced thumbnail handling - prioritize original source artwork
                let thumbnailUrl = null;

                // Priority 1: Use preserved original artwork
                if (track.originalArtwork) {
                    thumbnailUrl = track.originalArtwork;
                }
                // Priority 2: Non-YouTube thumbnails (higher quality)
                else if (track.thumbnail && !track.thumbnail.includes('i.ytimg.com')) {
                    thumbnailUrl = track.thumbnail;
                }
                // Priority 3: Raw thumbnails that aren't YouTube
                else if (track.raw && track.raw.thumbnail && !track.raw.thumbnail.includes('i.ytimg.com')) {
                    thumbnailUrl = track.raw.thumbnail;
                }
                // Priority 4: Any thumbnail as fallback
                else if (track.thumbnail) {
                    thumbnailUrl = track.thumbnail;
                }

                if (thumbnailUrl) {
                    embed.setThumbnail(thumbnailUrl);
                    console.log(`[Player] Using thumbnail: ${thumbnailUrl}`);
                }

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in play command:', error);

            // More detailed error messages based on the error type
            let errorMessage = '❌ | An error occurred while trying to play the song.';

            if (error.message && error.message.includes('Could not extract stream')) {
                errorMessage = '❌ | Could not extract audio stream. This track might be unavailable or restricted.';
            } else if (error.message && error.message.includes('No supported transcodings found')) {
                errorMessage = '❌ | This track format is not supported. Try a different track.';
            } else if (error.message && error.message.includes('Sign in to confirm your age')) {
                errorMessage = '❌ | Age-restricted content. Cannot play this track.';
            } else if (error.message && error.message.includes('no audio tracks found')) {
                errorMessage = '❌ | No audio tracks found in this content. Try a different URL or search term.';
            }

            await interaction.editReply({
                content: `${errorMessage}\nUse /diagnose to check player status.`,
                ephemeral: true
            });
        }
    },
};
