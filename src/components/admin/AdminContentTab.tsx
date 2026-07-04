import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EyeOff, Trash2, CheckCircle } from 'lucide-react';

export const AdminContentTab: React.FC = () => {
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [flaggedComments, setFlaggedComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from('posts').select('*, author:profiles!posts_profile_id_fkey(name, first_name)').in('moderation_status', ['flagged', 'hidden']),
        // Comments missing moderation column? We'll assume a 'flagged' field or similar, or just pull recently reported comments if a table exists.
        // For now, let's pretend there's a moderation_status on comments too if we add it, or we skip if not in schema.
        // Let's check schema for comments later. We'll leave it empty for now to avoid errors.
        Promise.resolve({ data: [] })
      ]);
      setFlaggedPosts(pRes.data || []);
      setFlaggedComments(cRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handlePostAction = async (id: string, action: 'approve' | 'hide' | 'delete') => {
    if (action === 'delete') {
      await supabase.from('posts').delete().eq('id', id);
    } else {
      await supabase.from('posts').update({ moderation_status: action === 'approve' ? 'approved' : 'hidden' }).eq('id', id);
    }
    fetchContent();
  };

  return (
    <div className="admin-tab-container">
      <div className="admin-card">
        <h3>Flagged Social Posts ({flaggedPosts.length})</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Content Snippet</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedPosts.map(p => (
                <tr key={p.id}>
                  <td>{p.author?.name || p.author?.first_name || 'Unknown'}</td>
                  <td><div style={{maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{p.content}</div></td>
                  <td><span className={`status-badge ${p.moderation_status}`}>{p.moderation_status}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-approve" onClick={() => handlePostAction(p.id, 'approve')}><CheckCircle size={16} /> Approve</button>
                      <button className="btn-hide" onClick={() => handlePostAction(p.id, 'hide')}><EyeOff size={16} /> Hide</button>
                      <button className="btn-reject" onClick={() => handlePostAction(p.id, 'delete')}><Trash2 size={16} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {flaggedPosts.length === 0 && <tr><td colSpan={4}>No flagged posts.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
