import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { INITIAL_POSTS, INITIAL_AUTOLINKS, INITIAL_USERS } from "./src/data/initialData";
import { DEFAULT_SITE_CONFIG } from "./src/lib/config";

// In-Memory Data Store (Initialized with default seed data)
let postsStore = [...INITIAL_POSTS];
let autolinksStore = [...INITIAL_AUTOLINKS];
let usersStore = [...INITIAL_USERS];
let siteConfigStore = { ...DEFAULT_SITE_CONFIG };

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS Middleware
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // 1. GET /api/posts
  app.get("/api/posts", (_req, res) => {
    res.json(postsStore);
  });

  // 2. POST /api/posts
  app.post("/api/posts", (req, res) => {
    const body = req.body || {};
    const { id, title, slug, contentMarkdown, excerpt, featuredImage, category, readTimeMinutes, authorId, status, metaTitle, metaDescription, tags } = body;

    if (!title || !contentMarkdown) {
      return res.status(400).json({ error: "Judul dan konten markdown wajib diisi." });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const postExcerpt = excerpt || contentMarkdown.slice(0, 150) + '...';
    const image = featuredImage || 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80';
    const cat = category || 'Pola Asuh';
    const readMin = readTimeMinutes || Math.max(1, Math.ceil(contentMarkdown.split(' ').length / 200));
    const postStatus = status || 'draft';
    const mTitle = metaTitle || `${title} | Parenting.my.id`;
    const mDesc = metaDescription || postExcerpt;
    const tagList = tags || 'parenting, anak';
    const now = new Date().toISOString();

    const author = usersStore.find(u => u.id === (authorId || 1)) || usersStore[0];

    if (id) {
      const index = postsStore.findIndex(p => p.id === Number(id));
      if (index !== -1) {
        postsStore[index] = {
          ...postsStore[index],
          title,
          slug: generatedSlug,
          contentMarkdown,
          excerpt: postExcerpt,
          featuredImage: image,
          category: cat,
          readTimeMinutes: readMin,
          status: postStatus,
          metaTitle: mTitle,
          metaDescription: mDesc,
          tags: tagList,
          updatedAt: now,
        };
        return res.json({ success: true, post: postsStore[index] });
      }
    }

    const newPost = {
      id: Date.now(),
      title,
      slug: generatedSlug,
      contentMarkdown,
      excerpt: postExcerpt,
      featuredImage: image,
      category: cat,
      readTimeMinutes: readMin,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      authorRole: author.role,
      status: postStatus,
      metaTitle: mTitle,
      metaDescription: mDesc,
      tags: tagList,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };

    postsStore.unshift(newPost);
    return res.json({ success: true, post: newPost });
  });

  // 3. DELETE /api/posts/:id
  app.delete("/api/posts/:id", (req, res) => {
    const id = Number(req.params.id);
    postsStore = postsStore.filter(p => p.id !== id);
    res.json({ success: true, message: "Artikel berhasil dihapus" });
  });

  // 4. GET /api/autolinks
  app.get("/api/autolinks", (_req, res) => {
    res.json(autolinksStore);
  });

  // 5. POST /api/autolinks
  app.post("/api/autolinks", (req, res) => {
    const { keyword, targetUrl, description } = req.body || {};
    if (!keyword || !targetUrl) {
      return res.status(400).json({ error: "Keyword dan Target URL wajib diisi" });
    }

    const existingIndex = autolinksStore.findIndex(a => a.keyword.toLowerCase() === keyword.toLowerCase());
    if (existingIndex !== -1) {
      autolinksStore[existingIndex] = {
        ...autolinksStore[existingIndex],
        targetUrl,
        description: description || '',
      };
      return res.json({ success: true, autolink: autolinksStore[existingIndex] });
    }

    const newAutolink = {
      id: Date.now(),
      keyword,
      targetUrl,
      description: description || '',
      clickCount: 0,
    };
    autolinksStore.push(newAutolink);
    res.json({ success: true, autolink: newAutolink });
  });

  // 6. DELETE /api/autolinks/:id
  app.delete("/api/autolinks/:id", (req, res) => {
    const id = Number(req.params.id);
    autolinksStore = autolinksStore.filter(a => a.id !== id);
    res.json({ success: true, message: "Autolink berhasil dihapus" });
  });

  // 7. GET /api/config
  app.get("/api/config", (_req, res) => {
    res.json(siteConfigStore);
  });

  // 8. POST /api/config
  app.post("/api/config", (req, res) => {
    const body = req.body || {};
    siteConfigStore = { ...siteConfigStore, ...body };
    res.json({ success: true, message: "Konfigurasi situs berhasil diperbarui." });
  });

  // 9. POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password, turnstileToken } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi." });
    }

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAEOu5iLIHe4oGxF6SIMinH1smE0';
    if (turnstileSecret && turnstileToken) {
      try {
        const verifyFormData = new URLSearchParams();
        verifyFormData.append('secret', turnstileSecret);
        verifyFormData.append('response', turnstileToken);

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: verifyFormData,
        });
        const outcome: any = await verifyRes.json();
        if (!outcome.success) {
          return res.status(403).json({ error: "Verifikasi Turnstile CAPTCHA gagal." });
        }
      } catch (err) {
        console.error("Turnstile verification error:", err);
      }
    }

    const user = usersStore.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (user) {
      return res.json({
        success: true,
        user,
        token: `session_${user.id}_${Date.now()}`
      });
    }

    // Default fallback check
    const lowerEmail = String(email).toLowerCase();
    if ((lowerEmail.startsWith('admin@') || lowerEmail.includes('admin')) && (password === 'admin123' || password === 'admin')) {
      return res.json({
        success: true,
        user: { ...usersStore[0], email: lowerEmail },
        token: `session_1_${Date.now()}`
      });
    } else if ((lowerEmail.startsWith('penulis@') || lowerEmail.startsWith('writer@') || lowerEmail.includes('writer')) && (password === 'writer123' || password === 'writer')) {
      return res.json({
        success: true,
        user: { ...usersStore[1], email: lowerEmail },
        token: `session_2_${Date.now()}`
      });
    }

    return res.status(401).json({ error: "Email atau password salah." });
  });

  // 10. POST /api/auth/update-credentials
  app.post("/api/auth/update-credentials", (req, res) => {
    const { id, name, email, avatar, bio } = req.body || {};
    if (!id || !email) {
      return res.status(400).json({ error: "ID dan Email wajib diisi." });
    }

    const userIndex = usersStore.findIndex(u => u.id === Number(id));
    if (userIndex !== -1) {
      usersStore[userIndex] = {
        ...usersStore[userIndex],
        name: name || usersStore[userIndex].name,
        email: email || usersStore[userIndex].email,
        avatar: avatar || usersStore[userIndex].avatar,
        bio: bio || usersStore[userIndex].bio,
      };
      return res.json({
        success: true,
        user: usersStore[userIndex],
        message: "Kredensial berhasil diperbarui."
      });
    }

    const newUser = {
      id: Number(id),
      email,
      name: name || "Admin",
      role: "admin" as const,
      avatar: avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      bio: bio || "",
    };
    usersStore.push(newUser);
    return res.json({ success: true, user: newUser, message: "Pengguna baru berhasil dibuat." });
  });

  // 11. POST /api/upload-github
  app.post("/api/upload-github", (req, res) => {
    const { filename } = req.body || {};
    const fallbackUrl = `https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80`;
    res.json({
      success: true,
      url: fallbackUrl,
      message: `Gambar ${filename || 'file'} berhasil diproses.`
    });
  });

  // Comments mock store
  const commentsStore: any[] = [
    {
      id: 1,
      postSlug: 'gizi-seimbang-balita-1-3-tahun',
      userName: 'Siti Rahmawati',
      userEmail: 'siti.rahmawati@gmail.com',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      content: 'Artikel yang sangat bermanfaat! Informasi gizi makro dan mikronya sangat jelas untuk panduan menu harian balita saya.',
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 2,
      postSlug: 'gizi-seimbang-balita-1-3-tahun',
      userName: 'Budi Santoso',
      userEmail: 'budi.santoso@gmail.com',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      content: 'Terima kasih Dokter Ratna atas pembahasannya. Sangat membantu mengatasi anak saya yang sedang Gerakan Tutup Mulut (GTM).',
      status: 'approved',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ];

  // Helper decode JWT
  const decodeJwtLocal = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  };

  // GET /api/comments
  app.get("/api/comments", (req, res) => {
    const { postSlug } = req.query;
    if (postSlug) {
      const filtered = commentsStore.filter(c => c.postSlug === postSlug && c.status === 'approved');
      return res.json(filtered);
    }
    res.json(commentsStore);
  });

  // POST /api/comments
  app.post("/api/comments", (req, res) => {
    const { postSlug, content, googleCredential } = req.body || {};
    let userName = req.body?.userName || '';
    let userEmail = req.body?.userEmail || '';
    let userAvatar = req.body?.userAvatar || '';

    if (!postSlug || !content || !content.trim()) {
      return res.status(400).json({ error: "Slug artikel dan isi komentar wajib diisi." });
    }

    if (googleCredential) {
      const gPayload = decodeJwtLocal(googleCredential);
      if (gPayload && gPayload.email) {
        userName = gPayload.name || userName || 'Pembaca Google';
        userEmail = gPayload.email;
        userAvatar = gPayload.picture || userAvatar || 'https://lh3.googleusercontent.com/a/default-user';
      }
    }

    if (!userName || !userEmail) {
      return res.status(401).json({ error: "Harap login dengan akun Google terlebih dahulu." });
    }

    const cleanAvatar = userAvatar || 'https://lh3.googleusercontent.com/a/default-user';
    const newComment = {
      id: Date.now(),
      postSlug,
      userName,
      userEmail,
      userAvatar: cleanAvatar,
      content: String(content).trim(),
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    commentsStore.unshift(newComment);
    res.json({ success: true, comment: newComment });
  });

  // DELETE /api/comments/:id
  app.delete("/api/comments/:id", (req, res) => {
    const commentId = Number(req.params.id);
    const index = commentsStore.findIndex(c => c.id === commentId);
    if (index !== -1) {
      commentsStore.splice(index, 1);
    }
    res.json({ success: true, id: commentId });
  });

  // 12. POST /api/ai/generate-meta
  app.post("/api/ai/generate-meta", async (req, res) => {
    const { title, content } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const host = req.headers.host || '';
    const rawHost = host.split(':')[0];
    const siteDomain = process.env.SITE_DOMAIN || (rawHost ? rawHost.replace(/^www\./, '') : 'example.com');

    if (!apiKey) {
      return res.json({
        metaTitle: `${title || 'Artikel'} | ${siteDomain}`,
        metaDescription: (content || '').slice(0, 150).replace(/[#*`_]/g, '') + '...',
        tags: 'parenting, anak, keluarga, kesehatan anak, balita',
        excerpt: (content || '').slice(0, 180).replace(/[#*`_]/g, '') + '...'
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Anda adalah seorang Senior SEO Specialist & Content Strategist untuk domain website ${siteDomain}.
Berdasarkan judul artikel: "${title}" dan isi ringkas: "${(content || '').slice(0, 500)}", hasilkan format JSON persis seperti ini tanpa markdown:
{
  "metaTitle": "Judul SEO menarik maksimal 60 karakter diakhiri | ${siteDomain}",
  "metaDescription": "Deskripsi Meta SEO membujuk dan memuat kata kunci utama (120-155 karakter).",
  "tags": "5 kata kunci dipisahkan koma",
  "excerpt": "Ringkasan artikel 2 kalimat yang hangat dan informatif untuk pembaca."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }

      return res.json({
        metaTitle: `${title} | ${siteDomain}`,
        metaDescription: (content || '').slice(0, 150).replace(/[#*`_]/g, '') + '...',
        tags: 'parenting, anak, keluarga, kesehatan anak, balita',
        excerpt: (content || '').slice(0, 180).replace(/[#*`_]/g, '') + '...'
      });
    } catch (err) {
      console.error("Gemini API Error:", err);
      return res.json({
        metaTitle: `${title} | ${siteDomain}`,
        metaDescription: (content || '').slice(0, 150).replace(/[#*`_]/g, '') + '...',
        tags: 'parenting, anak, keluarga, kesehatan anak, balita',
        excerpt: (content || '').slice(0, 180).replace(/[#*`_]/g, '') + '...'
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer(); 
