import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../functions/_lib/formatter-security.js', import.meta.url), 'utf8');
const security = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('legacy keys remain readable and newly saved keys use the shared secret', async () => {
    const userId = 'test-user';
    const provider = 'gemini';
    const legacySecret = 'legacy-secret-that-is-long-enough-for-testing';
    const sharedSecret = 'shared-secret-that-is-long-enough-for-testing';
    const legacy = await security.encryptFormatterApiKey('test-api-key', userId, provider, {
        FORMATTER_SETTINGS_SECRET: legacySecret
    });
    assert.equal(await security.decryptFormatterApiKey(legacy, userId, provider, {
        FORMATTER_SETTINGS_SECRET: legacySecret,
        FORMATTER_SETTINGS_SHARED_SECRET: sharedSecret
    }), 'test-api-key');
    await assert.rejects(() => security.decryptFormatterApiKey(legacy, userId, provider, {
        FORMATTER_SETTINGS_SHARED_SECRET: sharedSecret
    }));

    const migrated = await security.encryptFormatterApiKey('test-api-key', userId, provider, {
        FORMATTER_SETTINGS_SECRET: legacySecret,
        FORMATTER_SETTINGS_SHARED_SECRET: sharedSecret
    });
    assert.equal(await security.decryptFormatterApiKey(migrated, userId, provider, {
        FORMATTER_SETTINGS_SHARED_SECRET: sharedSecret
    }), 'test-api-key');
    await assert.rejects(() => security.decryptFormatterApiKey(migrated, userId, provider, {
        FORMATTER_SETTINGS_SECRET: legacySecret
    }));
    await assert.rejects(() => security.decryptFormatterApiKey(migrated, 'another-user', provider, {
        FORMATTER_SETTINGS_SHARED_SECRET: sharedSecret
    }));
});
