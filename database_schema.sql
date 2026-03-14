-- Supabase Schema for Etsy Seolab
-- Created: 2026-03-14

-- 1. Profiles (User / Shop metadata)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    shop_id TEXT,
    shop_name TEXT,
    etsy_token TEXT,
    etsy_refresh_token TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products Cache (To avoid hitting Etsy API limits)
CREATE TABLE IF NOT EXISTS product_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id TEXT NOT NULL,
    data JSONB NOT NULL,
    seo_score INTEGER,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Audit Logs (History of AI optimizations)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id TEXT,
    action_type TEXT NOT NULL, -- 'title_optimization', 'tag_enhancement', etc.
    before_data JSONB,
    after_data JSONB,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own products" ON product_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- 4. Waitlist (Lead Generation)
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert into waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view waitlist" ON waitlist FOR SELECT USING (false); -- Admin roles to be defined later
