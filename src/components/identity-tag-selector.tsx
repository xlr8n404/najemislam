'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { getTopTags, searchTags } from '@/lib/identity-tags';

interface IdentityTagSelectorProps {
  value: string | null;
  onChange: (tag: string | null) => void;
}

export function IdentityTagSelector({ value, onChange }: IdentityTagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = searchQuery.trim() ? searchTags(searchQuery) : getTopTags();
  const hasExactMatch = suggestions.length > 0 && suggestions[0].toLowerCase() === searchQuery.toLowerCase();

  const handleSelect = (tag: string) => {
    onChange(tag);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">Highlight Your Identity</label>
      
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted rounded-lg border border-border/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search size={18} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search or select a tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-background border border-border rounded-lg shadow-lg z-10">
            {hasExactMatch ? (
              <button
                type="button"
                onClick={() => handleSelect(suggestions[0])}
                disabled={value === suggestions[0]}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-medium"
              >
                {suggestions[0]}
              </button>
            ) : (
              suggestions.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelect(tag)}
                  disabled={value === tag}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                >
                  {tag}
                </button>
              ))
            )}
          </div>
        )}

        {/* Click outside to close */}
        {showSuggestions && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowSuggestions(false)}
          />
        )}
      </div>

      {/* Selected Tag Display */}
      {value && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleClear()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {value}
            <X size={16} />
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Your selected identity will be visible to followers on your posts
      </p>
    </div>
  );
}
