import React from 'react';

export const formatText = (text: string) => {
  if (!text) return null;

  // Regex to match #hashtags and @mentions
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} className="hashtag">
          {part}
        </span>
      );
    }
    if (part.startsWith('@')) {
      return (
        <span key={index} className="mention">
          {part}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};
