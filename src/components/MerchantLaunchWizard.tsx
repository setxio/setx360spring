"use client";

import type { User } from '../types/user';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Store, Globe, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export const MerchantLaunchWizard = ({ user }: { user: User }) => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setBusinessName(name);
    if (step === 1) {
      setSlug(generateSlug(name));
    }
  };

  const handleSubmit = async () => {
    if (!businessName || !slug) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          owner_id: user.id,
          business_name: businessName,
          slug: slug
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('That subdomain is already taken.');
        throw error;
      }

      setSuccess(true);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during provisioning.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '32px', color: '#111' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: '#f3e8ff', color: '#9333ea', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Store size={24} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>SETX.io B2B Launch</h2>
        <p style={{ color: '#6b7280', margin: '8px 0 0', fontSize: '0.9rem' }}>Deploy your sovereign digital storefront instantly.</p>
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Business Name</label>
            <input 
              type="text" 
              value={businessName}
              onChange={handleNameChange}
              placeholder="e.g., Groves Pecan Boutique"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
            />
          </div>
          <button 
            onClick={() => setStep(2)}
            disabled={!businessName.trim()}
            style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: businessName.trim() ? 'pointer' : 'not-allowed', opacity: businessName.trim() ? 1 : 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Choose your SETX.io Subdomain</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
              <input 
                type="text" 
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '1rem', background: '#f9fafb' }}
              />
              <div style={{ padding: '0 16px', color: '#6b7280', fontWeight: 500, background: '#f3f4f6', borderLeft: '1px solid #d1d5db', display: 'flex', alignItems: 'center', height: '100%' }}>
                .setx.io
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={12} /> You can map a custom domain later.
            </p>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setStep(1)}
              style={{ padding: '12px', background: '#fff', color: '#111', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Back
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !slug}
              style={{ flex: 1, padding: '12px', background: '#9333ea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Provisioning Vault...</> : 'Deploy Storefront'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && success && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Storefront Deployed!</h3>
          <p style={{ color: '#6b7280', margin: '8px 0 24px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Your secure multi-tenant vault is active.<br/>
            You can now visit <strong>{slug}.setx.io</strong>
          </p>
          <a 
            href={`http://${slug}.setx.io`} 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'inline-block', width: '100%', padding: '12px', background: '#111', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Open Dashboard
          </a>
        </div>
      )}
    </div>
  );
};
