'use client';

import Link from 'next/link';
import { Users, Plus, Check } from 'lucide-react';
import { useState } from 'react';

interface CommunityCardProps {
  community: any;
  onJoin?: (communityId: string) => void;
  isMember?: boolean;
}

export default function CommunityCard({ community, onJoin, isMember = false }: CommunityCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onJoin?.(community.id);
    } finally {
      setIsLoading(false);
    }
  };

  const memberCount = community.members?.length || 0;

  return (
    <Link href={`/communities/${community.id}`}>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer">
        {community.avatar_url && (
          <img
            src={community.avatar_url}
            alt={community.name}
            className="w-full h-40 object-cover rounded-lg mb-3"
          />
        )}
        
        <h3 className="font-semibold text-lg text-zinc-900 dark:text-white mb-1 line-clamp-2">
          {community.name}
        </h3>
        
        {community.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
            {community.description}
          </p>
        )}

        {community.category && (
          <div className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-2 py-1 rounded-full mb-3">
            {community.category}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <Users size={16} />
            <span>{memberCount} members</span>
          </div>

          {isMember && (
            <button
              disabled
              className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded flex items-center gap-1"
            >
              <Check size={14} />
              Member
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
