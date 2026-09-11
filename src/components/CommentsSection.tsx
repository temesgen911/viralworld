import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart, Flag, Send, CornerDownRight } from 'lucide-react';
import { Comment } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CommentsSectionProps {
  marketId: string;
  onOpenAuth: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ marketId, onOpenAuth }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/comments/${marketId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    };
    fetchComments();
  }, [marketId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (!newText.trim() || newText.length > 280) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          userId: user.uid,
          username: profile.username,
          userDisplayName: profile.displayName || profile.username,
          text: replyTo ? `@${replyTo.username} ${newText.trim()}` : newText.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created, ...prev]);
        setNewText('');
        setReplyTo(null);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likeCount: c.likeCount + (likedIds.has(id) ? -1 : 1) } : c))
    );
  };

  const handleReport = (id: string) => {
    setReportedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12141a] p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          <span>Market Discussion ({comments.length})</span>
        </h4>
        <span className="text-[11px] text-zinc-500 font-mono">Max 280 chars</span>
      </div>

      {/* Input */}
      <form onSubmit={handlePost} className="mb-6">
        {replyTo && (
          <div className="flex items-center justify-between mb-1.5 px-3 py-1 rounded-lg bg-white/5 text-xs text-zinc-400">
            <span>Replying to <strong className="text-emerald-400">@{replyTo.username}</strong></span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="relative">
          <textarea
            id="comment-text-input"
            rows={2}
            maxLength={280}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={user ? 'Will this Short blow up? Share your analysis...' : 'Sign in to join the conversation'}
            disabled={!user}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 pr-20 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
          <div className="absolute right-2 bottom-2.5 flex items-center gap-2">
            <span
              className={`text-[10px] font-mono ${
                newText.length > 250 ? 'text-orange-400' : 'text-zinc-500'
              }`}
            >
              {280 - newText.length}
            </span>
            <button
              id="comment-submit-btn"
              type="submit"
              disabled={submitting || !newText.trim() || !user}
              className="flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-40 transition-all"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No comments yet. Be the first to share your take!
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-white/10">
                    {c.username.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-white">@{c.username}</span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleLike(c.id)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      likedIds.has(c.id) ? 'text-rose-400' : 'text-zinc-500 hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${likedIds.has(c.id) ? 'fill-current' : ''}`} />
                    <span className="font-mono text-[11px]">{c.likeCount || 0}</span>
                  </button>

                  <button
                    onClick={() => setReplyTo(c)}
                    className="text-zinc-500 hover:text-white transition-colors"
                    title="Reply"
                  >
                    <CornerDownRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleReport(c.id)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    title="Report"
                  >
                    <Flag className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed break-words">{c.text}</p>
              {reportedIds.has(c.id) && (
                <span className="inline-block mt-1 text-[10px] text-zinc-500 italic">Reported for moderation</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
