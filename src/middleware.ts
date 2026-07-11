import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host');

  // Define allowed core domains for the Super App
  const coreDomains = [
    'setx360.com', 'www.setx360.com', 'setx360.org', 'www.setx360.org', 
    'efutura.com', 'www.efutura.com', 
    'txorb.com', 'www.txorb.com', 'texasorb.com', 'www.texasorb.com',
    'christworx.com', 'www.christworx.com',
    'localhost:3000', 'localhost:5173'
  ];
  const isCoreDomain = hostname && coreDomains.includes(hostname);

  // If it's a core domain, allow the request to proceed normally to the main app layout
  if (isCoreDomain) {
    // If they are explicitly trying to hit the B2B marketing site: setx.io
    if (hostname === 'setx.io') {
       // Allow them to hit the main marketing page, or redirect to a landing
       return NextResponse.rewrite(new URL(`/b2b-landing`, req.url));
    }
    return NextResponse.next();
  }

  // Handle Multi-Tenant Routing
  if (hostname) {
    // 1. Subdomain routing (e.g., boutique.setx.io, myblog.setx360.com)
    if (hostname.endsWith('.setx.io')) {
      const slug = hostname.replace('.setx.io', '');
      return NextResponse.rewrite(new URL(`/tenant/${slug}${url.pathname}`, req.url));
    }
    if (hostname.endsWith('.setx360.com')) {
      const slug = hostname.replace('.setx360.com', '');
      return NextResponse.rewrite(new URL(`/tenant/${slug}${url.pathname}`, req.url));
    }
    if (hostname.endsWith('.txorb.com')) {
      const slug = hostname.replace('.txorb.com', '');
      return NextResponse.rewrite(new URL(`/tenant/${slug}${url.pathname}`, req.url));
    }
    if (hostname.endsWith('.localhost:3000')) {
      const slug = hostname.replace('.localhost:3000', '');
      return NextResponse.rewrite(new URL(`/tenant/${slug}${url.pathname}`, req.url));
    }

    // 2. Custom Domain routing (e.g., myboutique.com)
    // In a real Vercel environment, you would hit the Vercel Edge Config or Supabase
    // to map `hostname` -> `tenant_slug`. For this boilerplate, we rewrite to a specialized handler.
    // We pass the raw hostname to the dynamic route so it can look up the tenant.
    return NextResponse.rewrite(new URL(`/tenant/custom/${hostname}${url.pathname}`, req.url));
  }

  return NextResponse.next();
}
