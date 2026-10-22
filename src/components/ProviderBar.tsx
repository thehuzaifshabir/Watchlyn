import React from 'react';
import { OTT_PROVIDERS } from '../services/tmdb';
import { useApp } from '../context/AppContext';

interface ProviderBarProps {
  selectedProviderId?: number;
  onSelect?: (providerId: number) => void;
}

// Crisp inline SVG brand icons for OTT networks
function getProviderIcon(id: number) {
  switch (id) {
    case 8: // Netflix
      return (
        <span className="font-black text-[#e50914] text-xs tracking-tighter">
          N
        </span>
      );
    case 337: // Disney+
      return (
        <span className="font-black text-[#3b82f6] text-[10px] tracking-tight">
          D+
        </span>
      );
    case 9: // Prime Video
      return (
        <span className="font-black text-[#00a8e1] text-[10px] tracking-tight">
          prime
        </span>
      );
    case 350: // Apple TV+
      return (
        <span className="font-bold text-white text-[10px]">
          tv+
        </span>
      );
    case 1899: // Max
      return (
        <span className="font-black text-[#60a5fa] text-[10px] tracking-wider">
          MAX
        </span>
      );
    case 386: // Peacock
      return (
        <span className="font-bold text-amber-400 text-[10px]">
          P•
        </span>
      );
    case 15: // Hulu
      return (
        <span className="font-black text-[#1ce783] text-[10px] tracking-tight">
          hulu
        </span>
      );
    case 531: // Paramount+
      return (
        <span className="font-black text-[#38bdf8] text-[10px]">
          P+
        </span>
      );
    default:
      return <span className="font-bold text-white text-xs">OTT</span>;
  }
}

export const ProviderBar: React.FC<ProviderBarProps> = ({ selectedProviderId, onSelect }) => {
  const { navigate } = useApp();

  const handleProviderClick = (providerId: number) => {
    if (onSelect) {
      onSelect(providerId);
    } else {
      navigate(`/provider/${providerId}`);
    }
  };

  return (
    <section className="my-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-400">
          Browse by Network / Provider
        </h2>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {OTT_PROVIDERS.map((provider) => {
          const isSelected = selectedProviderId === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderClick(provider.id)}
              aria-label={`Browse movies and shows on ${provider.name}`}
              className={`group flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 snap-start border cursor-pointer min-h-[44px] ${
                isSelected
                  ? 'bg-zinc-800 text-white border-[#e50914] shadow-lg shadow-red-950/40 ring-1 ring-[#e50914]'
                  : 'bg-[#121216] text-zinc-300 border-[#1f1f26] hover:bg-zinc-800/80 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {/* Provider Logo Emblem */}
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 border border-zinc-800/80 p-0.5 shadow-inner">
                {getProviderIcon(provider.id)}
              </div>
              <span className="whitespace-nowrap">{provider.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
