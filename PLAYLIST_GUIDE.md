# YouTube Playlist Support Guide

Your Discord music bot now supports YouTube playlists! Here's how to use this feature:

## How to Add YouTube Playlists

### Method 1: Using the `/play` command
You can now use the `/play` command with YouTube playlist URLs:

```
/play query: https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMt9xaJGA6H_VjlXEL
```

The bot will automatically detect that it's a playlist and add all tracks to the queue.

### Method 2: Using the new `/playlist` command
For a dedicated playlist experience, use the new `/playlist` command:

```
/playlist url: https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMt9xaJGA6H_VjlXEL
```

This command is specifically designed for playlists and provides better error handling.

## Supported YouTube Playlist URL Formats

The bot supports these YouTube playlist URL formats:

- `https://youtube.com/playlist?list=PLAYLIST_ID`
- `https://www.youtube.com/playlist?list=PLAYLIST_ID`
- `https://youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`

## Features

### ✅ What Works
- **Public playlists**: Any public YouTube playlist
- **Large playlists**: Supports playlists with hundreds of songs
- **Rich embeds**: Beautiful playlist information display
- **Queue integration**: Seamlessly adds to existing queue
- **Auto-play**: Starts playing immediately if nothing is playing

### ❌ Limitations
- **Private playlists**: Cannot access private or unlisted playlists
- **Age-restricted content**: Cannot load age-restricted playlists
- **YouTube Music**: Some YouTube Music playlists may not work

## Example Playlists to Test

Here are some public playlists you can test with:

1. **Lofi Hip Hop**: `https://youtube.com/playlist?list=PLOHoVaTp8R7dX0jcRlWf-hTI9F4QnayAo`
2. **Top Hits**: `https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMt9xaJGA6H_VjlXEL`
3. **Gaming Music**: `https://youtube.com/playlist?list=PLYUWsNlYUtvQZTOgYhKNhKWZNOr8QzCsL`

## Troubleshooting

### Common Issues

**"Could not load YouTube playlist"**
- Make sure the playlist is public
- Check that the URL is correct and complete
- Verify the playlist still exists

**"This doesn't appear to be a playlist URL"**
- Ensure the URL contains `list=` parameter
- Use the full playlist URL, not just a video from the playlist

**"Playlist is private or unavailable"**
- The playlist owner has made it private
- The playlist may have been deleted
- Try a different public playlist

### Getting Help

If you encounter issues:
1. Use `/diagnose` to check the bot's status
2. Make sure you're in a voice channel
3. Verify the playlist URL is public and accessible
4. Check the bot's permissions in your server

## Technical Details

The bot uses:
- **discord-player v6.6.4** with YouTube playlist support
- **QueryType.YOUTUBE_PLAYLIST** for optimal playlist handling
- **YoutubeiExtractor** for reliable YouTube access
- **Rich embeds** for better user experience

Enjoy your new playlist functionality! 🎵
