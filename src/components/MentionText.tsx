'use client';

import Link from 'next/link';

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className }: MentionTextProps) {
  if (!text || typeof text !== 'string') return null;

  // Split by mentions (@username), hashtags (#tag), and URLs
  const parts = text.split(/((?:https?:\/\/)[^\s]+|@\w+|#\w+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null;

        // Mention: @username
        if (/^@\w+$/.test(part)) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              href={`/${username}`}
              className="text-blue-500 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        // Hashtag: #tag
        if (/^#\w+$/.test(part)) {
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              href={`/search?q=%23${tag}`}
              className="text-blue-500 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        // URL: http/https
        if (/^https?:\/\//.test(part)) {
          let displayUrl = part;
          try {
            const url = new URL(part);
            displayUrl = url.hostname + (url.pathname !== '/' ? url.pathname : '');
          } catch {}
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 font-semibold hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl}
            </a>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
