// File: src/events/ready.js
// This event triggers when the bot successfully logs in and is ready.

const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('Music | /play', { type: ActivityType.Listening });

        // Optional: You can also run deploy-commands.js logic here if you prefer
        // instead of running it as a separate script.
        // Be mindful of rate limits if you do it on every startup for many guilds.
        // For development, running `npm run deploy` manually is often better.
        console.log("Bot is ready and activity set.");
    },
};