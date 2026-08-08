# Deploying to Vercel

The repo is at <https://github.com/0xZorak/kidamerch>. Connecting it once gives
you a deploy on every push to `main`.

## 1. Import the project

<https://vercel.com/new> → **Import Git Repository** → pick `0xZorak/kidamerch`.
Authorise Vercel for the repo if prompted (it is private).

Leave the build settings alone. Vercel reads the Build Output API directory this
project produces (`.vercel/output`), so the defaults work:

| Setting       | Value           |
| ------------- | --------------- |
| Framework     | Other           |
| Build command | `bun run build` |
| Output        | _leave empty_   |

## 2. Add the environment variables

Before the first deploy, open **Environment Variables** and add both, for all
three environments (Production, Preview, Development):

```
VITE_SUPABASE_URL        https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY   eyJhbGci...
```

Copy the values from your local `.env`. Without them the site still loads but
falls back to browser-only storage, so the admin dashboard and the live
catalogue will look empty.

Only ever use the **anon public** key. The `service_role` key bypasses every
security policy and must never be given to a frontend.

## 3. Deploy, then point Supabase at the domain

Hit **Deploy**. When it finishes, take the production URL and add it in Supabase
→ **Authentication** → **URL Configuration**:

- **Site URL**: your Vercel domain
- **Redirect URLs**: add the same domain

This keeps admin sign-in working on the deployed site.

## Notes

- `bun.lock` is the lockfile in use. Don't add `package-lock.json` alongside it,
  or Vercel and Lovable can install different dependency trees.
- The SSR server is built with Nitro's `vercel` preset, set in `vite.config.ts`.
  Lovable's own builds force the Cloudflare preset and ignore that override, so
  both hosts keep working from the same commit.
- `.env` is gitignored and has never been committed.
