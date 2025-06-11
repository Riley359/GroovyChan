// File: src/deploy-commands.js
// This script registers your slash commands with Discord.
// Run this script once when you add/update commands, or integrate it into your bot's ready event.

require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10'); // v10 for latest API
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');

function loadCommandFiles(directory) {
    const commandFiles = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of commandFiles) {
        const filePath = path.join(directory, file.name);
        if (file.isDirectory()) {
            loadCommandFiles(filePath); // Recursively load from subdirectories
        } else if (file.name.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

loadCommandFiles(commandsPath);

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        // For global commands, use Routes.applicationCommands(CLIENT_ID)
        // For guild-specific commands (faster updates for testing), use Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
        const data = await rest.put(
            process.env.GUILD_ID
                ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();