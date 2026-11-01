/**
 * Runtime configuration. Loaded before any app script.
 *
 * The build replaces apiBase in dist/ with environment-specific values:
 *   - dev:     /cgi-bin/ (same origin; tools/serve.js proxies to the API host)
 *   - staging: http://dev.kobool.com/cgi-bin/
 *   - prod:    http://dev.kobool.com/cgi-bin/
 *
 * The scheme is explicit because dev.kobool.com is http-only; a
 * scheme-relative base would inherit https on an https page and fail.
 * Switch to https://api.kobool.com once that host is live.
 */
window.APP_CONFIG = {
    apiBase: '/cgi-bin/',
    siteBase: '',
    defaultLang: 'ar',
    supportedLangs: ['ar', 'en'],
    analyticsId: '',
    blogUrl: ''
};

/**
 * Analytics shim.
 *
 * The legacy modules call ga() unconditionally. When no measurement ID is
 * configured the calls become no-ops instead of throwing ReferenceError.
 */
(function (global) {
    'use strict';
    var config = global.APP_CONFIG || {};
    if (typeof global.ga === 'function') return;

    if (config.analyticsId) {
        global.ga = function () {
            (global.ga.q = global.ga.q || []).push(arguments);
        };
        global.ga.l = Date.now();
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.google-analytics.com/analytics.js';
        document.head.appendChild(script);
        global.ga('create', config.analyticsId, 'auto');
    } else {
        global.ga = function () {};
    }
})(window);
