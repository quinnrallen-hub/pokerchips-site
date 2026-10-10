(function (root) {
    'use strict';
    const messages = root.POKER_TRANSLATIONS || {};
    const storageKey = 'lpt_language';
    const normalize = value => value === 'zh-CN' ? 'zh-CN' : 'en';
    let language = 'en';
    try { language = normalize(root.localStorage.getItem(storageKey)); } catch (e) {}
    const renderedMessages = new Map();
    const schemas = new WeakMap();

    function t(key, params = {}) {
        const pair = messages[key];
        const copy = pair ? pair[language === 'zh-CN' ? 1 : 0] : key;
        const result = copy.replace(/\{(\w+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match);
        renderedMessages.set(result, { key, params });
        if (renderedMessages.size > 200) renderedMessages.delete(renderedMessages.keys().next().value);
        return result;
    }

    // Retain message arguments so a visible toast/status can switch languages too.
    function remember(element, text) {
        element.textContent = text;
        const message = renderedMessages.get(text);
        if (message) {
            element.dataset.i18nLive = message.key;
            element.dataset.i18nParams = JSON.stringify(message.params);
        } else {
            delete element.dataset.i18nLive;
            delete element.dataset.i18nParams;
        }
    }

    function apply() {
        if (!root.document) return;
        const doc = root.document;
        doc.documentElement.lang = language;
        doc.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = t(element.dataset.i18n);
        });
        doc.querySelectorAll('[data-i18n-attributes]').forEach(element => {
            const attributes = JSON.parse(element.dataset.i18nAttributes);
            Object.entries(attributes).forEach(([attribute, key]) => element.setAttribute(attribute, t(key)));
        });
        doc.querySelectorAll('[data-i18n-live]').forEach(element => {
            element.textContent = t(element.dataset.i18nLive, JSON.parse(element.dataset.i18nParams || '{}'));
        });
        doc.querySelectorAll('[data-i18n-schema]').forEach(element => {
            if (!schemas.has(element)) schemas.set(element, JSON.parse(element.textContent));
            const mapping = JSON.parse(element.dataset.i18nSchema);
            const copy = JSON.parse(JSON.stringify(schemas.get(element)));
            function translate(object) {
                if (!object || typeof object !== 'object') return;
                Object.entries(object).forEach(([key, value]) => {
                    if (typeof value === 'string' && mapping[value]) object[key] = t(mapping[value]);
                    else translate(value);
                });
            }
            translate(copy);
            element.textContent = JSON.stringify(copy);
        });
        const select = doc.getElementById('languageSelect');
        if (select) {
            select.value = language;
            select.setAttribute('aria-label', t('Language'));
        }
        const manifest = doc.querySelector('link[rel="manifest"]');
        if (manifest) manifest.href = language === 'zh-CN' ? 'manifest.zh-CN.json' : 'manifest.json';
    }

    function setLanguage(value) {
        language = normalize(value);
        try { root.localStorage.setItem(storageKey, language); } catch (e) {}
        apply();
        if (root.document) root.document.dispatchEvent(new CustomEvent('languagechange'));
    }

    root.I18n = { t, remember, apply, setLanguage, get language() { return language; } };
    if (root.document) {
        // Set lang before page content is parsed. The English HTML remains a no-JS fallback.
        root.document.documentElement.lang = language;
        root.document.addEventListener('DOMContentLoaded', () => {
            apply();
            const select = root.document.getElementById('languageSelect');
            if (select) select.addEventListener('change', () => setLanguage(select.value));
        });
        root.addEventListener('storage', event => {
            if (event.key !== storageKey && event.key !== null) return;
            language = normalize(event.newValue);
            apply();
            root.document.dispatchEvent(new CustomEvent('languagechange'));
        });
    }
})(globalThis);
