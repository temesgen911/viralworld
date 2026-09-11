import { ContentMetadata } from '../../types/index.ts';
import { ContentProvider, ContentProviderRegistry } from './contentProvider.ts';

export class XProvider implements ContentProvider {
  public readonly platform = 'x' as const;

  // Cached metadata for demo X/Twitter posts and newly fetched posts
  private static metadataCache: Map<string, ContentMetadata> = new Map([
    [
      '1765432109876543210',
      {
        contentId: '1765432109876543210',
        platform: 'x',
        canonicalUrl: 'https://x.com/elonmusk/status/1765432109876543210',
        title: 'Starship flight test 5: Booster catch on launch pad mechanical arms',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517976487502-5f715da5c10e?auto=format&fit=crop&w=800&q=80',
        creatorName: 'Elon Musk',
        creatorId: 'elonmusk',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-03T17:00:00Z',
        currentViews: 14200000,
        currentLikes: 420000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      '1754321098765432109',
      {
        contentId: '1754321098765432109',
        platform: 'x',
        canonicalUrl: 'https://x.com/sama/status/1754321098765432109',
        title: 'Compute clusters expanding at unprecedented rates. The curve is vertical.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        creatorName: 'Sam Altman',
        creatorId: 'sama',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-07T20:15:00Z',
        currentViews: 3850000,
        currentLikes: 89000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
    [
      '1743210987654321098',
      {
        contentId: '1743210987654321098',
        platform: 'x',
        canonicalUrl: 'https://x.com/MrBeast/status/1743210987654321098',
        title: 'I uploaded an entire 20 minute video directly onto X to test monetization',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        creatorName: 'MrBeast',
        creatorId: 'MrBeast',
        creatorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        publishedAt: '2026-09-08T15:30:00Z',
        currentViews: 9800000,
        currentLikes: 310000,
        lastCheckedAt: new Date().toISOString(),
      },
    ],
  ]);

  /**
   * Parse various X / Twitter URL formats:
   * - https://x.com/username/status/1765432109876543210
   * - https://twitter.com/username/status/1765432109876543210
   * - https://mobile.twitter.com/username/status/1765432109876543210
   */
  public parseUrl(url: string): { contentId: string; canonicalUrl: string } | null {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // Match status ID from x.com or twitter.com: /(?:x\.com|twitter\.com)\/(?:#!\/)?(\w+)\/status\/(\d+)/
    const match = trimmed.match(/(?:x\.com|twitter\.com)\/(?:#!\/)?([a-zA-Z0-9_]+)\/status\/(\d+)/i);
    if (match && match[2]) {
      const username = match[1];
      const statusId = match[2];
      return {
        contentId: statusId,
        canonicalUrl: `https://x.com/${username}/status/${statusId}`,
      };
    }

    // Direct numeric tweet/status ID (15-22 digits)
    if (/^\d{16,22}$/.test(trimmed)) {
      return {
        contentId: trimmed,
        canonicalUrl: `https://x.com/user/status/${trimmed}`,
      };
    }

    return null;
  }

  public getCanonicalUrl(contentId: string): string {
    return `https://x.com/i/status/${contentId}`;
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
    if (XProvider.metadataCache.has(contentId)) {
      const cached = XProvider.metadataCache.get(contentId)!;
      return {
        ...cached,
        lastCheckedAt: new Date().toISOString(),
      };
    }

    // 2. Try Twitter / X Public oEmbed API (publish.twitter.com)
    try {
      const targetUrl = this.getCanonicalUrl(contentId);
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(targetUrl)}&omit_script=true`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        let hash = 0;
        for (let i = 0; i < contentId.length; i++) {
          hash = (hash << 5) - hash + contentId.charCodeAt(i);
          hash |= 0;
        }
        const seededViews = Math.abs(hash % 2000000) + 120000;
        const seededLikes = Math.round(seededViews * 0.05);

        // Strip HTML tags from oembed.html to extract post text
        let cleanText = 'Post on X';
        if (data.html) {
          cleanText = data.html
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/&mdash;.*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        const authorName = data.author_name || 'X User';
        const authorId = data.author_url ? data.author_url.split('/').filter(Boolean).pop() || 'user' : 'user';

        const meta: ContentMetadata = {
          contentId,
          platform: 'x',
          canonicalUrl: targetUrl,
          title: cleanText.substring(0, 140) || `Post by @${authorId}`,
          thumbnailUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80',
          creatorName: authorName,
          creatorId: authorId,
          creatorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          currentViews: seededViews,
          currentLikes: seededLikes,
          lastCheckedAt: new Date().toISOString(),
        };
        XProvider.metadataCache.set(contentId, meta);
        return meta;
      }
    } catch (err) {
      console.warn('X oEmbed fetch error, generating seeded metadata:', err);
    }

    // 3. Fallback deterministic metadata based on status ID hash
    let hash = 0;
    for (let i = 0; i < contentId.length; i++) {
      hash = (hash << 5) - hash + contentId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const seededViews = (absHash % 4500000) + 200000;
    const seededLikes = Math.round(seededViews * 0.04);

    const creators = [
      { name: 'Tech Insider', handle: 'techinsider', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Breaking News Feed', handle: 'breakingfeed', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Alpha Signals', handle: 'alphasignals', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Viral Post Bot', handle: 'viralbot', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' },
    ];
    const creator = creators[absHash % creators.length];

    const fallback: ContentMetadata = {
      contentId,
      platform: 'x',
      canonicalUrl: this.getCanonicalUrl(contentId),
      title: `Breaking post & community discussion thread on X #${contentId.substring(contentId.length - 6)}`,
      thumbnailUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80',
      creatorName: creator.name,
      creatorId: creator.handle,
      creatorAvatarUrl: creator.avatar,
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      currentViews: seededViews,
      currentLikes: seededLikes,
      lastCheckedAt: new Date().toISOString(),
    };
    XProvider.metadataCache.set(contentId, fallback);
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
    const existing = XProvider.metadataCache.get(contentId);
    if (existing) {
      existing.currentViews = newViews;
      if (newLikes !== undefined) existing.currentLikes = newLikes;
      existing.lastCheckedAt = new Date().toISOString();
      XProvider.metadataCache.set(contentId, existing);
    }
  }

  public static getCuratedSeeds(): ContentMetadata[] {
    return Array.from(XProvider.metadataCache.values());
  }
}

// Register on load
ContentProviderRegistry.register(new XProvider());
