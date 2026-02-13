import { getRequestContext } from '@cloudflare/next-on-pages';

export const getDB = () => {
    if (process.env.NODE_ENV === 'development') {
        const { env } = getRequestContext();
        return env.DB;
    }
    // In production (Cloudflare Pages), the binding is available on the request context
    const { env } = getRequestContext();
    return env.DB;
};
