const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filters')
        .setDescription('Manage audio filters and effects')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Show all available filters and their current status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all active filters')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nightcore')
                .setDescription('Toggle nightcore effect (faster tempo and higher pitch)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable nightcore')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('vaporwave')
                .setDescription('Toggle vaporwave effect (slower tempo and lower pitch)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable vaporwave')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('karaoke')
                .setDescription('Toggle karaoke mode (removes vocals)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable karaoke mode')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tremolo')
                .setDescription('Toggle tremolo effect (volume oscillation)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable tremolo')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('vibrato')
                .setDescription('Toggle vibrato effect (pitch oscillation)')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable vibrato')
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        await interaction.deferReply();

        try {
            const queue = client.player.nodes.get(interaction.guildId);

            if (!queue || !queue.isPlaying()) {
                return interaction.editReply('❌ | Nothing is currently playing!');
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'list') {
                // Show all available filters and their status
                const enabledFilters = queue.filters.ffmpeg.getFiltersEnabled();
                const disabledFilters = queue.filters.ffmpeg.getFiltersDisabled();

                const embed = new EmbedBuilder()
                    .setColor(0x00CED1) // Dark turquoise
                    .setTitle('🎛️ Audio Filters Status')
                    .setDescription('Current status of all available audio filters')
                    .setFooter({ 
                        text: `Requested by ${interaction.user.tag}`, 
                        iconURL: interaction.user.displayAvatarURL() 
                    });

                // Group filters by category
                const filterCategories = {
                    'Bass & Treble': ['bassboost_low', 'bassboost', 'bassboost_high', 'subboost', 'treble'],
                    'Spatial Effects': ['8D', 'surrounding', 'pulsator', 'haas'],
                    'Tempo & Pitch': ['nightcore', 'vaporwave'],
                    'Vocal Effects': ['karaoke', 'tremolo', 'vibrato'],
                    'Atmosphere': ['lofi', 'chorus', 'chorus2d', 'chorus3d', 'phaser', 'flanger'],
                    'Audio Processing': ['normalizer', 'normalizer2', 'compressor', 'expander', 'softlimiter', 'gate'],
                    'Special Effects': ['reverse', 'earrape', 'dim', 'fadein', 'mono', 'mstlr', 'mstrr', 'mcompand', 'silenceremove']
                };

                for (const [category, filters] of Object.entries(filterCategories)) {
                    const categoryStatus = filters.map(filter => {
                        const isEnabled = enabledFilters.includes(filter);
                        const emoji = isEnabled ? '🟢' : '🔴';
                        return `${emoji} ${filter}`;
                    }).join('\n');

                    if (categoryStatus) {
                        embed.addFields({
                            name: category,
                            value: categoryStatus,
                            inline: true
                        });
                    }
                }

                // Add summary
                embed.addFields({
                    name: '📊 Summary',
                    value: `**Active:** ${enabledFilters.length} filters\n**Available:** ${enabledFilters.length + disabledFilters.length} total filters`,
                    inline: false
                });

                return interaction.editReply({ embeds: [embed] });
            }

            if (subcommand === 'clear') {
                // Clear all filters
                await queue.filters.ffmpeg.setFilters({});
                
                const embed = new EmbedBuilder()
                    .setColor(0xFF6347) // Tomato color
                    .setTitle('🧹 Filters Cleared')
                    .setDescription('All audio filters have been disabled')
                    .setFooter({ 
                        text: `Requested by ${interaction.user.tag}`, 
                        iconURL: interaction.user.displayAvatarURL() 
                    });

                return interaction.editReply({ embeds: [embed] });
            }

            // Handle individual filter toggles
            const enabled = interaction.options.getBoolean('enabled');
            const filterMap = {
                'nightcore': { filter: 'nightcore', emoji: '⚡', description: 'Faster tempo and higher pitch for an energetic sound' },
                'vaporwave': { filter: 'vaporwave', emoji: '🌊', description: 'Slower tempo and lower pitch for a dreamy, retro vibe' },
                'karaoke': { filter: 'karaoke', emoji: '🎤', description: 'Removes vocals for karaoke-style playback' },
                'tremolo': { filter: 'tremolo', emoji: '📳', description: 'Volume oscillation creating a trembling effect' },
                'vibrato': { filter: 'vibrato', emoji: '🎵', description: 'Pitch oscillation creating a warbling effect' }
            };

            const filterInfo = filterMap[subcommand];
            if (!filterInfo) {
                return interaction.editReply('❌ | Unknown filter command!');
            }

            // Apply the filter
            await queue.filters.ffmpeg.setFilters({
                [filterInfo.filter]: enabled
            });

            const embed = new EmbedBuilder()
                .setColor(enabled ? 0x32CD32 : 0xFF6347) // Green if enabled, red if disabled
                .setTitle(`${filterInfo.emoji} ${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)} Filter`)
                .setDescription(`${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)} filter has been **${enabled ? 'enabled' : 'disabled'}**`)
                .setFooter({ 
                    text: `Requested by ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            if (enabled) {
                embed.addFields({
                    name: '🎧 Effect',
                    value: filterInfo.description,
                    inline: false
                });
            }

            // Add current track info
            if (queue.currentTrack) {
                embed.addFields({
                    name: '🎵 Current Track',
                    value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in filters command:', error);
            await interaction.editReply(`❌ | Error managing filters: ${error.message}`);
        }
    },
};
