-- Blog posts table for admin-managed content
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  category TEXT NOT NULL DEFAULT 'General',
  keywords TEXT[] DEFAULT '{}',
  emoji TEXT DEFAULT '📝',
  accent_color TEXT DEFAULT '#2563EB',
  hero_image TEXT DEFAULT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage blog posts" ON blog_posts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Public can read published posts
CREATE POLICY "Anyone can read published posts" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (published = true);
