import React from 'react';
import { 
  ShieldCheck, 
  Target, 
  Lightbulb, 
  Briefcase, 
  Globe, 
  Users, 
  ArrowRight,
  Code,
  Zap,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './CorporateView.css';

export const CorporateView: React.FC = () => {
  const { setEnv, user, logout } = useApp();

  return (
    <div className="corporate-container fade-in">
      {/* Top Nav */}
      <nav className="corporate-nav glass">
        <div className="nav-logo">SETX<span>.IO</span></div>
        <div className="nav-links">
          <button className="nav-link">Solutions</button>
          <button className="nav-link" onClick={() => setEnv('labs')}>Labs</button>
          <div className="nav-divider"></div>
          
          {user ? (
            <>
              <span className="nav-user-brief">Hello, <strong>{user.full_name || 'Partner'}</strong></span>
              <button className="nav-link logout" onClick={() => logout()}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="nav-link login" onClick={() => setEnv('labs')}>Partner Login</button>
              <button className="nav-terminal-btn" onClick={() => setEnv('labs')}>
                <ShieldCheck size={16} /> Admin Terminal
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="corporate-hero">
        <div className="hero-content">
          <div className="badge">SETX.IO</div>
          <h1>Empowering Regional Innovation</h1>
          <p>We build the digital infrastructure that connects communities, powers local commerce, and drives civic engagement across Southeast Texas.</p>
          <div className="hero-actions">
            <button className="primary-corporate-btn">Our Solutions <ArrowRight size={18} /></button>
            <button className="secondary-corporate-btn">Contact Sales</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card c1"><ShieldCheck size={24} /> <span>Secure Infrastructure</span></div>
          <div className="floating-card c2"><Globe size={24} /> <span>Community Scaled</span></div>
          <div className="floating-card c3"><Zap size={24} /> <span>High Performance</span></div>
        </div>
      </header>

      {/* Values & Mission */}
      <section className="corporate-section">
        <div className="section-label">OUR FOUNDATION</div>
        <div className="section-grid">
          <div className="value-card glass">
            <Target className="icon" />
            <h3>Our Mission</h3>
            <p>To digitize the local experience, ensuring every citizen and business has access to world-class technology tailored to their specific regional needs.</p>
          </div>
          <div className="value-card glass">
            <Lightbulb className="icon" />
            <h3>Our Vision</h3>
            <p>A connected Southeast Texas where physical distance is bridged by digital excellence, fostering growth and transparency.</p>
          </div>
          <div className="value-card glass">
            <Users className="icon" />
            <h3>Our Values</h3>
            <p>Local-First, Radical Transparency, Relentless Innovation, and Community Empowerment.</p>
          </div>
        </div>
      </section>

      {/* Service Offerings */}
      <section className="corporate-section alt">
        <div className="section-label">SOLUTIONS</div>
        <h2>Service Offerings</h2>
        <div className="solutions-list">
          <div className="solution-item premium-card">
            <div className="solution-icon"><Briefcase /></div>
            <div className="solution-text">
              <h3>Community OS</h3>
              <p>The core engine behind SETX 360, providing social, commercial, and civic modules for regional ecosystems.</p>
            </div>
            <ArrowRight className="go-arrow" />
          </div>
          <div className="solution-item premium-card">
            <div className="solution-icon"><Code /></div>
            <div className="solution-text">
              <h3>Hyper-Local Commerce</h3>
              <p>Full-stack marketplace solutions for vendors, restaurants, and service providers with integrated logistics.</p>
            </div>
            <ArrowRight className="go-arrow" />
          </div>
          <div className="solution-item premium-card">
            <div className="solution-icon"><Building2 /></div>
            <div className="solution-text">
              <h3>Civic Transparency Portals</h3>
              <p>Direct-to-citizen communication tools for local governments, chambers of commerce, and non-profits.</p>
            </div>
            <ArrowRight className="go-arrow" />
          </div>
        </div>
      </section>

      {/* Labs Promo */}
      <section className="corporate-section labs-promo glass">
        <div className="promo-content">
          <Code className="promo-icon" />
          <h2>SETX Labs</h2>
          <p>The builder for the next generation of regional businesses. Create standalone websites that tie directly into the 360 ecosystem.</p>
          <button className="primary-corporate-btn" onClick={() => setEnv('labs')}>
            Explore Labs <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="corporate-footer">
        <div className="footer-logo">SETX<span>.IO</span></div>
        <p>&copy; 2026 SETX.IO Professional Services. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
