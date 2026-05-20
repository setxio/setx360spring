import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Fetch Tenant Data
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*, custom_domains(domain_name)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !tenant) {
    notFound();
  }

  // 2. Render the White-Labeled Storefront
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '20px', marginBottom: '40px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#111' }}>{tenant.business_name}</h1>
        <p style={{ color: '#666', margin: '8px 0 0' }}>
          Powered by SETX.io • Merchant ID: {tenant.id.split('-')[0]}
        </p>
      </header>

      <main>
        <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Welcome to our store!</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
            This is a dynamically generated storefront served securely from the edge. 
            All customer data and inventory for <strong>{tenant.business_name}</strong> is strictly 
            isolated within their dedicated Supabase schema vault.
          </p>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              View Products
            </button>
            <button style={{ padding: '10px 20px', background: '#fff', color: '#000', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Login with SETX 360
            </button>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '60px', textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af' }}>
        &copy; {new Date().getFullYear()} {tenant.business_name}. Secure checkout via Stripe Connect.
      </footer>
    </div>
  );
}
