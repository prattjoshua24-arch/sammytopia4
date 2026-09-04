import { useEffect, useState } from "react";
import { api, ContentItem, MediaItem } from "../../lib/api";

const CONTENT_TYPES = [
  "article",
  "book",
  "chapter",
  "story",
  "screenplay",
  "song",
  "ems_volume",
  "ems_lesson",
  "zamar_event",
  "creative_project",
  "gallery_item",
  "video",
  "baking_post",
  "cooking_post",
  "honours_award",
];

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

type ContentForm = {
  id?: string;
  type: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  body: string;
  category: string;
  status: string;
};

type MediaForm = {
  category: string;
  title: string;
  description: string;
  featured: number;
};

const emptyContent: ContentForm = {
  type: "article",
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  body: "",
  category: "",
  status: "draft",
};

export default function AdminDashboard() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [selectedType, setSelectedType] = useState("article");
  const [selectedMediaCategory, setSelectedMediaCategory] =
    useState("all");

  const [contentForm, setContentForm] =
    useState<ContentForm>(emptyContent);

  const [editingContent, setEditingContent] =
    useState(false);

  const [mediaForms, setMediaForms] =
    useState<Record<string, MediaForm>>({});

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const [uploadCategory, setUploadCategory] =
    useState("sammytopia");

  const [uploadTitle, setUploadTitle] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadContent(type = selectedType) {
    try {
      setError("");
      const items = await api.admin.list(type);
      setContent(items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load content."
      );
    }
  }

  async function loadMedia(
    category = selectedMediaCategory
  ) {
    try {
      setError("");

      const items =
        await api.admin.listMedia(
          category === "all"
            ? undefined
            : category
        );

      setMedia(items);

      const forms: Record<string, MediaForm> = {};

      items.forEach((item) => {
        forms[item.id] = {
          category:
            item.category || "uncategorized",
          title: item.title || "",
          description:
            item.description || "",
          featured: item.featured || 0,
        };
      });

      setMediaForms(forms);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load media."
      );
    }
  }

  async function loadAll() {
    setLoading(true);

    try {
      await Promise.all([
        loadContent(),
        loadMedia(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function startNewContent() {
    setContentForm({
      ...emptyContent,
      type: selectedType,
    });

    setEditingContent(true);
    setMessage("");
    setError("");
  }

  function editContent(item: ContentItem) {
    setContentForm({
      id: item.id,
      type: item.type,
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle || "",
      description: item.description || "",
      body: item.body || "",
      category: item.category || "",
      status: item.status || "draft",
    });

    setEditingContent(true);
    setMessage("");
    setError("");
  }

  async function saveContent() {
    if (
      !contentForm.type ||
      !contentForm.slug ||
      !contentForm.title
    ) {
      setError(
        "Type, slug, and title are required."
      );
      return;
    }

    try {
      setError("");
      setMessage("Saving...");

      await api.admin.save({
        ...contentForm,
      });

      setMessage("Content saved successfully.");
      setEditingContent(false);

      await loadContent(
        contentForm.type
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save content."
      );
      setMessage("");
    }
  }

  async function deleteContent(
    item: ContentItem
  ) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("Deleting...");

      await api.admin.remove(item.id);

      setMessage("Content deleted.");
      await loadContent(selectedType);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete content."
      );
      setMessage("");
    }
  }

  function updateMediaForm(
    id: string,
    field: keyof MediaForm,
    value: string | number
  ) {
    setMediaForms((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function saveMedia(
    item: MediaItem
  ) {
    const form = mediaForms[item.id];

    if (!form) return;

    try {
      setError("");
      setMessage("Saving media...");

      await api.admin.updateMedia(
        item.id,
        {
          category: form.category,
          title: form.title,
          description: form.description,
          featured: form.featured,
        }
      );

      setMessage("Media updated successfully.");

      await loadMedia(
        selectedMediaCategory
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update media."
      );
      setMessage("");
    }
  }

  async function deleteMedia(
    item: MediaItem
  ) {
    const confirmed = window.confirm(
      `Delete "${item.title || item.r2_key}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("Deleting media...");

      await api.admin.removeMedia(
        item.id
      );

      setMessage("Media deleted.");

      await loadMedia(
        selectedMediaCategory
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete media."
      );
      setMessage("");
    }
  }

  async function uploadMedia() {
    if (!uploadFile) {
      setError("Please choose a file first.");
      return;
    }

    try {
      setError("");
      setMessage("Uploading media...");

      const form = new FormData();

      form.append(
        "file",
        uploadFile
      );

      form.append(
        "category",
        uploadCategory
      );

      if (uploadTitle.trim()) {
        form.append(
          "title",
          uploadTitle.trim()
        );
      }

      await api.admin.uploadMedia(
        form
      );

      setUploadFile(null);
      setUploadTitle("");

      setMessage(
        "Media uploaded successfully."
      );

      await loadMedia(
        selectedMediaCategory
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload media."
      );
      setMessage("");
    }
  }

  async function logout() {
    try {
      await api.admin.logout();
      window.location.href = "/admin";
    } catch {
      window.location.href = "/admin";
    }
  }

  const mediaBaseUrl = (
    key: string
  ) => `/media/${key}`;

  return (
    <div className="section">
      <div className="container">

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <div>
            <p
              style={{
                fontFamily:
                  "var(--font-ui)",
                fontSize: "0.8rem",
                letterSpacing:
                  "0.12em",
                textTransform:
                  "uppercase",
                opacity: 0.65,
              }}
            >
              Sammytopia CMS
            </p>

            <h1>Admin Dashboard</h1>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              padding:
                "8px 14px",
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              border:
                "1px solid rgba(201,162,39,0.4)",
              fontFamily:
                "var(--font-ui)",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              border:
                "1px solid rgba(180,60,60,0.6)",
              fontFamily:
                "var(--font-ui)",
            }}
          >
            {error}
          </div>
        )}

        {/* CONTENT MANAGEMENT */}

        <section
          style={{
            marginBottom: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h2>
              Content Management
            </h2>

            <button
              type="button"
              onClick={
                startNewContent
              }
            >
              + New Content
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            {CONTENT_TYPES.map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(
                      type
                    );
                    setEditingContent(
                      false
                    );
                    loadContent(type);
                  }}
                  style={{
                    padding:
                      "6px 10px",
                    cursor:
                      "pointer",
                    background:
                      selectedType ===
                      type
                        ? "var(--gold)"
                        : "transparent",
                    color:
                      selectedType ===
                      type
                        ? "var(--ink)"
                        : "inherit",
                    border:
                      "1px solid rgba(201,162,39,0.4)",
                  }}
                >
                  {type.replace(
                    /_/g,
                    " "
                  )}
                </button>
              )
            )}
          </div>

          {editingContent && (
            <div
              style={{
                border:
                  "1px solid rgba(201,162,39,0.3)",
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h3>
                {contentForm.id
                  ? "Edit Content"
                  : "New Content"}
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  marginTop: 16,
                }}
              >
                <label>
                  Type
                  <select
                    value={
                      contentForm.type
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          type: e.target
                            .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  >
                    {CONTENT_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type.replace(
                            /_/g,
                            " "
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Slug
                  <input
                    value={
                      contentForm.slug
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          slug: e.target
                            .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  />
                </label>

                <label>
                  Title
                  <input
                    value={
                      contentForm.title
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          title: e.target
                            .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  />
                </label>

                <label>
                  Subtitle
                  <input
                    value={
                      contentForm.subtitle
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          subtitle:
                            e.target
                              .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={
                      contentForm.description
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          description:
                            e.target
                              .value,
                        }
                      )
                    }
                    rows={4}
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  />
                </label>

                <label>
                  Body
                  <textarea
                    value={
                      contentForm.body
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          body: e.target
                            .value,
                        }
                      )
                    }
                    rows={12}
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                      fontFamily:
                        "monospace",
                    }}
                  />
                </label>

                <label>
                  Category
                  <input
                    value={
                      contentForm.category
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          category:
                            e.target
                              .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  />
                </label>

                <label>
                  Status
                  <select
                    value={
                      contentForm.status
                    }
                    onChange={(e) =>
                      setContentForm(
                        {
                          ...contentForm,
                          status:
                            e.target
                              .value,
                        }
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      marginTop: 6,
                      padding: 10,
                    }}
                  >
                    <option value="draft">
                      Draft
                    </option>
                    <option value="published">
                      Published
                    </option>
                  </select>
                </label>

                <div
                  style={{
                    display:
                      "flex",
                    gap: 10,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      saveContent
                    }
                  >
                    Save Content
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingContent(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading content...</p>
          ) : content.length === 0 ? (
            <p>
              No content found for{" "}
              <strong>
                {selectedType.replace(
                  /_/g,
                  " "
                )}
              </strong>
              .
            </p>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gap: 12,
              }}
            >
              {content.map(
                (item) => (
                  <article
                    key={item.id}
                    style={{
                      border:
                        "1px solid rgba(201,162,39,0.25)",
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <h3>
                          {item.title}
                        </h3>

                        <p
                          style={{
                            opacity:
                              0.65,
                            fontFamily:
                              "var(--font-ui)",
                            fontSize:
                              "0.85rem",
                          }}
                        >
                          {item.slug}
                        </p>

                        <p>
                          Status:{" "}
                          <strong>
                            {
                              item.status
                            }
                          </strong>
                        </p>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          alignItems:
                            "flex-start",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            editContent(
                              item
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteContent(
                              item
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        {/* MEDIA LIBRARY */}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <h2>
              Media Library
            </h2>
          </div>

          {/* Upload */}

          <div
            style={{
              border:
                "1px solid rgba(201,162,39,0.3)",
              padding: 24,
              marginBottom: 24,
            }}
          >
            <h3>
              Upload Media
            </h3>

            <div
              style={{
                display:
                  "grid",
                gap: 14,
                marginTop: 16,
              }}
            >
              <label>
                File
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) =>
                    setUploadFile(
                      e.target
                        .files?.[0] ||
                        null
                    )
                  }
                  style={{
                    display:
                      "block",
                    marginTop: 6,
                  }}
                />
              </label>

              <label>
                Category
                <select
                  value={
                    uploadCategory
                  }
                  onChange={(e) =>
                    setUploadCategory(
                      e.target.value
                    )
                  }
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop: 6,
                    padding: 10,
                  }}
                >
                  {MEDIA_CATEGORIES.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category.replace(
                          "-",
                          " "
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Title
                <input
                  value={
                    uploadTitle
                  }
                  onChange={(e) =>
                    setUploadTitle(
                      e.target.value
                    )
                  }
                  placeholder="Optional media title"
                  style={{
                    display:
                      "block",
                    width:
                      "100%",
                    marginTop: 6,
                    padding: 10,
                  }}
                />
              </label>

              <button
                type="button"
                onClick={
                  uploadMedia
                }
              >
                Upload Media
              </button>
            </div>
          </div>

          {/* Media filters */}

          <div
            style={{
              display:
                "flex",
              gap: 8,
              flexWrap:
                "wrap",
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedMediaCategory(
                  "all"
                );
                loadMedia("all");
              }}
              style={{
                padding:
                  "6px 10px",
                cursor:
                  "pointer",
                background:
                  selectedMediaCategory ===
                  "all"
                    ? "var(--gold)"
                    : "transparent",
                color:
                  selectedMediaCategory ===
                  "all"
                    ? "var(--ink)"
                    : "inherit",
                border:
                  "1px solid rgba(201,162,39,0.4)",
              }}
            >
              All
            </button>

            {MEDIA_CATEGORIES.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedMediaCategory(
                      category
                    );
                    loadMedia(
                      category
                    );
                  }}
                  style={{
                    padding:
                      "6px 10px",
                    cursor:
                      "pointer",
                    background:
                      selectedMediaCategory ===
                      category
                        ? "var(--gold)"
                        : "transparent",
                    color:
                      selectedMediaCategory ===
                      category
                        ? "var(--ink)"
                        : "inherit",
                    border:
                      "1px solid rgba(201,162,39,0.4)",
                  }}
                >
                  {category.replace(
                    "-",
                    " "
                  )}
                </button>
              )
            )}
          </div>

          {media.length === 0 ? (
            <p>
              No media found.
            </p>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {media.map(
                (item) => {
                  const form =
                    mediaForms[
                      item.id
                    ];

                  return (
                    <article
                      key={
                        item.id
                      }
                      style={{
                        border:
                          "1px solid rgba(201,162,39,0.25)",
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          aspectRatio:
                            "16 / 10",
                          overflow:
                            "hidden",
                          marginBottom:
                            12,
                        }}
                      >
                        {item.kind ===
                        "video" ? (
                          <video
                            src={mediaBaseUrl(
                              item.r2_key
                            )}
                            controls
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              objectFit:
                                "cover",
                            }}
                          />
                        ) : (
                          <img
                            src={mediaBaseUrl(
                              item.r2_key
                            )}
                            alt={
                              item.title ||
                              ""
                            }
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              objectFit:
                                "cover",
                            }}
                          />
                        )}
                      </div>

                      {form && (
                        <div
                          style={{
                            display:
                              "grid",
                            gap: 10,
                          }}
                        >
                          <label>
                            Title
                            <input
                              value={
                                form.title
                              }
                              onChange={(
                                e
                              ) =>
                                updateMediaForm(
                                  item.id,
                                  "title",
                                  e.target
                                    .value
                                )
                              }
                              style={{
                                display:
                                  "block",
                                width:
                                  "100%",
                                marginTop:
                                  4,
                                padding:
                                  8,
                              }}
                            />
                          </label>

                          <label>
                            Category
                            <select
                              value={
                                form.category
                              }
                              onChange={(
                                e
                              ) =>
                                updateMediaForm(
                                  item.id,
                                  "category",
                                  e.target
                                    .value
                                )
                              }
                              style={{
                                display:
                                  "block",
                                width:
                                  "100%",
                                marginTop:
                                  4,
                                padding:
                                  8,
                              }}
                            >
                              {MEDIA_CATEGORIES.map(
                                (
                                  category
                                ) => (
                                  <option
                                    key={
                                      category
                                    }
                                    value={
                                      category
                                    }
                                  >
                                    {category.replace(
                                      "-",
                                      " "
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </label>

                          <label>
                            Description
                            <textarea
                              value={
                                form.description
                              }
                              onChange={(
                                e
                              ) =>
                                updateMediaForm(
                                  item.id,
                                  "description",
                                  e.target
                                    .value
                                )
                              }
                              rows={3}
                              style={{
                                display:
                                  "block",
                                width:
                                  "100%",
                                marginTop:
                                  4,
                                padding:
                                  8,
                              }}
                            />
                          </label>

                          <label>
                            <input
                              type="checkbox"
                              checked={
                                form.featured ===
                                1
                              }
                              onChange={(
                                e
                              ) =>
                                updateMediaForm(
                                  item.id,
                                  "featured",
                                  e
                                    .target
                                    .checked
                                    ? 1
                                    : 0
                                )
                              }
                            />{" "}
                            Featured
                          </label>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: 8,
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                saveMedia(
                                  item
                                )
                              }
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteMedia(
                                  item
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
