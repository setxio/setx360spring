import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Building, ChevronLeft, ShieldCheck, Heart, MapPin, ExternalLink, CreditCard } from 'lucide-react';

const mockCharities = [
  {
    id: 'ch1',
    name: 'Southeast Texas Food Bank',
    category: 'Food Security',
    location: 'Beaumont, TX',
    ein: '74-25XXXXX',
    logo: 'https://images.unsplash.com/photo-1593113565694-c6f8716c0296?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1593113565694-c6f8716c0296?w=800&q=80',
    description: 'Providing meals and fighting hunger across 8 counties in Southeast Texas. Every $1 donated provides 4 meals to our neighbors in need.',
    website: 'https://setxfoodbank.org'
  },
  {
    id: 'ch2',
    name: 'Humane Society of SETX',
    category: 'Animal Welfare',
    location: 'Beaumont, TX',
    ein: '74-12XXXXX',
    logo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
    description: 'Dedicated to the welfare of animals. We provide shelter, medical care, and adoption services for thousands of homeless pets every year.',
    website: 'https://humanesociety.org'
  },
  {
    id: 'ch3',
    name: 'Boys & Girls Haven',
    category: 'Youth Services',
    location: 'Port Arthur, TX',
    ein: '74-45XXXXX',
    logo: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&q=80',
    description: 'Providing a safe, supportive home environment for children and youth in the foster care system who have experienced abuse or neglect.',
    website: 'https://boyhaven.org'
  },
  {
    id: 'ch4',
    name: 'Habitat for Humanity SETX',
    category: 'Housing',
    location: 'Orange, TX',
    ein: '74-88XXXXX',
    logo: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
    description: 'Bringing people together to build homes, communities and hope. We partner with families to build affordable housing.',
    website: 'https://habitat.org'
  }
];

export const CharitiesView: React.FC = () => {
  const { setEnv } = useApp();
  const [activeCharity, setActiveCharity] = useState<any>(null);

  if (activeCharity) {
    return (
      <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'var(--bg)', minHeight: '100vh' }}>
        <button 
          onClick={() => setActiveCharity(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '12px 0', marginBottom: '16px', fontWeight: 600 }}
        >
          <ChevronLeft size={20} /> Back to Directory
        </button>
        
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <img src={activeCharity.cover} alt={activeCharity.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          
          <div style={{ padding: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-40px', left: '24px', width: '80px', height: '80px', borderRadius: '16px', border: '4px solid var(--bg-card)', overflow: 'hidden', background: '#fff' }}>
              <img src={activeCharity.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ marginTop: '40px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeCharity.name} <ShieldCheck size={20} color="#10b981" />
              </h1>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <MapPin size={14} /> {activeCharity.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Building size={14} /> 501(c)(3) EIN: {activeCharity.ein}
                </span>
              </div>
              
              <span style={{ display: 'inline-block', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '24px' }}>
                {activeCharity.category}
              </span>

              <p style={{ color: 'var(--text)', lineHeight: 1.6, margin: '0 0 24px' }}>
                {activeCharity.description}
              </p>

              <button 
                style={{ width: '100%', background: '#10b981', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}
                onClick={() => alert('Stripe donation integration coming soon!')}
              >
                <Heart size={20} fill="currentColor" /> Donate Now
              </button>

              <a 
                href={activeCharity.website}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Visit Website <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={() => setEnv('home')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={24} color="#10b981" /> Charities
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>Support verified local nonprofits</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mockCharities.map(charity => (
          <div 
            key={charity.id} 
            onClick={() => setActiveCharity(charity)}
            style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9' }}>
              <img src={charity.logo} alt={charity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {charity.name} <ShieldCheck size={16} color="#10b981" />
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 8px', fontSize: '0.85rem' }}>{charity.category}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <MapPin size={12} /> {charity.location}
              </div>
            </div>
            
            <ChevronLeft size={20} color="var(--text-muted)" style={{ transform: 'rotate(180deg)' }} />
          </div>
        ))}
      </div>
    </div>
  );
};
