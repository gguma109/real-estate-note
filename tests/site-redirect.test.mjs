import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
const middleware = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('old page links redirect to the new site and preserve paths and queries', () => {
    const context = {
        request: new Request('https://move-out-confirmation.pages.dev/brokerage?tab=rental'),
        next: () => { throw new Error('next should not be called'); }
    };
    const response = middleware.onRequest(context);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://real-estate-note.pages.dev/brokerage?tab=rental');
});

test('APIs and the new site continue without redirect', () => {
    const next = () => new Response('next');
    for (const url of [
        'https://move-out-confirmation.pages.dev/api/formatter-settings',
        'https://real-estate-note.pages.dev/brokerage'
    ]) {
        const response = middleware.onRequest({ request: new Request(url), next });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('Location'), null);
    }
});
