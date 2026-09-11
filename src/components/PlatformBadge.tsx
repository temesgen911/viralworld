import React from 'react';
import { Youtube, Instagram, Twitter, Video, Music } from 'lucide-react';
import { Platform } from '../types/index.ts';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const getPlatformConfig = (platform: Platform) => {
  switch (platform) {
    case 'youtube':
      return {
        name: 'YouTube',
        label: 'YouTube Short',
        icon: Youtube,
        badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
        brandColor: '#FF0000',
        metricName: 'views',
        watchLabel: 'Watch on YouTube',
        sampleUrl: 'https://www.youtube.com/shorts/07d2dXHYb94',
        placeholder: 'e.g. youtube.com/shorts/... or youtu.be/...',
      };
    case 'tiktok':
      return {
        name: 'TikTok',
        label: 'TikTok Video',
        icon: Music,
        badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
        brandColor: '#00F2FE',
        metricName: 'views',
        watchLabel: 'Watch on TikTok',
        sampleUrl: 'https://www.tiktok.com/@khaby.lame/video/7345678901234567890',
        placeholder: 'e.g. tiktok.com/@creator/video/... or vm.tiktok.com/...',
      };
    case 'instagram':
      return {
        name: 'Instagram',
        label: 'Instagram Reel',
        icon: Instagram,
        badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
        brandColor: '#E1306C',
        metricName: 'plays / views',
        watchLabel: 'View on Instagram',
        sampleUrl: 'https://www.instagram.com/reel/C4aBc123DeF/',
        placeholder: 'e.g. instagram.com/reel/... or instagram.com/p/...',
      };
    case 'x':
      return {
        name: 'X (Twitter)',
        label: 'X Post',
        icon: Twitter,
        badgeBg: 'bg-zinc-400/10 text-zinc-300 border-zinc-400/30',
        brandColor: '#1DA1F2',
        metricName: 'impressions / views',
        watchLabel: 'View on X',
        sampleUrl: 'https://x.com/elonmusk/status/1765432109876543210',
        placeholder: 'e.g. x.com/username/status/... or twitter.com/...',
      };
    default:
      return {
        name: 'Video',
        label: 'Video',
        icon: Video,
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        brandColor: '#10B981',
        metricName: 'views',
        watchLabel: 'Open Original',
        sampleUrl: '',
        placeholder: 'Paste video link...',
      };
  }
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'sm', showLabel = true }) => {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold tracking-wide ${config.badgeBg} ${sizeClasses}`}
    >
      <Icon className={iconSizes} />
      {showLabel && <span>{config.name}</span>}
    </span>
  );
};
