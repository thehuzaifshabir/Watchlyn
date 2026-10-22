import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, AlertCircle, ShieldCheck, PlayCircle, Clock } from 'lucide-react';
import { VIDEO_SERVERS, getEmbedUrl, VideoServer } from '../utils/player';
import { formatProgressTime } from '../utils/formatters';
import { useApp } from '../context/AppContext';

interface VideoPlayerProps {
  mediaType: 'movie' | 'tv';
  tmdbId: number;
  season?: number;
  episode?: number;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  isAnime?: boolean;
  onEpisodeEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  mediaType,
  tmdbId,
  season = 1,
  episode = 1,
  title,
  posterPath,
  backdropPath,
  onEpisodeEnded,
}) => {
  const { getSavedProgress, saveWatchProgress, flushWatchProgress } = useApp();

  const [activeServerId, setActiveServerId] = useState<string>('vidy');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);

  // Retrieve saved progress from storage for this specific title and episode
  const savedItem = getSavedProgress(tmdbId, mediaType, season, episode);
  const initialSavedSeconds =
    savedItem && savedItem.progressSeconds && savedItem.progressSeconds > 5
      ? savedItem.progressSeconds
      : undefined;

  const [resumeSeconds] = useState<number | undefined>(initialSavedSeconds);

  // Construct active embed URL
  const activeEmbedUrl = getEmbedUrl({
    serverId: activeServerId,
    mediaType,
    tmdbId,
    season,
    episode,
    progressSeconds: resumeSeconds,
  });

  const handleServerChange = (serverId: string) => {
    if (serverId !== activeServerId) {
      flushWatchProgress();
      setIsIframeLoading(true);
      setActiveServerId(serverId);
    }
  };

  const handleReload = () => {
    setIsIframeLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  // Immediate sync when Season or Episode changes
  useEffect(() => {
    flushWatchProgress();
  }, [season, episode, flushWatchProgress]);

  // Immediate sync when navigating away (visibilitychange or unmount)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushWatchProgress();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      flushWatchProgress();
    };
  }, [flushWatchProgress]);

  // Real-Time Watch Progress Sync via window.postMessage (Vidy Player Event Integration)
  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const payload = JSON.parse(event.data);

        // 1. Handle PLAYER_EVENT (timeupdate, play, pause, ended)
        if (
          payload.event === 'timeupdate' ||
          payload.event === 'pause' ||
          payload.event === 'ended' ||
          payload.event === 'play'
        ) {
          const currentTime = Math.floor(Number(payload.currentTime) || 0);
          const duration = Math.floor(Number(payload.duration) || 0);
          const isImmediate = payload.event === 'pause' || payload.event === 'ended';

          if (currentTime > 0) {
            saveWatchProgress(
              {
                tmdbId,
                mediaType,
                title,
                posterPath: posterPath || null,
                backdropPath: backdropPath || null,
                season: mediaType === 'tv' ? season : undefined,
                episode: mediaType === 'tv' ? episode : undefined,
                progressSeconds: currentTime,
                durationSeconds: duration > 0 ? duration : undefined,
              },
              isImmediate
            );
          }

          // Auto-advance parent UI state when a TV episode ends
          if (payload.event === 'ended' && mediaType === 'tv') {
            if (onEpisodeEnded) {
              onEpisodeEnded();
            }
          }
        }

        // 2. Also support MEDIA_DATA payloads if present
        if (payload.type === 'MEDIA_DATA' && payload.data) {
          const mediaTime = Math.floor(Number(payload.data.currentTime || payload.data.time) || 0);
          const mediaDur = Math.floor(Number(payload.data.duration) || 0);
          if (mediaTime > 0) {
            saveWatchProgress({
              tmdbId,
              mediaType,
              title,
              posterPath: posterPath || null,
              backdropPath: backdropPath || null,
              season: mediaType === 'tv' ? season : undefined,
              episode: mediaType === 'tv' ? episode : undefined,
              progressSeconds: mediaTime,
              durationSeconds: mediaDur > 0 ? mediaDur : undefined,
            });
          }
        }
      } catch {
        // Safely ignore non-JSON messages from unrelated browser extensions
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [tmdbId, mediaType, season, episode, title, posterPath, backdropPath, saveWatchProgress, onEpisodeEnded]);

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
      {/* Server Switcher Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121216] px-3 sm:px-4 py-2.5 border-b border-[#1f1f26]">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-[#e50914]" />
          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Streaming Servers:
          </span>
          {activeServerId === 'vidy' && resumeSeconds && resumeSeconds > 5 && (
            <div className="hidden sm:flex items-center gap-1 rounded bg-red-950/40 border border-red-800/40 px-2 py-0.5 text-[10px] text-red-400 font-bold">
              <Clock className="h-3 w-3" />
              <span>Auto-Resume at {formatProgressTime(resumeSeconds)}</span>
            </div>
          )}
        </div>

        {/* Server Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {VIDEO_SERVERS.map((server) => {
            const isSelected = activeServerId === server.id;
            return (
              <button
                key={server.id}
                type="button"
                onClick={() => handleServerChange(server.id)}
                className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer min-h-[36px] shrink-0 ${
                  isSelected
                    ? 'bg-[#e50914] text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <span>{server.name}</span>
                {server.badge && !isSelected && server.id !== 'vidy' ? (
                  <span className="hidden xl:inline text-[9px] text-zinc-500 font-normal">
                    ({server.badge})
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Reload server button */}
          <button
            type="button"
            onClick={handleReload}
            title="Reload player"
            aria-label="Reload stream"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isIframeLoading ? 'animate-spin text-[#e50914]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 16:9 Mandatory Responsive Video Container */}
      <div className="relative aspect-video w-full bg-black">
        {/* Shimmer loading spinner */}
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm text-zinc-400">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent mb-3" />
            <p className="text-xs font-medium text-zinc-300">
              Connecting to {activeServerId === 'vidy' ? 'Vidy (Server 1)' : activeServerId} stream...
            </p>
            {resumeSeconds && resumeSeconds > 5 && activeServerId === 'vidy' && (
              <p className="text-[11px] text-[#e50914] font-semibold mt-1">
                Resuming playback at {formatProgressTime(resumeSeconds)}
              </p>
            )}
            <p className="text-[11px] text-zinc-500 mt-1">If buffering occurs, switch servers above</p>
          </div>
        )}

        {/* Mandatory exact iframe implementation for unmuted autoplay & fullscreen with allow="encrypted-media; autoplay *; fullscreen *" */}
        <iframe
          key={`${activeEmbedUrl}-${reloadKey}`}
          src={activeEmbedUrl}
          title={title || 'Vidy Player'}
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="encrypted-media; autoplay *; fullscreen *"
          allowFullScreen
          onLoad={() => setIsIframeLoading(false)}
        />
      </div>

      {/* Video Footer Help & Server Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d0d10] px-3 sm:px-4 py-2 text-[11px] text-zinc-400 border-t border-[#1f1f26]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            {activeServerId === 'vidy'
              ? 'Vidy Primary Stream: Real-Time Progress Sync Active'
              : 'Backup Streaming Server'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-zinc-400">
          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
          <span>If video buffers, switch to Server 2 (VidKing) or Server 3 (VidSrc).</span>
        </div>
      </div>
    </div>
  );
};
