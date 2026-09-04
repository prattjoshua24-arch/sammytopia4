export interface ContentItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  body?: string | null;
  category?: string | null;
  tags?: string | null;
  author?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  status: string;
  published_at?: string | null;
  children?: ContentItem[];
  media?: MediaItem[];
}

export interface MediaItem {
  id: string;
  r2_key: string;
  kind: "image" | "video";
  title?: string | null;
  description?: string | null;
  category?: string | null;
  featured?: number;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  list: (type: string, parent?: string) =>
    req<{ items: ContentItem[] }>(
      `/api/content?type=${encodeURIComponent(type)}${parent ? `&parent=${encodeURIComponent(parent)}` : ""}`
    ).then((r) => r.items),

  get: (slug: string) => req<ContentItem>(`/api/content/${encodeURIComponent(slug)}`),

  media: (category?: string) =>
    req<{ items: MediaItem[] }>(`/api/media${category ? `?category=${encodeURIComponent(category)}` : ""}`).then(
      (r) => r.items
    ),

  search: (q: string) => req<{ items: ContentItem[] }>(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.items),

  admin: {
    login: (password: string) =>
      req<{ ok: boolean }>("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      }),
    logout: () => req<{ ok: boolean }>("/api/admin/logout", { method: "POST" }),
    list: (type?: string) =>
      req<{ items: ContentItem[] }>(`/api/admin/content${type ? `?type=${encodeURIComponent(type)}` : ""}`).then(
        (r) => r.items
      ),
    save: (item: Partial<ContentItem>) =>
      req<{ ok: boolean; id: string }>("/api/admin/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item),
      }),
    remove: (id: string) => req<{ ok: boolean }>(`/api/admin/content/${id}`, { method: "DELETE" }),
    uploadMedia: (form: FormData) =>
      req<{ ok: boolean; id: string; url: string }>("/api/admin/media", { method: "POST", body: form }),
    listMedia: (category?: string) =>
      req<{ items: MediaItem[] }>(
        `/api/admin/media${category ? `?category=${encodeURIComponent(category)}` : ""}`
      ).then((r) => r.items),
    updateMedia: (id: string, item: Partial<MediaItem>) =>
      req<{ ok: boolean }>(`/api/admin/media/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item),
      }),
    removeMedia: (id: string) => req<{ ok: boolean }>(`/api/admin/media/${id}`, { method: "DELETE" }),
  },
};

export function mediaUrl(key: string): string {
  return `/media/${key}`;
}
