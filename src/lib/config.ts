import { SiteConfig } from '../types';
import { applyTheme } from './theme';

export function getDerivedDomain(configDomain?: string): string {
  if (configDomain && configDomain.trim().length > 0) {
    return configDomain.trim();
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    return host.startsWith('www.') ? host.substring(4) : host;
  }
  return 'example.com';
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site_name: 'Parenting Portal',
  site_domain: '',
  site_tagline: 'Edukasi & Pengasuhan Anak Modern',
  site_description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga.',
  site_logo_url: '',
  site_logo_icon: 'Heart',
  site_favicon_url: '/favicon.ico',
  header_nav_links: [
    { label: 'Beranda', url: '/' },
    { label: 'Sitemap', url: '/sitemap.xml' },
    { label: 'RSS Feed', url: '/feed.xml' }
  ],
  enable_search_bar: true,
  enable_theme_toggle: true,

  // Theme & Appearance Config
  theme_mode: 'light',
  theme_palette: 'rose-coral',
  font_size_scale: 'standard',

  header_badge_text: 'Cloudflare D1 Edge Engine',
  hero_badge_text: 'Cloudflare D1 Edge Architecture • TTFB < 20ms',
  autolink_ticker_label: 'Kata Kunci SEO Terpopuler:',
  footer_badge_1: 'Cloudflare Pages Edge',
  footer_badge_2: 'Cloudflare D1 SQLite',
  footer_badge_3: 'GitHub REST Storage',
  footer_autolink_label: 'Auto-Linking Engine On-Page',
  seo_meta_title: 'Parenting Portal - Edukasi & Pengasuhan Anak Modern',
  seo_meta_description: 'Portal informasi dan panduan pengasuhan anak modern, nutrisi balita, serta kesehatan keluarga.',
  seo_default_og_image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200&h=630',
  show_hero_section: true,
  hero_title: 'Panduan Pengasuhan Anak Terpercaya',
  hero_subtitle: 'Temukan artikel, tips nutrisi, dan edukasi tumbuh kembang anak untuk orang tua modern.',
  hero_cta_text: 'Jelajahi Artikel',
  hero_cta_link: '#artikel-terbaru',
  posts_per_page: 9,
  enable_featured_post: true,
  pagination_type: 'load_more',
  show_sidebar: true,
  popular_posts_count: 5,
  categories_widget_limit: 8,
  sidebar_banner_code: '',
  footer_about_text: 'Portal media edukasi berkulitas seputar dunia pengasuhan anak, kesehatan keluarga, dan pendidikan anak usia dini.',
  footer_copyright_text: `© ${new Date().getFullYear()} Modern Edge Blog. Hak Cipta Dilindungi Undang-Undang.`,
  social_facebook: 'https://facebook.com',
  social_instagram: 'https://instagram.com',
  social_twitter: 'https://x.com',
  footer_menu_links: [
    { label: 'Kebijakan Privasi', url: '/privacy' },
    { label: 'Syarat & Ketentuan', url: '/terms' },
    { label: 'Sitemap XML', url: '/sitemap.xml' },
    { label: 'RSS Feed', url: '/feed.xml' }
  ]
};

export async function loadSiteConfig(): Promise<SiteConfig> {
  // 1. Try local cache first for instant load
  const cached = localStorage.getItem('parenting_site_config');
  let currentConfig: SiteConfig = cached ? { ...DEFAULT_SITE_CONFIG, ...JSON.parse(cached) } : DEFAULT_SITE_CONFIG;

  // Apply theme immediately
  applyTheme(currentConfig);

  // 2. Fetch fresh config from API / D1
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        currentConfig = { ...DEFAULT_SITE_CONFIG, ...data };
        localStorage.setItem('parenting_site_config', JSON.stringify(currentConfig));
        applyTheme(currentConfig);
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote config, using cached/default config:', err);
  }

  return currentConfig;
}

export const getSiteConfig = loadSiteConfig;

export async function saveSiteConfig(config: SiteConfig): Promise<boolean> {
  // Apply theme immediately
  applyTheme(config);

  // Save to localStorage immediately
  localStorage.setItem('parenting_site_config', JSON.stringify(config));

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (err) {
    console.error('Error saving site config to API:', err);
    return false;
  }
}
