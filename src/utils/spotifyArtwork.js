// File: src/utils/spotifyArtwork.js
// Utility to fetch high-quality Spotify album artwork using the Spotify Web API

const fetch = require('node-fetch');

class SpotifyArtworkFetcher {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // Get Spotify access token using client credentials
    async getAccessToken() {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Spotify credentials not found');
        }

        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

            return this.accessToken;
        } catch (error) {
            console.error('[Spotify Artwork] Error getting access token:', error);
            throw error;
        }
    }

    // Extract Spotify ID from URL
    extractSpotifyId(url) {
        const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        return match ? { type: match[1], id: match[2] } : null;
    }

    // Get high-quality artwork for a Spotify track
    async getTrackArtwork(trackId) {
        try {
            const token = await this.getAccessToken();
            const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            const data = await response.json();
            const images = data.album?.images;
            
            if (images && images.length > 0) {
                // Return the highest quality image (first one is usually the largest)
                return images[0].url;
            }

            return null;
        } catch (error) {
            console.error('[Spotify Artwork] Error fetching track artwork:', error);
            return null;
        }
    }

    // Get high-quality artwork for a Spotify album
    async getAlbumArtwork(albumId) {
        try {
            const token = await this.getAccessToken();
            const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`);
            }

            const data = await response.json();
            const images = data.images;
            
            if (images && images.length > 0) {
                // Return the highest quality image
                return images[0].url;
            }

            return null;
        } catch (error) {
            console.error('[Spotify Artwork] Error fetching album artwork:', error);
            return null;
        }
    }

    // Get artwork from any Spotify URL
    async getArtworkFromUrl(spotifyUrl) {
        try {
            const parsed = this.extractSpotifyId(spotifyUrl);
            if (!parsed) {
                return null;
            }

            switch (parsed.type) {
                case 'track':
                    return await this.getTrackArtwork(parsed.id);
                case 'album':
                    return await this.getAlbumArtwork(parsed.id);
                case 'playlist':
                    // Playlists don't have consistent artwork, return null
                    return null;
                default:
                    return null;
            }
        } catch (error) {
            console.error('[Spotify Artwork] Error getting artwork from URL:', error);
            return null;
        }
    }
}

// Export a singleton instance
module.exports = new SpotifyArtworkFetcher();
