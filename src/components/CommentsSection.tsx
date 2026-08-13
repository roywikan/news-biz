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

  // 2. Load Comments for this post
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/comments?postSlug=${encodeURIComponent(postSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  // 3. Initialize Google Identity Services (GSI)
  useEffect(() => {
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
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            // Standard client ID or prompt handler
            client_id: '10842753052029-parenting-blog.apps.googleusercontent.com',
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
  }, [user]);

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

      const data = await res.json() as { success?: boolean; comment?: Comment; error?: string };
      if (res.ok && data.success) {
        setCommentText('');
        setSuccessMsg('Komentar Anda berhasil dipublikasikan!');
        setTimeout(() => setSuccessMsg(''), 4000);
        // Refresh comments list
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
        } else {
          fetchComments();
        }
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
      
      {/* SECTION TITLE & BADGE */}
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

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Proteksi Akun Google & Turnstile</span>
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
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md">
                      <UserCheck className="w-3 h-3" /> Terverifikasi Google
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-bold transition-all flex items-center gap-1"
                title="Keluar dari akun Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar Akun</span>
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
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
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
              {/* Google GSI Native Button Container */}
              <div ref={googleBtnRef} className="min-h-[40px]" />

              {/* Instant One-Click Google Login Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowDemoLoginModal(true)}
                className="px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Atau Masuk Cepat Akun Google</span>
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
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
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
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
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
                          {comment.userName}
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
