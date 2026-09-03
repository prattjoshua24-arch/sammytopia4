# Sammytopia

No Limits. No Boundaries. Building Ideas, Shaping Tomorrow.
✒ S by Samuel 

Samuel Pratt's personal creative platform — books, stories, worship music, 
an English learning resource, and more — built on Cloudflare (Workers + D1
+ R2), deployed straight from GitHub with no Wrangler CLI required.

## What's here

- `worker.ts` — the API: public content endpoints + a cookie-authenticated
  Admin CMS API (login, create/edit/publish/delete content, upload media).
- `functions/media/[[path]].ts` — serves uploaded media from R2 at `/media/…`.
- `src/` — the React (Vite) frontend: homepage, the Joshuana reader,
  Love Happens (story + separate screenplay), Sammy Speaks, English Made
  Simple, Zamar, Baking & Cooking, Gallery, Search, and the Admin dashboard.
- `migrations/` — D1 schema + seed data generated from Samuel's actual
  supplied manuscripts (nothing invented — see CONTENT-INVENTORY.md).
- `public/media/` — the real supplied photos/branding, organised by
  category, ready to upload to the R2 bucket once at launch.

## First-time setup

1. Push this repository to **GitHub**.
2. In Cloudflare, connect the GitHub repo via Workers & Pages → Workers
   Builds (see `DEPLOYMENT.md` for the full walkthrough).
3. Create the D1 database and R2 bucket, and update the `database_id` in
   `wrangler.toml` to match your D1 database.
4. Run the migrations once (from your machine, with `wrangler` installed
   locally just for this one-time step — not needed day to day):
   ```
   npm run db:migrate:remote
   ```
5. Upload the contents of `public/media/` to your R2 bucket, preserving
   the folder paths (e.g. `wilberforce/wilberforce-809.jpg`) so they match
   the `r2_key` values already seeded in the `media` table.
6. In Cloudflare, set the `ADMIN_PASSWORD` secret (Settings → Variables
   and Secrets) — never commit a real password to GitHub.

After that, every `git push` to your connected branch redeploys the site
automatically.

## Adding new content after launch

Log in at `/admin` on your live site. From there you can add new Joshuana
chapters, new English Made Simple volumes/lessons, new Sammy Speaks
articles, new Zamar events, new baking/cooking posts, and upload new   
photos or videos to the Media Library — no code changes needed.
