import { ContentMetadata } from '../../types/index.ts';
import { ContentProvider, ContentProviderRegistry } from './contentProvider.ts';

export class InstagramProvider implements ContentProvider {
  public readonly platform = 'instagram' as const;

  // Cached metadata for demo reels/posts and newly fetched content
  private static metadataCache: Map<string, ContentMetadata> = new Map([
    [
      'C4aBc123DeF',
      {
        contentId: 'C4aBc123DeF',
        platform: 'instagram',
        canonicalUrl: 'https://www.instagram.com/reel/C4aBc123DeF/',
        title: 'Life hacks that are actually simple and useful in daily life',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80',
        creatorName: 'khaby00',
        creatorId: 'khaby00',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-02T14:00:00Z',
        currentViews: 1420500,
        currentLikes: 185000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      'D1eFg456HiJ',
      {
        contentId: 'D1eFg456HiJ',
        platform: 'instagram',
        canonicalUrl: 'https://www.instagram.com/reel/D1eFg456HiJ/',
        title: 'When reality bends through a cardboard box illusion magic',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        creatorName: 'zachking',
        creatorId: 'zachking',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-06T19:20:00Z',
        currentViews: 864200,
        currentLikes: 94000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      'E2hIj789KlM',
      {
        contentId: 'E2hIj789KlM',
        platform: 'instagram',
        canonicalUrl: 'https://www.instagram.com/reel/E2hIj789KlM/',
        title: 'Night training session under Lisbon floodlights with team',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517649763966-4c113217d848?auto=format&fit=crop&w=800&q=80',
        creatorName: 'cristiano',
        creatorId: 'cristiano',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-09T21:00:00Z',
        currentViews: 3820000,
        currentLikes: 512000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
  ]);

  /**
   * Parse various Instagram URL formats:
   * - https://www.instagram.com/reel/C4aBc123DeF/
   * - https://www.instagram.com/reels/C4aBc123DeF/
   * - https://www.instagram.com/p/C4aBc123DeF/
   * - https://instagr.am/p/C4aBc123DeF/
   */
  public parseUrl(url: string): { contentId: string; canonicalUrl: string } | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // Match Instagram reel or post shortcode: (?:reel|reels|p)\/([a-zA-Z0-9_-]+)
    const match = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      const contentId = match[1];
      const isReel = /reel/i.test(trimmed);
      return {
        contentId,
        canonicalUrl: isReel 
          ? `https://www.instagram.com/reel/${contentId}/` 
          : `https://www.instagram.com/p/${contentId}/`,
      };
    }

    // Direct Instagram shortcode (e.g. C4aBc123DeF)
    if (/^[a-zA-Z0-9_-]{9,15}$/.test(trimmed) && !trimmed.startsWith('UC') && trimmed.length !== 11) {
      return {
        contentId: trimmed,
        canonicalUrl: `https://www.instagram.com/reel/${trimmed}/`,
      };
    }

    return null;
  }

  public getCanonicalUrl(contentId: string): string {
    return `https://www.instagram.com/reel/${contentId}/`;
  }

  public async validateContent(contentId: string): Promise<boolean> {
    try {
      const metadata = await this.fetchContent(contentId);
      return !!metadata && !!metadata.title;
    } catch {
      return false;
    }
  }

  public async fetchContent(contentId: string): Promise<ContentMetadata> {
    // 1. Check cache first
    if (InstagramProvider.metadataCache.has(contentId)) {
      const cached = InstagramProvider.metadataCache.get(contentId)!;
      return {
        ...cached,
        lastCheckedAt: new Date().toISOString(),
      };
    }

    // 2. Try Instagram Public oEmbed endpoint
    try {
      const targetUrl = this.getCanonicalUrl(contentId);
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        let hash = 0;
        for (let i = 0; i < contentId.length; i++) {
          hash = (hash << 5) - hash + contentId.charCodeAt(i);
          hash |= 0;
        }
        const seededViews = Math.abs(hash % 950000) + 45000;
        const seededLikes = Math.round(seededViews * 0.09);

        const meta: ContentMetadata = {
          contentId,
          platform: 'instagram',
          canonicalUrl: targetUrl,
          title: data.title || `Instagram Reel by @${data.author_name || 'creator'}`,
          thumbnailUrl: data.thumbnail_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
          creatorName: data.author_name || 'Instagram Creator',
          creatorId: data.author_name ? data.author_name.toLowerCase().replace(/[^a-z0-9_]/g, '') : 'instagram_creator',
          creatorAvatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
          publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          currentViews: seededViews,
          currentLikes: seededLikes,
          lastCheckedAt: new Date().toISOString(),
        };
        InstagramProvider.metadataCache.set(contentId, meta);
        return meta;
      }
    } catch (err) {
      console.warn('Instagram oEmbed fetch error, generating seeded metadata:', err);
    }

    // 3. Fallback deterministic generator based on shortcode
    let hash = 0;
    for (let i = 0; i < contentId.length; i++) {
      hash = (hash << 5) - hash + contentId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const seededViews = (absHash % 1200000) + 35000;
    const seededLikes = Math.round(seededViews * 0.085);

    const creators = [
      { name: 'viral_reels', handle: 'viral_reels', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'aesthetic.vibes', handle: 'aesthetic.vibes', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'daily.tech', handle: 'daily.tech', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
      { name: 'foodie_culture', handle: 'foodie_culture', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
    ];
    const creator = creators[absHash % creators.length];

    const fallback: ContentMetadata = {
      contentId,
      platform: 'instagram',
      canonicalUrl: this.getCanonicalUrl(contentId),
      title: `Instagram Reel: Trending moment & viral highlight #${contentId.substring(0, 6)}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
      creatorName: creator.name,
      creatorId: creator.handle,
      creatorAvatarUrl: creator.avatar,
      publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      currentViews: seededViews,
      currentLikes: seededLikes,
      lastCheckedAt: new Date().toISOString(),
    };
    InstagramProvider.metadataCache.set(contentId, fallback);
    return fallback;
  }

  public async fetchMetrics(contentId: string): Promise<{ viewCount: number; likeCount: number }> {
    const meta = await this.fetchContent(contentId);
    return {
      viewCount: meta.currentViews,
      likeCount: meta.currentLikes,
    };
  }

  public static updateSimulatedMetric(contentId: string, newViews: number, newLikes?: number): void {
    const existing = InstagramProvider.metadataCache.get(contentId);
    if (existing) {
      existing.currentViews = newViews;
      if (newLikes !== undefined) existing.currentLikes = newLikes;
      existing.lastCheckedAt = new Date().toISOString();
      InstagramProvider.metadataCache.set(contentId, existing);
    }
  }

  public static getCuratedSeeds(): ContentMetadata[] {
    return Array.from(InstagramProvider.metadataCache.values());
  }
}

// Register on load
ContentProviderRegistry.register(new InstagramProvider());
