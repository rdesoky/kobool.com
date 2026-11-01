/**
 * v3 bootstrap. Replaces the server-generated v3/init.php.
 *
 * Builds the require.config module map from the files actually present in
 * /v3/modules/, exposes CssLinks/PgLinks, computes TMatching client-side,
 * and starts the app.
 */
(function () {
    'use strict';

    var MODULES = [
        'acc_activate', 'acc_suspend', 'app', 'bank_tr', 'cashu', 'chat', 'check-frame',
        'contact', 'cookie', 'cp_buy', 'cp_eula', 'cp_help', 'cp_report', 'cpoints',
        'data-viewer', 'decline', 'declines', 'dom-utils', 'drill', 'e-render', 'featured',
        'feedback', 'forgot', 'home', 'http', 'inline-edit', 'jclass', 'js-promise',
        'js-query', 'k-template', 'kactions', 'kevents', 'kmail', 'kui', 'layout', 'list',
        'login', 'matching_timer', 'matching', 'mem-ui', 'mem-view10', 'mem-view25',
        'mem-view5', 'mem', 'my_q_by_member', 'my_recent_questions', 'my', 'page-nav',
        'popup', 'q', 'qa', 'qui', 'register', 'saved-search', 'search', 'shortcuts',
        'ssn-monitor', 'stats', 'str-loader', 'svd_srch', 'tab-ctrl', 'tooltip',
        'ui-selector', 'upd_attr', 'upd_email', 'upd_pass', 'upd_pics', 'upd_txt', 'update',
        'utils'
    ];

    var paths = {};
    MODULES.forEach(function (name) {
        paths[name === 'js-query' ? 'jquery' : name] = name;
    });
    paths.dummy = 'dummy';

    require.config({
        baseUrl: '/v3/modules/',
        paths: paths
    });

    // Seconds until the next 23:00 UTC matching run.
    function matchingTimeLeft() {
        var now = new Date();
        var target = new Date(Date.UTC(
            now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 0, 0
        ));
        if (target.getTime() <= now.getTime()) {
            target.setUTCDate(target.getUTCDate() + 1);
        }
        return Math.floor((target.getTime() - now.getTime()) / 1000);
    }

    window.TMatching = {
        check_time: Math.floor(Date.now() / 1000),
        time_left: matchingTimeLeft()
    };

    window.CssLinks = {
        base: '/v3/css/base.css',
        kui: '/v3/css/kui.css',
        'font-awesome': '/v3/css/font-awesome.min.css',
        chat: '/v3/css/chat.css',
        cntx_menu: '/v3/css/cntx_menu.css',
        cpoints: '/v3/css/cpoints.css',
        decline: '/v3/css/decline.css',
        home: '/v3/css/home.css',
        kmail: '/v3/css/kmail.css',
        list: '/v3/css/list.css',
        mem: '/v3/css/mem.css',
        popup: '/v3/css/popup.css',
        register: '/v3/css/register.css',
        skin1: '/v3/css/skin1.css',
        skin2: '/v3/css/skin2.css',
        dummy: 'dummy'
    };

    window.PgLinks = {
        acc_activate: '/v3/pages/acc_activate.html',
        acc_suspend: '/v3/pages/acc_suspend.html',
        bank_tr: '/v3/pages/bank_tr.html',
        chat: '/v3/pages/chat.html',
        contact: '/v3/pages/contact.html',
        drill: '/v3/pages/drill.html',
        help: '/v3/pages/help.html',
        home: '/v3/pages/home.html',
        list: '/v3/pages/list.html',
        login: '/v3/pages/login.html',
        login_form: '/v3/pages/login_form.html',
        logout: '/v3/pages/logout.html',
        matching: '/v3/pages/matching.html',
        mem: '/v3/pages/mem.html',
        my: '/v3/pages/my.html',
        my_recent_q_answers: '/v3/pages/my_recent_q_answers.html',
        my_recent_questions: '/v3/pages/my_recent_questions.html',
        phone_tr: '/v3/pages/phone_tr.html',
        qa: '/v3/pages/qa.html',
        reg_form: '/v3/pages/reg_form.html',
        register: '/v3/pages/register.html',
        search: '/v3/pages/search.html',
        templates: '/v3/pages/templates.html',
        upd_attr: '/v3/pages/upd_attr.html',
        upd_email: '/v3/pages/upd_email.html',
        upd_pass: '/v3/pages/upd_pass.html',
        upd_pics: '/v3/pages/upd_pics.html',
        upd_txt: '/v3/pages/upd_txt.html',
        geo: '/cgi-bin/geo.pl'
    };

    // PgVer is no longer needed: string bundles are fetched as JSON.
    // Language switching is handled by shared/strings.js for both shells.
    window.PgVer = { ar: {}, en: {} };

    require(['app'], function (app) {
        app.run();
    });
})();
