import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import './LinkPreviewCard.css';

interface LinkPreviewData {
  title: string;
  description?: string;
  image?: string;
  url: string;
  domain: string;
}

interface LinkPreviewCardProps {
  url: string;
  compact?: boolean; // slim version for inside CreatePostModal
}

// Extract the first plain HTTP(S) URL from text, skipping YouTube (already embedded)
export function extractPreviewUrl(text: string): string | null {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const youtubeRegex = /(?:youtube\.com|youtu\.be)/;
  const matches = text.match(urlRegex) || [];
  for (const match of matches) {
    if (!youtubeRegex.test(match)) {
      try {
        new URL(match); // validate it's a real URL
        return match;
      } catch { /* skip */ }
    }
  }
  return null;
}

// Session-level cache so we never re-fetch the same URL
const ogCache: Record<string, LinkPreviewData | 'error'> = {};

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, compact = false }) => {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;

    // Check memory cache first
    if (ogCache[url]) {
      if (ogCache[url] !== 'error') setData(ogCache[url] as LinkPreviewData);
      setLoading(false);
      return;
    }

    // Check sessionStorage
    try {
      const stored = sessionStorage.getItem(`ogp_${url}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        ogCache[url] = parsed;
        setData(parsed);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    // Fetch via microlink.io — free public OG API, CORS-enabled
    fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`)
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success') {
          let domain = '';
          try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }
          const preview: LinkPreviewData = {
            title: json.data.title || domain,
            description: json.data.description,
            image: json.data.image?.url || json.data.screenshot?.url,
            url: json.data.url || url,
            domain,
          };
          ogCache[url] = preview;
          try { sessionStorage.setItem(`ogp_${url}`, JSON.stringify(preview)); } catch { /* ignore */ }
          setData(preview);
        } else {
          ogCache[url] = 'error';
        }
      })
      .catch(() => { ogCache[url] = 'error'; })
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className={`link-preview-card loading ${compact ? 'compact' : ''}`}>
        <div className="link-preview-shimmer" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-preview-card ${compact ? 'compact' : ''}`}
      onClick={e => e.stopPropagation()}
    >
      {data.image && !compact && (
        <div className="link-preview-image" style={{ backgroundImage: `url(${data.image})` }} />
      )}
      <div className="link-preview-body">
        <div className="link-preview-domain">
          <Globe size={12} />
          <span>{data.domain}</span>
        </div>
        <div className="link-preview-title">{data.title}</div>
        {data.description && !compact && (
          <div className="link-preview-desc">{data.description}</div>
        )}
      </div>
      <ExternalLink size={14} className="link-preview-external" />
    </a>
  );
};
