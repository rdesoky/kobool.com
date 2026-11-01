/**
 * v2 runtime manifest. Replaces the server-generated v2/init_vars.php.
 *
 * JSLinks/CssLinks/PgLinks mirror v2/filesver.php with the .php page links
 * rewritten to the converted .html fragments. PgVer is no longer needed:
 * string bundles are fetched as JSON, so it stays empty for compatibility.
 */
(function (global) {
    'use strict';

    var SCR = '/v2/';
    var CSS = '/v2/css/';
    var PGS = '/v2/pages/';

    global.JSLinks = {
        AppMain: SCR + 'kmain.js',
        ERender: SCR + 'erender.js',
        KMail: SCR + 'kmail.js',
        Init: SCR + 'init.js',
        KActions: SCR + 'kactions.js',
        'MemVUR.vw25': SCR + 'mem_view_25.js',
        'MemVUR.vw5': SCR + 'mem_view_5.js',
        'MemVUR.vw10': SCR + 'mem_view_10.js',
        My: SCR + 'my.js',
        SavedSearch: SCR + 'svd_srch.js',
        ContactUS: SCR + 'contact.js',
        Declines: SCR + 'declines.js',
        ForgotLogin: SCR + 'forgot.js',
        ActivateMembership: SCR + 'acc_activate.js',
        StopMembership: SCR + 'acc_suspend.js',
        UpdateEmail: SCR + 'upd_email.js',
        UpdatePassword: SCR + 'upd_pass.js',
        Decline: SCR + 'decline.js',
        CrCards: SCR + 'cr_cards.js',
        CPointsByCashu: SCR + 'cashu.js',
        CPointsReport: SCR + 'cp_report.js',
        CPointByPhoneCard: SCR + 'phone_tr.js',
        CPoints: SCR + 'cpoints.js',
        QUI: SCR + 'qui.js',
        JCContextMenuBtn: SCR + 'JCContextMenuBtn.js',
        UpdatePics: SCR + 'upd_pics.js',
        UpdateText: SCR + 'upd_txt.js',
        UpdateAttr: SCR + 'upd_attr.js',
        Update: SCR + 'update.js',
        ToolTip: SCR + 'tip.js',
        Chat: SCR + 'chat.js',
        CDataViewer: SCR + 'data_viewer.js',
        QA: SCR + 'qa.js',
        Search: SCR + 'search.js',
        Drill: SCR + 'drill.js',
        KUI: SCR + 'kui.js',
        List: SCR + 'list.js',
        Utils: SCR + 'utils.js',
        PgNav: SCR + 'nav.js',
        Register: SCR + 'register.js',
        Popup: SCR + 'popup.js',
        Home: SCR + 'home.js',
        MemView: SCR + 'mem.js',
        IMem: SCR + 'imem.js'
    };

    global.PgLinks = {
        p404: PGS + '404.html',
        matching: PGS + 'matching.html',
        smp_srch: PGS + 'smp_search.html',
        logout: PGS + 'logout.html',
        home: PGS + 'home.html',
        register: PGS + 'register.html',
        login: PGS + 'login.html',
        help: PGS + 'help.html',
        upd_attr: PGS + 'upd_attr.html',
        upd_txt: PGS + 'upd_txt.html',
        geo: '/cgi-bin/geo.pl'
    };

    global.CssLinks = {
        defaultstyle: CSS + 'defaultstyle.css',
        base: CSS + 'base.css',
        kui: CSS + 'kui.css',
        decline: CSS + 'decline.css',
        chat: CSS + 'chat.css',
        cntx_menu: CSS + 'cntx_menu.css',
        tooltip: CSS + 'tooltip.css',
        home: CSS + 'home.css',
        register: CSS + 'register.css',
        who: CSS + 'who.css',
        popup: CSS + 'popup.css',
        list: CSS + 'list.css',
        mem: CSS + 'mem.css',
        cpoints: CSS + 'cpoints.css',
        kmail: CSS + 'kmail.css'
    };

    global.PgVer = { ar: {}, en: {} };
})(window);
