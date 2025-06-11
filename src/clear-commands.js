// File: src/clear-commands.js
// Script to clear all slash commands (both guild and global)

require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('🧹 Starting command cleanup...');

        // Clear guild-specific commands (if GUILD_ID is set)
        if (process.env.GUILD_ID) {
            console.log(`🗑️ Clearing guild commands for guild: ${process.env.GUILD_ID}`);
            const guildData = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: [] }
            );
            console.log(`✅ Cleared ${guildData.length} guild commands.`);
        }

        // Clear global commands
        console.log('🗑️ Clearing global commands...');
        const globalData = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        console.log(`✅ Cleared ${globalData.length} global commands.`);

        console.log('🎉 All commands cleared! Now run "npm run deploy" to redeploy.');

    } catch (error) {
        console.error('❌ Error clearing commands:', error);
    }
})();
