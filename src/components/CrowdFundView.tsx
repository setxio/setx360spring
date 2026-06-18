import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { HeartHandshake, ChevronLeft, Search, Users, Target, Clock, ArrowRight, Share2, CreditCard } from 'lucide-react';

const mockCampaigns = [
  {
    id: 'c1',
    title: 'Help Sarah Rebuild After the Fire',
    creator: 'Community Neighbors',
    category: 'Emergency',
    goal: 50000,
    raised: 32450,
    backers: 412,
    daysLeft: 14,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    description: 'Sarah lost her family home to a devastating fire last week. We are raising funds to help her cover immediate expenses and secure temporary housing.'
  },
  {
    id: 'c2',
    title: 'Beaumont Youth Soccer Uniforms',
    creator: 'Coach Mike',
    category: 'Sports & Youth',
    goal: 5000,
    raised: 1200,
    backers: 45,
    daysLeft: 30,
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&q=80',
    description: 'Our local youth soccer team needs new uniforms and equipment for the upcoming season. Every little bit helps our kids stay active!'
  },
  {
    id: 'c3',
    title: 'Medical Expenses for Baby Leo',
    creator: 'The Martinez Family',
    category: 'Medical',
    goal: 100000,
    raised: 85000,
    backers: 1205,
    daysLeft: 5,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
    description: 'Leo was born with a rare heart condition. We are raising money for his upcoming specialized surgery and prolonged hospital stay.'
  },
  {
    id: 'c4',
    title: 'Community Garden Project',
    creator: 'Green Thumbs SETX',
    category: 'Community',
    goal: 2000,
    raised: 2100,
    backers: 89,
    daysLeft: 0,
    image: 'https://images.unsplash.com/photo-1416879598555-1416879598555?w=800&q=80',
    description: 'Turning the empty lot on 4th street into a vibrant community garden for fresh produce and neighborhood gatherings. Goal Reached!'
  }
];

export const CrowdFundView: React.FC = () => {
  const { setEnv } = useApp();
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (activeCampaign) {
    const progress = Math.min((activeCampaign.raised / activeCampaign.goal) * 100, 100);
    return (
      <div style={{ padding: '20px', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto', background: 'var(--bg)', minHeight: '100vh' }}>
        <button 
          onClick={() => setActiveCampaign(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '12px 0', marginBottom: '16px', fontWeight: 600 }}
        >
          <ChevronLeft size={20} /> Back to CrowdFund
        </button>
        
        <img src={activeCampaign.image} alt={activeCampaign.title} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '16px', marginBottom: '24px' }} />
        
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>{activeCampaign.title}</h1>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '1rem' }}>by <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeCampaign.creator}</span></p>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)', marginBottom: '24px', border: '1px solid var(--border)' }}>
          <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#10b981' : 'var(--primary)', borderRadius: '6px' }} />
          </div>
          
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>
            {formatCurrency(activeCampaign.raised)}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.9rem' }}>pledged of {formatCurrency(activeCampaign.goal)} goal</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{activeCampaign.backers.toLocaleString()}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Backers</p>
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{activeCampaign.daysLeft}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Days to go</p>
            </div>
          </div>

          <button 
            style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => alert('Stripe checkout integration coming soon!')}
          >
            <CreditCard size={20} /> Back this project
          </button>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>About this project</h3>
          <p style={{ color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
            {activeCampaign.description}
            <br/><br/>
            Your contribution makes a huge difference. Every donation, no matter how small, brings us closer to our goal and helps us support those in need in our community. Thank you for your generosity!
          </p>
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
            <HeartHandshake size={24} color="var(--primary)" /> CrowdFund
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>Help people who need help</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {mockCampaigns.map(campaign => {
          const progress = Math.min((campaign.raised / campaign.goal) * 100, 100);
          return (
            <div 
              key={campaign.id} 
              onClick={() => setActiveCampaign(campaign)}
              style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s' }}
            >
              <div style={{ position: 'relative', height: '160px' }}>
                <img src={campaign.image} alt={campaign.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {campaign.category}
                </div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.3 }}>{campaign.title}</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 16px', fontSize: '0.85rem' }}>by {campaign.creator}</p>
                
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#10b981' : 'var(--primary)', borderRadius: '3px' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: progress >= 100 ? '#10b981' : 'var(--primary)' }}>{formatCurrency(campaign.raised)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>raised</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Users size={14} /> {campaign.backers}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Clock size={14} /> {campaign.daysLeft > 0 ? `${campaign.daysLeft}d left` : 'Ended'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
