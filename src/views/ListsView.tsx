import React, { useState, useRef } from 'react';
import {
  Bookmark,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  Check,
  FolderOpen,
  Film,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PosterCard } from '../components/PosterCard';

export const ListsView: React.FC = () => {
  const {
    lists,
    createList,
    deleteList,
    renameList,
    removeItemFromList,
    exportBackup,
    importBackup,
    navigate,
  } = useApp();

  const [activeListId, setActiveListId] = useState<string>(lists[0]?.id || 'watchlist');
  const [isCreatingList, setIsCreatingList] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeList = lists.find((l) => l.id === activeListId) || lists[0];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newId = createList(newListName.trim());
    setActiveListId(newId);
    setNewListName('');
    setIsCreatingList(false);
  };

  const handleStartRename = (listId: string, currentName: string) => {
    setEditingListId(listId);
    setEditedName(currentName);
  };

  const handleSaveRename = (listId: string) => {
    if (editedName.trim()) {
      renameList(listId, editedName.trim());
    }
    setEditingListId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackup(content);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const totalTitles = lists.reduce((acc, curr) => acc + curr.items.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header with Title and Backup Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1f1f26]">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-[#e50914]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Saved Lists
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Organize movies and shows into custom watchlists. Export or restore your backup anytime.
          </p>
        </div>

        {/* Export / Import & New List Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportBackup}
            aria-label="Export lists JSON"
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[40px]"
          >
            <Download className="h-4 w-4 text-[#e50914]" />
            <span>Export (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import lists JSON"
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer min-h-[40px]"
          >
            <Upload className="h-4 w-4 text-[#e50914]" />
            <span>Import (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreatingList(true)}
            aria-label="Create new list"
            className="flex items-center gap-1.5 rounded-xl bg-[#e50914] hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-950/40 transition-all cursor-pointer min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>New List</span>
          </button>
        </div>
      </div>

      {/* Create New List Modal / Inline Form */}
      {isCreatingList && (
        <form
          onSubmit={handleCreateList}
          className="my-5 rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-center shadow-lg"
        >
          <div className="flex-1 w-full">
            <label htmlFor="new-list-name-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              List Title
            </label>
            <input
              id="new-list-name-input"
              type="text"
              autoFocus
              placeholder="e.g., Mind-Bending Thrillers, Weekend Binge..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 self-end sm:self-end mt-2 sm:mt-0">
            <button
              type="submit"
              disabled={!newListName.trim()}
              className="rounded-xl bg-[#e50914] px-5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer min-h-[40px]"
            >
              Create List
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingList(false)}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 cursor-pointer min-h-[40px]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Lists Tabs / Switcher */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {lists.map((list) => {
          const isSelected = list.id === activeListId;

          return (
            <button
              key={list.id}
              type="button"
              onClick={() => setActiveListId(list.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-zinc-800 border-[#e50914] text-white shadow-lg ring-1 ring-[#e50914]'
                  : 'bg-[#121216] border-[#1f1f26] text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <span>{list.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isSelected ? 'bg-[#e50914] text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {list.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active List Header & Renaming/Deletion Controls */}
      {activeList && (
        <div className="mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#121216] border border-[#1f1f26] p-4 sm:p-5">
          <div className="flex-1 min-w-[200px]">
            {editingListId === activeList.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(activeList.id)}
                  aria-label="Save list name"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">{activeList.name}</h2>
                {!activeList.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleStartRename(activeList.id, activeList.name)}
                    aria-label="Rename list"
                    className="text-zinc-500 hover:text-white p-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeList.items.length} {activeList.items.length === 1 ? 'title' : 'titles'} in this list
            </p>
          </div>

          {!activeList.isDefault && (
            <button
              type="button"
              onClick={() => deleteList(activeList.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors p-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete List</span>
            </button>
          )}
        </div>
      )}

      {/* List Items / Exact Cinejoy Empty State */}
      {activeList && activeList.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {activeList.items.map((item) => (
            <div key={`${item.mediaType}-${item.id}`} className="relative group">
              <PosterCard
                item={{
                  id: item.id,
                  title: item.title,
                  poster_path: item.posterPath,
                  release_date: item.year ? `${item.year}-01-01` : undefined,
                  vote_average: item.rating,
                  media_type: item.mediaType,
                }}
              />
              {/* Quick remove from this specific list */}
              <button
                type="button"
                onClick={() => removeItemFromList(activeList.id, item.id)}
                title="Remove from list"
                aria-label={`Remove ${item.title} from list`}
                className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-zinc-400 hover:text-red-400 hover:bg-black transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Exact Cinejoy Empty State required by prompt */
        <div className="my-12 py-16 px-4 text-center rounded-2xl bg-[#121216] border border-[#1f1f26] max-w-xl mx-auto shadow-xl">
          <FolderOpen className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">No lists yet</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
            No lists yet. Create a list to start organizing your movies and shows, or import a list file you exported earlier.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreatingList(true)}
              className="flex items-center gap-2 rounded-xl bg-[#e50914] px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-950/40 cursor-pointer min-h-[40px]"
            >
              <Plus className="h-4 w-4" />
              <span>Create List</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer min-h-[40px]"
            >
              <Upload className="h-4 w-4" />
              <span>Import List (.json)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
