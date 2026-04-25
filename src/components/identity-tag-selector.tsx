'use client';

import { X } from 'lucide-react';
import { getTopTags } from '@/lib/identity-tags';

interface IdentityTagSelectorProps {
  value: string | null;
  onChange: (tag: string | null) => void;
}

export function IdentityTagSelector({ value, onChange }: IdentityTagSelectorProps) {
  const tags = getTopTags();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 10).map((tag) => {
          const isSelected = value === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(isSelected ? null : tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tag}
              {isSelected && <X size={13} strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Your selected identity will be visible to followers on your posts
      </p>
    </div>
  );
}
