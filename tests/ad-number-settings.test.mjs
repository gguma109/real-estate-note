import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../functions/api/ad-number-settings.js', import.meta.url), 'utf8');
const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const validRanges = {
    rooms: [1000, 1199],
    commercial: [1200, 1399],
    building: [1400, 1499],
    house: [1500, 1599],
    land: [1600, 1799],
    other: [1800, 1999]
};

function createContext(ranges) {
    const calls = [];
    return {
        calls,
        context: {
            request: new Request('https://example.com/api/ad-number-settings', {
                method: 'POST',
                headers: { Authorization: 'Bearer user-1', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ranges, email: 'user@example.com' })
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

test('saves non-overlapping account-specific ad number ranges', async () => {
    const { context, calls } = createContext(validRanges);
    const response = await api.onRequestPost(context);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.ranges, validRanges);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].values[1], 'user-1');
});

test('rejects overlapping ad number ranges', async () => {
    const { context, calls } = createContext({
        ...validRanges,
        commercial: [1100, 1399]
    });
    const response = await api.onRequestPost(context);
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /겹칠 수 없습니다/);
    assert.equal(calls.length, 0);
});
