import React, { useRef, useState } from 'react';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { CastMember } from '../types';
import { getProfileUrl } from '../services/tmdb';
import { useApp } from '../context/AppContext';

interface CastCarouselProps {
  cast: CastMember[];
}

export const CastCarousel: React.FC<CastCarouselProps> = ({ cast }) => {
  const { setActivePersonId } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!cast || cast.length === 0) return null;

  const topCast = cast.slice(0, 20);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollDistance = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-400">
          Top Cast & Crew
        </h2>
        <span className="text-xs text-zinc-500">{topCast.length} Members</span>
      </div>

      <div className="relative group/cast -mx-2 px-2">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll cast left"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white shadow-xl backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll cast right"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white shadow-xl backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory"
        >
          {topCast.map((person) => {
            const headshotUrl = getProfileUrl(person.profile_path, 'w185');

            return (
              <div
                key={person.id}
                onClick={() => setActivePersonId(person.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActivePersonId(person.id);
                  }
                }}
                className="group flex w-[110px] sm:w-[130px] shrink-0 flex-col items-center text-center snap-start cursor-pointer transition-transform hover:scale-105"
              >
                {/* Headshot */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-zinc-900 border border-[#1f1f26] shadow-sm">
                  {headshotUrl ? (
                    <img
                      src={headshotUrl}
                      alt={person.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Name & Character */}
                <div className="mt-2 w-full px-1">
                  <p className="truncate text-xs font-semibold text-white group-hover:text-[#e50914] transition-colors" title={person.name}>
                    {person.name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-400 mt-0.5" title={person.character}>
                    {person.character || 'Self'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
