import { ContentMetadata, Platform } from '../../types/index.ts';

export interface ContentProvider {
  readonly platform: Platform;
  parseUrl(url: string): { contentId: string; canonicalUrl: string } | null;
  fetchContent(contentId: string): Promise<ContentMetadata>;
  fetchMetrics(contentId: string): Promise<{ viewCount: number; likeCount: number }>;
  validateContent(contentId: string): Promise<boolean>;
  getCanonicalUrl(contentId: string): string;
}

export class ContentProviderRegistry {
  private static providers: Map<Platform, ContentProvider> = new Map();

  public static register(provider: ContentProvider): void {
    this.providers.set(provider.platform, provider);
  }

  public static get(platform: Platform): ContentProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new Error(`No content provider registered for platform: ${platform}`);
    }
    return provider;
  }

  public static getAll(): ContentProvider[] {
    return Array.from(this.providers.values());
  }

  public static getSupportedPlatforms(): Platform[] {
    return Array.from(this.providers.keys());
  }

  public static detectProvider(url: string): { provider: ContentProvider; contentId: string; canonicalUrl: string } | null {
    for (const provider of this.providers.values()) {
      const parsed = provider.parseUrl(url);
      if (parsed) {
        return { provider, ...parsed };
      }
    }
    return null;
  }
}
