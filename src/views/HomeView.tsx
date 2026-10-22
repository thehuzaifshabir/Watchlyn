import React, { useEffect, useState } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ContinueWatchingRail } from '../components/ContinueWatchingRail';
import { ProviderBar } from '../components/ProviderBar';
import { MediaRail } from '../components/MediaRail';
import {
  fetchTrendingAll,
  fetchTrendingMovies,
  fetchTrendingSeries,
  fetchMoviesByProvider,
  fetchSeriesByProvider,
  fetchAwardWinningMovies,
  fetchAwardWinningShows,
  fetchPsychologicalThrillers,
  fetchCannesAcclaimed,
  fetchTopRatedMovies,
  fetchTopRatedSeries,
  OTT_PROVIDERS,
} from '../services/tmdb';
import { MediaItem } from '../types';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { navigate } = useApp();

  // Hero
  const [trendingAll, setTrendingAll] = useState<MediaItem[]>([]);
  // Dynamic Rails
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<MediaItem[]>([]);
  // Provider Switchers
  const providerSwitchers = OTT_PROVIDERS.slice(0, 5); // Netflix, Disney+, Prime, Apple TV+, Max
  const [activeMovieProviderId, setActiveMovieProviderId] = useState<number>(8); // Netflix
  const [providerMovies, setProviderMovies] = useState<MediaItem[]>([]);
  const [activeSeriesProviderId, setActiveSeriesProviderId] = useState<number>(8); // Netflix
  const [providerSeries, setProviderSeries] = useState<MediaItem[]>([]);

  // Editorial Rails
  const [awardMovies, setAwardMovies] = useState<MediaItem[]>([]);
  const [awardShows, setAwardShows] = useState<MediaItem[]>([]);
  const [thrillers, setThrillers] = useState<MediaItem[]>([]);
  const [cannesAcclaimed, setCannesAcclaimed] = useState<MediaItem[]>([]);
  const [topMovies, setTopMovies] = useState<MediaItem[]>([]);
  const [topSeries, setTopSeries] = useState<MediaItem[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Initial Rail Data
  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      fetchTrendingAll('day'),
      fetchTrendingMovies('week'),
      fetchTrendingSeries('week'),
      fetchAwardWinningMovies(),
      fetchAwardWinningShows(),
      fetchPsychologicalThrillers(),
      fetchCannesAcclaimed(),
      fetchTopRatedMovies(1),
      fetchTopRatedSeries(1),
    ])
      .then(
        ([
          trendAll,
          trendMov,
          trendSer,
          awardMov,
          awardSer,
          psych,
          cannes,
          topMov,
          topSer,
        ]) => {
          if (!isCancelled) {
            setTrendingAll(trendAll);
            setTrendingMovies(trendMov);
            setTrendingSeries(trendSer);
            setAwardMovies(awardMov);
            setAwardShows(awardSer);
            setThrillers(psych);
            setCannesAcclaimed(cannes);
            setTopMovies(topMov.results);
            setTopSeries(topSer.results);
            setLoading(false);
          }
        }
      )
      .catch((err) => {
        console.error('Failed to load home rails:', err);
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch movies on provider switch
  useEffect(() => {
    let isCancelled = false;
    fetchMoviesByProvider(activeMovieProviderId)
      .then((data) => {
        if (!isCancelled) setProviderMovies(data);
      })
      .catch((err) => console.error(err));
    return () => {
      isCancelled = true;
    };
  }, [activeMovieProviderId]);

  // Fetch series on provider switch
  useEffect(() => {
    let isCancelled = false;
    fetchSeriesByProvider(activeSeriesProviderId)
      .then((data) => {
        if (!isCancelled) setProviderSeries(data);
      })
      .catch((err) => console.error(err));
    return () => {
      isCancelled = true;
    };
  }, [activeSeriesProviderId]);

  return (
    <div className="min-h-screen pb-12">
      {/* 1. Hero Banner Carousel */}
      <HeroBanner items={trendingAll} />

      {/* 2. Continue Watching Rail (Conditional) */}
      <ContinueWatchingRail />

      {/* 3. Browse by Provider Bar */}
      <ProviderBar />

      {/* 4. Trending Movies Rail */}
      <MediaRail
        title="Trending Movies"
        items={trendingMovies}
        isLoading={loading}
        onViewAll={() => navigate('/movies?sort=popularity.desc')}
      />

      {/* 5. Trending TV Series Rail */}
      <MediaRail
        title="Trending Series"
        items={trendingSeries}
        isLoading={loading}
        onViewAll={() => navigate('/series?sort=popularity.desc')}
      />

      {/* 6. Movies on Interactive Provider Switcher */}
      <MediaRail
        title="Movies on Demand"
        items={providerMovies}
        isLoading={providerMovies.length === 0}
        onViewAll={() => navigate(`/provider/${activeMovieProviderId}`)}
        headerRight={
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {providerSwitchers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveMovieProviderId(p.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer min-h-[32px] ${
                  activeMovieProviderId === p.id
                    ? 'bg-[#e50914] text-white shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        }
      />

      {/* 7. TV Series on Interactive Provider Switcher */}
      <MediaRail
        title="Series on Demand"
        items={providerSeries}
        isLoading={providerSeries.length === 0}
        onViewAll={() => navigate(`/provider/${activeSeriesProviderId}`)}
        headerRight={
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {providerSwitchers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveSeriesProviderId(p.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer min-h-[32px] ${
                  activeSeriesProviderId === p.id
                    ? 'bg-[#e50914] text-white shadow'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        }
      />

      {/* 8. Cinejoy Signature Editorial Rails */}
      {/* Award Winning Movies */}
      <MediaRail
        title="Award-Winning Movies"
        items={awardMovies}
        isLoading={loading}
        onViewAll={() => navigate('/movies?sort=vote_average.desc')}
      />

      {/* Award Winning Shows */}
      <MediaRail
        title="Emmy & Award-Winning Shows"
        items={awardShows}
        isLoading={loading}
        onViewAll={() => navigate('/series?sort=vote_average.desc')}
      />

      {/* Psychological Thrillers */}
      <MediaRail
        title="Mind-Bending & Psychological Thrillers"
        items={thrillers}
        isLoading={loading}
        onViewAll={() => navigate('/movies?genre=53')}
      />

      {/* Cannes / Critically Acclaimed */}
      <MediaRail
        title="Cannes & World Cinema Masterpieces"
        items={cannesAcclaimed}
        isLoading={loading}
        onViewAll={() => navigate('/movies?sort=vote_average.desc')}
      />

      {/* Top Rated Movies & Series */}
      <MediaRail
        title="Top Rated Movies of All Time"
        items={topMovies}
        isLoading={loading}
        onViewAll={() => navigate('/movies?sort=vote_average.desc')}
      />

      <MediaRail
        title="Top Rated TV Series"
        items={topSeries}
        isLoading={loading}
        onViewAll={() => navigate('/series?sort=vote_average.desc')}
      />
    </div>
  );
};
