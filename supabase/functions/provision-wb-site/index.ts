import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) throw new Error('Unauthorized');

    const { site_id, site_name, subdomain } = await req.json();
    if (!site_id || !subdomain) throw new Error('Missing site_id or subdomain');

    // Verify this user owns the site
    const { data: site, error: siteErr } = await supabase
      .from('wb_sites')
      .select('id, owner_id, storage_bucket')
      .eq('id', site_id)
      .single();

    if (siteErr || !site) throw new Error('Site not found');
    if (site.owner_id !== user.id) throw new Error('Forbidden');

    // If bucket already exists, skip creation
    if (site.storage_bucket) {
      return new Response(JSON.stringify({ bucket: site.storage_bucket }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a unique bucket per site
    const bucketName = `wb-${site_id}`;

    const { error: bucketErr } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB per file
      allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
    });

    if (bucketErr && !bucketErr.message.includes('already exists')) {
      throw new Error(`Failed to create bucket: ${bucketErr.message}`);
    }

    // Store the bucket name back on the site record
    await supabase
      .from('wb_sites')
      .update({ storage_bucket: bucketName })
      .eq('id', site_id);

    // Create default settings row for this site
    await supabase
      .from('wb_site_settings')
      .upsert({ site_id }, { onConflict: 'site_id' });

    // Create a "Hello World" post as the default first post
    await supabase.from('wb_posts').upsert([{
      site_id,
      author_id: user.id,
      title: 'Hello World!',
      slug: 'hello-world',
      content: '<h2>Welcome to your new website!</h2><p>This is your first post. Feel free to edit or delete it, then start writing!</p>',
      excerpt: 'Welcome to your new website built with SETX 360 Sites.',
      status: 'published',
      published_at: new Date().toISOString(),
    }], { onConflict: 'site_id,slug' });

    // Create a default "Home" page
    await supabase.from('wb_pages').upsert([{
      site_id,
      author_id: user.id,
      title: 'Home',
      slug: 'home',
      content: '<h1>Welcome</h1><p>This is your home page. Start customizing it from your dashboard.</p>',
      status: 'published',
      sort_order: 1,
    }], { onConflict: 'site_id,slug' });

    return new Response(JSON.stringify({ 
      success: true, 
      bucket: bucketName,
      message: `Site provisioned successfully. Bucket: ${bucketName}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('provision-wb-site error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
