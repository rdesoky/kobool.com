/**
 * Client-side string bundles and DOM binder.
 *
 * Replaces the server-side get_str.php / ClientStrings pipeline.
 *
 * Bundles are compiled at build time to <app>/text/<lang>/<source>.json and
 * contain a flat map of dotted keys, e.g. { "a.logout": "خروج" }.
 *
 * Public API (mirrors the legacy globals so existing modules keep working):
 *   RS("qa:ui", cb)        load a source bundle
 *   RAS([...], cb)         load several bundles
 *   _S("qa:ui.message")    read a string (sync, after load)
 *   _PS(key)               read a string (async, loads its bundle)
 *   _HS(el, key, cb)       set an element's text/HTML from a string
 *
 * Plus the declarative binder used by converted static pages:
 *   data-string="source:key"        set text/HTML from a bundle
 *   data-string-attr="title"        set an attribute instead of content
 *   data-visible-if="member|guest"  toggle visibility from session state
 *   data-options="countries"        populate a <select> from shared/data JSON
 *
 * data-visible-if is deliberately distinct from k-template's data-show-if,
 * which evaluates a `(? ... ?)` expression against the page data.
 */
(function (global) {
    'use strict';

    var config = global.APP_CONFIG || {};
    var supported = config.supportedLangs || ['ar', 'en'];
    var defaultLang = config.defaultLang || 'ar';

    var bundles = {};      // "lang:source" -> flat object
    var pending = {};      // "lang:source" -> Promise
    var listeners = [];

    function readCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function writeCookie(name, value) {
        document.cookie = name + '=' + encodeURIComponent(value) + ';path=/;max-age=' + (3600 * 24 * 365 * 5);
    }

    function detectLang() {
        var fromQuery = new URLSearchParams(global.location.search).get('lang');
        if (fromQuery && supported.indexOf(fromQuery) !== -1) {
            return fromQuery;
        }
        var fromCookie = readCookie('lang');
        if (fromCookie && supported.indexOf(fromCookie) !== -1) {
            return fromCookie;
        }
        var nav = (global.navigator.language || '').slice(0, 2).toLowerCase();
        if (supported.indexOf(nav) !== -1) {
            return nav;
        }
        return defaultLang;
    }

    var currentLang = detectLang();
    writeCookie('lang', currentLang);

    function appRoot() {
        // v2 pages live under /v2/, v3 under /v3/; the shell at / is v3.
        var path = global.location.pathname;
        if (path.indexOf('/v2/') === 0) return '/v2/';
        if (path.indexOf('/v3/') === 0) return '/v3/';
        return '/v3/';
    }

    function bundleUrl(lang, source) {
        return appRoot() + 'text/' + lang + '/' + source + '.json';
    }

    function loadBundle(source, lang) {
        lang = lang || currentLang;
        var key = lang + ':' + source;
        if (bundles[key]) {
            return Promise.resolve(bundles[key]);
        }
        if (pending[key]) {
            return pending[key];
        }
        pending[key] = fetch(bundleUrl(lang, source), { credentials: 'omit' })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('String bundle not found: ' + source + ' (' + res.status + ')');
                }
                return res.json();
            })
            .then(function (data) {
                bundles[key] = data;
                delete pending[key];
                return data;
            })
            .catch(function (err) {
                delete pending[key];
                bundles[key] = {};
                if (global.console) console.warn(err.message);
                return bundles[key];
            });
        return pending[key];
    }

    function splitKey(strID) {
        var idx = strID.indexOf(':');
        if (idx === -1) {
            return { source: 'str', key: strID };
        }
        return { source: strID.slice(0, idx), key: strID.slice(idx + 1) };
    }

    function getString(strID, defVal) {
        var parts = splitKey(strID);
        var bundle = bundles[currentLang + ':' + parts.source];
        if (bundle && Object.prototype.hasOwnProperty.call(bundle, parts.key)) {
            return bundle[parts.key];
        }
        if (defVal !== undefined) {
            return defVal;
        }
        return '[' + strID + ']';
    }

    function requireStrings(path, callback) {
        var parts = splitKey(path);
        return loadBundle(parts.source).then(function () {
            if (callback) callback();
            return true;
        });
    }

    function requireArrayOfStrings(list, callback) {
        return Promise.all(list.map(function (item) { return requireStrings(item); }))
            .then(function () {
                if (callback) callback();
                return true;
            });
    }

    function getStringAsync(strID, defVal) {
        var parts = splitKey(strID);
        return loadBundle(parts.source).then(function () {
            return getString(strID, defVal);
        });
    }

    function setHTML(el, strID, onload) {
        el = typeof el === 'string' ? document.getElementById(el) : el;
        if (!el) return null;
        if (typeof strID !== 'string' || !strID.length) {
            el.innerHTML = strID == null ? '' : String(strID);
            return el;
        }
        var parts = splitKey(strID);
        el.innerHTML = '&nbsp;';
        loadBundle(parts.source).then(function () {
            var value = getString(strID);
            if (onload) {
                var ret = onload(value);
                if (ret !== undefined) value = ret;
            }
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = value;
            } else {
                el.innerHTML = value;
            }
        });
        return el;
    }

    // ---- declarative binder -------------------------------------------------

    function sessionState() {
        var ssn = global.SSN;
        return ssn && ssn.id ? 'member' : 'guest';
    }

    function applyString(el) {
        var strID = el.getAttribute('data-string');
        if (!strID) return;
        var attr = el.getAttribute('data-string-attr');
        var template = el.getAttribute('data-string-template');
        var refs = strID.split('|');
        var sources = refs.map(function (ref) { return splitKey(ref).source; });

        Promise.all(sources.map(function (source) { return loadBundle(source); }))
            .then(function () {
                var values = refs.map(function (ref) { return getString(ref); });
                var value;
                if (template) {
                    var next = 0;
                    value = template.replace(/\{s\}/g, function () {
                        return next < values.length ? values[next++] : '';
                    });
                } else {
                    value = values[0];
                }
                if (attr) {
                    el.setAttribute(attr, value);
                } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value;
                } else {
                    el.innerHTML = value;
                }
            });
    }

    function applyShowIf(el) {
        var expr = el.getAttribute('data-visible-if');
        if (!expr) return;
        var state = sessionState();
        var visible = expr.split('|').some(function (token) {
            token = token.trim();
            if (token === 'member' || token === 'guest') return token === state;
            if (token === 'ar' || token === 'en') return token === currentLang;
            return false;
        });
        el.style.display = visible ? '' : 'none';
    }

    function applyOptions(el) {
        var name = el.getAttribute('data-options');
        if (!name) return;
        var group = el.getAttribute('data-options-group');
        fetch('/shared/data/' + name + '.json', { credentials: 'omit' })
            .then(function (res) { return res.ok ? res.json() : null; })
            .then(function (data) {
                var items = data;
                if (group && data && data.sfilters) {
                    items = data.sfilters[group] || [];
                }
                if (!Array.isArray(items)) items = [];
                var html = '<option value="0">---</option>';
                items.forEach(function (item) {
                    var value = item.value !== undefined ? item.value : item;
                    var label = item.label !== undefined ? item.label : value;
                    html += '<option value="' + String(value).replace(/"/g, '&quot;') + '">' +
                        String(label).replace(/</g, '&lt;') + '</option>';
                });
                el.innerHTML = html;
            })
            .catch(function () { /* leave the select empty */ });
    }

    function bind(root) {
        root = root || document;
        var nodes = root.querySelectorAll('[data-string],[data-visible-if],[data-options]');
        for (var i = 0; i < nodes.length; i++) {
            applyString(nodes[i]);
            applyShowIf(nodes[i]);
            applyOptions(nodes[i]);
        }
    }

    function setLanguage(lang) {
        if (supported.indexOf(lang) === -1) return;
        currentLang = lang;
        writeCookie('lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        bundles = {};
        pending = {};
        listeners.forEach(function (fn) { fn(lang); });
        bind(document);
    }

    function onLanguageChange(fn) {
        listeners.push(fn);
    }

    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    var api = {
        lang: function () { return currentLang; },
        setLanguage: setLanguage,
        onLanguageChange: onLanguageChange,
        loadBundle: loadBundle,
        getString: getString,
        bind: bind,
        sessionState: sessionState
    };

    global.KStrings = api;
    global.RS = requireStrings;
    global.RAS = requireArrayOfStrings;
    global._S = getString;
    global._PS = getStringAsync;
    global._HS = setHTML;

    // Language switch links, shared by the v2 and v3 shells.
    document.addEventListener('click', function (event) {
        var el = event.target.closest ? event.target.closest('[data-lang-switch]') : null;
        if (!el) return;
        event.preventDefault();
        setLanguage(el.getAttribute('data-lang-switch'));
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { bind(document); });
    } else {
        bind(document);
    }
})(window);
