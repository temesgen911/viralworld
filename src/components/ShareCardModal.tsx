import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { Market } from '../types/index.ts';
import { formatMetricNumber } from '../services/thresholds/suggestThresholds.ts';

interface ShareCardModalProps {
  market: Market;
  userPositionSide?: 'YES' | 'NO';
  entryMetric?: number;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  market,
  userPositionSide,
  entryMetric,
  onClose,
}) => {
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  // Render social card to canvas
  useEffect(() => {
    let cancelled = false;

    const renderCard = async () => {
      setGenerating(true);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = 1080;
      const height = format === 'story' ? 1920 : 1080;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background: Dark sleek aesthetic
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a0b0e');
      bgGrad.addColorStop(0.5, '#12141a');
      bgGrad.addColorStop(1, '#07080a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric glow
      const glow = ctx.createRadialGradient(width / 2, height * 0.35, 50, width / 2, height * 0.35, width * 0.7);
      glow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 2. Top Header / Brand
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00FF88';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('VIRAL', width / 2, format === 'story' ? 140 : 90);

      ctx.fillStyle = '#8E8E93';
      ctx.font = '500 24px sans-serif';
      ctx.fillText('BET ON WHAT BLOWS UP NEXT', width / 2, format === 'story' ? 180 : 125);

      // 3. Optional "I CALLED IT EARLY" Badge
      if (entryMetric && userPositionSide === 'YES') {
        const badgeY = format === 'story' ? 240 : 160;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 250, badgeY - 35, 500, 60, 30);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00FF88';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`🔥 CALLED IT EARLY AT ${formatMetricNumber(entryMetric)} VIEWS`, width / 2, badgeY + 6);
      }

      // 4. Content Thumbnail
      const thumbY = format === 'story' ? 340 : 220;
      const thumbW = format === 'story' ? 760 : 540;
      const thumbH = format === 'story' ? 760 : 380;
      const thumbX = (width - thumbW) / 2;

      // Draw rounded card outline for thumb
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 40);
      ctx.clip();

      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Fallback smoothly if CORS blocks
          img.src = market.thumbnailUrl;
        });
        ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
      } catch {
        ctx.fillStyle = '#222';
        ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
      }
      ctx.restore();

      // Thumbnail border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 40);
      ctx.stroke();

      // 5. Title & Target
      const textStartY = format === 'story' ? thumbY + thumbH + 80 : thumbY + thumbH + 50;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`@${market.creatorName}`, width / 2, textStartY);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText(`TARGET: ${formatMetricNumber(market.targetMetric)} VIEWS`, width / 2, textStartY + 60);

      // Current Metric
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(`Current: ${formatMetricNumber(market.currentMetric)} views`, width / 2, textStartY + 110);

      // 6. Probability Bar & Numbers
      const probY = textStartY + 170;
      const probW = 760;
      const probX = (width - probW) / 2;

      // Box YES
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(probX, probY, probW * 0.48, 110, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('YES', probX + (probW * 0.48) / 2, probY + 45);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px monospace';
      ctx.fillText(`${yesPercent}%`, probX + (probW * 0.48) / 2, probY + 95);

      // Box NO
      const noX = probX + probW * 0.52;
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(noX, probY, probW * 0.48, 110, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F43F5E';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('NO', noX + (probW * 0.48) / 2, probY + 45);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 44px monospace';
      ctx.fillText(`${noPercent}%`, noX + (probW * 0.48) / 2, probY + 95);

      // 7. Footer Tagline
      if (format === 'story') {
        ctx.fillStyle = '#71717A';
        ctx.font = '500 24px sans-serif';
        ctx.fillText('viral.app • Spot it early. Back your call.', width / 2, height - 80);
      }

      if (!cancelled) {
        setPreviewDataUrl(canvas.toDataURL('image/png'));
        setGenerating(false);
      }
    };

    renderCard();

    return () => {
      cancelled = true;
    };
  }, [format, market, userPositionSide, entryMetric]);

  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    a.download = `VIRAL-${market.slug}-${format}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    const marketUrl = window.location.origin + `/market/${market.slug || market.id}`;
    if (navigator.share && previewDataUrl) {
      try {
        const blob = await (await fetch(previewDataUrl)).blob();
        const file = new File([blob], `VIRAL-${market.slug}.png`, { type: 'image/png' });
        await navigator.share({
          title: `VIRAL Prediction: ${market.title}`,
          text: `I made a prediction on VIRAL: Will this reach ${formatMetricNumber(market.targetMetric)} views?`,
          url: marketUrl,
          files: [file],
        });
        return;
      } catch (err) {
        console.log('Share canceled or fallback to link share');
      }
    }
    // Fallback: copy link
    handleCopyLink();
  };

  const handleCopyLink = () => {
    const marketUrl = window.location.origin + `/market/${market.slug || market.id}`;
    navigator.clipboard.writeText(marketUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div
        id="share-card-modal"
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#12141a] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <button
          id="share-modal-close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-4">
          <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Share Your Prediction Card</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">High-resolution card ready for Instagram Story, X or Discord</p>
        </div>

        {/* Format Toggle */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-bold">
            <button
              id="format-story-btn"
              onClick={() => setFormat('story')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                format === 'story' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Instagram Story (9:16)
            </button>
            <button
              id="format-square-btn"
              onClick={() => setFormat('square')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                format === 'square' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Square (1:1)
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex justify-center mb-5">
          <div className="relative max-h-[360px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-lg">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Social Card Preview"
                className={`object-contain ${format === 'story' ? 'h-[360px] w-auto' : 'h-[300px] w-[300px]'}`}
              />
            ) : (
              <div className="flex h-[360px] w-[200px] items-center justify-center text-xs text-zinc-500">
                Generating card...
              </div>
            )}
          </div>
        </div>

        {/* Hidden Canvas used for high-res generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            id="share-native-btn"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 py-3 text-xs font-bold text-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>

          <button
            id="share-download-btn"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>

          <button
            id="share-copy-btn"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-3 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
