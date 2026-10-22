import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeBackup, validateAndParseBackup } from './storage.ts';
import { UserCustomList, ContinueWatchingItem } from '../types';

test('serializeBackup and validateAndParseBackup round-trip correctly', () => {
  const dummyLists: UserCustomList[] = [
    {
      id: 'list-1',
      name: 'Sci-Fi Gold',
      description: 'Best space movies',
      isDefault: false,
      createdAt: 1700000000000,
      items: [
        {
          id: 157336,
          mediaType: 'movie',
          title: 'Interstellar',
          posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          year: '2014',
          rating: 8.6,
          addedAt: 1700000010000,
        },
      ],
    },
  ];

  const dummyHistory: ContinueWatchingItem[] = [
    {
      tmdbId: 1399,
      mediaType: 'tv',
      title: 'Game of Thrones',
      posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      season: 3,
      episode: 9,
      episodeTitle: 'The Rains of Castamere',
      timestamp: 1700000050000,
      updatedAt: 1700000050000,
    },
  ];

  const json = serializeBackup(dummyLists, dummyHistory);
  const parsed = validateAndParseBackup(json);

  assert.equal(parsed.lists.length, 1);
  assert.equal(parsed.lists[0].name, 'Sci-Fi Gold');
  assert.equal(parsed.lists[0].items[0].title, 'Interstellar');
  assert.equal(parsed.history.length, 1);
  assert.equal(parsed.history[0].tmdbId, 1399);
  assert.equal(parsed.history[0].season, 3);
  assert.equal(parsed.history[0].episode, 9);
});

test('validateAndParseBackup rejects invalid data', () => {
  assert.throws(() => validateAndParseBackup('not-a-json'));
  assert.throws(() => validateAndParseBackup('null'));
});
