## Environment Knowledge

- **setx360.com** and **txorb.com** are two separate frontend domains representing different regional targets (setx360.com is regional to Jefferson county, txorb.com is state level).
- Crucially, they **share** the exact same Vercel project and Supabase environments. Any deployments or database changes applied to one will affect both domains.

- **Deployment**: Never rely on GitHub for deployments. Always push directly to production using the Vercel CLI (`vercel --prod`).  