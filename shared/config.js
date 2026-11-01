/**
 * Runtime configuration. Loaded before any app script.
 *
 * The build replaces apiBase in dist/ with environment-specific values:
 *   - dev:     /cgi-bin/ (same origin; tools/serve.js proxies to the API host)
 *   - staging: //dev.kobool.com/cgi-bin/
 *   - prod:    //dev.kobool.com/cgi-bin/
 *
 * The base is scheme-relative so it inherits the page's scheme: http today,
 * https once TLS is terminated in front of the API host. Switch to
 * //api.kobool.com/cgi-bin/ once that host serves the CGI.
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
 * Local previews (localhost / 127.0.0.1) use the same-origin /cgi-bin/ base so
 * every API call goes through tools/serve.js's proxy instead of crossing to the
 * API host. Served from any other host, the built API base stands.
 */
(function (global) {
    'use strict';
    var host = global.location && global.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        global.APP_CONFIG.apiBase = '/cgi-bin/';
    }
})(window);

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
