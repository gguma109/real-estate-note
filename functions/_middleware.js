const OLD_SITE = 'move-out-confirmation.pages.dev';
const NEW_SITE = 'real-estate-note.pages.dev';

export function onRequest(context) {
    const url = new URL(context.request.url);
    if (url.hostname === OLD_SITE && !url.searchParams.has('stay-on-moveout') &&
        url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
        url.hostname = NEW_SITE;
        return Response.redirect(url.toString(), 302);
    }
    return context.next();
}
