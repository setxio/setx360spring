import React, { useState } from 'react';
import { Phone, Delete, Users, Clock } from 'lucide-react';
import { ContactsPlatform } from './ContactsPlatform';
import './PhoneView.css';

interface PhoneViewProps {
  user: any;
}

export const PhoneView: React.FC<PhoneViewProps> = ({ user }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad');

  const handleKeyPress = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber) {
      // In a real app, integrate with WebRTC / Twilio
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const formatPhoneNumber = (number: string) => {
    if (!number) return '';
    const cleaned = ('' + number).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}` + (match[3] ? `-${match[3]}` : '');
    }
    return number;
  };

  return (
    <div className="phone-platform">
      <div className="phone-tabs">
        <button className={`phone-tab ${activeTab === 'recents' ? 'active' : ''}`} onClick={() => setActiveTab('recents')}>
          <Clock size={24} />
          <span>Recents</span>
        </button>
        <button className={`phone-tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
          <Users size={24} />
          <span>Contacts</span>
        </button>
        <button className={`phone-tab ${activeTab === 'keypad' ? 'active' : ''}`} onClick={() => setActiveTab('keypad')}>
          <div className="keypad-icon">
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
          </div>
          <span>Keypad</span>
        </button>
      </div>

      <div className="phone-content" style={activeTab === 'contacts' ? { overflow: 'hidden' } : {}}>
        {activeTab === 'keypad' && (
          <div className="keypad-container">
            <div className="number-display">
              <h2>{formatPhoneNumber(phoneNumber) || ' '}</h2>
            </div>
            
            <div className="keypad-grid">
              <button className="keypad-btn" onClick={() => handleKeyPress('1')}>1<span className="letters"></span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('2')}>2<span className="letters">ABC</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('3')}>3<span className="letters">DEF</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('4')}>4<span className="letters">GHI</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('5')}>5<span className="letters">JKL</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('6')}>6<span className="letters">MNO</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('7')}>7<span className="letters">PQRS</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('8')}>8<span className="letters">TUV</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('9')}>9<span className="letters">WXYZ</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('*')}>*<span className="letters"></span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('0')}>0<span className="letters">+</span></button>
              <button className="keypad-btn" onClick={() => handleKeyPress('#')}>#<span className="letters"></span></button>
            </div>

            <div className="keypad-actions">
              <div style={{ width: 64 }}></div> {/* Spacer */}
              <button className="call-btn-large" onClick={handleCall}>
                <Phone size={32} color="#fff" />
              </button>
              <button className="delete-btn" onClick={handleDelete} disabled={!phoneNumber}>
                {phoneNumber && <Delete size={28} />}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'recents' && (
          <div className="recents-container" style={{ height: '100%', overflow: 'hidden' }}>
            <ContactsPlatform hideHeader={true} hideRecentTab={false} />
            <div className="phone-empty-state" style={{ display: 'none' }}>No recent calls</div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="contacts-container" style={{ height: '100%', overflow: 'hidden' }}>
            <ContactsPlatform hideHeader={true} hideRecentTab={true} />
          </div>
        )}
      </div>
    </div>
  );
};
