import React from 'react';
import { ShortsFeed } from './ShortsFeed';
import { VideosView } from './VideosView';
import { MusicView } from './MusicView';
import './MediaView.css';

interface MediaViewProps {
  activeTab: number;
  user: any;
  scope: string;
}

export const MediaView: React.FC<MediaViewProps> = ({ activeTab, user, scope }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <ShortsFeed user={user} scope={scope} />;
      case 1:
        return <VideosView user={user} scope={scope} />;
      case 2:
        return <MusicView user={user} scope={scope} />;
      default:
        return <ShortsFeed user={user} scope={scope} />;
    }
  };

  return (
    <div className="media-view-container">
      {renderContent()}
    </div>
  );
};
