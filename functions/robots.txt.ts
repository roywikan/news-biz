interface Env {
  SITE_DOMAIN?: string;
  SITE_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url);
  const siteDomain = context.env.SITE_DOMAIN || requestUrl.hostname.replace(/^www\./, '');
  const siteUrl = context.env.SITE_URL || `${requestUrl.protocol}//${siteDomain}`;
  const txt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
