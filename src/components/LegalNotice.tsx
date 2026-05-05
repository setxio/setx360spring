import React, { useState } from 'react';
import { Shield, FileText, Copyright, ChevronLeft, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './LegalNotice.css';

interface LegalNoticeProps {
  onClose?: () => void;
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy' | 'copyright'>('tos');

  const { theme } = useApp();
  const isIO = theme.startsWith('io-');
  const brandName = isIO ? 'IO' : 'SETX 360';
  const companyName = isIO ? 'IO Platform' : 'SETX 360 Platform';

  return (
    <div className="legal-notice-container glass">
      <div className="legal-header">
        <div className="legal-header-content">
          <button className="back-btn" onClick={onClose}><ChevronLeft size={20} /> Back</button>
          <h1>Platform Guidelines</h1>
          <p>Protecting the {brandName} community and our users.</p>
        </div>
      </div>

      <div className="legal-tabs">
        <button 
          className={`legal-tab ${activeTab === 'tos' ? 'active' : ''}`}
          onClick={() => setActiveTab('tos')}
        >
          <FileText size={18} /> Terms of Service
        </button>
        <button 
          className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Shield size={18} /> Privacy Policy
        </button>
        <button 
          className={`legal-tab ${activeTab === 'copyright' ? 'active' : ''}`}
          onClick={() => setActiveTab('copyright')}
        >
          <Copyright size={18} /> Copyright Notice
        </button>
      </div>

      <div className="legal-content-scroll">
        {activeTab === 'tos' && (
          <div className="legal-document">
            <h2>Terms of Service</h2>
            <p className="last-updated">Last Updated: April 25, 2026</p>
            
            <section>
              <h3>1. Acceptance of Terms</h3>
              <p>By accessing or using {companyName} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h3>2. Financial Services & Fintech</h3>
              <p>{companyName} provides a digital ledger and wallet system (SEC). By using the financial features of the platform, you acknowledge:</p>
              <ul>
                <li>The digital wallet is a representation of value within the {brandName} ecosystem.</li>
                <li>Vendors and Drivers utilize Stripe Connect for fiat payouts. You must comply with Stripe's Services Agreement.</li>
                <li>{brandName} is a platform provider and is not responsible for the quality or delivery of products sold by independent vendors.</li>
              </ul>
            </section>

            <section>
              <h3>3. Refund Policy</h3>
              <p>Refunds are managed according to the specific policy set by each independent Vendor. In the absence of a vendor-specific policy, the {brandName} platform standard 30-day window applies. All refunds are processed back to the original payment method.</p>
            </section>

            <section>
              <h3>4. Civic Command & 311</h3>
              <p>The Civic Command center is a community communication tool. **DO NOT USE THIS PLATFORM FOR LIFE-THREATENING EMERGENCIES.** Always dial 911 for immediate emergency assistance.</p>
            </section>

            <section>
              <h3>6. Dispute Resolution</h3>
              <p>Any disputes arising from the use of {companyName} shall be resolved through binding arbitration in the jurisdiction of your local municipality. You waive your right to a jury trial or to participate in a class action lawsuit.</p>
            </section>

            <section>
              <h3>7. Limitation of Liability</h3>
              <p>{companyName} is provided "as is" without warranties of any kind. In no event shall {companyName}, its directors, or employees be liable for any indirect, incidental, or consequential damages resulting from your use of the platform, including financial losses or service interruptions.</p>
            </section>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="legal-document">
            <h2>Privacy Policy & GDPR Statement</h2>
            <p className="last-updated">Last Updated: April 25, 2026</p>
            
            <section>
              <h3>1. Data Collection & GDPR Compliance</h3>
              <p>We adhere to high privacy standards, including GDPR principles for our users. We collect:</p>
              <ul>
                <li><strong>Location Data:</strong> Necessary for "Town Boundary" filtering and 311 routing.</li>
                <li><strong>Identity Data:</strong> Name, age (minimum 16), and contact info.</li>
                <li><strong>Financial Data:</strong> Processed via Stripe.</li>
              </ul>
            </section>

            <section>
              <h3>2. Right to Data Portability & Access</h3>
              <p>In compliance with GDPR, you have the right to download a complete copy of all personal data we store about you. This includes your profile, posts, messages, and order history. This can be initiated via your Settings panel.</p>
            </section>

            <section>
              <h3>3. Third-Party Sharing</h3>
              <p>We share data only with essential service providers:</p>
              <ul>
                <li><strong>Stripe:</strong> For payment processing and KYC compliance.</li>
                <li><strong>Supabase:</strong> For secure database and authentication services.</li>
              </ul>
            </section>

            <section>
              <h3>4. Data Retention</h3>
              <p>We retain your data only for as long as your account is active. Upon account deletion, all personal data is purged from our active databases within 30 days.</p>
            </section>
          </div>
        )}

        {activeTab === 'copyright' && (
          <div className="legal-document">
            <h2>Intellectual Property & User Guidelines</h2>
            
            <section>
              <h3>1. Platform Ownership</h3>
              <p>All platform software, logos, and proprietary algorithms are the sole property of {companyName}.</p>
            </section>

            <section>
              <h3>2. User Generated Content</h3>
              <p>By posting content on {brandName}, you grant us a non-exclusive, royalty-free license to display and distribute that content within the platform ecosystem.</p>
            </section>

            <section>
              <h3>3. User Guidelines & Boundaries</h3>
              <ul>
                <li><strong>Town Boundary:</strong> To ensure neighborhood safety, users under the age of 18 are restricted to their town of residency. Engaging in "Neighbor-Hopping" or spoofing location to bypass these protections is strictly prohibited.</li>
                <li><strong>Local Communication:</strong> Messaging for minors is restricted to residents within their own verified community to ensure neighborhood safety and trust.</li>
                <li><strong>Respect:</strong> No harassment, hate speech, or spamming of local community boards.</li>
              </ul>
            </section>
          </div>
        )}
      </div>

      <div className="legal-footer">
        <p>© 2026 {companyName}. All Rights Reserved.</p>
        <div className="legal-links">
          <a href="mailto:support@setx360.com">Contact Support <ExternalLink size={14} /></a>
        </div>
      </div>
    </div>
  );
};
