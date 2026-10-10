const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

function load(savedLanguage, blocked = false, documentFixture) {
    assert.ok(fs.existsSync(path.join(root, 'i18n.js')), 'Shared language module must exist');
    const storage = new Map([['lpt_language', savedLanguage], ['lpt_state', '{"pot":40}']]);
    const context = vm.createContext({
        navigator: { language: 'zh-CN' },
        document: documentFixture,
        addEventListener() {}, CustomEvent: class { constructor(type) { this.type = type; } },
        localStorage: {
            getItem(key) { if (blocked) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
            setItem(key, value) { if (blocked) throw new Error('Storage blocked'); storage.set(key, value); }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'translations.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), context);
    return { api: context.I18n, storage };
}

test('English is the default even when browser language is Chinese', () => {
    const { api } = load();
    assert.equal(api.language, 'en');
    assert.equal(api.t('Call {amount}', { amount: 40 }), 'Call 40');
});

test('Language choice survives navigation and does not overwrite saved game', () => {
    const { api, storage } = load();
    api.setLanguage('zh-CN');
    assert.equal(api.t('Call {amount}', { amount: 40 }), '跟注 40');
    assert.equal(storage.get('lpt_language'), 'zh-CN');
    assert.equal(storage.get('lpt_state'), '{"pot":40}');
    assert.equal(load(storage.get('lpt_language')).api.language, 'zh-CN');
    api.setLanguage('en');
    assert.equal(api.t('Call {amount}', { amount: 40 }), 'Call 40');
});

test('Blocked storage and invalid saved languages fall back safely', () => {
    assert.equal(load('fr').api.language, 'en');
    const { api } = load(undefined, true);
    api.setLanguage('zh-CN');
    assert.equal(api.language, 'zh-CN');
    api.setLanguage('fr');
    assert.equal(api.language, 'en');
});

test('Interpolation preserves names and numbers literally', () => {
    const { api } = load('zh-CN');
    assert.equal(api.t('{name} wins {amount}!', { name: '张三', amount: 1200 }), '张三 赢得 1200 筹码！');
    assert.equal(api.t('Unknown message'), 'Unknown message');
});

test('All translated messages preserve interpolation arguments in both languages', () => {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(root, 'translations.js'), 'utf8'), context);
    for (const [key, [en, zh]] of Object.entries(context.POKER_TRANSLATIONS)) {
        assert.ok(en && zh, `Missing translation: ${key}`);
        const params = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
        assert.deepEqual(params(en), params(zh), `Changed parameters: ${key}`);
    }
});

test('Every page can switch languages and every literal UI message is translated', () => {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(root, 'translations.js'), 'utf8'), context);
    const messages = context.POKER_TRANSLATIONS;
    for (const file of ['index', 'connect', 'multiplayer', 'about', 'guide', 'blog']) {
        const html = fs.readFileSync(path.join(root, `${file}.html`), 'utf8');
        assert.match(html, /id="languageSelect"/);
        assert.match(html, /src="translations.js"/);
        assert.match(html, /src="i18n.js"/);
        for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(messages[m[1]], `Missing ${m[1]}`);
        for (const m of html.matchAll(/I18n\.t\('([^']+)'/g)) assert.ok(messages[m[1]], `Missing UI message: ${m[1]}`);
    }
});

test('Offline cache includes both language manifests and shared translation scripts', () => {
    const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    for (const file of ['translations.js', 'i18n.js', 'manifest.json', 'manifest.zh-CN.json']) {
        assert.ok(worker.includes(`'/${file}'`), `Offline cache missing ${file}`);
        assert.ok(fs.existsSync(path.join(root, file)));
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).lang, 'en');
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'manifest.zh-CN.json'), 'utf8')).lang, 'zh-CN');
});

test('Structured metadata switches all feature labels and restores the English source', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const match = html.match(/<script type="application\/ld\+json" data-i18n-schema="([^"]*)">([\s\S]*?)<\/script>/);
    const decode = text => text.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
    const element = { dataset: { i18nSchema: decode(match[1]) }, textContent: match[2] };
    const source = JSON.parse(element.textContent);
    const doc = {
        documentElement: {}, addEventListener() {}, dispatchEvent() {},
        getElementById: () => null, querySelector: () => null,
        querySelectorAll: selector => selector === '[data-i18n-schema]' ? [element] : []
    };
    const { api } = load('en', false, doc);
    api.setLanguage('zh-CN');
    const translated = JSON.parse(element.textContent);
    assert.equal(translated.browserRequirements, '需要启用 JavaScript 的现代浏览器');
    assert.deepEqual(translated.featureList, ['筹码记录', '盲注管理', '底池计算', '多人点对点同步', 'PWA 离线支持']);
    assert.equal(translated.datePublished, source.datePublished);
    assert.equal(translated.url, source.url);
    api.setLanguage('en');
    assert.deepEqual(JSON.parse(element.textContent), source);
});
