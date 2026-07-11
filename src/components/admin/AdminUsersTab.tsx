import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        supabase.from('verifications').select('*, profiles(*)').eq('status', 'pending'),
        supabase.from('profiles').select('*').eq('identity_disputed', true)
      ]);
      setVerifications(vRes.data || []);
      setDisputes(dRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleVerification = async (id: string, profileId: string, requestedRole: string, isApproval: boolean) => {
    const status = isApproval ? 'approved' : 'rejected';
    const { error } = await supabase.from('verifications').update({ status }).eq('id', id);

    if (!error && isApproval && profileId) {
      // If approved, update the profile to the requested role (e.g. 'verified_pro')
      // Also ensure is_verified is set to true
      await supabase.from('profiles').update({ role: requestedRole, is_verified: true }).eq('id', profileId);
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('platform_activity').insert({
        action_type: 'verification_approved',
        description: `Approved verification for ${profileId} (Role updated to ${requestedRole})`,
        user_id: user?.id
      });
    }
    fetchUsers();
  };

  return (
    <div className="admin-tab-container">
      <div className="admin-card">
        <h3>Pending Verifications ({verifications.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map(v => (
                <tr key={v.id}>
                  <td>{v.profiles?.name || v.profiles?.first_name}</td>
                  <td>{v.verification_type}</td>
                  <td><span className="status-badge pending">Pending</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-approve" onClick={() => handleVerification(v.id, v.profile_id || v.user_id, v.requested_role, true)}><CheckCircle size={16} /> Approve</button>
                      <button className="btn-reject" onClick={() => handleVerification(v.id, v.profile_id || v.user_id, v.requested_role, false)}><XCircle size={16} /> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {verifications.length === 0 && <tr><td colSpan={4}>No pending verifications.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card mt-6">
        <h3 className="text-amber-500 flex items-center gap-2"><AlertTriangle size={20} /> Identity Disputes ({disputes.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Reason</th>
                <th>Date Flagged</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d.id}>
                  <td>{d.name || d.first_name}</td>
                  <td>{d.dispute_reason}</td>
                  <td>{new Date(d.dispute_date).toLocaleDateString()}</td>
                </tr>
              ))}
              {disputes.length === 0 && <tr><td colSpan={3}>No identity disputes.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
