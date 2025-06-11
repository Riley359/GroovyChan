const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Function to format rank information
function formatRank(rankData) {
    if (!rankData || !rankData.currenttier) return 'Unranked';
    
    const tiers = [
        'Iron 1', 'Iron 2', 'Iron 3',
        'Bronze 1', 'Bronze 2', 'Bronze 3',
        'Silver 1', 'Silver 2', 'Silver 3',
        'Gold 1', 'Gold 2', 'Gold 3',
        'Platinum 1', 'Platinum 2', 'Platinum 3',
        'Diamond 1', 'Diamond 2', 'Diamond 3',
        'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
        'Immortal 1', 'Immortal 2', 'Immortal 3',
        'Radiant'
    ];
    
    const rankName = tiers[rankData.currenttier - 3] || 'Unranked';
    const rr = rankData.ranking_in_tier || 0;
    
    return `${rankName} (${rr} RR)`;
}

// Function to get rank icon URL
function getRankIcon(tier) {
    if (!tier || tier < 3) return 'https://media.valorant-api.com/competitivetiers/03621f52-342b-ca4e-4f00-27b97de6d9fd/0/smallicon.png';
    return `https://media.valorant-api.com/competitivetiers/03621f52-342b-ca4e-4f00-27b97de6d9fd/${tier}/largeicon.png`;
}

// Helper function to get peak rank
const getPeakRank = (mmrData) => {
    if (!mmrData) return 'Unranked';
    
    // Check for highest_rank_patched directly in mmrData
    if (mmrData.highest_rank_patched) {
        return mmrData.highest_rank_patched;
    }
    
    // Check for patched_tier in highest_rank object
    if (mmrData.highest_rank && mmrData.highest_rank.patched_tier) {
        return mmrData.highest_rank.patched_tier;
    }
    
    // If we have tier information, format it
    if (mmrData.highest_rank && mmrData.highest_rank.tier) {
        return formatRank({
            currenttier: mmrData.highest_rank.tier,
            ranking_in_tier: mmrData.highest_rank.ranking_in_tier || 0
        });
    }
    
    return 'Unranked';
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valorant')
        .setDescription('Get Valorant player statistics')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Player Riot ID (e.g., "playername#1234")')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const playerInput = interaction.options.getString('player');
        
        // Validate input format
        if (!playerInput.includes('#')) {
            return interaction.editReply('❌ Please provide a valid Riot ID in the format: `playername#tag`');
        }
        
        const [name, tag] = playerInput.split('#');
        
        if (!name || !tag) {
            return interaction.editReply('❌ Invalid format. Please use: `playername#tag`');
        }
        
        try {
            const apiKey = process.env.HENRIKDEV_API_KEY;
            if (!apiKey) {
                console.error('HenrikDev API key is not configured');
                return interaction.editReply('❌ The bot is not properly configured. Please contact the bot administrator.');
            }
            
            // Get account data
            const [accountResponse, mmrResponse] = await Promise.all([
                axios.get(`https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, {
                    headers: { 'Authorization': apiKey }
                }),
                axios.get(`https://api.henrikdev.xyz/valorant/v1/mmr/na/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`, {
                    headers: { 'Authorization': apiKey }
                }).catch(() => ({ data: { data: null } }))
            ]);
            
            const playerData = accountResponse.data.data;
            const mmrData = mmrResponse.data?.data || {};
            const currentSeason = mmrData.currenttierpatched ? mmrData : mmrData.current_data || {};
            const highestRank = mmrData.highest_rank || mmrData.highest_rank_patched || {};
            
            // Get lifetime stats and match history for headshot percentage
            const [lifetimeStats, matchHistory] = await Promise.all([
                axios.get(`https://api.henrikdev.xyz/valorant/v2/by-puuid/lifetime/matches/${playerData.region}/${playerData.puuid}`, {
                    headers: { 'Authorization': apiKey }
                }).catch(() => ({ data: { data: { stats: null } } })),
                axios.get(`https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/${playerData.region}/${playerData.puuid}?size=10`, {
                    headers: { 'Authorization': apiKey }
                }).catch(() => ({ data: { data: [] } }))
            ]);
            
            // Calculate headshot percentage from match history if available
            let headshotPct = 'N/A';
            let matchesPlayed = 'N/A';
            let winRate = 'N/A';
            
            // Try to get stats from match history
            if (matchHistory.data?.data && matchHistory.data.data.length > 0) {
                let totalShots = 0;
                let totalHeadshots = 0;
                let wins = 0;
                let validMatches = 0;
                
                matchHistory.data.data.forEach(match => {
                    if (match.players?.all_players) {
                        const player = match.players.all_players.find(p => p.puuid === playerData.puuid);
                        if (player && player.stats) {
                            totalShots += (player.stats.headshots + player.stats.bodyshots + player.stats.legshots) || 0;
                            totalHeadshots += player.stats.headshots || 0;
                            
                            // Only count matches where we can determine a winner
                            if (match.teams && match.teams.winner && player.team) {
                                validMatches++;
                                if (player.team.toLowerCase() === match.teams.winner.toLowerCase()) {
                                    wins++;
                                }
                            }
                        }
                    }
                });
                
                if (totalShots > 0) {
                    headshotPct = `${((totalHeadshots / totalShots) * 100).toFixed(1)}%`;
                }
                
                matchesPlayed = matchHistory.data.data.length.toString();
                
                // Only calculate win rate if we have valid matches
                if (validMatches > 0) {
                    winRate = `${((wins / validMatches) * 100).toFixed(1)}%`;
                }
            }
            
            // Fallback to lifetime stats if available
            const stats = lifetimeStats.data?.data || {};
            if (headshotPct === 'N/A' && stats.statistics?.shots) {
                const shots = stats.statistics.shots;
                const totalShots = shots.head + shots.body + shots.leg;
                if (totalShots > 0) {
                    headshotPct = `${((shots.head / totalShots) * 100).toFixed(1)}%`;
                }
            }
            
            if (matchesPlayed === 'N/A' && stats.matches) {
                matchesPlayed = stats.matches.toString();
            }
            
            if (winRate === 'N/A' && stats.matches > 0 && stats.wins !== undefined) {
                // Make sure wins is not null or undefined and convert to number if needed
                const wins = Number(stats.wins) || 0;
                const matches = Number(stats.matches) || 1; // Avoid division by zero
                winRate = `${((wins / matches) * 100).toFixed(1)}%`;
            }
            
            // Format rank information
            const currentRank = currentSeason.currenttierpatched || formatRank(currentSeason);
            const peakRank = getPeakRank(mmrData);
            const currentRR = currentSeason.ranking_in_tier || currentSeason.elo || 0;
            
            // Create vtl.lol link with proper encoding for usernames with spaces
            const vtlUsername = encodeURIComponent(playerData.name.replace(/ /g, '_'));
            const vtlLink = `[vtl.lol](https://vtl.lol/id/${vtlUsername}_${playerData.tag})`;
            
            const embed = new EmbedBuilder()
                .setColor('#ff4655')
                .setTitle(`Valorant Stats - ${playerData.name}#${playerData.tag}`)
                .setThumbnail(playerData.card?.large || playerData.card?.small || null)
                .addFields(
                    { name: 'Level', value: `\`${playerData.account_level || 'N/A'}\``, inline: true },
                    { name: 'Region', value: `\`${playerData.region?.toUpperCase() || 'N/A'}\``, inline: true },
                    { name: 'Last Updated', value: `\`${playerData.last_update || 'N/A'}\``, inline: true },
                    { name: 'Current Rank', value: `\`${currentRank}\``, inline: true },
                    { name: 'RR', value: `\`${currentRR}\``, inline: true },
                    { name: 'Peak Rank', value: `\`${peakRank}\``, inline: true },
                    { name: 'Headshot %', value: `\`${headshotPct}\``, inline: true },
                    { name: 'Matches Played', value: `\`${matchesPlayed}\``, inline: true },
                    { name: 'Win Rate', value: `\`${winRate}\``, inline: true },
                    { name: 'VTL Profile', value: vtlLink, inline: false }
                )
                .setFooter({ 
                    text: 'Powered by Rileyx', 
                    iconURL: 'https://henrikdev.xyz/favicon.ico' 
                })
                .setTimestamp();
                
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching Valorant stats:', error);
            
            if (error.response) {
                if (error.response.status === 404) {
                    return interaction.editReply('❌ Player not found. Please check the Riot ID and try again.');
                } else if (error.response.status === 429) {
                    return interaction.editReply('⚠️ Rate limit exceeded. Please try again later.');
                } else if (error.response.status === 401) {
                    console.error('Invalid or missing HenrikDev API key');
                    return interaction.editReply('❌ The bot is not properly configured. Please contact the bot administrator.');
                }
            }
            
            await interaction.editReply('❌ An error occurred while fetching player stats. Please try again later.');
        }
    },
};
