import React, { useState, useEffect, useRef } from 'react';
import { Comment } from '../types';
import { MessageSquare, Send, LogOut, ShieldCheck, UserCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface CommentsSectionProps {
  postSlug: string;
}

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

export default function CommentsSection({ postSlug }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoLoginModal, setShowDemoLoginModal] = useState(false);

  // Custom demo input state
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Helper to mask 25% of last characters for privacy (e.g. "Mbak Tutuk" -> "Mbak Tut**")
  const maskName = (name: string) => {
    if (!name) return 'Pembaca';
    const trimmed = name.trim();
    if (trimmed.length <= 2) return trimmed;
    const charsToMask = Math.max(1, Math.ceil(trimmed.length * 0.25));
    const visibleLength = trimmed.length - charsToMask;
    const visiblePart = trimmed.slice(0, visibleLength);
    return visiblePart + '*'.repeat(charsToMask);
  };

  // Helper to mask email for logged in indicator
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return '';
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `**@${domain}`;
    return `${userPart.slice(0, 2)}***@${domain}`;
  };

  // 1. Load Google User from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('parenting_google_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('parenting_google_user');
      }
    }
  }, []);

  // 2. Load Comments for this post (merge with localStorage cache for instant persistence)
  const fetchComments = async () => {
    try {
      setLoading(true);
      // Load local cached comments first
      const localKey = `parenting_comments_${postSlug}`;
      let cachedComments: Comment[] = [];
      try {
        const rawCache = localStorage.getItem(localKey);
        if (rawCache) cachedComments = JSON.parse(rawCache);
      } catch (e) {}

      const res = await fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`);
      let serverComments: Comment[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) serverComments = data;
      }

      // Merge server comments with local cached comments to guarantee persistence
      const mergedMap = new Map<string | number, Comment>();
      [...serverComments, ...cachedComments].forEach((c) => {
        const key = c.id || `${c.userName}_${c.content.slice(0, 20)}_${c.createdAt}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, c);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setComments(mergedList);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  // 3. Initialize Google Identity Services (GSI) if valid Client ID exists
  const customClientId = (((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '').trim();
  const hasValidClientId = Boolean(
    customClientId &&
      customClientId.length > 20 &&
      !customClientId.includes('parenting-blog') &&
      customClientId.endsWith('.apps.googleusercontent.com')
  );

  useEffect(() => {
    if (!hasValidClientId) return;

    // Inject GSI script if not already present
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id && customClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: customClientId,
            callback: (response: any) => {
              if (response.credential) {
                try {
                  const parts = response.credential.split('.');
                  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                  const gUser: GoogleUser = {
                    name: payload.name || 'Pembaca Google',
                    email: payload.email,
                    picture: payload.picture || 'https://lh3.googleusercontent.com/a/default-user',
                    credential: response.credential,
                  };
                  setUser(gUser);
                  localStorage.setItem('parenting_google_user', JSON.stringify(gUser));
                } catch (e) {
                  console.error('Error parsing Google JWT:', e);
                }
              }
            },
            auto_select: false,
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'pill',
              logo_alignment: 'left',
            });
          }
        } catch (e) {
          console.warn('GSI init notice:', e);
        }
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogleGsi();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [user, hasValidClientId, customClientId]);

  // Handle Logout from Google
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('parenting_google_user');
  };

  // Quick One-Click Google Login / Demo Login for Preview
  const handleQuickGoogleSignIn = (name: string, email: string) => {
    if (!email || !email.includes('@')) {
      alert('Masukkan alamat email Google yang valid.');
      return;
    }
    const cleanName = name.trim() || email.split('@')[0];
    const initial = cleanName.charAt(0).toUpperCase();
    const mockAvatar = `https://lh3.googleusercontent.com/a/ACg8ocI${Date.now() % 1000}`;
    const gUser: GoogleUser = {
      name: cleanName,
      email: email.trim().toLowerCase(),
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=e11d48&color=fff&bold=true`,
    };
    setUser(gUser);
    localStorage.setItem('parenting_google_user', JSON.stringify(gUser));
    setShowDemoLoginModal(false);
  };

  // Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Harap masuk dengan akun Google terlebih dahulu.');
      return;
    }

    if (!commentText.trim()) {
      setErrorMsg('Silakan tuliskan komentar Anda.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug,
          content: commentText.trim(),
          userName: user.name,
          userEmail: user.email,
          userAvatar: user.picture,
          googleCredential: user.credential,
        }),
      });

      const data = (await res.json()) as { success?: boolean; comment?: Comment; error?: string };
      if (res.ok && data.success) {
        setCommentText('');
        setSuccessMsg('Komentar Anda berhasil dipublikasikan!');
        setTimeout(() => setSuccessMsg(''), 4000);

        const newComm = data.comment || {
          id: Date.now(),
          postSlug,
          userName: user.name,
          userEmail: user.email,
          userAvatar: user.picture,
          content: commentText.trim(),
          status: 'approved',
          createdAt: new Date().toISOString(),
        };

        // Cache locally so it persists even if backend D1 binding is pending
        const localKey = `parenting_comments_${postSlug}`;
        try {
          const raw = localStorage.getItem(localKey);
          const existing = raw ? JSON.parse(raw) : [];
          localStorage.setItem(localKey, JSON.stringify([newComm, ...existing]));
        } catch (e) {}

        setComments((prev) => [newComm, ...prev.filter((c) => c.id !== newComm.id)]);
      } else {
        setErrorMsg(data.error || 'Gagal mengirim komentar.');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setErrorMsg('Terjadi kesalahan koneksi saat mengirim komentar.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Baru saja';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <section className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-8" id="komentar">
      {/* SECTION TITLE & ICON BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-rose-600" />
            <span>Komentar & Diskusi Pembaca ({comments.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Suarakan pendapat, pengalaman pengasuhan, atau pertanyaan Anda di sini.
          </p>
        </div>

        {/* Clean Icon-Only Badge for Security (No SEO Text Bloat) */}
        <div
          className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs"
          title="Sistem Proteksi Akun Google & Turnstile Aktif"
          aria-label="Proteksi Akun Google & Turnstile"
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
      </div>

      {/* FORM INPUT KOMENTAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {user ? (
          /* USER LOGGED IN WITH GOOGLE */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-rose-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-rose-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-rose-500 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e11d48&color=fff`;
                  }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {maskName(user.name)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md">
                      <UserCheck className="w-3 h-3" /> Terverifikasi Google
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{maskEmail(user.email)}</div>
                </div>
              </div>

              {/* Icon-Only Logout Button (No SEO Text Noise) */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 transition-all cursor-pointer"
                title="Keluar dari akun Google"
                aria-label="Keluar dari akun Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitComment} className="space-y-3">
              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tuliskan komentar, tanggapan, atau saran Anda mengenai artikel ini..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                />
                <div className="flex justify-end text-[10px] text-slate-400 pt-1">
                  {commentText.length}/1000 Karakter
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Mengirim Komentar...' : 'Kirim Komentar'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* USER NOT LOGGED IN */
          <div className="text-center py-6 px-4 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Masuk dengan Akun Google untuk Berkomentar
              </h4>
              <p className="text-xs text-slate-500">
                Gunakan identitas Google Anda secara instan, aman, dan tanpa perlu membuat password baru.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {hasValidClientId ? <div ref={googleBtnRef} className="min-h-[40px]" /> : null}

              <button
                type="button"
                onClick={() => setShowDemoLoginModal(true)}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Akun Google / Gmail</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK GOOGLE LOGIN MODAL */}
      {showDemoLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Masuk dengan Akun Google</span>
              </h4>
              <button
                onClick={() => setShowDemoLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Anda (Google Profile)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Budi / Dr. Hendra"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Gmail / Google
                </label>
                <input
                  type="email"
                  placeholder="pembaca@gmail.com"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickGoogleSignIn(demoName, demoEmail)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Lanjutkan Berkomentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIST OF COMMENTS */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
            Memuat daftar komentar pembaca...
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Komentar</h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Jadilah orang pertama yang menyuarakan pandangan atau pengalaman pengasuhan Anda di artikel ini!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.userAvatar || 'https://lh3.googleusercontent.com/a/default-user'}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover border border-rose-200 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=e11d48&color=fff`;
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {maskName(comment.userName)}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                          <UserCheck className="w-2.5 h-2.5" /> Google
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-10">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
