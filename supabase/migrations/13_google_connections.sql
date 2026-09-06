-- 13. GOOGLE CONNECTIONS
CREATE TABLE google_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    google_subject_id TEXT NOT NULL,
    google_email TEXT NOT NULL,
    google_display_name TEXT,
    google_avatar_url TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    granted_scopes TEXT,
    status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'reconnect_required', 'disconnected', 'revoked')),
    error_code TEXT,
    error_message TEXT,
    last_used_at TIMESTAMPTZ,
    last_refresh_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_user_id, google_subject_id)
);

CREATE TRIGGER update_google_connections_modtime BEFORE UPDATE ON google_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;
-- Only admins can manage their own Google connections
CREATE POLICY "Admins can manage own google connections" ON google_connections FOR ALL USING (is_admin() AND auth.uid() = admin_user_id);
