import React from 'react';
import { useApp } from '../../context/AppContext';
import { CivicDashboard } from './CivicDashboard';
import { CreatorDashboard } from './CreatorDashboard';
import { DriverDashboard } from './DriverDashboard';
import { MasterBusinessDashboard } from './MasterBusinessDashboard';
import { MinistryDashboard } from './MinistryDashboard';
import { RestaurantDashboard } from './RestaurantDashboard';
import { ServicesDashboard } from './ServicesDashboard';
import { VendorDashboard } from './VendorDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';
import { Loader2 } from 'lucide-react';

export const DashboardPortal: React.FC = () => {
  const { user, activeContext } = useApp();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // Only Super Admins can access the Super Admin Dashboard when no context is selected
  const isSuperAdmin = user.role?.toLowerCase() === 'super admin';

  if (!activeContext && isSuperAdmin) {
    return <AdminDashboard user={user} />;
  }

  if (!activeContext) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>No Workspace Selected</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Please select a workspace from your portal.</p>
        <button 
          style={{ padding: '8px 24px', background: '#8b5cf6', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => window.location.href = '/?env=me'}
        >
          Return to Portal
        </button>
      </div>
    );
  }

  // Route to the correct dashboard based on PageType
  const pageType = activeContext.page_type?.toLowerCase() || '';

  switch (pageType) {
    case 'business':
    case 'merchant':
    case 'retail':
      return <MasterBusinessDashboard user={user as any} />;
    case 'artist':
    case 'creator':
    case 'media':
      return <CreatorDashboard user={user as any} />;
    case 'official':
    case 'chamber':
    case 'civic':
    case 'non_profit':
      return <CivicDashboard user={user as any} />;
    case 'gig':
    case 'driver':
      return <DriverDashboard user={user as any} />;
    case 'church':
    case 'ministry':
      return <MinistryDashboard user={user as any} />;
    case 'restaurant':
    case 'food':
    case 'venue':
      return <RestaurantDashboard user={user as any} />;
    case 'services':
      return <ServicesDashboard user={user as any} />;
    case 'vendor':
      return <VendorDashboard user={user as any} />;
    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dashboard Under Construction</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>The dashboard for {pageType} is not yet available.</p>
          <button 
            style={{ padding: '8px 24px', background: '#8b5cf6', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => window.location.href = '/?env=me'}
          >
            Return to Portal
          </button>
        </div>
      );
  }
};

export default DashboardPortal;
