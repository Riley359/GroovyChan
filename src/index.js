// File: src/index.js
// Main entry point for the bot

require('dotenv').config(); // Loads environment variables from .env file
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { Player } = require('discord-player');

// Create a new Client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        // GatewayIntentBits.GuildMessages, // Add if you need to read messages
        // GatewayIntentBits.MessageContent, // Add if you need message content
    ],
});

// Import play-dl for better YouTube support
require('play-dl');

// Import YoutubeiExtractor from discord-player-youtubei
const { YoutubeiExtractor } = require('discord-player-youtubei');

// Import performance monitor
const PerformanceMonitor = require('./utils/performanceMonitor');
const performanceMonitor = new PerformanceMonitor();

// Initialize discord-player with optimized settings
client.player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio', // Always get best quality
        highWaterMark: 1 << 24, // 16MB buffer (reduced from 32MB for better memory usage)
        requestOptions: {
            headers: {
                cookie: process.env.YOUTUBE_COOKIE || ''
            }
        }
    },
    connectionTimeout: 20000, // Reduced to 20 seconds for faster failures
    skipFFmpeg: false, // Keep FFmpeg for filters
    // Enhanced performance optimizations
    lagMonitor: 5000, // Monitor lag every 5 seconds (less frequent for better performance)
    useLegacyFFmpeg: false, // Use modern FFmpeg features
    // Memory optimizations
    maxHistorySize: 25, // Limit history to 25 tracks (default is 100)
    maxQueueSize: 1000, // Limit queue size to prevent memory issues
    // Audio quality optimizations
    audioQuality: 'high', // Use high quality instead of highest for better performance
    // Connection optimizations
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 60000, // 1 minute instead of 5
    leaveOnEnd: true,
    leaveOnEndCooldown: 60000 // 1 minute instead of 5
});

// Main async function to setup and start the bot
async function main() {

    // Load extractors with improved error handling
    console.log('[Player Extractors] Loading extractors...');

    try {
        // Register the stable YoutubeiExtractor from discord-player-youtubei ONLY
        try {
            await client.player.extractors.register(YoutubeiExtractor, {
                // Configuration for better stability
                streamOptions: {
                    useClient: 'ANDROID', // Use Android client for better compatibility
                    quality: 'best', // Get best quality available
                },
                // Enable caching for better performance
                cache: true
            });
            console.log('[Player Extractors] ✅ Registered stable YoutubeiExtractor with optimized config');
        } catch (err) {
            console.warn(`[Player Extractors] ⚠️ Failed to register YoutubeiExtractor: ${err.message}`);
            // Try with basic config as fallback
            try {
                await client.player.extractors.register(YoutubeiExtractor, {});
                console.log('[Player Extractors] ✅ Registered YoutubeiExtractor with basic config');
            } catch (fallbackErr) {
                console.error(`[Player Extractors] ❌ Failed to register YoutubeiExtractor even with basic config: ${fallbackErr.message}`);
            }
        }

        // Load individual extractors (excluding YouTube to avoid conflicts)
        try {
            const {
                SpotifyExtractor,
                SoundCloudExtractor,
                AppleMusicExtractor,
                VimeoExtractor,
                AttachmentExtractor,
                ReverbnationExtractor
            } = require('@discord-player/extractor');

            // Register Spotify extractor with proper credentials
            try {
                await client.player.extractors.register(SpotifyExtractor, {
                    clientId: process.env.SPOTIFY_CLIENT_ID || process.env.DP_SPOTIFY_CLIENT_ID,
                    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || process.env.DP_SPOTIFY_CLIENT_SECRET
                });
                console.log('[Player Extractors] ✅ Registered SpotifyExtractor with credentials');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register SpotifyExtractor: ${err.message}`);
                if (!process.env.SPOTIFY_CLIENT_ID && !process.env.DP_SPOTIFY_CLIENT_ID) {
                    console.warn('[Player Extractors] ℹ️ Spotify credentials not found. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env');
                }
            }

            // Register SoundCloud extractor
            try {
                await client.player.extractors.register(SoundCloudExtractor);
                console.log('[Player Extractors] ✅ Registered SoundCloudExtractor');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register SoundCloudExtractor: ${err.message}`);
            }

            // Register Apple Music extractor
            try {
                await client.player.extractors.register(AppleMusicExtractor);
                console.log('[Player Extractors] ✅ Registered AppleMusicExtractor');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register AppleMusicExtractor: ${err.message}`);
            }

            // Register Vimeo extractor
            try {
                await client.player.extractors.register(VimeoExtractor);
                console.log('[Player Extractors] ✅ Registered VimeoExtractor');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register VimeoExtractor: ${err.message}`);
            }

            // Register Attachment extractor (for direct file uploads)
            try {
                await client.player.extractors.register(AttachmentExtractor);
                console.log('[Player Extractors] ✅ Registered AttachmentExtractor');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register AttachmentExtractor: ${err.message}`);
            }

            // Register Reverbnation extractor
            try {
                await client.player.extractors.register(ReverbnationExtractor);
                console.log('[Player Extractors] ✅ Registered ReverbnationExtractor');
            } catch (err) {
                console.warn(`[Player Extractors] ⚠️ Failed to register ReverbnationExtractor: ${err.message}`);
            }

            console.log('[Player Extractors] ✅ Individual extractor registration complete');
        } catch (err) {
            console.warn(`[Player Extractors] ⚠️ Could not load @discord-player/extractor: ${err.message}`);
            console.warn('[Player Extractors] ℹ️ Music functionality may be limited');
        }

        // Check for required dependencies
        try {
            require('mediaplex');
            console.log('[Player Extractors] ✅ mediaplex is installed');
        } catch (err) {
            console.warn('[Player Extractors] ⚠️ mediaplex is not installed. Audio processing may not work properly');
            console.warn('[Player Extractors] ℹ️ Try installing it with: npm install mediaplex');
        }

        try {
            require('ffmpeg-static');
            console.log('[Player Extractors] ✅ ffmpeg-static is installed');
        } catch (err) {
            console.warn('[Player Extractors] ⚠️ ffmpeg-static is not installed. Audio conversion may not work properly');
            console.warn('[Player Extractors] ℹ️ Try installing it with: npm install ffmpeg-static');
        }

        // Log the number of registered extractors
        console.log(`[Player Extractors] 📊 Extractor loading process completed.`);
    } catch (error) {
        console.error('[Player Extractors] ❌ Error setting up player:', error.message);
        console.error('[Player Extractors] ⚠️ Music functionality may not work properly!');
    }

    // Load player events (important for user feedback)
    const playerEventsPath = path.join(__dirname, 'player-events');

    if (fs.existsSync(playerEventsPath)) {
        const playerEventFiles = fs.readdirSync(playerEventsPath).filter(file => file.endsWith('.js'));

        for (const file of playerEventFiles) {
            const filePath = path.join(playerEventsPath, file);
            try {
                const event = require(filePath);
                if (event.name && event.execute) {
                    if (event.once) {
                        client.player.events.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.player.events.on(event.name, (...args) => event.execute(...args, client));
                    }
                } else {
                    console.log(`[WARNING] Player event at ${filePath} is missing name or execute property.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to load player event ${file}:`, error.message);
            }
        }
        console.log(`[Player Events] ✅ Loaded ${playerEventFiles.length} player event(s).`);
    } else {
        console.log('[Player Events] ⚠️ No player-events directory found.');
    }

    // Store commands
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');

    // Recursive function to load commands from subdirectories
    function loadCommands(directory) {
        if (!fs.existsSync(directory)) {
            console.log(`[Commands] ⚠️ Commands directory not found: ${directory}`);
            return;
        }

        const commandFiles = fs.readdirSync(directory, { withFileTypes: true });
        for (const file of commandFiles) {
            const filePath = path.join(directory, file.name);
            if (file.isDirectory()) {
                loadCommands(filePath); // Recursively load commands in subdirectories
            } else if (file.name.endsWith('.js')) {
                try {
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(`[Commands] ✅ Loaded: ${command.data.name}`);
                    } else {
                        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Failed to load command ${file.name}:`, error.message);
                }
            }
        }
    }

    loadCommands(commandsPath);
    console.log(`[Commands] 📊 Total commands loaded: ${client.commands.size}`);

    // Load Discord client events
    const eventsPath = path.join(__dirname, 'events');

    if (fs.existsSync(eventsPath)) {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                const event = require(filePath);
                if (event.name && event.execute) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                } else {
                    console.log(`[WARNING] Client event at ${filePath} is missing name or execute property.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to load client event ${file}:`, error.message);
            }
        }
        console.log(`[Client Events] ✅ Loaded ${eventFiles.length} client event(s).`);
    } else {
        console.log('[Client Events] ⚠️ No events directory found.');
    }

    // Log in to Discord with your client's token
    try {
        console.log('[Login] 🔄 Attempting to log in...');
        await client.login(process.env.BOT_TOKEN);
        console.log('[Login] ✅ Successfully logged in as ' + (client.user ? client.user.tag : 'Unknown User'));

        // Start performance monitoring after successful login
        performanceMonitor.start();

        // Make performance monitor available to commands
        client.performanceMonitor = performanceMonitor;

        // Set up periodic cleanup (every 30 minutes)
        setInterval(() => {
            performanceMonitor.cleanup();
        }, 30 * 60 * 1000);

    } catch (err) {
        console.error('[Login Error] ❌ Could not log in:', err.message);
        console.error('[Login Error] Please check your BOT_TOKEN in the .env file');
        process.exit(1);
    }
}

// Global error handlers for YouTube parsing issues
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('CompositeVideoPrimaryInfo')) {
        console.warn('[YouTube Parser] ⚠️ Non-fatal YouTube parsing error (suppressed):', reason.message);
        return; // Don't crash the bot for YouTube parsing issues
    }
    console.error('[Unhandled Rejection] ❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
    if (error && error.message && error.message.includes('CompositeVideoPrimaryInfo')) {
        console.warn('[YouTube Parser] ⚠️ Non-fatal YouTube parsing error (suppressed):', error.message);
        return; // Don't crash the bot for YouTube parsing issues
    }
    console.error('[Uncaught Exception] ❌ Uncaught exception:', error);
    process.exit(1);
});

// Enhanced error handling for the main function
main().catch(error => {
    console.error('[Unhandled Main Error] ❌ An error occurred during bot initialization:');
    console.error(error);
    process.exit(1);
});