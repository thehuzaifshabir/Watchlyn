import React, { useEffect, useState } from 'react';
import { X, Star, Calendar, MapPin, Film, Clapperboard } from 'lucide-react';
import { PersonDetails, PersonCombinedCredits } from '../types';
import { fetchPersonDetails, fetchPersonCombinedCredits, getProfileUrl, getImageUrl } from '../services/tmdb';
import { useApp } from '../context/AppContext';
import { formatYear, formatRating } from '../utils/formatters';

export const PersonModal: React.FC = () => {
  const { activePersonId, setActivePersonId, navigate } = useApp();
  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonCombinedCredits | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activePersonId) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchPersonDetails(activePersonId),
      fetchPersonCombinedCredits(activePersonId),
    ])
      .then(([det, cred]) => {
        if (isMounted) {
          setDetails(det);
          // Sort credits by popularity and vote count
          const sortedCast = [...(cred.cast || [])].sort(
            (a, b) => (b.vote_count || 0) * (b.vote_average || 0) - (a.vote_count || 0) * (a.vote_average || 0)
          );
          setCredits({ ...cred, cast: sortedCast });
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load person credits:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePersonId]);

  if (!activePersonId) return null;

  const handleClose = () => {
    setActivePersonId(null);
  };

  const handleItemClick = (mediaType: 'movie' | 'tv', id: number) => {
    setActivePersonId(null);
    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-[#121216] border border-[#1f1f26] shadow-2xl p-5 sm:p-7 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e50914] border-t-transparent" />
            <p className="mt-4 text-xs text-zinc-400">Loading filmography...</p>
          </div>
        ) : details ? (
          <div>
            {/* Header: Profile picture, Name, Bio */}
            <div className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-[#1f1f26]">
              <div className="relative aspect-[3/4] w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 mx-auto sm:mx-0">
                {details.profile_path ? (
                  <img
                    src={getProfileUrl(details.profile_path, 'h632')}
                    alt={details.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
                    No Photo
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                <h2 id="person-modal-title" className="text-xl sm:text-2xl font-black text-white">
                  {details.name}
                </h2>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
                  {details.known_for_department && (
                    <span className="rounded bg-zinc-900 px-2 py-0.5 text-zinc-300 font-semibold border border-zinc-800">
                      {details.known_for_department}
                    </span>
                  )}
                  {details.place_of_birth && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{details.place_of_birth}</span>
                    </div>
                  )}
                  {details.birthday && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Born: {details.birthday}</span>
                    </div>
                  )}
                </div>

                {details.biography && (
                  <p className="mt-3 text-xs sm:text-sm text-zinc-300 line-clamp-4 leading-relaxed">
                    {details.biography}
                  </p>
                )}
              </div>
            </div>

            {/* Known For / Filmography Rail */}
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Clapperboard className="h-4 w-4 text-[#e50914]" />
                <span>Known For ({credits?.cast?.length || 0} Titles)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {(credits?.cast || []).slice(0, 24).map((item) => {
                  const title = item.title || item.name || 'Untitled';
                  const poster = getImageUrl(item.poster_path, 'w185');
                  const year = formatYear(item.release_date || item.first_air_date);
                  const rating = formatRating(item.vote_average);
                  const type = item.media_type === 'tv' ? 'tv' : 'movie';

                  return (
                    <div
                      key={`${item.id}-${type}`}
                      onClick={() => handleItemClick(type, item.id)}
                      className="group flex gap-2.5 rounded-xl bg-zinc-900/60 p-2 hover:bg-zinc-800 transition-colors border border-zinc-800 cursor-pointer"
                    >
                      <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-zinc-950">
                        {poster ? (
                          <img src={poster} alt={title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[8px] text-zinc-600">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        <p className="truncate text-xs font-semibold text-white group-hover:text-[#e50914]" title={title}>
                          {title}
                        </p>
                        <p className="truncate text-[10px] text-zinc-400" title={item.character}>
                          {item.character || 'Role'}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-zinc-500">
                          {year && <span>{year}</span>}
                          {rating !== 'NR' && (
                            <span className="flex items-center text-amber-400">
                              ★ {rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
