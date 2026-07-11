import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Mail, Loader2, ShieldAlert, Trash2, Check, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TeamManager: React.FC = () => {
    const { activeContext, user } = useApp();
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (activeContext) {
            fetchMembers();
        }
    }, [activeContext]);

    const fetchMembers = async () => {
        setIsLoading(true);
        // We join with profiles to get the user's name/email if they are registered
        const { data, error } = await supabase
            .from('page_members')
            .select('*, profile:profiles(name, email, avatar_url)')
            .eq('page_id', activeContext?.id);
        
        if (!error && data) {
            setMembers(data);
        }
        setIsLoading(false);
    };

    const handleInvite = async () => {
        if (!inviteEmail) {
            setError('Please enter an email address.');
            return;
        }
        setIsInviting(true);
        setError('');
        setSuccess('');

        // 1. Check if user exists by email in profiles
        const { data: profiles, error: profileErr } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', inviteEmail.toLowerCase());

        let userIdToInvite = null;
        if (profiles && profiles.length > 0) {
            userIdToInvite = profiles[0].id;
        } else {
            // Note: In a real system you'd send an email invite link to register.
            // For now, if they aren't registered, we just log an error.
            setError('User not found. They must register an account first.');
            setIsInviting(false);
            return;
        }

        // 2. Check if already a member
        const isAlreadyMember = members.some(m => m.user_id === userIdToInvite);
        if (isAlreadyMember) {
            setError('User is already a member of this workspace.');
            setIsInviting(false);
            return;
        }

        // 3. Add to page_members
        const { error: insertErr } = await supabase.from('page_members').insert({
            page_id: activeContext?.id,
            user_id: userIdToInvite,
            access_level: inviteRole
        });

        if (insertErr) {
            setError(insertErr.message);
        } else {
            setSuccess('Team member added successfully!');
            setInviteEmail('');
            fetchMembers();
        }
        setIsInviting(false);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;
        
        const { error } = await supabase
            .from('page_members')
            .delete()
            .eq('id', memberId);
            
        if (!error) {
            setMembers(members.filter(m => m.id !== memberId));
        } else {
            alert('Failed to remove member: ' + error.message);
        }
    };

    if (!activeContext) return null;

    // Only allow owner or admin to manage team
    const currentUserMember = members.find(m => m.user_id === user?.id);
    const canManage = currentUserMember?.access_level === 'admin' || currentUserMember?.access_level === 'owner' || activeContext.owner_id === user?.id;

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="team-manager">
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} color="var(--primary)" />
                    Team Management
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Manage who has access to {activeContext.name}.
                </p>
            </div>

            {canManage && (
                <div className="premium-card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--bg-card)' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={18} /> Invite Team Member
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 250px' }}>
                            <input 
                                type="email" 
                                placeholder="Email address"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)' }}
                            />
                        </div>
                        <div style={{ flex: '0 1 150px' }}>
                            <select 
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-dark)' }}
                            >
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button 
                            className="primary-btn" 
                            onClick={handleInvite}
                            disabled={isInviting || !inviteEmail}
                            style={{ flex: '0 1 auto' }}
                        >
                            {isInviting ? <Loader2 className="animate-spin" size={18} /> : 'Send Invite'}
                        </button>
                    </div>
                    {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={16} /> {error}</p>}
                    {success && <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> {success}</p>}
                </div>
            )}

            <div className="members-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>Active Members</h4>
                {members.map(member => {
                    const profile = member.profile || {};
                    const isSelf = member.user_id === user?.id;
                    const isOwner = activeContext.owner_id === member.user_id;

                    return (
                        <div key={member.id} className="premium-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" /> : <Users size={20} color="var(--primary)" />}
                                </div>
                                <div>
                                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>
                                        {profile.name || 'Unknown User'} {isSelf && <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 400 }}>(You)</span>}
                                    </h5>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <Mail size={12} style={{ opacity: 0.5 }} />
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{profile.email || 'No email available'}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 600, 
                                    textTransform: 'capitalize',
                                    background: isOwner || member.access_level === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isOwner || member.access_level === 'admin' ? '#c4b5fd' : 'var(--text-muted)'
                                }}>
                                    {isOwner ? 'Owner' : member.access_level}
                                </span>
                                
                                {canManage && !isOwner && !isSelf && (
                                    <button 
                                        onClick={() => handleRemoveMember(member.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', opacity: 0.7, padding: '4px' }}
                                        title="Remove Member"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
