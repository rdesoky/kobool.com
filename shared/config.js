/**
 * Runtime configuration. Loaded before any app script.
 *
 * The build replaces apiBase in dist/ with environment-specific values:
 *   - dev:     /cgi-bin/ (same origin; tools/serve.js proxies to the API host)
 *   - staging: //dev.kobool.com/cgi-bin/ (scheme-relative; http today)
 *   - prod:    //dev.kobool.com/cgi-bin/ (scheme-relative; https after TLS)
 *
 * The scheme-relative base inherits the page's scheme, so it matches the
 * API host's current http-only serving and automatically upgrades to https
 * once TLS is terminated in front of the API host.
 *
 * NOTE: api.kobool.com is not ready yet; dev.kobool.com is the current API
 * host. Switch to //api.kobool.com when it goes live.
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
