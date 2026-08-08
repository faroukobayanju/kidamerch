# Deploying to Vercel

**Live:** <https://kidamerch.vercel.app> · Vercel project `zoraks-projects/kidamerch`
· source at <https://github.com/0xZorak/kidamerch>

Already done: the project is linked, `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are set for Production and Development, and production
has been deployed.

## Shipping a change

```bash
git push zorak main    # save the code
vercel deploy --prod   # publish it
```

To get a deploy automatically on every push instead, open the project in Vercel
→ **Settings** → **Git** → connect `0xZorak/kidamerch`.

## Remaining setup

1. **Preview environment variables.** Production and Development are set;
   Preview is not, because the CLI insists on asking which branch. Add the two
   variables for Preview in **Settings → Environment Variables** if you want
   branch previews to reach the database.
2. **Supabase auth URLs.** Supabase → **Authentication** → **URL Configuration**
   → set **Site URL** to `https://kidamerch.vercel.app` and add it under
   **Redirect URLs**, so admin sign-in works on the live domain.

## Environment variables

```
VITE_SUPABASE_URL        https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY   eyJhbGci...
```

Without them the site still loads but falls back to browser-only storage, so the
catalogue and admin dashboard look empty.

Only ever use the **anon public** key. The `service_role` key bypasses every
security policy and must never be given to a frontend.

## Notes

- `bun.lock` is the lockfile in use. Don't add `package-lock.json` alongside it,
  or Vercel and Lovable can install different dependency trees.
- The SSR server is built with Nitro's `vercel` preset, set in `vite.config.ts`.
  Lovable's own builds force the Cloudflare preset and ignore that override, so
  both hosts keep working from the same commit.
- `.env` is gitignored and has never been committed.
