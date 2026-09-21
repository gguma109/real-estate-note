import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../functions/api/profile.js', import.meta.url), 'utf8');
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function createContext(prefix) {
    const calls = [];
    return {
        calls,
        context: {
            request: new Request('https://example.com/api/profile', {
                method: 'POST',
                headers: { Authorization: 'Bearer user-1', 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: '테스트', ad_number_prefix: prefix, email: 'user@example.com' })
            }),
            env: {
                DB: {
                    prepare(sql) {
                        return {
                            bind(...values) {
                                calls.push({ sql, values });
                                return { run: async () => ({ success: true }) };
                            }
                        };
                    }
                }
            }
        }
    };
}

test('preserves lowercase and mixed-case property number prefixes', async () => {
    for (const prefix of ['sm', 'Sm12', 'SM']) {
        const { context, calls } = createContext(prefix);
        const response = await api.onRequestPost(context);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.ad_number_prefix, prefix);
        assert.equal(calls[1].values[1], prefix);
    }
});

test('rejects punctuation in property number prefixes', async () => {
    const { context, calls } = createContext('sm-');
    const response = await api.onRequestPost(context);

    assert.equal(response.status, 400);
    assert.equal(calls.length, 1);
});
