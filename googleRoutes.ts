import express from 'express';
import { google } from 'googleapis';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const getSupabaseClient = (authHeader?: string) => {
  if (!authHeader) throw new Error('Unauthorized: Missing auth header');
  return createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || '',
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
};

// Check if user is admin
const verifyAdmin = async (supabase: any, userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !data || data.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
};

const getOAuth2Client = (redirectUri: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

const ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || 'default-fallback-insecure-key-change-me';

const encrypt = (text: string) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
const decrypt = (ciphertext: string) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

router.get('/auth/url', (req, res) => {
  try {
    const origin = req.get('Origin') || req.get('Referer')?.replace(/\/$/, '') || `http://${req.get('host')}`;
    const redirectUri = `${origin}/api/google/auth/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/contacts'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force to get refresh token
      scope: scopes,
      state: req.query.token as string // Pass supabase token in state to associate account on callback
    });

    res.json({ url });
  } catch (error: any) {
    console.error('Error generating auth url:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  const token = req.query.state as string; // Supabase auth token
  
  if (!code || !token) {
    return res.status(400).send('Missing code or auth token');
  }

  try {
    const origin = req.get('Origin') || req.get('Referer')?.replace(/\/api\/google\/auth\/callback.*/, '') || `http://${req.get('host')}`;
    // Reconstruct the exact redirect uri used
    const redirectUri = `${origin.replace(/\/$/, '')}/api/google/auth/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const supabase = getSupabaseClient(`Bearer ${token}`);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) throw new Error('Invalid Supabase token');
    await verifyAdmin(supabase, user.id);

    // Upsert the connection
    const connectionData = {
      admin_user_id: user.id,
      google_subject_id: userInfo.data.id,
      google_email: userInfo.data.email,
      google_display_name: userInfo.data.name,
      google_avatar_url: userInfo.data.picture,
      access_token_encrypted: encrypt(tokens.access_token || ''),
      refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      granted_scopes: tokens.scope,
      status: 'connected',
      error_code: null,
      error_message: null
    };

    // Since we have a unique constraint on (admin_user_id, google_subject_id), we can check and update
    const { data: existing } = await supabase
      .from('google_connections')
      .select('id, refresh_token_encrypted')
      .eq('admin_user_id', user.id)
      .eq('google_subject_id', userInfo.data.id)
      .single();

    if (existing) {
      if (!tokens.refresh_token && existing.refresh_token_encrypted) {
         // keep old refresh token if new one not provided
         delete connectionData.refresh_token_encrypted;
      }
      await supabase
        .from('google_connections')
        .update(connectionData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('google_connections')
        .insert([connectionData]);
    }

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/admin/google';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Helper to get authenticated Google API client
const getGoogleClient = async (req: express.Request, connectionId: string) => {
  const authHeader = req.headers.authorization;
  const supabase = getSupabaseClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await verifyAdmin(supabase, user.id);

  const { data: connection, error } = await supabase
    .from('google_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('admin_user_id', user.id)
    .single();

  if (error || !connection) throw new Error('Connection not found');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: decrypt(connection.access_token_encrypted),
    refresh_token: connection.refresh_token_encrypted ? decrypt(connection.refresh_token_encrypted) : undefined,
    expiry_date: connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : undefined,
  });

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const updateData: any = {
        access_token_encrypted: encrypt(tokens.access_token),
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        last_refresh_at: new Date().toISOString()
      };
      if (tokens.refresh_token) {
        updateData.refresh_token_encrypted = encrypt(tokens.refresh_token);
      }
      await supabase
        .from('google_connections')
        .update(updateData)
        .eq('id', connectionId);
    }
  });

  // Test token, if it fails, set status to reconnect_required
  try {
    await oauth2Client.getAccessToken();
    await supabase.from('google_connections').update({ last_used_at: new Date().toISOString(), status: 'connected' }).eq('id', connectionId);
  } catch (e: any) {
    await supabase.from('google_connections').update({ status: 'reconnect_required', error_message: e.message }).eq('id', connectionId);
    throw new Error('Google token expired or revoked. Reconnect required.');
  }

  return oauth2Client;
};

// --- GMAIL API ---
router.get('/gmail/inbox', async (req, res) => {
  try {
    const { connectionId, pageToken, q } = req.query;
    const auth = await getGoogleClient(req, connectionId as string);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: q ? undefined : ['INBOX'],
      q: q as string,
      maxResults: 20,
      pageToken: pageToken as string
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        const d = await gmail.users.messages.get({ userId: 'me', id: msg.id as string, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
        const headers = d.data.payload?.headers || [];
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: d.data.snippet,
          subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
          from: headers.find(h => h.name === 'From')?.value || 'Unknown',
          date: headers.find(h => h.name === 'Date')?.value,
          unread: d.data.labelIds?.includes('UNREAD')
        };
      })
    );

    res.json({ messages: messageDetails, nextPageToken: response.data.nextPageToken });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/gmail/send', async (req, res) => {
  try {
    const { connectionId, to, subject, body } = req.body;
    const auth = await getGoogleClient(req, connectionId as string);
    const gmail = google.gmail({ version: 'v1', auth });

    const message = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      'MIME-Version: 1.0\n',
      'Content-Transfer-Encoding: 7bit\n',
      `to: ${to}\n`,
      `subject: ${subject}\n\n`,
      body
    ].join('');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// --- DRIVE API ---
router.get('/drive/files', async (req, res) => {
  try {
    const { connectionId, pageToken, q } = req.query;
    const auth = await getGoogleClient(req, connectionId as string);
    const drive = google.drive({ version: 'v3', auth });

    const query = q ? q as string : "'root' in parents and trashed = false";
    const response = await drive.files.list({
      q: query,
      pageSize: 30,
      pageToken: pageToken as string,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, iconLink, hasThumbnail, thumbnailLink, webViewLink)',
      orderBy: 'folder,modifiedTime desc'
    });

    res.json({ files: response.data.files || [], nextPageToken: response.data.nextPageToken });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- CONTACTS API ---
router.get('/contacts', async (req, res) => {
  try {
    const { connectionId, pageToken, q } = req.query;
    const auth = await getGoogleClient(req, connectionId as string);
    const people = google.people({ version: 'v1', auth });

    if (q) {
      const response = await people.people.searchContacts({
        query: q as string,
        readMask: 'names,emailAddresses,phoneNumbers,photos',
        pageSize: 30
      });
      const contacts = (response.data.results || []).map(r => r.person);
      res.json({ contacts });
    } else {
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 30,
        pageToken: pageToken as string,
        personFields: 'names,emailAddresses,phoneNumbers,photos'
      });
      res.json({ contacts: response.data.connections || [], nextPageToken: response.data.nextPageToken });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Revoke
router.post('/auth/revoke', async (req, res) => {
  try {
    const { connectionId } = req.body;
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data: connection } = await supabase
      .from('google_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('admin_user_id', user.id)
      .single();

    if (connection && connection.access_token_encrypted) {
      const token = decrypt(connection.access_token_encrypted);
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
      } catch (e) {
        console.warn('Revoke API call failed', e);
      }
    }
    
    await supabase.from('google_connections').update({
      status: 'revoked',
      access_token_encrypted: 'REVOKED',
      refresh_token_encrypted: 'REVOKED',
      revoked_at: new Date().toISOString()
    }).eq('id', connectionId);

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect (Delete)
router.post('/auth/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.body;
    const authHeader = req.headers.authorization;
    const supabase = getSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    await supabase.from('google_connections').delete().eq('id', connectionId).eq('admin_user_id', user.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
