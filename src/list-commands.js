// File: src/list-commands.js
// Script to list all currently deployed slash commands

require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('📋 Checking deployed commands...\n');

        // Check guild-specific commands (if GUILD_ID is set)
        if (process.env.GUILD_ID) {
            console.log(`🏠 Guild Commands (Guild ID: ${process.env.GUILD_ID}):`);
            console.log('================================================');
            try {
                const guildCommands = await rest.get(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
                );
                
                if (guildCommands.length === 0) {
                    console.log('   No guild commands deployed.');
                } else {
                    guildCommands.forEach((cmd, index) => {
                        console.log(`   ${index + 1}. /${cmd.name} - ${cmd.description}`);
                    });
                }
                console.log(`   Total: ${guildCommands.length} guild commands\n`);
            } catch (error) {
                console.log(`   Error fetching guild commands: ${error.message}\n`);
            }
        }

        // Check global commands
        console.log('🌍 Global Commands:');
        console.log('===================');
        try {
            const globalCommands = await rest.get(
                Routes.applicationCommands(process.env.CLIENT_ID)
            );
            
            if (globalCommands.length === 0) {
                console.log('   No global commands deployed.');
            } else {
                globalCommands.forEach((cmd, index) => {
                    console.log(`   ${index + 1}. /${cmd.name} - ${cmd.description}`);
                });
            }
            console.log(`   Total: ${globalCommands.length} global commands\n`);
        } catch (error) {
            console.log(`   Error fetching global commands: ${error.message}\n`);
        }

        console.log('💡 Notes:');
        console.log('- Guild commands update instantly (for testing)');
        console.log('- Global commands take up to 1 hour to propagate');
        console.log('- If you see duplicates, run "npm run clear-commands" then "npm run deploy"');

    } catch (error) {
        console.error('❌ Error listing commands:', error);
    }
})();
