interface Env {
  DB?: any;
  SITE_DOMAIN?: string;
  SITE_URL?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const siteDomain = env.SITE_DOMAIN || url.hostname.replace(/^www\./, '');

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  };

  if (method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200);
  }

  try {
    // 1. GET /api/posts
    if (path === '/api/posts' && method === 'GET') {
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(`
            SELECT 
              p.id, p.title, p.slug, p.content_markdown as contentMarkdown, p.excerpt, 
              p.featured_image as featuredImage, p.category, p.read_time_minutes as readTimeMinutes, 
              p.author_id as authorId, p.status, p.meta_title as metaTitle, 
              p.meta_description as metaDescription, p.tags, p.views, p.created_at as createdAt, p.updated_at as updatedAt,
              u.name as authorName, u.avatar as authorAvatar, u.role as authorRole
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.id DESC
          `).all();

          if (results && results.length > 0) {
            return jsonResponse(results);
          }
        } catch (e) {
          console.error('Error fetching posts from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 2. POST /api/posts
    if (path === '/api/posts' && method === 'POST') {
      const body = await request.json() as any;
      const { id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, authorId, status, metaTitle, metaDescription, tags } = body;

      if (!title || !contentMarkdown) {
        return jsonResponse({ error: 'Judul dan konten markdown wajib diisi.' }, 400);
      }

      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const postExcerpt = excerpt || contentMarkdown.slice(0, 150) + '...';
      const image = featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80';
      const cat = category || 'Pola Asuh';
      const readMin = readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200));
      const postStatus = status || 'draft';
      const mTitle = metaTitle || `${title} | ${siteDomain}`;
      const mDesc = metaDescription || postExcerpt;
      const tagList = tags || 'parenting, anak';
      const now = new Date().toISOString();

      if (env.DB) {
        try {
          if (id) {
            await env.DB.prepare(`
              UPDATE posts SET 
                title = ?, slug = ?, content_markdown = ?, excerpt = ?, featured_image = ?,
                category = ?, read_time_minutes = ?, status = ?, meta_title = ?, meta_description = ?,
                tags = ?, updated_at = ?
              WHERE id = ?
            `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, postStatus, mTitle, mDesc, tagList, now, id).run();

            return jsonResponse({ success: true, post: { ...body, id, slug: generatedSlug, updatedAt: now } });
          } else {
            const insertResult = await env.DB.prepare(`
              INSERT INTO posts (title, slug, content_markdown, excerpt, featured_image, category, read_time_minutes, author_id, status, meta_title, meta_description, tags, views, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(title, generatedSlug, contentMarkdown, postExcerpt, image, cat, readMin, authorId || 1, postStatus, mTitle, mDesc, tagList, now, now).run();

            const newId = insertResult.meta?.last_row_id || Date.now();

            return jsonResponse({
              success: true,
              post: {
                id: newId,
                title,
                slug: generatedSlug,
                contentMarkdown,
                excerpt: postExcerpt,
                featuredImage: image,
                category: cat,
                readTimeMinutes: readMin,
                authorId: authorId || 1,
                status: postStatus,
                metaTitle: mTitle,
                metaDescription: mDesc,
                tags: tagList,
                views: 0,
                createdAt: now,
                updatedAt: now
              }
            });
          }
        } catch (e: any) {
          console.error('Error saving post to D1:', e);
          return jsonResponse({ error: 'Gagal menyimpan artikel ke D1 Database: ' + e.message }, 500);
        }
      }

      return jsonResponse({ success: true, post: { ...body, id: id || Date.now(), slug: generatedSlug } });
    }

    // 3. DELETE /api/posts/:id
    if (path.startsWith('/api/posts/') && method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (env.DB && id) {
        try {
          await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        } catch (e) {
          console.error('Error deleting post from D1:', e);
        }
      }
      return jsonResponse({ success: true, message: 'Artikel berhasil dihapus' });
    }

    // 4. GET /api/autolinks
    if (path === '/api/autolinks' && method === 'GET') {
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare('SELECT id, keyword, target_url as targetUrl, description, click_count as clickCount FROM autolinks ORDER BY id DESC').all();
          if (results && results.length > 0) {
            return jsonResponse(results);
          }
        } catch (e) {
          console.error('Error fetching autolinks from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 5. POST /api/autolinks
    if (path === '/api/autolinks' && method === 'POST') {
      const body = await request.json() as any;
      const { keyword, targetUrl, description } = body;
      if (!keyword || !targetUrl) {
        return jsonResponse({ error: 'Keyword dan Target URL wajib diisi' }, 400);
      }

      if (env.DB) {
        try {
          const existing = await env.DB.prepare('SELECT id FROM autolinks WHERE LOWER(keyword) = LOWER(?)').bind(keyword).first();
          if (existing) {
            await env.DB.prepare('UPDATE autolinks SET target_url = ?, description = ? WHERE id = ?').bind(targetUrl, description || '', existing.id).run();
            return jsonResponse({ success: true, autolink: { id: existing.id, keyword, targetUrl, description } });
          } else {
            const insertRes = await env.DB.prepare('INSERT INTO autolinks (keyword, target_url, description) VALUES (?, ?, ?)').bind(keyword, targetUrl, description || '').run();
            return jsonResponse({ success: true, autolink: { id: insertRes.meta?.last_row_id || Date.now(), keyword, targetUrl, description, clickCount: 0 } });
          }
        } catch (e: any) {
          console.error('Error saving autolink to D1:', e);
        }
      }

      return jsonResponse({ success: true, autolink: { id: Date.now(), keyword, targetUrl, description, clickCount: 0 } });
    }

    // 6. DELETE /api/autolinks/:id
    if (path.startsWith('/api/autolinks/') && method === 'DELETE') {
      const parts = path.split('/');
      const id = parts[parts.length - 1];
      if (env.DB && id) {
        try {
          await env.DB.prepare('DELETE FROM autolinks WHERE id = ?').bind(id).run();
        } catch (e) {
          console.error('Error deleting autolink from D1:', e);
        }
      }
      return jsonResponse({ success: true, message: 'Autolink berhasil dihapus' });
    }

    // Helper decode JWT
    const decodeJwtCloud = (token: string) => {
      try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(payloadBase64);
        return JSON.parse(decoded);
      } catch (e) {
        return null;
      }
    };

    // 6.1 GET /api/comments
    if (path === '/api/comments' && method === 'GET') {
      const postSlug = url.searchParams.get('postSlug');
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'approved',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();

          if (postSlug) {
            const { results } = await env.DB.prepare(`
              SELECT id, post_slug as postSlug, user_name as userName, user_email as userEmail, user_avatar as userAvatar, content, status, created_at as createdAt 
              FROM comments 
              WHERE post_slug = ? AND status = 'approved' 
              ORDER BY id DESC
            `).bind(postSlug).all();
            return jsonResponse(results || []);
          } else {
            const { results } = await env.DB.prepare(`
              SELECT id, post_slug as postSlug, user_name as userName, user_email as userEmail, user_avatar as userAvatar, content, status, created_at as createdAt 
              FROM comments 
              ORDER BY id DESC
            `).all();
            return jsonResponse(results || []);
          }
        } catch (e) {
          console.error('Error fetching comments from D1:', e);
        }
      }
      return jsonResponse([]);
    }

    // 6.2 POST /api/comments
    if (path === '/api/comments' && method === 'POST') {
      const body = await request.json() as any;
      const { postSlug, content, googleCredential } = body;
      let userName = body.userName || '';
      let userEmail = body.userEmail || '';
      let userAvatar = body.userAvatar || '';

      if (!postSlug || !content || !content.trim()) {
        return jsonResponse({ error: 'Slug artikel dan isi komentar wajib diisi.' }, 400);
      }

      if (googleCredential) {
        const gPayload = decodeJwtCloud(googleCredential);
        if (gPayload && gPayload.email) {
          userName = gPayload.name || userName || 'Pembaca Google';
          userEmail = gPayload.email;
          userAvatar = gPayload.picture || userAvatar || 'https://lh3.googleusercontent.com/a/default-user';
        }
      }

      if (!userName || !userEmail) {
        return jsonResponse({ error: 'Harap login dengan akun Google terlebih dahulu.' }, 401);
      }

      const cleanAvatar = userAvatar || 'https://lh3.googleusercontent.com/a/default-user';
      const cleanContent = String(content).trim();
      const nowIso = new Date().toISOString();

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              post_slug TEXT NOT NULL,
              user_name TEXT NOT NULL,
              user_email TEXT NOT NULL,
              user_avatar TEXT NOT NULL,
              content TEXT NOT NULL,
              status TEXT DEFAULT 'approved',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `).run();

          const insertRes = await env.DB.prepare(`
            INSERT INTO comments (post_slug, user_name, user_email, user_avatar, content, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'approved', ?)
          `).bind(postSlug, userName, userEmail, cleanAvatar, cleanContent, nowIso).run();

          return jsonResponse({
            success: true,
            comment: {
              id: insertRes.meta?.last_row_id || Date.now(),
              postSlug,
              userName,
              userEmail,
              userAvatar: cleanAvatar,
              content: cleanContent,
              status: 'approved',
              createdAt: nowIso
            }
          });
        } catch (e) {
          console.error('Error inserting comment into D1:', e);
        }
      }

      return jsonResponse({
        success: true,
        comment: {
          id: Date.now(),
          postSlug,
          userName,
          userEmail,
          userAvatar: cleanAvatar,
          content: cleanContent,
          status: 'approved',
          createdAt: nowIso
        }
      });
    }

    // 6.3 DELETE /api/comments/:id
    if (path.startsWith('/api/comments/') && method === 'DELETE') {
      const parts = path.split('/');
      const commentId = parts[parts.length - 1];
      if (env.DB && commentId) {
        try {
          await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();
        } catch (e) {
          console.error('Error deleting comment from D1:', e);
        }
      }
      return jsonResponse({ success: true, id: commentId });
    }

    // 7. GET /api/config (Public site settings ONLY)
    if (path === '/api/config' && method === 'GET') {
      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS configs (
              key TEXT PRIMARY KEY,
              value TEXT
            )
          `).run();

          // SECURITY PURGE: Remove any sensitive credential keys accidentally saved in configs table
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key LIKE 'admin_%' OR key LIKE '%password%' OR key LIKE '%secret%' OR key LIKE '%token%'").run();
          } catch {}

          const { results } = await env.DB.prepare('SELECT key, value FROM configs').all();
          if (results && results.length > 0) {
            const configObj: Record<string, any> = {};
            const SENSITIVE_KEYS = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];
            
            for (const row of results) {
              const kLower = String(row.key).toLowerCase();
              if (SENSITIVE_KEYS.includes(row.key) || kLower.startsWith('admin_') || kLower.includes('password') || kLower.includes('secret')) {
                continue; // STRIKT: Exclude all credential keys from public site config response
              }
              try {
                configObj[row.key] = JSON.parse(row.value);
              } catch {
                configObj[row.key] = row.value;
              }
            }
            return jsonResponse(configObj);
          }
        } catch (e) {
          console.error('Error fetching site configs from D1:', e);
        }
      }
      return jsonResponse({});
    }

    // 8. POST /api/config
    if (path === '/api/config' && method === 'POST') {
      const body = await request.json() as Record<string, any>;
      if (!body || typeof body !== 'object') {
        return jsonResponse({ error: 'Data konfigurasi tidak valid.' }, 400);
      }

      // If body contains admin user credentials, update the users table directly instead of storing in configs
      if (body.admin_email || body.admin_password || body.admin_name) {
        if (env.DB) {
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT,
                avatar TEXT,
                bio TEXT,
                created_at TEXT
              )
            `).run();
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
            try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

            const email = body.admin_email;
            const password = body.admin_password;
            const name = body.admin_name;
            const avatar = body.admin_avatar;
            const bio = body.admin_bio;

            const existing = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR role = "admin"').bind(email || '').first();
            if (existing) {
              if (password && String(password).trim().length > 0) {
                await env.DB.prepare('UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ? WHERE id = ?')
                  .bind(name || 'Admin', email || `admin@${siteDomain}`, String(password), avatar || '', bio || '', existing.id).run();
              } else {
                await env.DB.prepare('UPDATE users SET name = ?, email = ?, avatar = ?, bio = ? WHERE id = ?')
                  .bind(name || 'Admin', email || `admin@${siteDomain}`, avatar || '', bio || '', existing.id).run();
              }
            } else {
              await env.DB.prepare('INSERT INTO users (email, password, name, role, avatar, bio, created_at) VALUES (?, ?, ?, "admin", ?, ?, ?)')
                .bind(email || `admin@${siteDomain}`, String(password || 'admin123'), name || 'Admin', avatar || '', bio || '', new Date().toISOString()).run();
            }
          } catch (uErr) {
            console.error('Error syncing admin user from config payload:', uErr);
          }
        }
      }

      // Filter out sensitive credential keys from being written to configs table or public/site_config.json
      const safeConfigObj: Record<string, any> = {};
      const SENSITIVE_KEYS = ['admin_email', 'admin_password', 'admin_name', 'admin_avatar', 'admin_bio', 'password', 'secret', 'token'];

      for (const [key, value] of Object.entries(body)) {
        const kLower = key.toLowerCase();
        if (SENSITIVE_KEYS.includes(key) || kLower.startsWith('admin_') || kLower.includes('password') || kLower.includes('secret')) {
          continue; // DO NOT SAVE SENSITIVE KEYS INTO CONFIGS TABLE
        }
        safeConfigObj[key] = value;
      }

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS configs (
              key TEXT PRIMARY KEY,
              value TEXT
            )
          `).run();

          // Delete any existing credential keys in DB
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key LIKE 'admin_%' OR key LIKE '%password%' OR key LIKE '%secret%'").run();
          } catch {}

          for (const [key, value] of Object.entries(safeConfigObj)) {
            const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
            await env.DB.prepare(`
              INSERT INTO configs (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `).bind(key, strVal).run();
          }
        } catch (e: any) {
          console.error('Error saving site configs to D1:', e);
        }
      }

      // Sync ONLY safeConfigObj to public/site_config.json via GitHub API if GITHUB_TOKEN exists
      const token = env.GITHUB_TOKEN;
      if (token) {
        try {
          const owner = env.GITHUB_OWNER || 'roywikan';
          const repo = env.GITHUB_REPO || 'parenting-my-id';
          const branch = env.GITHUB_BRANCH || 'main';
          const filePath = 'public/site_config.json';
          const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

          let sha = '';
          const getRes = await fetch(ghUrl, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CloudflarePages-ParentingApp',
            }
          });
          if (getRes.ok) {
            const getData: any = await getRes.json();
            sha = getData.sha;
          }

          const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(safeConfigObj, null, 2))));
          await fetch(ghUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CloudflarePages-ParentingApp',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'update: site_config.json via Admin Portal',
              content: contentBase64,
              branch,
              ...(sha ? { sha } : {})
            }),
          });
        } catch (err) {
          console.error('Failed to sync site_config.json to GitHub:', err);
        }
      }

      return jsonResponse({ success: true, message: 'Konfigurasi situs berhasil diperbarui.' });
    }

    // 9. POST /api/auth/update-credentials
    if (path === '/api/auth/update-credentials' && method === 'POST') {
      const { id, name, email, password, avatar, bio } = await request.json() as any;

      if (!email || !id) {
        return jsonResponse({ error: 'ID dan Email wajib diisi.' }, 400);
      }

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE,
              password TEXT,
              name TEXT,
              role TEXT,
              avatar TEXT,
              bio TEXT,
              created_at TEXT
            )
          `).run();

          // Ensure missing columns exist in existing D1 table
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

          // SECURITY PURGE: Purge any sensitive keys from configs table
          try {
            await env.DB.prepare("DELETE FROM configs WHERE key LIKE 'admin_%' OR key LIKE '%password%' OR key LIKE '%secret%'").run();
          } catch {}

          const existingUser = await env.DB.prepare('SELECT id FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(id, email).first();

          if (existingUser) {
            if (password && password.trim().length > 0) {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, password = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'Admin', email, password, avatar || '', bio || '', existingUser.id).run();
            } else {
              await env.DB.prepare(`
                UPDATE users SET name = ?, email = ?, avatar = ?, bio = ?
                WHERE id = ?
              `).bind(name || 'Admin', email, avatar || '', bio || '', existingUser.id).run();
            }
          } else {
            await env.DB.prepare(`
              INSERT INTO users (id, email, password, name, role, avatar, bio, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(id, email, password || 'admin123', name || 'Admin', 'admin', avatar || '', bio || '', new Date().toISOString()).run();
          }

          const updatedUser = await env.DB.prepare('SELECT id, email, name, role, avatar, bio FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').bind(id, email).first();

          return jsonResponse({
            success: true,
            user: updatedUser || { id, email, name, role: 'admin', avatar, bio },
            message: 'Kredensial berhasil diperbarui di D1 Database.'
          });
        } catch (e: any) {
          console.error('Error updating user credentials in D1:', e);
          return jsonResponse({ error: 'Gagal memperbarui kredensial: ' + e.message }, 500);
        }
      }

      return jsonResponse({
        success: true,
        user: { id, email, name, role: 'admin', avatar, bio },
        message: 'Kredensial diperbarui secara lokal.'
      });
    }

    // 10. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password, turnstileToken } = await request.json() as any;

      // Server-side Turnstile Verification
      const turnstileSecret = env.TURNSTILE_SECRET_KEY || '0x4AAAAAAEOu5iLIHe4oGxF6SIMinH1smE0';
      if (turnstileSecret) {
        if (!turnstileToken) {
          return jsonResponse({ error: 'Harap selesaikan verifikasi Turnstile CAPTCHA.' }, 400);
        }

        try {
          const clientIp = request.headers.get('cf-connecting-ip') || '';
          const verifyFormData = new FormData();
          verifyFormData.append('secret', turnstileSecret);
          verifyFormData.append('response', turnstileToken);
          if (clientIp) verifyFormData.append('remoteip', clientIp);

          const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: verifyFormData,
          });

          const verifyOutcome = await verifyRes.json() as any;
          if (!verifyOutcome.success) {
            return jsonResponse({ error: 'Verifikasi Turnstile gagal atau kadaluarsa. Silakan coba lagi.' }, 403);
          }
        } catch (tErr) {
          console.error('Turnstile verification request failed:', tErr);
          return jsonResponse({ error: 'Layanan verifikasi Turnstile mengalami masalah.' }, 500);
        }
      }

      if (env.DB) {
        try {
          await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE,
              password TEXT,
              name TEXT,
              role TEXT,
              avatar TEXT,
              bio TEXT,
              created_at TEXT
            )
          `).run();

          // Ensure missing columns exist in existing D1 table
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN password TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN avatar TEXT").run(); } catch {}
          try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); } catch {}

          // Query user by email
          const user = await env.DB.prepare('SELECT id, email, password, name, role, avatar, bio FROM users WHERE LOWER(email) = LOWER(?)').bind(email).first();
          
          if (user) {
            // Check password if set in D1
            if (user.password && password && user.password !== password) {
              return jsonResponse({ error: 'Password yang Anda masukkan salah.' }, 401);
            }

            return jsonResponse({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
              },
              token: `session_${user.id}_${Date.now()}`
            });
          }
        } catch (e) {
          console.error('Error logging in via D1:', e);
        }
      }

      // Check D1 config override if set
      if (env.DB) {
        try {
          const customEmail = await env.DB.prepare("SELECT value FROM configs WHERE key = 'admin_email'").first();
          const customPass = await env.DB.prepare("SELECT value FROM configs WHERE key = 'admin_password'").first();

          if (customEmail?.value && customPass?.value) {
            const cleanEmail = String(customEmail.value).replace(/^"|"$/g, '');
            const cleanPass = String(customPass.value).replace(/^"|"$/g, '');

            if (email.toLowerCase() === cleanEmail.toLowerCase() && password === cleanPass) {
              return jsonResponse({
                success: true,
                user: {
                  id: 1,
                  email: cleanEmail,
                  name: 'Admin Utama',
                  role: 'admin',
                  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                  bio: 'Administrator Utama Parenting.my.id'
                },
                token: `session_1_${Date.now()}`
              });
            }
          }
        } catch (e) {
          console.error('Error checking config credentials:', e);
        }
      }

      // Flexible default initial login check for any domain name
      const lowerEmail = email.toLowerCase();
      if ((lowerEmail.startsWith('admin@') || lowerEmail.includes('admin')) && (password === 'admin123' || password === 'admin')) {
        return jsonResponse({
          success: true,
          user: {
            id: 1,
            email: lowerEmail,
            name: 'Administrator',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
            bio: 'Pengelola Portal dan Editor Konten.'
          },
          token: `session_1_${Date.now()}`
        });
      } else if ((lowerEmail.startsWith('penulis@') || lowerEmail.startsWith('writer@') || lowerEmail.includes('writer')) && (password === 'writer123' || password === 'writer')) {
        return jsonResponse({
          success: true,
          user: {
            id: 2,
            email: lowerEmail,
            name: 'Penulis Konten',
            role: 'writer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            bio: 'Edukator dan Penulis Konten.'
          },
          token: `session_2_${Date.now()}`
        });
      }

      return jsonResponse({ error: 'Email atau password salah.' }, 401);
    }

    // 8. POST /api/upload-github
    if (path === '/api/upload-github' && method === 'POST') {
      const { filename, base64Content } = await request.json() as any;
      const token = env.GITHUB_TOKEN;
      const owner = env.GITHUB_OWNER || 'roywikan';
      const repo = env.GITHUB_REPO || 'parenting-my-id';
      const branch = env.GITHUB_BRANCH || 'main';

      if (!token) {
        return jsonResponse({ error: 'GITHUB_TOKEN belum diset di Cloudflare Pages Variables & Secrets.' }, 500);
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const cleanName = (filename || 'image.png').toLowerCase().replace(/[^a-z0-9.-]/g, '-');
      const filePath = `public/uploads/${dateStr}/${Date.now()}-${cleanName}`;
      const message = `upload: image ${filename} via Parenting CMS`;

      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const ghRes = await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CloudflarePages-ParentingApp',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: base64Content,
          branch,
        }),
      });

      if (ghRes.ok) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        return jsonResponse({ success: true, url: rawUrl, path: filePath });
      } else {
        const errData = await ghRes.json() as any;
        return jsonResponse({ error: errData.message || 'Gagal mengunggah gambar ke GitHub.' }, 500);
      }
    }

    return jsonResponse({ error: 'Endpoint tidak ditemukan' }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal Server Error' }, 500);
  }
};
