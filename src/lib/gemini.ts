import { getDerivedDomain } from './config';

/**
 * AI Assistant for Blog Editor
 * Generates SEO descriptions, catchphrases, and article outlines dynamically.
 */
export async function generateParentingSEOMeta(title: string, content: string) {
  try {
    const res = await fetch('/api/ai/generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.metaTitle) {
        return data;
      }
    }
  } catch (err) {
    console.error('Gemini API fetch error:', err);
  }

  const siteDomain = getDerivedDomain();

  // Fallback if API fails or key is unavailable
  return {
    metaTitle: `${title} | ${siteDomain}`,
    metaDescription: content.slice(0, 150).replace(/[#*`_]/g, '') + '...',
    tags: 'parenting, anak, keluarga, kesehatan anak, balita',
    excerpt: content.slice(0, 180).replace(/[#*`_]/g, '') + '...'
  };
}
