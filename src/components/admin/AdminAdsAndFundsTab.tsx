import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Megaphone, CheckCircle, XCircle } from 'lucide-react';

export const AdminAdsAndFundsTab: React.FC = () => {
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [pendingFunds, setPendingFunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [aRes, fRes] = await Promise.all([
        supabase.from('ads').select('*, profile:profiles(name, first_name)').eq('status', 'pending'),
        // Assuming crowdfunds or charities have a pending status if we add moderation there
        Promise.resolve({ data: [] })
      ]);
      setPendingAds(aRes.data || []);
      setPendingFunds(fRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleAdStatus = async (id: string, action: 'active' | 'rejected') => {
    await supabase.from('ads').update({ status: action }).eq('id', id);
    fetchData();
  };

  return (
    <div className="admin-tab-container">
      <div className="admin-card">
        <h3>Pending Advertisements ({pendingAds.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Title</th>
                <th>Target Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingAds.map(ad => (
                <tr key={ad.id}>
                  <td>{ad.profile?.name || ad.profile?.first_name || 'Unknown'}</td>
                  <td>{ad.title}</td>
                  <td>{ad.target_category || 'General'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-approve" onClick={() => handleAdStatus(ad.id, 'active')}><CheckCircle size={16}/> Approve</button>
                      <button className="btn-reject" onClick={() => handleAdStatus(ad.id, 'rejected')}><XCircle size={16}/> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingAds.length === 0 && <tr><td colSpan={4}>No pending ads.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
