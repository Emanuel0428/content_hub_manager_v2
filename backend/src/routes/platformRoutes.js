/**
 * Platform Routes
 * Returns platform configurations and metadata
 */

const platformConfigs = {
  twitch: {
    id: 'twitch',
    name: 'Twitch',
    color: '#9146FF',
    icon: '📺',
    categories: [
      {
        id: 'thumbnails',
        name: 'Thumbnails',
        description: 'Stream preview images',
        dimensions: '1920×1080px',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'emotes',
        name: 'Emotes',
        description: 'Custom channel emotes',
        dimensions: '28×28px, 56×56px, 112×112px',
        recommendedFormats: ['PNG'],
      },
      {
        id: 'badges',
        name: 'Badges',
        description: 'Subscriber and bit badges',
        dimensions: '18×18px, 36×36px, 72×72px',
        recommendedFormats: ['PNG'],
      },
      {
        id: 'overlays',
        name: 'Overlays',
        description: 'Stream overlays and scenes',
        dimensions: '1920×1080px',
        recommendedFormats: ['PNG'],
      },
      {
        id: 'alerts',
        name: 'Alerts',
        description: 'Follow, sub, and donation alerts',
        dimensions: 'Various',
        recommendedFormats: ['PNG', 'GIF', 'WEBM'],
      },
      {
        id: 'panels',
        name: 'Panels',
        description: 'Channel info panels',
        dimensions: '320×100px (recommended)',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'offline',
        name: 'Offline Screen',
        description: 'Offline banner image',
        dimensions: '1920×1080px',
        recommendedFormats: ['PNG', 'JPG'],
      },
    ],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    icon: '▶️',
    categories: [
      {
        id: 'thumbnails',
        name: 'Thumbnails',
        description: 'Video thumbnail images',
        dimensions: '1280×720px',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'banner',
        name: 'Channel Banner',
        description: 'Channel art/banner',
        dimensions: '2560×1440px',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'endscreens',
        name: 'End Screens',
        description: 'Video end screen elements',
        dimensions: '1920×1080px',
        recommendedFormats: ['PNG'],
      },
      {
        id: 'watermark',
        name: 'Watermark',
        description: 'Video watermark/branding',
        dimensions: '150×150px',
        recommendedFormats: ['PNG'],
      },
    ],
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    icon: '🎵',
    categories: [
      {
        id: 'thumbnails',
        name: 'Thumbnails',
        description: 'Video cover images',
        dimensions: '1080×1920px (9:16)',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'profile',
        name: 'Profile Picture',
        description: 'Account profile image',
        dimensions: '200×200px',
        recommendedFormats: ['PNG', 'JPG'],
      },
      {
        id: 'clips',
        name: 'Clips & Edits',
        description: 'Video clips and edited content',
        dimensions: '1080×1920px (9:16)',
        recommendedFormats: ['MP4', 'MOV'],
      },
    ],
  },
};

function registerPlatformRoutes(app) {
  /**
   * GET /api/platforms
   * Returns all platform configurations
   */
  app.get('/api/platforms', async (request, reply) => {
    return {
      success: true,
      data: Object.values(platformConfigs),
    };
  });

  /**
   * GET /api/platforms/:platformId
   * Returns configuration for a specific platform
   */
  app.get('/api/platforms/:platformId', async (request, reply) => {
    const { platformId } = request.params;
    const platform = platformConfigs[platformId];

    if (!platform) {
      return reply.status(404).send({
        success: false,
        error: `Platform '${platformId}' not found`,
      });
    }

    return {
      success: true,
      data: platform,
    };
  });

  /**
   * GET /api/platforms/:platformId/categories
   * Returns categories for a specific platform
   */
  app.get('/api/platforms/:platformId/categories', async (request, reply) => {
    const { platformId } = request.params;
    const platform = platformConfigs[platformId];

    if (!platform) {
      return reply.status(404).send({
        success: false,
        error: `Platform '${platformId}' not found`,
      });
    }

    return {
      success: true,
      data: platform.categories,
    };
  });
}

module.exports = registerPlatformRoutes;
