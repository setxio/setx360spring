import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import './ContactActionButtons.css';

interface ContactActionButtonsProps {
  contactId?: string;
  phone?: string;
  onMessageClick?: () => void;
  onCallClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const ContactActionButtons: React.FC<ContactActionButtonsProps> = ({
  contactId,
  phone,
  onMessageClick,
  onCallClick,
  size = 'medium'
}) => {
  
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCallClick) {
      onCallClick();
    } else if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      console.log('Open Standalone Phone App');
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessageClick) {
      onMessageClick();
    } else {
      console.log('Open Standalone Messages App for contact:', contactId);
    }
  };

  return (
    <div className={`contact-action-buttons size-${size}`}>
      <button className="action-btn call-btn" onClick={handleCall} title="Call">
        <Phone size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} />
      </button>
      <button className="action-btn message-btn" onClick={handleMessage} title="Message">
        <MessageSquare size={size === 'small' ? 16 : size === 'medium' ? 20 : 24} />
      </button>
    </div>
  );
};
