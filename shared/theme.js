/**
 * Theme manager for the v2 and v3 shells.
 *
 * Loaded in <head> before any stylesheet so the saved (or system) theme is
 * applied before first paint and there is no light flash on a dark page.
 *
 * Saved preferences are "dark", "light" or "system". When nothing is saved we
 * follow the operating system's prefers-color-scheme setting. The effective
 * theme is written to <html data-theme="...">, which shared/theme.css keys on.
 *
 * Markup opts in with data-theme-toggle:
 *
 *   <li data-theme-toggle>Dark mode</li>
 *
 * The label is updated to the action the next click performs ("Dark mode" in
 * light, "Light mode" in dark) and is localized from the document language.
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'kobool-theme';
    var MEDIA_QUERY = '(prefers-color-scheme: dark)';
    var root = global.document && global.document.documentElement;
    var MODES = { light: 1, dark: 1, system: 1 };

    var LABELS = {
        en: { dark: 'Dark mode', light: 'Light mode' },
        ar: { dark: 'الوضع الداكن', light: 'الوضع الفاتح' }
    };

    var mql = null;
    try {
        if (global.matchMedia) mql = global.matchMedia(MEDIA_QUERY);
    } catch (err) {
        mql = null;
    }

    function systemPrefersDark() {
        return !!(mql && mql.matches);
    }

    function normalize(mode) {
        return MODES[mode] ? mode : 'system';
    }

    function readMode() {
        var stored = null;
        try {
            stored = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
        } catch (err) {
            stored = null;
        }
        return normalize(stored);
    }

    function writeMode(mode) {
        try {
            if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, mode);
        } catch (err) {
            /* Private mode / storage disabled: the theme still applies for this page. */
        }
    }

    function resolve(mode) {
        mode = normalize(mode);
        if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
        return mode;
    }

    function documentLang() {
        var lang = (root && (root.getAttribute('lang') || root.lang)) || 'en';
        return String(lang).slice(0, 2) === 'ar' ? 'ar' : 'en';
    }

    function labelFor(theme) {
        // The label names the action, not the current state.
        return LABELS[documentLang()][theme === 'dark' ? 'light' : 'dark'];
    }

    function closestToggle(node) {
        while (node && node.nodeType === 1) {
            if (node.getAttribute && node.getAttribute('data-theme-toggle') !== null) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    function updateControls(theme) {
        if (!global.document || !global.document.querySelectorAll) return;
        var controls = global.document.querySelectorAll('[data-theme-toggle]');
        var label = labelFor(theme);
        for (var i = 0; i < controls.length; i++) {
            var el = controls[i];
            if (el.textContent !== label) el.textContent = label;
            el.setAttribute('title', label);
            el.setAttribute('aria-label', label);
            el.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
            el.setAttribute('role', 'button');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        }
    }

    function notify(mode, theme) {
        try {
            var event;
            if (typeof global.CustomEvent === 'function') {
                event = new global.CustomEvent('themechange', {
                    detail: { mode: mode, theme: theme }
                });
            } else if (global.document && global.document.createEvent) {
                event = global.document.createEvent('CustomEvent');
                event.initCustomEvent('themechange', false, false, {
                    mode: mode,
                    theme: theme
                });
            }
            if (event && global.dispatchEvent) global.dispatchEvent(event);
        } catch (err) {
            /* Optional notification only. */
        }
    }

    function apply(mode) {
        mode = normalize(mode);
        var theme = resolve(mode);

        if (root) {
            root.setAttribute('data-theme', theme);
            root.setAttribute('data-theme-mode', mode);
            if (root.style) root.style.colorScheme = theme;
        }

        var meta = global.document && global.document.querySelector
            ? global.document.querySelector('meta[name="theme-color"]')
            : null;
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#11151a' : '#f0f0f0');

        updateControls(theme);
        notify(mode, theme);
        return theme;
    }

    var current = readMode();

    function setMode(mode) {
        current = normalize(mode);
        writeMode(current);
        apply(current);
        return current;
    }

    function toggle() {
        var next = resolve(current) === 'dark' ? 'light' : 'dark';
        setMode(next);
        return next;
    }

    function onToggleEvent(event) {
        var el = closestToggle(event.target || event.srcElement);
        if (!el) return;
        if (event.preventDefault) event.preventDefault();
        toggle();
    }

    function onToggleKey(event) {
        var key = event.key;
        if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;
        var el = closestToggle(event.target || event.srcElement);
        if (!el) return;
        if (event.preventDefault) event.preventDefault();
        toggle();
    }

    // Apply immediately, before the body exists, so the first paint is correct.
    apply(current);

    function wire() {
        if (!global.document || !global.document.addEventListener) return;
        global.document.addEventListener('click', onToggleEvent);
        global.document.addEventListener('keydown', onToggleKey);
        // Refresh labels now that the toggle markup is in the DOM.
        apply(current);
    }

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', wire);
        } else {
            wire();
        }
    }

    // Follow the OS setting while the user has not picked an explicit theme.
    if (mql) {
        var onSystemChange = function () {
            if (current === 'system') apply(current);
        };
        if (mql.addEventListener) mql.addEventListener('change', onSystemChange);
        else if (mql.addListener) mql.addListener(onSystemChange);
    }

    // Keep other open tabs in sync with an explicit choice.
    if (global.addEventListener) {
        global.addEventListener('storage', function (event) {
            if (!event || event.key !== STORAGE_KEY) return;
            current = readMode();
            apply(current);
        });
    }

    global.KTheme = {
        storageKey: STORAGE_KEY,
        getMode: function () { return current; },
        getTheme: function () { return resolve(current); },
        setMode: setMode,
        toggle: toggle,
        refresh: function () { return apply(current); }
    };
})(window);
