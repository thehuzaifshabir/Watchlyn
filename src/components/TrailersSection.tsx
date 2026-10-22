import React, { useState } from 'react';
import { Play, X, Video } from 'lucide-react';
import { VideoItem } from '../types';

interface TrailersSectionProps {
  videos: VideoItem[];
}

export const TrailersSection: React.FC<TrailersSectionProps> = ({ videos }) => {
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  // Filter YouTube trailers and teasers
  const trailers = (videos || []).filter(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip')
  );

  if (trailers.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Video className="h-4 w-4 text-[#e50914]" />
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-400">
          Official Trailers & Clips
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {trailers.slice(0, 8).map((vid) => {
          const thumbnail = `https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`;

          return (
            <div
              key={vid.id}
              onClick={() => setActiveVideoKey(vid.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveVideoKey(vid.key);
                }
              }}
              className="group relative flex w-[220px] sm:w-[260px] shrink-0 flex-col overflow-hidden rounded-xl bg-[#121216] border border-[#1f1f26] shadow-md snap-start cursor-pointer hover:border-zinc-700 transition-all"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                <img
                  src={thumbnail}
                  alt={vid.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e50914] text-white shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-2 left-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  {vid.type}
                </div>
              </div>

              <div className="p-2.5">
                <h3 className="truncate text-xs font-semibold text-white" title={vid.name}>
                  {vid.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      {activeVideoKey && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setActiveVideoKey(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveVideoKey(null)}
              aria-label="Close trailer"
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideoKey}?autoplay=1`}
              title="Official Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}
    </section>
  );
};
