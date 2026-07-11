'use client';

import React, { useState } from 'react';

export default function CheckoutButton({
  siteId,
  productId,
  variations,
  productPrice,
  accentColor,
}: {
  siteId: string;
  productId: string;
  variations?: any[];
  productPrice: number;
  accentColor: string;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string>(
    variations && variations.length > 0 ? variations[0].id : ''
  );

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wb/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          product_id: productId,
          variation_id: selectedVariation || undefined,
          success_url: window.location.href,
          cancel_url: window.location.href,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during checkout');
      setLoading(false);
    }
  };

  return (
    <>
      {variations && variations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Select Variation:</label>
          <select
            value={selectedVariation}
            onChange={(e) => setSelectedVariation(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, background: '#fff' }}
          >
            {variations.map((v: any) => (
              <option key={v.id} value={v.id}>
                {Object.values(v.attributes).join(' / ')} - ${(v.price !== null ? v.price : productPrice).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{ width: '100%', background: loading ? '#ccc' : accentColor, color: '#fff', border: 'none', padding: '14px', borderRadius: 6, fontSize: '1.1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Redirecting to checkout...' : 'Add to Cart'}
      </button>
    </>
  );
}
