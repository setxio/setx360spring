import React, { useState } from 'react';
import { DollarSign, RefreshCw, CheckCircle, ShieldAlert, X, Trash2, Loader2, LucideUnlock, LucideLock } from 'lucide-react';
import { LucideUnlock as Unlock, Lock } from 'lucide-react';

interface Props {
  users: any[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  editingFeeUser: any;
  customFeesForm: { fee_percentage: string; base_fee: string };
  onEditFeeUser: (user: any) => void;
  onCloseFeeModal: () => void;
  onFeeFormChange: (form: { fee_percentage: string; base_fee: string }) => void;
  onSaveCustomFees: () => void;
  onToggleUserStatus: (userId: string, currentStatus: string) => void;
}

export const AdminDirectoryTab: React.FC<Props> = ({
  users, searchQuery, onSearchChange, onRefresh,
  editingFeeUser, customFeesForm, onEditFeeUser, onCloseFeeModal,
  onFeeFormChange, onSaveCustomFees, onToggleUserStatus
}) => (
  <div className="admin-card">
    <div className="card-header">
      <h3>Citizen Directory</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          placeholder="Search citizens..."
          style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className="icon-btn" onClick={onRefresh}><RefreshCw size={18} /></button>
      </div>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table className="premium-table">
        <thead>
          <tr>
            <th>Citizen</th><th>Role</th><th>Region</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users
            .filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">{user.name?.[0] || '?'}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                <td>{user.city || 'Unknown'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 900,
                    background: user.status === 'frozen' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: user.status === 'frozen' ? '#ef4444' : '#10b981'
                  }}>
                    {(user.status || 'active').toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="icon-btn"
                      style={{ width: 32, height: 32 }}
                      onClick={() => onEditFeeUser(user)}
                    >
                      <DollarSign size={14} />
                    </button>
                    <button onClick={() => onToggleUserStatus(user.id, user.status)} className="icon-btn" style={{ width: 32, height: 32 }}>
                      {user.status === 'frozen' ? <Unlock size={14} /> : <Lock size={14} />}
                    </button>
                    <button className="icon-btn" style={{ width: 32, height: 32, color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {editingFeeUser && (
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
        <div className="stat-card" style={{ maxWidth: 450, width: '100%', border: '1px solid var(--admin-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0 }}>Fee Override: {editingFeeUser.name}</h3>
            <button className="icon-btn" onClick={onCloseFeeModal} style={{ width: 32, height: 32 }}><X size={16} /></button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 24 }}>Leave fields empty to revert to global platform rates.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8, fontWeight: 700 }}>Custom Fee Percentage (%)</label>
              <input type="number" step="0.1" placeholder="e.g. 5.5"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                value={customFeesForm.fee_percentage}
                onChange={(e) => onFeeFormChange({ ...customFeesForm, fee_percentage: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8, fontWeight: 700 }}>Custom Base Fee ($)</label>
              <input type="number" step="0.50" placeholder="e.g. 1.00"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: '#fff' }}
                value={customFeesForm.base_fee}
                onChange={(e) => onFeeFormChange({ ...customFeesForm, base_fee: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="icon-btn" style={{ flex: 1, background: 'var(--admin-accent)', color: '#fff', fontWeight: 900, height: 48, width: 'auto' }} onClick={onSaveCustomFees}>Save Override</button>
              <button className="icon-btn" style={{ flex: 1, height: 48, width: 'auto' }} onClick={onCloseFeeModal}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
