import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ContentItem } from "../../lib/api";

const CONTENT_TYPES = [
  "article", "book", "chapter", "story", "screenplay", "song",
  "ems_volume", "ems_lesson", "zamar_event", "creative_project",
  "gallery_item", "video", "baking_post", "cooking_post",
];

const emptyDraft: Partial<ContentItem> = {
  type: "article", slug: "", title: "", subtitle: "", body: "",
  category: "", status: "draft", parent_id: "", sort_order: 0,
};

export default function AdminDashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [draft, setDraft] = useState<Partial<ContentItem>>(emptyDraft);
  const [uploadCategory, setUploadCategory] = useState("uncategorized");
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = () => api.admin.list().then(setItems).catch(() => navigate("/admin"));

  useEffect(() => {
    refresh();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.type || !draft.slug || !draft.title) {
      setMessage("Type, slug, and title are required.");
      return;
    }
    await api.admin.save(draft);
    setMessage(`Saved "${draft.title}".`);
    setDraft(emptyDraft);
    refresh();
  };

  const edit = (item: ContentItem) => setDraft(item);

  const remove = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await api.admin.remove(id);
    refresh();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("category", uploadCategory);
    form.append("title", file.name);
    const res = await api.admin.uploadMedia(form);
    setMessage(`Uploaded to ${res.url}`);
    e.target.value = "";
  };

  const logout = async () => {
    await api.admin.logout();
    navigate("/admin");
  };

  return (
    <div className="section" style={{ background: "var(--parchment)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Admin</h1>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--ink)", borderRadius: 3, padding: "6px 12px", cursor: "pointer" }}>
            Log out
          </button>
        </div>
        {message && <p style={{ color: "var(--forest)" }}>{message}</p>}

        <h2>Upload media</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
          <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
            {["wilberforce", "sammytopia", "school", "zamar", "baking", "about", "creative-work", "uncategorized"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="file" accept="image/*,video/*" onChange={uploadFile} />
        </div>

        <h2>{draft.id ? "Edit" : "New"} content</h2>
        <form onSubmit={save} className="admin-form" style={{ margin: 0, maxWidth: 640 }}>
          <label>Type</label>
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label>Slug (URL-safe, unique)</label>
          <input value={draft.slug ?? ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
          <label>Title</label>
          <input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          <label>Subtitle</label>
          <input value={draft.subtitle ?? ""} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
          <label>Category</label>
          <input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <label>Parent slug or ID (optional — e.g. a book for a chapter)</label>
          <input value={draft.parent_id ?? ""} onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })} />
          <label>Body</label>
          <textarea rows={10} value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          <label>Status</label>
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="submit">Save</button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(emptyDraft)} style={{ marginLeft: 8, background: "transparent", color: "var(--ink)", border: "1px solid var(--ink)" }}>
              Cancel edit
            </button>
          )}
        </form>

        <h2 style={{ marginTop: 40 }}>All content</h2>
        <div className="feature-list" style={{ borderColor: "var(--paper-line)" }}>
          {items.map((item) => (
            <div key={item.id} className="feature-row" style={{ borderBottom: "1px solid var(--paper-line)", color: "var(--ink)" }}>
              <div>
                <div className="feature-title" style={{ color: "var(--ink)" }}>{item.title}</div>
                <div className="feature-desc">{item.type} · {item.status} · {item.slug}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => edit(item)} style={{ cursor: "pointer" }}>Edit</button>
                <button onClick={() => remove(item.id)} style={{ cursor: "pointer", color: "var(--ember)" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
