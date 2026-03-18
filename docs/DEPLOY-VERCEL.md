# Deploy City Fleet to Vercel

Your app is a standard Next.js 14 project, so Vercel will detect it and build it without extra config.

---

## 1. Push your code to Git

Git is already initialized in this project. You only need to:

- Create a **GitHub**, **GitLab**, or **Bitbucket** repo (if you don’t have one yet).
- Add it as the remote and push:

  ```bash
  cd "c:\Users\gwald\OneDrive\Documents\City Fleet\Cityfleet App"
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
  git push -u origin main
  ```

- Ensure **.gitignore** includes `.env.local`, `node_modules`, and `.next` so secrets and build output aren’t committed.

---

## 2. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New…** → **Project**.
3. **Import** the Git repository that contains the City Fleet app.
4. Leave **Framework Preset** as **Next.js** (auto-detected).
5. **Root Directory:** If the repo is only the app, leave blank. If the app lives in a subfolder (e.g. `Cityfleet App`), set **Root Directory** to that folder.
6. Do **not** deploy yet; add env vars first.

---

## 3. Add environment variables

In the same “Import” screen (or later in **Project → Settings → Environment Variables**):

| Name | Value | Where to get it |
|------|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | Supabase Dashboard → your project → **Settings** → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (long string) | Same page → Project API keys → **anon** **public** |

- Add both for **Production** (and optionally **Preview** if you use branch deploys).
- Then click **Deploy**.

---

## 4. Deploy and use the URL

- Vercel will run `npm install` and `next build`, then deploy.
- When it’s done you get a URL like `https://cityfleet-xxx.vercel.app`.
- Use this URL for the client: they open it, log in with the test accounts (e.g. mechanic@cityfleet.local / manager@cityfleet.local / ops@cityfleet.local with password **Password1!** after seed).

---

## 5. Optional: custom domain

In the Vercel project: **Settings** → **Domains** → add your domain and follow the DNS instructions.

---

## 6. Checklist

- [ ] Code in Git (only app code; `.env.local` not committed).
- [ ] Repo connected to Vercel.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel.
- [ ] Supabase project has all migrations and seed run (so login and data work).
- [ ] Deploy succeeded; share the Vercel URL with the client for review and testing.

No `vercel.json` is required for a normal Next.js app; add one only if you need redirects, headers, or other overrides.
