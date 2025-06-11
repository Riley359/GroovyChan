// File: src/commands/music/playlist.js
// Dedicated playlist command for adding YouTube playlists

const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Adds a YouTube playlist to the queue.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube playlist URL')
                .setRequired(true)),
    async execute(interaction, client) {
        await interaction.deferReply();

        const member = interaction.member;
        if (!member.voice.channel) {
            return interaction.editReply({ content: 'You need to be in a voice channel to add playlists!', ephemeral: true });
        }

        const playlistUrl = interaction.options.getString('url');

        // Validate that it's a YouTube playlist URL
        if (!playlistUrl.includes('youtube.com') && !playlistUrl.includes('youtu.be')) {
            return interaction.editReply({
                content: '❌ | Please provide a valid YouTube playlist URL!',
                ephemeral: true
            });
        }

        if (!playlistUrl.includes('list=') && !playlistUrl.includes('playlist?')) {
            return interaction.editReply({
                content: '❌ | This doesn\'t appear to be a playlist URL. Make sure it contains "list=" parameter!',
                ephemeral: true
            });
        }

        try {
            // Log the search attempt
            console.log(`[Playlist] Loading playlist: "${playlistUrl}"`);

            // Search for the playlist using YOUTUBE_PLAYLIST query type
            let searchResult;
            try {
                searchResult = await client.player.search(playlistUrl, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.YOUTUBE_PLAYLIST
                });
            } catch (searchError) {
                // Check if it's a YouTube parsing error but playlist still loaded
                if (searchError.message && searchError.message.includes('CompositeVideoPrimaryInfo')) {
                    console.warn(`[Playlist] YouTube parsing warning (non-fatal): ${searchError.message}`);
                    // Try to continue - the search might have still worked
                    searchResult = searchError.result || null;
                } else {
                    throw searchError; // Re-throw if it's a different error
                }
            }

            console.log(`[Playlist] Search result: ${searchResult ? `Found ${searchResult.tracks?.length || 0} tracks` : 'No results'}`);

            if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
                return interaction.editReply({
                    content: `❌ | Could not load the playlist! Make sure the playlist is public and the URL is correct.\nUse /diagnose to check player status.`,
                    ephemeral: true
                });
            }

            if (!searchResult.playlist) {
                return interaction.editReply({
                    content: `❌ | This URL doesn't appear to be a valid playlist. Try using the /play command for individual videos.`,
                    ephemeral: true
                });
            }

            // Get the queue for the guild with standard settings
            const queue = client.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000, // 5 minutes
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000, // 5 minutes
                bufferingTimeout: 3000,
                connectionTimeout: 20000,
                disableVolume: false
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

            // Add all tracks from the playlist to the queue
            console.log(`[Playlist] Adding ${searchResult.tracks.length} tracks to queue`);
            queue.addTrack(searchResult.tracks);

            console.log(`[Playlist] Starting playback if not already playing`);
            if (!queue.isPlaying()) {
                await queue.node.play();
            }

            console.log(`[Playlist] Creating embed response`);
            // Create a rich embed for the playlist
            const trackCount = searchResult.tracks.length;
            const playlistEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`✅ Playlist Added - ${trackCount} Track${trackCount !== 1 ? 's' : ''}`)
                .setDescription(`**${searchResult.playlist.title}**\n🎵 Successfully loaded **${trackCount}** track${trackCount !== 1 ? 's' : ''} to the queue!`)
                .addFields(
                    { name: '📊 Tracks Loaded', value: `${trackCount}`, inline: true },
                    { name: '🎬 Source', value: 'YouTube', inline: true },
                    { name: '⏱️ Total Duration', value: String(searchResult.playlist.estimatedDuration || 'Unknown'), inline: true }
                )
                .setThumbnail(searchResult.playlist.thumbnail || searchResult.tracks[0]?.thumbnail)
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();

            // Add URL field if available
            if (searchResult.playlist.url) {
                playlistEmbed.addFields({ name: 'Playlist URL', value: `[View on YouTube](${searchResult.playlist.url})`, inline: false });
            }

            console.log(`[Playlist] Sending embed response`);
            await interaction.editReply({ embeds: [playlistEmbed] });
            console.log(`[Playlist] Command completed successfully`);

        } catch (error) {
            console.error('Error in playlist command:', error);
            console.error('Full error stack:', error.stack);

            let errorMessage = '❌ | An error occurred while trying to load the playlist.';

            if (error.message && error.message.includes('private')) {
                errorMessage = '❌ | This playlist is private or unavailable. Make sure the playlist is public.';
            } else if (error.message && error.message.includes('not found')) {
                errorMessage = '❌ | Playlist not found. Check the URL and try again.';
            } else if (error.message && error.message.includes('Sign in to confirm your age')) {
                errorMessage = '❌ | Age-restricted playlist. Cannot load this playlist.';
            } else {
                // Add more specific error details for debugging
                errorMessage = `❌ | Error: ${error.message}`;
            }

            // Only send error if interaction hasn't been replied to yet
            try {
                await interaction.editReply({
                    content: `${errorMessage}\nUse /diagnose to check player status.`,
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    },
};
