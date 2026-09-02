# Sammytopia — GitHub + Cloudflare deployment

This project is designed so Samuel never needs to install or run Wrangler
locally for day-to-day use. Wrangler is only used once, by whoever sets up
the project, to run migrations.

## 1. Put the code on GitHub

Create a new GitHub repository and push this project to it.

## 2. Connect Cloudflare to the GitHub repo

1. In the Cloudflare dashboard, go to **Workers & Pages**.
2. Click **Create application** → **Workers** → **Import a repository**
   (Workers Builds).
3. Authorize Cloudflare's GitHub App and select the Sammytopia repository.
4. Build settings:
   - Build command: `npm run build`
   - Deploy command: uses `wrangler.toml` automatically
   - Root directory: `/`
5. Deploy. From now on, every push to the connected branch triggers a new
   build and deploy automatically — no CLI needed.

## 3. Create the D1 database and R2 bucket

One-time setup steps, doable in the Cloudflare dashboard UI directly
(Workers & Pages → D1 and → R2 — no CLI required):

1. **D1**: create a database named `sammytopia-db`. Copy its database ID
   into `wrangler.toml` under `[[d1_databases]] database_id`.
2. **R2**: create a bucket named `sammytopia-media`.
3. Bind both to the Worker: Workers & Pages → sammytopia → Settings →
   Bindings → add the D1 database as `DB` and the R2 bucket as `MEDIA`
   (these names must match `wrangler.toml` exactly).

## 4. Run the database migrations (one time)

The `migrations/` folder contains the schema plus all of Samuel's real
content, already converted to SQL. Run these once, in order, against the
**remote** (production) database, from any machine with Node installed:

```
npm install
npx wrangler login
npm run db:migrate:remote
```

You won't need to do this again unless the schema changes — day-to-day
content updates go through the Admin panel instead.

## 5. Upload the media files

Upload everything under `public/media/` to the `sammytopia-media` R2
bucket, keeping the same folder structure (e.g. the file at
`public/media/zamar/zamar-logo.jpg` should be uploaded to the R2 key
`zamar/zamar-logo.jpg`). This can be done through the Cloudflare dashboard's
R2 upload UI — no CLI needed. These keys already match what's seeded in
the `media` table.

## 6. Set the admin password

Workers & Pages → sammytopia → Settings → Variables and Secrets → add a
**secret** named `ADMIN_PASSWORD`. Never put the real password in
`wrangler.toml` or commit it to GitHub.

## Ongoing use

- **Content updates**: log in at `yoursite.com/admin` and use the
  dashboard — no redeploy needed, changes are live immediately.
- **Code changes**: push to GitHub; Cloudflare rebuilds and redeploys
  automatically.
