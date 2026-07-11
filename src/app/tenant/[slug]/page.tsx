import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CheckoutButton from '@/components/CheckoutButton';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Check wb_sites first
  const { data: site } = await supabase
    .from('wb_sites')
    .select('name, tagline, white_label_config')
    .or(`subdomain.eq.${slug},custom_domain.eq.${slug}`)
    .eq('status', 'active')
    .single();

  if (site) {
    return {
      title: site.name,
      description: site.tagline || `Welcome to ${site.name}`,
    };
  }

  // Fall back to tenants
  const { data: tenant } = await supabase
    .from('tenants')
    .select('business_name')
    .eq('slug', slug)
    .single();

  return {
    title: tenant?.business_name || slug,
  };
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const postSlug = resolvedSearch.post as string | undefined;
  const pageSlug = resolvedSearch.page as string | undefined;
  const productSlug = resolvedSearch.product as string | undefined;

  // ─── Check if this slug belongs to a Website Builder site ──────────────────
  const { data: site } = await supabase
    .from('wb_sites')
    .select('*')
    .or(`subdomain.eq.${slug},custom_domain.eq.${slug}`)
    .eq('status', 'active')
    .single();

  if (site) {
    return <WbSiteRenderer site={site} postSlug={postSlug} pageSlug={pageSlug} productSlug={productSlug} />;
  }

  // ─── Fall back to original SETX.io merchant tenant logic ───────────────────
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*, custom_domains(domain_name)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !tenant) {
    notFound();
  }

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

// ─── Website Builder Public Renderer ───────────────────────────────────────────
async function WbSiteRenderer({
  site,
  postSlug,
  pageSlug,
  productSlug,
}: {
  site: any;
  postSlug?: string;
  pageSlug?: string;
  productSlug?: string;
}) {
  const wl = site.white_label_config || {};
  const accentColor = wl.accentColor || '#2271b1';
  const headingFont = wl.headingFont || 'Inter';
  const bodyFont = wl.bodyFont || 'Inter';

  // Fetch nav menu items
  const { data: menuItems } = await supabase
    .from('wb_menu_items')
    .select('*')
    .eq('site_id', site.id)
    .is('parent_id', null)
    .order('sort_order');

  // Fetch plugins config
  const { data: settings } = await supabase
    .from('wb_site_settings')
    .select('plugins_config')
    .eq('site_id', site.id)
    .single();
  const plugins = settings?.plugins_config || {};

  // If viewing a specific post
  if (postSlug) {
    const { data: post } = await supabase
      .from('wb_posts')
      .select('*')
      .eq('site_id', site.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) notFound();

    return (
      <SiteShell site={site} menuItems={menuItems || []} accentColor={accentColor} headingFont={headingFont} bodyFont={bodyFont}>
        <article style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0' }}>
          {post.featured_image_url && (
            <img src={post.featured_image_url} alt={post.title} style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 8, marginBottom: 32 }} />
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {(post.categories || []).map((cat: string) => (
              <span key={cat} style={{ background: accentColor + '22', color: accentColor, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{cat}</span>
            ))}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a', lineHeight: 1.3 }}>{post.title}</h1>
          {post.published_at && (
            <p style={{ color: '#888', fontSize: 14, margin: '0 0 32px' }}>
              {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
          <div
            style={{ lineHeight: 1.8, color: '#333', fontSize: '1.05rem' }}
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #eee' }}>
            {(post.tags || []).map((tag: string) => (
              <span key={tag} style={{ background: '#f0f0f1', color: '#666', padding: '3px 10px', borderRadius: 20, fontSize: 12, marginRight: 6 }}>#{tag}</span>
            ))}
          </div>
        </article>
      </SiteShell>
    );
  }

  // If viewing a specific static page
  if (pageSlug) {
    const { data: pg } = await supabase
      .from('wb_pages')
      .select('*')
      .eq('site_id', site.id)
      .eq('slug', pageSlug)
      .eq('status', 'published')
      .single();

    if (!pg) notFound();

    return (
      <SiteShell site={site} menuItems={menuItems || []} accentColor={accentColor} headingFont={headingFont} bodyFont={bodyFont}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 0' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 32, color: '#1a1a1a' }}>{pg.title}</h1>
          <div
            style={{ lineHeight: 1.8, color: '#333', fontSize: '1.05rem' }}
            dangerouslySetInnerHTML={{ __html: pg.content || '' }}
          />
        </div>
      </SiteShell>
    );
  }

  // If viewing a specific product
  if (productSlug) {
    const { data: prod } = await supabase
      .from('wb_products')
      .select('*')
      .eq('site_id', site.id)
      .eq('slug', productSlug)
      .eq('status', 'published')
      .single();

    if (!prod) notFound();

    const { data: variations } = await supabase
      .from('wb_product_variations')
      .select('*')
      .eq('product_id', prod.id)
      .order('price', { ascending: true });

    return (
      <SiteShell site={site} menuItems={menuItems || []} accentColor={accentColor} headingFont={headingFont} bodyFont={bodyFont}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 0', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            {prod.image_url ? (
              <img src={prod.image_url} alt={prod.title} style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1', background: '#f0f0f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>No Image</div>
            )}
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ fontSize: '2.5rem', margin: '0 0 8px', color: '#1a1a1a' }}>{prod.title}</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 600, color: accentColor, margin: '0 0 24px' }}>
              ${Number(prod.price).toFixed(2)}
            </p>
            <div style={{ color: '#444', lineHeight: 1.6, marginBottom: 32 }} dangerouslySetInnerHTML={{ __html: prod.description || '' }} />
            
            <CheckoutButton
              siteId={site.id}
              productId={prod.id}
              variations={variations || []}
              productPrice={Number(prod.price)}
              accentColor={accentColor}
            />
            <p style={{ fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center' }}>Secure checkout powered by Stripe Connect.</p>
          </div>
        </div>
      </SiteShell>
    );
  }

  // ── Homepage ─────────────────────────────────────────────────────────────────
  // Fetch published posts for the blog roll
  const { data: posts } = await supabase
    .from('wb_posts')
    .select('id, title, slug, excerpt, featured_image_url, categories, published_at, created_at')
    .eq('site_id', site.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  let storeProducts: any[] = [];
  if (plugins.ecommerce) {
    const { data: prods } = await supabase
      .from('wb_products')
      .select('id, title, slug, price, image_url')
      .eq('site_id', site.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(8);
    storeProducts = prods || [];
  }

  return (
    <SiteShell site={site} menuItems={menuItems || []} accentColor={accentColor} headingFont={headingFont} bodyFont={bodyFont}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`, borderRadius: 12, padding: '56px 40px', marginBottom: 48, textAlign: 'center', border: `1px solid ${accentColor}22` }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 16px', color: '#1a1a1a', lineHeight: 1.2 }}>{site.name}</h1>
        {site.tagline && <p style={{ fontSize: '1.15rem', color: '#555', margin: 0, maxWidth: 560, marginInline: 'auto' }}>{site.tagline}</p>}
      </section>

      {/* Posts Grid */}
      {posts && posts.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '0 0 24px', color: '#1a1a1a' }}>Latest Posts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginBottom: 48 }}>
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/tenant/${site.subdomain}?post=${post.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', overflow: 'hidden', transition: 'box-shadow .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                {post.featured_image_url && (
                  <img src={post.featured_image_url} alt={post.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                )}
                {!post.featured_image_url && (
                  <div style={{ height: 8, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
                )}
                <div style={{ padding: '16px 20px 20px' }}>
                  {(post.categories || []).slice(0, 1).map((cat: string) => (
                    <span key={cat} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: accentColor, letterSpacing: '.5px' }}>{cat}</span>
                  ))}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '6px 0 8px', color: '#1a1a1a', lineHeight: 1.4 }}>{post.title}</h3>
                  {post.excerpt && <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.6 }}>{post.excerpt}</p>}
                  <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Featured Products Grid */}
      {plugins.ecommerce && storeProducts.length > 0 && (
        <div style={{ marginTop: 64, marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 24px', color: '#1a1a1a', textAlign: 'center' }}>Featured Products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {storeProducts.map((p) => (
              <a
                key={p.id}
                href={`/tenant/${site.subdomain}?product=${p.slug}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 10, border: '1px solid #e8e8e8', overflow: 'hidden', transition: 'transform .2s', paddingBottom: 16 }}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No Image</div>
                )}
                <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px', color: '#1a1a1a' }}>{p.title}</h3>
                  <p style={{ fontWeight: 600, color: accentColor, margin: 0 }}>${Number(p.price).toFixed(2)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!posts?.length && (!plugins.ecommerce || !storeProducts.length) && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
          <p style={{ fontSize: '1.1rem' }}>No content yet. Check back soon!</p>
        </div>
      )}

      {/* Subscribe CTA */}
      <section style={{ background: '#f8f9fa', borderRadius: 12, padding: '40px', textAlign: 'center', border: '1px solid #e8e8e8', marginBottom: 48 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: '#1a1a1a' }}>Stay in the loop</h2>
        <p style={{ color: '#666', margin: '0 0 20px' }}>Subscribe using your SETX 360 account to get notified when new content is published.</p>
        <a
          href={`https://setx360.com?subscribe_to=${site.subdomain}`}
          style={{ display: 'inline-block', background: accentColor, color: '#fff', padding: '12px 28px', borderRadius: 6, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}
        >
          Subscribe with SETX 360
        </a>
      </section>
    </SiteShell>
  );
}

// ─── Shared Site Shell (Header + Footer) ───────────────────────────────────────
function SiteShell({
  site,
  menuItems,
  accentColor,
  fontFamily,
  children,
}: {
  site: any;
  menuItems: any[];
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  children: React.ReactNode;
}) {
  const wl = site.white_label_config || {};

  // Build Google Fonts URL
  const fonts = Array.from(new Set([headingFont, bodyFont])).map(f => f.replace(/ /g, '+'));
  const fontUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}:wght@400;500;600;700`).join('&')}&display=swap`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{site.name}</title>
        {site.tagline && <meta name="description" content={site.tagline} />}
        <link href={fontUrl} rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; font-family: "${bodyFont}", sans-serif; background: #fff; color: #1a1a1a; }
          a { color: ${accentColor}; }
          img { max-width: 100%; }
          h1,h2,h3,h4 { line-height: 1.3; font-family: "${headingFont}", sans-serif; }
          .wb-content p { margin: 0 0 1.2em; }
          .wb-content ul, .wb-content ol { padding-left: 1.5em; margin: 0 0 1.2em; }
          .wb-content blockquote { border-left: 4px solid ${accentColor}; margin: 0; padding: 8px 16px; color: #666; background: #f8f9fa; }
          .wb-content code { background: #f0f0f1; padding: 2px 6px; border-radius: 3px; font-size: .9em; }
          .wb-content h2 { font-size: 1.5em; margin: 1.5em 0 .5em; }
          .wb-content h3 { font-size: 1.25em; margin: 1.2em 0 .4em; }
          
          /* Custom CSS */
          ${wl.customCss || ''}
        `}</style>
      </head>
      <body>
        {/* Header */}
        <header style={{ borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, background: '#fff', zIndex: 100 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <a href={`/tenant/${site.subdomain}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              {wl.logoUrl && <img src={wl.logoUrl} alt={site.name} style={{ height: 36, width: 'auto' }} />}
              <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#1a1a1a' }}>{wl.brandName || site.name}</span>
            </a>
            <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              {menuItems.map((item) => (
                <a key={item.id} href={item.url} style={{ textDecoration: 'none', color: '#444', fontWeight: 500, fontSize: 15, transition: 'color .15s' }}>
                  {item.label}
                </a>
              ))}
              <a
                href={`https://setx360.com?subscribe_to=${site.subdomain}`}
                style={{ background: accentColor, color: '#fff', padding: '8px 18px', borderRadius: 6, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}
              >
                Subscribe
              </a>
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }} className="wb-content">
          {children}
        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #e8e8e8', marginTop: 80, padding: '32px 24px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
          <p style={{ margin: '0 0 8px' }}>
            &copy; {new Date().getFullYear()} <strong style={{ color: '#666' }}>{wl.brandName || site.name}</strong>. All rights reserved.
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>
            Powered by{' '}
            <a href="https://setx360.com" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>SETX 360 Sites</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
