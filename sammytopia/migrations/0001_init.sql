-- Sammytopia D1 schema
-- Generic content table handles: articles, books, chapters, stories, screenplays,
-- songs, music projects, EMS volumes/lessons, zamar events, creative projects,
-- gallery items, videos, baking posts, cooking posts.
-- A flexible schema keeps the CMS extensible without new migrations for every
-- future content type Samuel adds.

CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,              -- 'article' | 'book' | 'chapter' | 'story' | 'screenplay'
                                    -- | 'song' | 'ems_volume' | 'ems_lesson' | 'zamar_event'
                                    -- | 'creative_project' | 'gallery_item' | 'video'
                                    -- | 'baking_post' | 'cooking_post'
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  body TEXT,                       -- markdown body, where applicable
  category TEXT,
  tags TEXT,                       -- JSON array as text
  author TEXT DEFAULT 'Samuel Pratt',
  featured_media_id TEXT,
  parent_id TEXT,                  -- e.g. a chapter's parent book, a lesson's parent volume
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES content(id)
);

CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_parent ON content(parent_id);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,               -- 'image' | 'video'
  title TEXT,
  description TEXT,
  category TEXT,                    -- e.g. 'wilberforce' | 'zamar' | 'baking' | 'school' | ...
  tags TEXT,                        -- JSON array as text
  width INTEGER,
  height INTEGER,
  featured INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);

-- join table so one media item can attach to multiple content items
CREATE TABLE IF NOT EXISTS content_media (
  content_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (content_id, media_id),
  FOREIGN KEY (content_id) REFERENCES content(id),
  FOREIGN KEY (media_id) REFERENCES media(id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
