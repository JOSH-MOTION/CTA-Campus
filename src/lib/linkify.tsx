// src/lib/linkify.tsx
import React from 'react';

/**
 * Converts URLs in text to clickable links
 * @param text - The text that may contain URLs
 * @returns Array of React nodes with URLs converted to anchor tags
 */
export const linkify = (text: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};