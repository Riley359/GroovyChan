// build.js - Script to build the Discord Music Bot into an executable
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process for Discord Music Bot...');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
  console.log('✅ Created dist directory');
}

try {
  // Check if .env file exists and copy it to dist
  if (fs.existsSync('.env')) {
    fs.copyFileSync('.env', path.join('dist', '.env'));
    console.log('✅ Copied .env file to dist directory');
  } else {
    console.warn('⚠️ No .env file found. The executable will need environment variables configured.');
    
    // Create a template .env file in the dist directory
    const envTemplate = 
`# Discord Bot Token (Required)
DISCORD_TOKEN=your_discord_token_here

# Spotify API Credentials (Optional - for Spotify support)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# YouTube Cookie (Optional - for better YouTube performance)
YOUTUBE_COOKIE=
`;
    fs.writeFileSync(path.join('dist', '.env.template'), envTemplate);
    console.log('✅ Created .env.template file in dist directory');
  }

  // Build the executable using pkg with specific Node.js version and additional options
  console.log('🔨 Building executable (this may take a few minutes)...');
  execSync('pkg . --target node16-win-x64 --output dist/discord-music-bot.exe --options "experimental-modules,no-warnings" --compress GZip', { stdio: 'inherit' });
  
  // Create a README file with instructions
  const readmeContent = 
`# Discord Music Bot - Executable Version

## Setup Instructions

1. Edit the '.env' file in this directory with your Discord bot token:
   DISCORD_TOKEN=your_discord_token_here

2. (Optional) Add Spotify credentials for Spotify support:
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

3. Run 'discord-music-bot.exe' to start the bot.

## Troubleshooting

- If the bot crashes on startup, make sure your Discord token is correct.
- For issues with music playback, ensure your bot has proper permissions in your Discord server.
- The bot requires an internet connection to function properly.

## Features

- Play music from YouTube, Spotify, SoundCloud, and more
- Queue management
- Audio filters
- And more!

Enjoy your Discord Music Bot!
`;
  fs.writeFileSync(path.join('dist', 'README.txt'), readmeContent);
  console.log('✅ Created README.txt with setup instructions');

  console.log('✅ Build completed successfully! Your executable is in the dist folder.');
  console.log('📁 dist/discord-music-bot.exe');
  console.log('📄 dist/.env (or .env.template if no .env was found)');
  console.log('📄 dist/README.txt');
  console.log('\n⭐ Don\'t forget to edit the .env file with your Discord bot token before distributing!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
