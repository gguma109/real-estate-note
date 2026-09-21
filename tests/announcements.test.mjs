import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const announcements = JSON.parse(readFileSync(new URL('../public/announcements.json', import.meta.url), 'utf8'));
const indexHtml = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('announcements expose a current version and structured release notes', () => {
    assert.match(announcements.currentVersion, /^\d+\.\d+\.\d+$/);
    assert.ok(Array.isArray(announcements.announcements));
    assert.ok(announcements.announcements.length > 0);
    assert.equal(announcements.announcements[0].version, announcements.currentVersion);
    for (const notice of announcements.announcements) {
        assert.ok(notice.date);
        assert.ok(notice.title);
        assert.ok(notice.summary);
        assert.ok(Array.isArray(notice.changes));
        assert.ok(notice.changes.length > 0);
    }
});

test('portal includes announcement controls and loads the release notes feed', () => {
    assert.match(indexHtml, /id="announcement-button"/);
    assert.match(indexHtml, /id="announcement-modal"/);
    assert.match(indexHtml, /fetch\('\/announcements\.json'/);
    assert.match(indexHtml, /announcement_seen_version/);
});
