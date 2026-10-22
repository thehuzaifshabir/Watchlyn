import React, { useState } from 'react';
import { X, Plus, Check, Bookmark } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AddToListModal: React.FC = () => {
  const {
    addToListTarget,
    setAddToListTarget,
    lists,
    createList,
    addItemToList,
    removeItemFromList,
    isItemInList,
  } = useApp();

  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!addToListTarget) return null;

  const handleToggle = (listId: string) => {
    const inList = isItemInList(listId, addToListTarget.id);
    if (inList) {
      removeItemFromList(listId, addToListTarget.id);
    } else {
      addItemToList(listId, addToListTarget);
    }
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newId = createList(newListName.trim());
    addItemToList(newId, addToListTarget);
    setNewListName('');
    setIsCreating(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setAddToListTarget(null)}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#121216] border border-[#1f1f26] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f26]">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-[#e50914]" />
            <h2 id="add-to-list-title" className="text-base sm:text-lg font-bold text-white">
              Save to List
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAddToListTarget(null)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Item summary */}
        <div className="py-3 text-xs text-zinc-400 truncate border-b border-[#1f1f26]">
          Saving <span className="font-bold text-white">"{addToListTarget.title}"</span>
        </div>

        {/* Lists Checkbox Group */}
        <div className="mt-4 flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {lists.map((list) => {
            const checked = isItemInList(list.id, addToListTarget.id);

            return (
              <button
                key={list.id}
                type="button"
                onClick={() => handleToggle(list.id)}
                className={`flex items-center justify-between rounded-xl p-3 text-left transition-all cursor-pointer border ${
                  checked
                    ? 'bg-zinc-800/80 border-[#e50914]/80 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{list.name}</p>
                  <p className="text-[11px] text-zinc-500">{list.items.length} titles</p>
                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                    checked
                      ? 'bg-[#e50914] border-[#e50914] text-white'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {checked && <Check className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Create New List toggle */}
        <div className="mt-4 pt-4 border-t border-[#1f1f26]">
          {isCreating ? (
            <form onSubmit={handleCreateList} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="List name (e.g. Weekend Binge)..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1 rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#e50914] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newListName.trim()}
                className="rounded-xl bg-[#e50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700/80 p-2.5 text-xs font-semibold text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New List</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
