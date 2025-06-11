// File: src/events/interactionCreate.js
// This event triggers when an interaction (like a slash command) is received.

const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) { // Pass client here
        if (!interaction.isChatInputCommand()) return; // Only handle slash commands

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            try {
                await interaction.reply({ content: `Error: Command "${interaction.commandName}" not found.`, ephemeral: true });
            } catch (e) {
                console.error("Error replying to unknown command interaction:", e);
            }
            return;
        }

        try {
            await command.execute(interaction, client); // Pass client to command's execute function
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                try {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } catch (e) {
                     console.error("Error sending followUp after command execution error:", e);
                }
            } else {
                try {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                } catch (e) {
                    console.error("Error sending reply after command execution error:", e);
                }
            }
        }
    },
};