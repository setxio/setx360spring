import React from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  vendors: any[];
  onRefresh: () => void;
}

export const AdminVendorsTab: React.FC<Props> = ({ vendors, onRefresh }) => (
  <div className="admin-card">
    <div className="card-header">
      <h3>Merchant Registry</h3>
      <button className="icon-btn" onClick={onRefresh}><RefreshCw size={18} /></button>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table className="premium-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Owner</th>
            <th>Trust Score</th>
            <th>Performance</th>
            <th>Status</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(vendor => (
            <tr key={vendor.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{vendor.name}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{vendor.business_type || 'Retail'}</div>
              </td>
              <td>{vendor.profiles?.name || 'Unknown'}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ height: 8, flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${vendor.trust_score || 85}%`, background: (vendor.trust_score || 85) > 80 ? '#10b981' : '#f59e0b' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{vendor.trust_score || 85}%</span>
                </div>
              </td>
              <td>
                <div style={{ fontSize: '0.8rem' }}>📦 {vendor.fulfillment_rate || 100}% Fill</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>⏱️ {vendor.response_time_hours || 24}h Resp</div>
              </td>
              <td><span className={`role-badge ${vendor.status}`}>{vendor.status}</span></td>
              <td>{new Date(vendor.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
