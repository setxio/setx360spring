import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Store, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

export const AdminMarketTab: React.FC = () => {
  const [classifiedReports, setClassifiedReports] = useState<any[]>([]);
  const [gigDisputes, setGigDisputes] = useState<any[]>([]);
  const [storeApprovals, setStoreApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const [cRes, gRes, sRes] = await Promise.all([
        supabase.from('classified_reports').select('*, reporter:profiles!classified_reports_reporter_id_fkey(name), item:classified_items(*)').eq('status', 'pending'),
        supabase.from('gig_disputes').select('*, gig:gigs(*), requester:profiles!requester_id(name)').eq('status', 'Open'),
        // Store approvals could be merchants pending KYC or just stores pending verification
        // Let's assume stores with 'pending' status if status exists, otherwise empty for now
        Promise.resolve({ data: [] })
      ]);
      setClassifiedReports(cRes.data || []);
      setGigDisputes(gRes.data || []);
      setStoreApprovals(sRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <div className="admin-tab-container">
      <div className="admin-card">
        <h3>Classified Reports ({classifiedReports.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Reporter</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classifiedReports.map(r => (
                <tr key={r.id}>
                  <td>{r.item?.title || 'Unknown Item'}</td>
                  <td>{r.reporter?.name || 'Unknown'}</td>
                  <td>{r.reason}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-approve"><CheckCircle size={16}/> Dismiss</button>
                      <button className="btn-reject"><Trash2 size={16}/> Delete Item</button>
                    </div>
                  </td>
                </tr>
              ))}
              {classifiedReports.length === 0 && <tr><td colSpan={4}>No pending reports.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
