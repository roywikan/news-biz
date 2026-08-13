interface Env {
  SITE_DOMAIN?: string;
  SITE_URL?: string;
  [key: string]: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  let shouldRedirect = false;
  
  // Calculate site_domain dynamically from request host or env
  const cleanHostname = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  const siteDomain = env.SITE_DOMAIN || (env.SITE_URL ? new URL(env.SITE_URL).hostname : cleanHostname);
  
  let targetDomain = siteDomain;
  let targetPath = pathname;

  // 1. Domain Canonicalization: www.<domain> -> <domain>
  if (hostname.startsWith('www.')) {
    shouldRedirect = true;
    targetDomain = cleanHostname;
  }

  // 2. Legacy Category Path Redirection (/makanan/*, /balita/*, etc. -> /baca/*)
  if (pathname.startsWith('/makanan/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/makanan\//, '/baca/');
  } else if (pathname.startsWith('/balita/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/balita\//, '/baca/');
  } else if (pathname.startsWith('/kesehatan/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/kesehatan\//, '/baca/');
  } else if (pathname.startsWith('/parenting/')) {
    shouldRedirect = true;
    targetPath = pathname.replace(/^\/parenting\//, '/baca/');
  }

  if (shouldRedirect) {
    const redirectUrl = `https://${targetDomain}${targetPath}${url.search}`;
    return Response.redirect(redirectUrl, 301);
  }

  return next();
};
