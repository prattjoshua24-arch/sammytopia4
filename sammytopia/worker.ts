
// Sammytopia Worker — public content API + Admin CMS API.
// Runs on Cloudflare Workers, bound to a D1 database (DB) and an R2 bucket (MEDIA).

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_PASSWORD: string;
}

const SESSION_COOKIE = "sammytopia_admin";
const SESSION_HOURS = 12;

const MEDIA_CATEGORIES = [
  "wilberforce",
  "sammytopia",
  "school",
  "zamar",
  "baking",
  "about",
  "creative-work",
  "uncategorized",
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "access-control-allow-origin": "*",
    },
  });
}

function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

function unauthorized(): Response {
  return json({ error: "Unauthorized" }, 401);
}

async function randomToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");

  if (!header) return null;

  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));

  return match ? match.slice(name.length + 1) : null;
}

async function requireAdmin(
  request: Request,
  env: Env
): Promise<boolean> {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) return false;

  const row = await env.DB.prepare(
    "SELECT expires_at FROM admin_sessions WHERE token = ?"
  )
    .bind(token)
    .first<{ expires_at: string }>();

  if (!row) return false;

  return new Date(row.expires_at).getTime() > Date.now();
}

// ---------- Public content endpoints ----------

async function listContent(
  env: Env,
  type: string,
  url: URL
): Promise<Response> {
  const parentSlug = url.searchParams.get("parent");

  let query =
    "SELECT * FROM content WHERE type = ? AND status = 'published'";

  const binds: unknown[] = [type];

  if (parentSlug) {
    const parent = await env.DB.prepare(
      "SELECT id FROM content WHERE slug = ?"
    )
      .bind(parentSlug)
      .first<{ id: string }>();

    if (!parent) return json({ items: [] });

    query += " AND parent_id = ?";
    binds.push(parent.id);
  }

  query += " ORDER BY sort_order ASC, published_at DESC";

  const { results } = await env.DB.prepare(query)
    .bind(...binds)
    .all();

  return json({ items: results });
}

async function getContentBySlug(
  env: Env,
  slug: string
): Promise<Response> {
  const item = await env.DB.prepare(
    "SELECT * FROM content WHERE slug = ? AND status = 'published'"
  )
    .bind(slug)
    .first();

  if (!item) return notFound();

  const { results: children } = await env.DB.prepare(
    `SELECT * FROM content
     WHERE parent_id = ?
     AND status = 'published'
     ORDER BY sort_order ASC`
  )
    .bind((item as { id: string }).id)
    .all();

  const { results: media } = await env.DB.prepare(
    `SELECT m.*, cm.caption, cm.sort_order as media_sort
     FROM media m
     JOIN content_media cm ON cm.media_id = m.id
     WHERE cm.content_id = ?
     ORDER BY cm.sort_order ASC`
  )
    .bind((item as { id: string }).id)
    .all();

  return json({
    ...item,
    children,
    media,
  });
}

async function listMedia(
  env: Env,
  url: URL
): Promise<Response> {
  const category = url.searchParams.get("category");

  let query = "SELECT * FROM media";
  const binds: unknown[] = [];

  if (category) {
    query += " WHERE category = ?";
    binds.push(category);
  }

  query += " ORDER BY created_at DESC";

  const { results } = await env.DB.prepare(query)
    .bind(...binds)
    .all();

  return json({ items: results });
}

async function search(
  env: Env,
  url: URL
): Promise<Response> {
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return json({ items: [] });
  }

  const like = `%${q}%`;

  const { results } = await env.DB.prepare(
    `SELECT id, type, slug, title, subtitle, category
     FROM content
     WHERE status = 'published'
     AND (
       title LIKE ?
       OR subtitle LIKE ?
       OR body LIKE ?
     )
     ORDER BY published_at DESC
     LIMIT 30`
  )
    .bind(like, like, like)
    .all();

  return json({ items: results });
}

// ---------- Admin authentication ----------

async function adminLogin(
  request: Request,
  env: Env
): Promise<Response> {
  const body = await request
    .json<{ password?: string }>()
    .catch(() => ({}));

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return unauthorized();
  }

  const token = await randomToken();

  const expires = new Date(
    Date.now() + SESSION_HOURS * 3600 * 1000
  ).toISOString();

  await env.DB.prepare(
    "INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)"
  )
    .bind(token, expires)
    .run();

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`,
      },
    }
  );
}

async function adminLogout(
  request: Request,
  env: Env
): Promise<Response> {
  const token = getCookie(request, SESSION_COOKIE);

  if (token) {
    await env.DB.prepare(
      "DELETE FROM admin_sessions WHERE token = ?"
    )
      .bind(token)
      .run();
  }

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      },
    }
  );
}

// ---------- Admin content ----------

async function adminListAll(
  env: Env,
  url: URL
): Promise<Response> {
  const type = url.searchParams.get("type");

  let query = "SELECT * FROM content";
  const binds: unknown[] = [];

  if (type) {
    query += " WHERE type = ?";
    binds.push(type);
  }

  query += " ORDER BY updated_at DESC LIMIT 200";

  const { results } = await env.DB.prepare(query)
    .bind(...binds)
    .all();

  return json({ items: results });
}

async function adminUpsertContent(
  request: Request,
  env: Env
): Promise<Response> {
  const b = await request
    .json<Record<string, unknown>>()
    .catch(() => ({}));

  if (!b.type || !b.slug || !b.title) {
    return json(
      {
        error: "type, slug, and title are required",
      },
      400
    );
  }

  const id =
    (b.id as string) || crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO content (
      id,
      type,
      slug,
      title,
      subtitle,
      description,
      body,
      category,
      tags,
      featured_media_id,
      parent_id,
      sort_order,
      status,
      published_at,
      updated_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      slug=excluded.slug,
      title=excluded.title,
      subtitle=excluded.subtitle,
      description=excluded.description,
      body=excluded.body,
      category=excluded.category,
      tags=excluded.tags,
      featured_media_id=excluded.featured_media_id,
      parent_id=excluded.parent_id,
      sort_order=excluded.sort_order,
      status=excluded.status,
      published_at=excluded.published_at,
      updated_at=datetime('now')`
  )
    .bind(
      id,
      b.type,
      b.slug,
      b.title,
      b.subtitle ?? null,
      b.description ?? null,
      b.body ?? null,
      b.category ?? null,
      b.tags
        ? JSON.stringify(b.tags)
        : null,
      b.featured_media_id ?? null,
      b.parent_id ?? null,
      b.sort_order ?? 0,
      b.status ?? "draft",
      b.status === "published"
        ? new Date().toISOString()
        : null
    )
    .run();

  return json({
    ok: true,
    id,
  });
}

async function adminDeleteContent(
  env: Env,
  id: string
): Promise<Response> {
  await env.DB.prepare(
    "DELETE FROM content WHERE id = ?"
  )
    .bind(id)
    .run();

  return json({ ok: true });
}

// ---------- Admin media ----------

async function adminListMedia(
  env: Env,
  url: URL
): Promise<Response> {
  const category = url.searchParams.get("category");

  let query = "SELECT * FROM media";
  const binds: unknown[] = [];

  if (category) {
    query += " WHERE category = ?";
    binds.push(category);
  }

  query += " ORDER BY created_at DESC";

  const { results } = await env.DB.prepare(query)
    .bind(...binds)
    .all();

  return json({ items: results });
}

function mediaKeyForCategory(
  oldKey: string,
  category: string
): string {
  const filename =
    oldKey.split("/").pop() ||
    crypto.randomUUID();

  return `${category}/${filename}`;
}

async function adminUpdateMedia(
  request: Request,
  env: Env,
  id: string
): Promise<Response> {
  const body = await request
    .json<{
      category?: string;
      title?: string;
      description?: string;
      featured?: number;
    }>()
    .catch(() => ({}));

  const existing = await env.DB.prepare(
    "SELECT * FROM media WHERE id = ?"
  )
    .bind(id)
    .first<{
      id: string;
      r2_key: string;
      kind: "image" | "video";
      title: string | null;
      description: string | null;
      category: string | null;
      featured: number;
    }>();

  if (!existing) {
    return notFound();
  }

  const newCategory =
    body.category ?? existing.category ?? "uncategorized";

  if (!MEDIA_CATEGORIES.includes(newCategory)) {
    return json(
      {
        error: `Invalid media category: ${newCategory}`,
      },
      400
    );
  }

  const oldCategory =
    existing.category ?? "uncategorized";

  const categoryChanged =
    newCategory !== oldCategory;

  let newKey = existing.r2_key;

  if (categoryChanged) {
    newKey = mediaKeyForCategory(
      existing.r2_key,
      newCategory
    );

    const object = await env.MEDIA.get(
      existing.r2_key
    );

    if (!object) {
      return json(
        {
          error:
            "The media file could not be found in R2.",
        },
        404
      );
    }

    try {
      await env.MEDIA.put(
        newKey,
        object.body,
        {
          httpMetadata: object.httpMetadata,
          customMetadata: object.customMetadata,
        }
      );

      await env.DB.prepare(
        `UPDATE media
         SET r2_key = ?,
             category = ?,
             title = ?,
             description = ?,
             featured = ?
         WHERE id = ?`
      )
        .bind(
          newKey,
          newCategory,
          body.title ?? existing.title,
          body.description ??
            existing.description,
          body.featured ??
            existing.featured ??
            0,
          id
        )
        .run();

      await env.MEDIA.delete(
        existing.r2_key
      );
    } catch (error) {
      // If the database update failed after the new
      // R2 object was created, remove the new object.
      try {
        await env.MEDIA.delete(newKey);
      } catch {
        // Ignore rollback failure.
      }

      throw error;
    }
  } else {
    await env.DB.prepare(
      `UPDATE media
       SET category = ?,
           title = ?,
           description = ?,
           featured = ?
       WHERE id = ?`
    )
      .bind(
        newCategory,
        body.title ?? existing.title,
        body.description ??
          existing.description,
        body.featured ??
          existing.featured ??
          0,
        id
      )
      .run();
  }

  const updated = await env.DB.prepare(
    "SELECT * FROM media WHERE id = ?"
  )
    .bind(id)
    .first();

  return json({
    ok: true,
    item: updated,
  });
}

async function adminDeleteMedia(
  env: Env,
  id: string
): Promise<Response> {
  const media = await env.DB.prepare(
    "SELECT r2_key FROM media WHERE id = ?"
  )
    .bind(id)
    .first<{ r2_key: string }>();

  if (!media) {
    return notFound();
  }

  // Remove references first.
  await env.DB.prepare(
    "DELETE FROM content_media WHERE media_id = ?"
  )
    .bind(id)
    .run();

  await env.DB.prepare(
    "DELETE FROM media WHERE id = ?"
  )
    .bind(id)
    .run();

  await env.MEDIA.delete(media.r2_key);

  return json({ ok: true });
}

async function adminUploadMedia(
  request: Request,
  env: Env
): Promise<Response> {
  const form = await request.formData();

  const file = form.get("file") as File | null;

  if (!file) {
    return json(
      {
        error: "file is required",
      },
      400
    );
  }

  const category =
    (form.get("category") as string) ||
    "uncategorized";

  if (!MEDIA_CATEGORIES.includes(category)) {
    return json(
      {
        error: `Invalid media category: ${category}`,
      },
      400
    );
  }

  const title =
    (form.get("title") as string) ||
    file.name;

  const ext =
    file.name.split(".").pop() ||
    "bin";

  const key =
    `${category}/${crypto.randomUUID()}.${ext}`;

  await env.MEDIA.put(
    key,
    await file.arrayBuffer(),
    {
      httpMetadata: {
        contentType: file.type,
      },
    }
  );

  const id = crypto.randomUUID();

  const kind =
    file.type.startsWith("video")
      ? "video"
      : "image";

  await env.DB.prepare(
    `INSERT INTO media (
      id,
      r2_key,
      kind,
      title,
      category,
      created_at
    )
    VALUES (
      ?, ?, ?, ?, ?, datetime('now')
    )`
  )
    .bind(
      id,
      key,
      kind,
      title,
      category
    )
    .run();

  return json({
    ok: true,
    id,
    key,
    url: `/media/${key}`,
  });
}

// ---------- Media serving ----------

async function serveMedia(
  env: Env,
  key: string
): Promise<Response> {
  const object =
    await env.MEDIA.get(key);

  if (!object) {
    return notFound();
  }

  const headers = new Headers();

  object.writeHttpMetadata(headers);

  headers.set(
    "etag",
    object.httpEtag
  );

  headers.set(
    "cache-control",
    "public, max-age=31536000, immutable"
  );

  return new Response(
    object.body,
    { headers }
  );
}

// ---------- Router ----------

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods":
            "GET,POST,DELETE,OPTIONS",
          "access-control-allow-headers":
            "content-type",
        },
      });
    }

    // ---------- Public API ----------

    if (
      path === "/api/content" &&
      request.method === "GET"
    ) {
      const type =
        url.searchParams.get("type");

      if (!type) {
        return json(
          {
            error:
              "type query param required",
          },
          400
        );
      }

      return listContent(
        env,
        type,
        url
      );
    }

    if (
      path.startsWith("/api/content/") &&
      request.method === "GET"
    ) {
      const slug =
        path.replace(
          "/api/content/",
          ""
        );

      return getContentBySlug(
        env,
        slug
      );
    }

    if (
      path === "/api/media" &&
      request.method === "GET"
    ) {
      return listMedia(
        env,
        url
      );
    }

    if (
      path === "/api/search" &&
      request.method === "GET"
    ) {
      return search(
        env,
        url
      );
    }

    // ---------- R2 media ----------

    if (
      path.startsWith("/media/") &&
      request.method === "GET"
    ) {
      const key =
        path.replace(
          "/media/",
          ""
        );

      return serveMedia(
        env,
        key
      );
    }

    // ---------- Admin authentication ----------

    if (
      path === "/api/admin/login" &&
      request.method === "POST"
    ) {
      return adminLogin(
        request,
        env
      );
    }

    if (
      path === "/api/admin/logout" &&
      request.method === "POST"
    ) {
      return adminLogout(
        request,
        env
      );
    }

    // ---------- Admin protected routes ----------

    if (
      path.startsWith("/api/admin/")
    ) {
      const ok =
        await requireAdmin(
          request,
          env
        );

      if (!ok) {
        return unauthorized();
      }

      // Content
      if (
        path === "/api/admin/content" &&
        request.method === "GET"
      ) {
        return adminListAll(
          env,
          url
        );
      }

      if (
        path === "/api/admin/content" &&
        request.method === "POST"
      ) {
        return adminUpsertContent(
          request,
          env
        );
      }

      if (
        path.startsWith(
          "/api/admin/content/"
        ) &&
        request.method === "DELETE"
      ) {
        const id =
          path.replace(
            "/api/admin/content/",
            ""
          );

        return adminDeleteContent(
          env,
          id
        );
      }

      // Media list
      if (
        path === "/api/admin/media" &&
        request.method === "GET"
      ) {
        return adminListMedia(
          env,
          url
        );
      }

      // Media upload
      if (
        path === "/api/admin/media" &&
        request.method === "POST"
      ) {
        return adminUploadMedia(
          request,
          env
        );
      }

      // Media update / reclassification
      if (
        path.startsWith(
          "/api/admin/media/"
        ) &&
        request.method === "POST"
      ) {
        const id =
          path.replace(
            "/api/admin/media/",
            ""
          );

        return adminUpdateMedia(
          request,
          env,
          id
        );
      }

      // Media delete
      if (
        path.startsWith(
          "/api/admin/media/"
        ) &&
        request.method === "DELETE"
      ) {
        const id =
          path.replace(
            "/api/admin/media/",
            ""
          );

        return adminDeleteMedia(
          env,
          id
        );
      }

      return notFound();
    }

    return env.ASSETS.fetch(
      request
    );
  },
};
