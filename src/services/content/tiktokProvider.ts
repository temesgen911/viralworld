import { ContentMetadata } from '../../types/index.ts';
import { ContentProvider, ContentProviderRegistry } from './contentProvider.ts';

export class TikTokProvider implements ContentProvider {
  public readonly platform = 'tiktok' as const;

  // Cached metadata for demo TikToks and newly fetched content
  private static metadataCache: Map<string, ContentMetadata> = new Map([
    [
      '6862153058223197445',
      {
        contentId: '6862153058223197445',
        platform: 'tiktok',
        canonicalUrl: 'https://www.tiktok.com/@bellapoarch/video/6862153058223197445',
        title: 'M to the B - Soph Aspin Send (Head bounce viral lip sync)',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        creatorName: 'bellapoarch',
        creatorId: 'bellapoarch',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-08-20T12:00:00Z',
        currentViews: 8200000,
        currentLikes: 780000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      '7345678901234567890',
      {
        contentId: '7345678901234567890',
        platform: 'tiktok',
        canonicalUrl: 'https://www.tiktok.com/@khaby.lame/video/7345678901234567890',
        title: 'Just open the door with your hands! Why make it complicated?',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=800&q=80',
        creatorName: 'khaby.lame',
        creatorId: 'khaby.lame',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-04T16:00:00Z',
        currentViews: 2450000,
        currentLikes: 310000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      '7210987654321098765',
      {
        contentId: '7210987654321098765',
        platform: 'tiktok',
        canonicalUrl: 'https://www.tiktok.com/@charlidamelio/video/7210987654321098765',
        title: 'New dance trend choreography tutorial with friends',
        thumbnailUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
        creatorName: 'charlidamelio',
        creatorId: 'charlidamelio',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-07T18:45:00Z',
        currentViews: 1890000,
        currentLikes: 240000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
  ]);

  /**
   * Parse various TikTok URL formats:
   * - https://www.tiktok.com/@username/video/7345678901234567890
   * - https://www.tiktok.com/v/7345678901234567890.html
   * - https://vm.tiktok.com/ZMxxxxxx/
   * - https://vt.tiktok.com/ZMxxxxxx/
   * - Direct video ID
   */
  public parseUrl(url: string): { contentId: string; canonicalUrl: string } | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // Standard video URL: @username/video/(\d+)
    const stdMatch = trimmed.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i);
    if (stdMatch && stdMatch[2]) {
      const username = stdMatch[1];
      const videoId = stdMatch[2];
      return {
        contentId: videoId,
        canonicalUrl: `https://www.tiktok.com/@${username}/video/${videoId}`,
      };
    }

    // Direct /v/(\d+)
    const vMatch = trimmed.match(/tiktok\.com\/v\/(\d+)/i);
    if (vMatch && vMatch[1]) {
      const videoId = vMatch[1];
      return {
        contentId: videoId,
        canonicalUrl: `https://www.tiktok.com/@creator/video/${videoId}`,
      };
    }

    // Short URLs: vm.tiktok.com/xxx or vt.tiktok.com/xxx
    const shortMatch = trimmed.match(/(?:vm|vt)\.tiktok\.com\/([a-zA-Z0-9_-]+)/i);
    if (shortMatch && shortMatch[1]) {
      const shortCode = shortMatch[1];
      return {
        contentId: shortCode,
        canonicalUrl: `https://vm.tiktok.com/${shortCode}/`,
      };
    }

    // Direct numeric video ID (15-22 digits)
    if (/^\d{15,22}$/.test(trimmed)) {
      return {
        contentId: trimmed,
        canonicalUrl: `https://www.tiktok.com/@creator/video/${trimmed}`,
      };
    }

    return null;
  }

  public getCanonicalUrl(contentId: string): string {
    return `https://www.tiktok.com/@creator/video/${contentId}`;
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
    if (TikTokProvider.metadataCache.has(contentId)) {
      const cached = TikTokProvider.metadataCache.get(contentId)!;
      return {
        ...cached,
        lastCheckedAt: new Date().toISOString(),
      };
    }

    // 2. Try official TikTok Public oEmbed API (No auth required)
    try {
      const targetUrl = this.getCanonicalUrl(contentId);
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        let hash = 0;
        for (let i = 0; i < contentId.length; i++) {
          hash = (hash << 5) - hash + contentId.charCodeAt(i);
          hash |= 0;
        }
        const seededViews = Math.abs(hash % 1500000) + 65000;
        const seededLikes = Math.round(seededViews * 0.11);

        const meta: ContentMetadata = {
          contentId,
          platform: 'tiktok',
          canonicalUrl: targetUrl,
          title: data.title || `TikTok video by @${data.author_unique_id || data.author_name || 'creator'}`,
          thumbnailUrl: data.thumbnail_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
          creatorName: data.author_unique_id || data.author_name || 'tiktok_creator',
          creatorId: data.author_unique_id || 'tiktok_creator',
          creatorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          currentViews: seededViews,
          currentLikes: seededLikes,
          lastCheckedAt: new Date().toISOString(),
        };
        TikTokProvider.metadataCache.set(contentId, meta);
        return meta;
      }
    } catch (err) {
      console.warn('TikTok oEmbed fetch error, generating seeded metadata:', err);
    }

    // 3. Fallback deterministic metadata based on video ID hash
    let hash = 0;
    for (let i = 0; i < contentId.length; i++) {
      hash = (hash << 5) - hash + contentId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const seededViews = (absHash % 2500000) + 80000;
    const seededLikes = Math.round(seededViews * 0.12);

    const creators = [
      { name: 'tiktok.trends', handle: 'tiktok.trends', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'comedy_central_clips', handle: 'comedy_central_clips', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'dance.fever', handle: 'dance.fever', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' },
      { name: 'gaming_highlights_daily', handle: 'gaming_highlights_daily', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
    ];
    const creator = creators[absHash % creators.length];

    const fallback: ContentMetadata = {
      contentId,
      platform: 'tiktok',
      canonicalUrl: this.getCanonicalUrl(contentId),
      title: `TikTok: Viral sound & trending video #${contentId.substring(contentId.length - 6)}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      creatorName: creator.name,
      creatorId: creator.handle,
      creatorAvatarUrl: creator.avatar,
      publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      currentViews: seededViews,
      currentLikes: seededLikes,
      lastCheckedAt: new Date().toISOString(),
    };
    TikTokProvider.metadataCache.set(contentId, fallback);
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
    const existing = TikTokProvider.metadataCache.get(contentId);
    if (existing) {
      existing.currentViews = newViews;
      if (newLikes !== undefined) existing.currentLikes = newLikes;
      existing.lastCheckedAt = new Date().toISOString();
      TikTokProvider.metadataCache.set(contentId, existing);
    }
  }

  public static getCuratedSeeds(): ContentMetadata[] {
    return Array.from(TikTokProvider.metadataCache.values());
  }
}

// Register on load
ContentProviderRegistry.register(new TikTokProvider());
