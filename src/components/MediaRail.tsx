import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import { PosterCard } from './PosterCard';

interface MediaRailProps {
  title: string;
  items: MediaItem[];
  headerRight?: React.ReactNode;
  onViewAll?: () => void;
  getEpisodeBadge?: (item: MediaItem) => string | undefined;
  getSubBadge?: (item: MediaItem) => string | undefined;
  isLoading?: boolean;
}

export const MediaRail: React.FC<MediaRailProps> = ({
  title,
  items,
  headerRight,
  onViewAll,
  getEpisodeBadge,
  getSubBadge,
  isLoading = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="relative my-6 md:my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Rail Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#f8fafc]">{title}</h2>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs font-semibold text-[#e50914] hover:underline cursor-pointer"
            >
              See all
            </button>
          )}
        </div>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>

      {/* Rail Carousel Container with Chevrons */}
      <div className="group/rail relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Left Arrow Button (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label={`Scroll ${title} left`}
            className="hidden md:flex absolute left-2 lg:left-4 top-[40%] -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white shadow-xl backdrop-blur-md border border-zinc-800 transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow Button (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label={`Scroll ${title} right`}
            className="hidden md:flex absolute right-2 lg:right-4 top-[40%] -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-black/80 text-white shadow-xl backdrop-blur-md border border-zinc-800 transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scrollable List */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-[130px] sm:w-[160px] md:w-[180px] shrink-0 snap-start animate-pulse"
                >
                  <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800/80" />
                  <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-800" />
                  <div className="mt-1 h-3 w-1/2 rounded bg-zinc-800/60" />
                </div>
              ))
            : items.map((item) => (
                <div
                  key={`${item.id}-${item.media_type || 'm'}`}
                  className="w-[130px] sm:w-[160px] md:w-[180px] shrink-0 snap-start"
                >
                  <PosterCard
                    item={item}
                    episodeBadge={getEpisodeBadge ? getEpisodeBadge(item) : undefined}
                    subBadge={getSubBadge ? getSubBadge(item) : undefined}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};
