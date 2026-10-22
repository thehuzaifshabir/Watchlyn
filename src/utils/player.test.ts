import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmbedUrl, buildVidyEmbedUrl, VIDEO_SERVERS } from './player.ts';

test('buildVidyEmbedUrl builds exact Movie fresh start URL', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 315162,
    mediaType: 'movie',
  });
  assert.equal(url, 'https://vidy.st/movie/315162?color=DC2626&autoplay=true');
});

test('buildVidyEmbedUrl builds exact Movie resuming URL at 120s', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 315162,
    mediaType: 'movie',
    progressSeconds: 120,
  });
  assert.equal(url, 'https://vidy.st/movie/315162?color=DC2626&autoplay=true&progress=120');
});

test('buildVidyEmbedUrl ignores progress <= 5 seconds', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 315162,
    mediaType: 'movie',
    progressSeconds: 4,
  });
  assert.equal(url, 'https://vidy.st/movie/315162?color=DC2626&autoplay=true');
});

test('buildVidyEmbedUrl builds exact TV episode URL with TV flags', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 1396,
    mediaType: 'tv',
    season: 1,
    episode: 1,
  });
  assert.equal(
    url,
    'https://vidy.st/tv/1396/1/1?color=DC2626&autoplay=true&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true'
  );
});

test('buildVidyEmbedUrl builds TV episode with saved progress', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 1396,
    mediaType: 'tv',
    season: 2,
    episode: 4,
    progressSeconds: 450,
  });
  assert.equal(
    url,
    'https://vidy.st/tv/1396/2/4?color=DC2626&autoplay=true&progress=450&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true'
  );
});

test('buildVidyEmbedUrl builds exact Vidy TMDB route for anime and series with multi-season support', () => {
  const url = buildVidyEmbedUrl({
    tmdbId: 1429, // Attack on Titan
    mediaType: 'tv',
    season: 2,
    episode: 1,
  });
  assert.equal(
    url,
    'https://vidy.st/tv/1429/2/1?color=DC2626&autoplay=true&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true'
  );
});

test('getEmbedUrl defaults to Vidy as Server 1', () => {
  const url = getEmbedUrl({
    mediaType: 'movie',
    tmdbId: 550,
  });
  assert.equal(url, 'https://vidy.st/movie/550?color=DC2626&autoplay=true');
});

test('getEmbedUrl preserves fallback servers', () => {
  const vidKingMovie = getEmbedUrl({
    serverId: 'vidking',
    mediaType: 'movie',
    tmdbId: 550,
  });
  assert.equal(vidKingMovie, 'https://www.vidking.net/embed/movie/550?autoPlay=true');

  const vidSrcProTv = getEmbedUrl({
    serverId: 'vidsrc-pro',
    mediaType: 'tv',
    tmdbId: 1399,
    season: 1,
    episode: 1,
  });
  assert.equal(vidSrcProTv, 'https://vidsrc.cc/v2/embed/tv/1399/1/1');
});

test('VIDEO_SERVERS has Vidy as primary Server 1 with no AniList direct server', () => {
  assert.equal(VIDEO_SERVERS.length, 6);
  assert.equal(VIDEO_SERVERS[0].id, 'vidy');
  assert.equal(VIDEO_SERVERS[0].name, 'Server 1 (Vidy)');
  assert.equal(VIDEO_SERVERS.some((s) => s.id === 'anilist'), false);
});
