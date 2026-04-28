$dbUrl = "postgres://postgres.okulcpbrikcumiomrzuh:J53V7CriZZj8Zu0u@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
$queries = @(
    "ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_community TEXT",
    "ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_county TEXT",
    "ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_state TEXT",
    "ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_country TEXT",
    "CREATE OR REPLACE FUNCTION public.sync_post_author_geography() RETURNS TRIGGER AS ' BEGIN SELECT community, county, state, country INTO NEW.author_community, NEW.author_county, NEW.author_state, NEW.author_country FROM public.profiles WHERE id = NEW.profile_id; RETURN NEW; END; ' LANGUAGE plpgsql SECURITY DEFINER",
    "DROP TRIGGER IF EXISTS tr_sync_post_author_geography ON public.posts",
    "CREATE TRIGGER tr_sync_post_author_geography BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_post_author_geography()",
    "UPDATE public.posts p SET author_community = pr.community, author_county = pr.county, author_state = pr.state, author_country = pr.country FROM public.profiles pr WHERE p.profile_id = pr.id AND p.author_community IS NULL",
    "CREATE INDEX IF NOT EXISTS idx_posts_author_community ON public.posts(author_community)",
    "CREATE INDEX IF NOT EXISTS idx_posts_author_county ON public.posts(author_county)",
    "CREATE INDEX IF NOT EXISTS idx_posts_author_state ON public.posts(author_state)",
    "CREATE INDEX IF NOT EXISTS idx_posts_author_country ON public.posts(author_country)",
    "NOTIFY pgrst, 'reload schema'"
)

foreach ($q in $queries) {
    Write-Host "Executing: $q"
    npx supabase db query --db-url $dbUrl $q --agent no
}
