import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, X, Mail, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StaffManagementProps {
  entityId: string;
  entityType: 'business' | 'civic' | 'ministry' | 'creator';
  user: any;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ entityId, entityType, user }) => {
  if (!user) return null;
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState<'manager' | 'worker'>('worker');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [entityId]);

  const fetchStaff = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('staff_clearance')
      .select('*, profiles:profile_id(*)')
      .eq('entity_id', entityId);
    
    if (!error && data) {
      setStaff(data);
    }
    setIsLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);
    setSuccess(null);

    // 1. Find profile by email
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email)
      .single();

    if (findError || !profile) {
      setError("User not found with that email address.");
      setIsAdding(false);
      return;
    }

    // 2. Insert into staff_clearance
    const { error: insertError } = await supabase
      .from('staff_clearance')
      .insert({
        profile_id: profile.id,
        entity_id: entityId,
        entity_type: entityType,
        clearance_level: level
      });

    if (insertError) {
      if (insertError.code === '23505') {
        setError("This user already has clearance for this entity.");
      } else {
        setError("Failed to add staff member.");
      }
    } else {
      setSuccess(`Successfully granted clearance to ${profile.name}`);
      setEmail('');
      fetchStaff();
    }
    setIsAdding(false);
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!window.confirm("Are you sure you want to revoke this user's clearance?")) return;
    
    const { error } = await supabase
      .from('staff_clearance')
      .delete()
      .eq('id', staffId);

    if (!error) {
      setStaff(staff.filter(s => s.id !== staffId));
    }
  };

  return (
    <div className="staff-management fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Team Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Grant special dashboard clearance to regular users.</p>
        </div>
        <Users size={32} style={{ opacity: 0.2 }} />
      </div>

      <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} color="var(--primary)" /> Grant New Clearance
        </h3>
        <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input 
              type="email" 
              placeholder="worker@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}
            />
          </div>
          <select 
            value={level}
            onChange={e => setLevel(e.target.value as any)}
            style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}
          >
            <option value="worker">Worker Clearance</option>
            <option value="manager">Manager Clearance</option>
          </select>
          <button 
            type="submit" 
            className="primary-btn" 
            disabled={isAdding}
            style={{ padding: '10px 24px' }}
          >
            {isAdding ? <Loader2 className="animate-spin" size={18} /> : 'Grant Access'}
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '12px' }}>{error}</p>}
        {success && <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> {success}</p>}
      </div>

      <div className="staff-list">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Current Staff</h3>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>
        ) : staff.length === 0 ? (
          <div className="premium-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
            <p>No staff members have been added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {staff.map(member => (
              <div key={member.id} className="premium-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>
                    {member.profiles?.name?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{member.profiles?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {member.profiles?.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '4px 10px', borderRadius: '12px' }}>
                    <Shield size={12} /> {member.clearance_level}
                  </div>
                  <button 
                    onClick={() => handleRemoveStaff(member.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '50%', transition: 'all 0.2s' }}
                    className="delete-hover"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
