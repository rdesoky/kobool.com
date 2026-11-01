'use strict';

/**
 * Test runner for kobool.com static build.
 *
 *   node tests/run.js
 *
 * Covers: XML parser, string compiler, data compiler, shared strings binder
 * (language resolution), and the same-origin proxy allowlist. A final smoke
 * builds dist/ and runs validate.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');

const { parseXml, parseXmlToObject, decodeEntities } = require(path.join(TOOLS, 'xml'));
const { compileSourceFile, flatten, listXmlSources, LANGS } = require(path.join(TOOLS, 'compile-strings'));
const { buildCountries, buildOptions } = require(path.join(TOOLS, 'compile-data'));
const { createProxy, DEFAULT_TARGET } = require(path.join(TOOLS, 'proxy'));
const { convert } = require(path.join(TOOLS, 'convert-pages'));
const { validate } = require(path.join(TOOLS, 'validate'));

test('XML parser: elements, attributes, entities, CDATA', () => {
    const src = '<?xml version="1.0"?>\n<root>\n  <a x="1&amp;2">Hello &lt;world&gt;</a>\n' +
        '  <b><![CDATA[raw <stuff> & here]]></b>\n  <c/>\n  <!-- comment -->\n</root>';
    const tree = parseXml(src);
    assert.strictEqual(tree.name, 'root');
    assert.strictEqual(tree.children.length, 3);

    const a = tree.children[0];
    assert.strictEqual(a.name, 'a');
    assert.deepStrictEqual(a.attrs, { x: '1&2' });
    assert.strictEqual(a.text, 'Hello <world>');

    const b = tree.children[1];
    assert.strictEqual(b.text, 'raw <stuff> & here');

    const c = tree.children[2];
    assert.strictEqual(c.name, 'c');
    assert.strictEqual(c.children.length, 0);
    assert.strictEqual(c.text, '');
});

test('XML parser: rejects malformed input', () => {
    assert.throws(() => parseXml('<root><a></root>'), /mismatched tag/);
    assert.throws(() => parseXml('<root><a></a>'), /unclosed element/);
    assert.throws(() => parseXml(''), /empty document/);
});

test('decodeEntities: named and numeric', () => {
    // &nbsp; is U+00A0, not a plain space.
    assert.strictEqual(decodeEntities('&amp;&lt;&gt;&quot;&apos;&nbsp;'), '&<>"\'\u00a0');
    assert.strictEqual(decodeEntities('&#65;&#x42;'), 'AB');
    assert.strictEqual(decodeEntities('&unknown;'), '&unknown;');
});

test('decodeEntities: &nbsp; is U+00A0', () => {
    assert.strictEqual(decodeEntities('&nbsp;'), '\u00a0');
});

test('string compiler: flatten renames value-attr elements to v<value>', () => {
    const src = '<root><select_gender><option value="0">رجل</option>' +
        '<option value="1">امرأة</option></select_gender><pg_title.home>home</pg_title.home></root>';
    const tree = parseXml(src);
    const flat = {};
    flatten(tree, '', flat);
    assert.deepStrictEqual(flat, {
        'select_gender.v0': 'رجل',
        'select_gender.v1': 'امرأة',
        'pg_title.home': 'home'
    });
});

test('string compiler: compileSourceFile outputs deterministically sorted keys', () => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kobool-sort-'));
    const file = path.join(dir, 'str.xml');
    fs.writeFileSync(file, '<root><b>2</b><a>1</a><c>3</c></root>');
    const compiled = compileSourceFile(file);
    assert.deepStrictEqual(Object.keys(compiled), ['a', 'b', 'c']);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('string compiler: listXmlSources lists only .xml files', () => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kobool-xml-'));
    fs.writeFileSync(path.join(dir, 'a.xml'), '<root/>');
    fs.writeFileSync(path.join(dir, 'b.xml'), '<root/>');
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'x');
    const sources = listXmlSources(dir);
    assert.deepStrictEqual(sources, ['a', 'b']);
    assert.deepStrictEqual(listXmlSources(path.join(dir, 'missing')), []);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('data compiler: countries parse with preserveAttrs', () => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kobool-data-'));
    const langDir = path.join(dir, 'v3', 'text', 'ar');
    fs.mkdirSync(langDir, { recursive: true });
    fs.writeFileSync(
        path.join(langDir, 'countries.xml'),
        '<root><option value="1" name="مصر" code="EG"/><option value="0" name="X"/></root>'
    );
    const countries = buildCountries(dir, 'ar');
    assert.ok(Array.isArray(countries));
    assert.strictEqual(countries.length, 1);
    assert.deepStrictEqual(countries[0], { value: '1', label: 'مصر', code: 'EG' });
    fs.rmSync(dir, { recursive: true, force: true });
});

test('data compiler: options groups parse', () => {
    const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kobool-data-'));
    const langDir = path.join(dir, 'v3', 'text', 'ar');
    fs.mkdirSync(langDir, { recursive: true });
    fs.writeFileSync(
        path.join(langDir, 'options.xml'),
        '<root><sfilters><f1><option value="1">One</option><option value="2">Two</option></f1>' +
        '<f2><option value="3">Three</option></f2></sfilters></root>'
    );
    const opts = buildOptions(dir, 'ar');
    assert.deepStrictEqual(Object.keys(opts.sfilters).sort(), ['f1', 'f2']);
    assert.deepStrictEqual(opts.sfilters.f1, [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' }
    ]);
    assert.deepStrictEqual(opts.sfilters.f2, [{ value: '3', label: 'Three' }]);
    fs.rmSync(dir, { recursive: true, force: true });
});

test('page converter: element content becomes data-string', () => {
    const { html } = convert('<div><span><?=S("a.logout")?></span></div>');
    assert.match(html, /<span data-string="str:a\.logout"><\/span>/);
});

test('page converter: attribute value becomes data-string-attr', () => {
    const { html } = convert('<input type="text" placeholder="<?=S("login.login_name")?>"/>');
    assert.match(html, /placeholder="" data-string="str:login\.login_name" data-string-attr="placeholder"/);
});

test('page converter: literal text around a string becomes a template', () => {
    const { html } = convert('<option value=""><?= "---" . S("any_status") . "---" ?></option>');
    assert.match(html, /data-string="str:any_status"/);
    assert.match(html, /data-string-template="---\{s\}---"/);
});

test('page converter: attribute template keeps the literal prefix', () => {
    const { html } = convert('<textarea placeholder="&gt;<?=S("feedback_link")?>"></textarea>');
    assert.match(html, /data-string-template="&gt;\{s\}"/);
});

test('page converter: explicit string source is preserved', () => {
    const { html } = convert('<div><?=S("home.msg","home")?></div>');
    assert.match(html, /data-string="home:home\.msg"/);
});

test('page converter: strips the PHP prologue and reports leftovers', () => {
    const { html, notes } = convert('<?php include("x.php"); ?>\n<div><?php echo 1; ?></div>');
    assert.ok(!html.includes('<?php'), 'PHP must not survive conversion');
    assert.ok(notes.some((n) => /unconverted PHP/.test(n)));
});

test('build: rewriteBase prefixes only real root-absolute URLs', () => {
    const os = require('os');
    const { rewriteBase } = require(path.join(TOOLS, 'build'));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kobool-base-'));
    const file = path.join(dir, 'page.html');
    fs.writeFileSync(file, [
        '<link href="/v3/css/base.css"/>',
        '<script src="/shared/config.js"></script>',
        '<a href="#pg=home">x</a>',
        '<a href="//cdn.example.com/x.js">y</a>',
        '<a href="https://example.com/z">z</a>',
        '<meta content="/not-a-url"/>',
        '<style>body{background:url(/images/x.gif)}</style>'
    ].join('\n'));

    rewriteBase(dir, '/repo');
    const out = fs.readFileSync(file, 'utf8');
    fs.rmSync(dir, { recursive: true, force: true });

    assert.match(out, /href="\/repo\/v3\/css\/base\.css"/);
    assert.match(out, /src="\/repo\/shared\/config\.js"/);
    assert.match(out, /url\(\/repo\/images\/x\.gif\)/);
    assert.match(out, /href="#pg=home"/);
    assert.match(out, /href="\/\/cdn\.example\.com\/x\.js"/);
    assert.match(out, /href="https:\/\/example\.com\/z"/);
    assert.match(out, /content="\/not-a-url"/);
});

test('strings: addQueryParam appends to bare and already-queried URLs', () => {
    const vm = require('vm');
    const code = fs.readFileSync(path.join(ROOT, 'shared', 'strings.js'), 'utf8');
    const sandbox = {
        window: {
            location: { pathname: '/', search: '' },
            APP_CONFIG: {},
            navigator: { language: 'en-US', languages: ['en-US'] }
        },
        document: {
            cookie: '',
            documentElement: {},
            addEventListener() {},
            querySelectorAll() { return []; }
        },
        Promise,
        RegExp,
        URLSearchParams,
        console
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    // Static PgLinks carry no "?v=" cache-buster, so a bare path must get "?"
    assert.strictEqual(
        sandbox.window.KStrings.addQueryParam('/v3/pages/templates.html', 'lang', 'en'),
        '/v3/pages/templates.html?lang=en'
    );
    // A legacy "?v=..." suffix must keep "&"
    assert.strictEqual(
        sandbox.window.KStrings.addQueryParam('/cgi-bin/geo.pl?v=1', 'lang', 'ar'),
        '/cgi-bin/geo.pl?v=1&lang=ar'
    );
});

test('strings binder: language resolution prefers cookie, falls back to default', () => {
    // detectLang() lives in shared/strings.js (IIFE); assert its static
    // expectations from source (config.js is a browser script, not loadable).
    const js = fs.readFileSync(path.join(ROOT, 'shared', 'strings.js'), 'utf8');
    assert.match(js, /supportedLangs/);
    assert.match(js, /defaultLang/);
    const src = fs.readFileSync(path.join(ROOT, 'shared', 'config.js'), 'utf8');
    assert.match(src, /defaultLang: 'ar'/);
    assert.match(src, /supportedLangs: \['ar', 'en'\]/);
});

test('proxy: DEFAULT_TARGET points at the current CORS-enabled API host', () => {
    assert.strictEqual(DEFAULT_TARGET, 'http://dev.kobool.com');
});

test('validate: an http:// API base is expected and never reported', () => {
    const os = require('os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kobool-mixed-'));
    const distShared = path.join(dir, 'shared');
    fs.mkdirSync(distShared, { recursive: true });
    fs.writeFileSync(path.join(distShared, 'config.js'), 'window.APP_CONFIG={apiBase:"http://dev.kobool.com/cgi-bin/"};');
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head></head><body>hi</body></html>');

    // The site is served over http:// (staging.kobool.com has HTTPS
    // enforcement disabled), so an http:// API base is correct for every
    // environment and must produce neither an error nor a warning.
    for (const env of ['dev', 'staging', 'prod']) {
        const res = validate({ env, dist: dir });
        assert.ok(!res.errors.some((e) => /API base/.test(e)), `${env} must not error: ${res.errors}`);
        assert.ok(!res.warnings.some((w) => /API base/.test(w)), `${env} must not warn: ${res.warnings}`);
    }

    fs.rmSync(dir, { recursive: true, force: true });
});

test('validate: an https:// API base warns because the hosts are http-only', () => {
    const os = require('os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kobool-https-'));
    const distShared = path.join(dir, 'shared');
    fs.mkdirSync(distShared, { recursive: true });
    fs.writeFileSync(path.join(distShared, 'config.js'), 'window.APP_CONFIG={apiBase:"https://api.kobool.com/cgi-bin/"};');
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head></head><body>hi</body></html>');

    const staging = validate({ env: 'staging', dist: dir });
    assert.ok(!staging.errors.some((e) => /API base/.test(e)), 'https:// must not be an error');
    assert.ok(staging.warnings.some((w) => /http-only/.test(w)), 'https:// must warn');

    fs.rmSync(dir, { recursive: true, force: true });
});

test('build: --no-cname omits CNAME, default writes it', () => {
    const { parseArgs } = require(path.join(TOOLS, 'build'));

    assert.strictEqual(parseArgs(['node', 'build.js', '--env=staging']).cname, true);
    assert.strictEqual(parseArgs(['node', 'build.js', '--env=staging', '--no-cname']).cname, false);
});

test('build: --api-base overrides the environment API base', () => {
    const { parseArgs } = require(path.join(TOOLS, 'build'));

    assert.strictEqual(parseArgs(['node', 'build.js']).apiBase, null);
    // A trailing slash is normalized so callers can concatenate script names.
    assert.strictEqual(
        parseArgs(['node', 'build.js', '--api-base=https://api.kobool.com/cgi-bin']).apiBase,
        'https://api.kobool.com/cgi-bin/'
    );
});

test('validate: a CNAME in a subpath build is an error', () => {
    const os = require('os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kobool-cname-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<html><head></head><body>hi</body></html>');

    // A GitHub Pages project site is served from /<repo>/ over https and must
    // not claim a custom domain: the CNAME makes Pages try to provision a
    // certificate for a host without HTTPS, which fails and blocks the HTTPS
    // setting.
    fs.writeFileSync(path.join(dir, 'CNAME'), 'staging.kobool.com\n');
    const withCname = validate({ env: 'staging', dist: dir, base: '/kobool.com' });
    assert.ok(
        withCname.errors.some((e) => /CNAME/.test(e)),
        `subpath build with CNAME must error: ${withCname.errors}`
    );

    // The same artifact is fine for a domain-root deployment.
    const rootBuild = validate({ env: 'staging', dist: dir });
    assert.ok(!rootBuild.errors.some((e) => /CNAME/.test(e)), 'root build may keep its CNAME');

    fs.rmSync(path.join(dir, 'CNAME'));
    const noCname = validate({ env: 'staging', dist: dir, base: '/kobool.com' });
    assert.ok(!noCname.errors.some((e) => /CNAME/.test(e)), 'subpath build without CNAME is valid');

    fs.rmSync(dir, { recursive: true, force: true });
});

function mockReqRes(url, headers) {
    const req = {
        url,
        method: 'GET',
        headers: Object.assign({ host: 'localhost', accept: '*/*' }, headers),
        pipe: () => {}
    };
    const res = {
        _status: 0,
        _headers: {},
        _body: '',
        writeHead(status, headers) {
            this._status = status;
            Object.assign(this._headers, headers);
        },
        end(body) {
            this._body = body || '';
        }
    };
    return { req, res };
}

test('proxy: allowlist rejects non-allowed paths', () => {
    const proxy = createProxy({ target: 'http://127.0.0.1:1', allowlist: ['/cgi-bin/login.pl'] });
    const { req, res } = mockReqRes('/cgi-bin/query.pl', {});
    proxy(req, res);
    assert.strictEqual(res._status, 403);
});

test('proxy: non-proxied path returns 404', () => {
    const proxy = createProxy({ target: 'http://127.0.0.1:1' });
    const { req, res } = mockReqRes('/index.html', {});
    proxy(req, res);
    assert.strictEqual(res._status, 404);
});

test('favicon: the original site icon ships at the site root', () => {
    // Copied verbatim from the original repo (v1/html.min/favicon.ico) and
    // served from /favicon.ico, which is where browsers look by default.
    const icon = path.join(ROOT, 'favicon.ico');
    assert.ok(fs.existsSync(icon), 'favicon.ico must exist at the repo root');

    const bytes = fs.readFileSync(icon);
    assert.strictEqual(bytes.length, 1718, 'favicon.ico must be the original file');
    // ICO header: reserved=0, type=1 (icon), 2 images.
    assert.strictEqual(bytes.readUInt16LE(0), 0);
    assert.strictEqual(bytes.readUInt16LE(2), 1);
    assert.strictEqual(bytes.readUInt16LE(4), 2);

    // Both shells must reference it explicitly.
    for (const shell of ['index.html', path.join('v2', 'index.html')]) {
        const html = fs.readFileSync(path.join(ROOT, shell), 'utf8');
        assert.match(html, /<link rel="icon" href="\/favicon\.ico"/, `${shell} must link the icon`);
    }
});

test('smoke: dist builds and validates cleanly', { timeout: 120000 }, () => {
    execFileSync(process.execPath, [path.join(TOOLS, 'build.js'), '--env=prod'], {
        cwd: ROOT,
        stdio: 'pipe'
    });

    // dist must contain the config pointing at the CORS-enabled API host
    // (currently dev.kobool.com, scheme-relative).
    const distConfig = fs.readFileSync(path.join(ROOT, 'dist', 'shared', 'config.js'), 'utf8');
    assert.match(distConfig, /\/\/dev\.kobool\.com\/cgi-bin\//);

    // The App Store badge must be present (referenced from index.html).
    assert.ok(
        fs.existsSync(path.join(ROOT, 'dist', 'images', 'Download_on_the_App_Store_Badge_AR_RGB_blk_102417.svg')),
        'App Store badge SVG missing from dist/images'
    );

    // Validation must pass.
    let out;
    try {
        out = execFileSync(process.execPath, [path.join(TOOLS, 'validate.js')], {
            cwd: ROOT,
            stdio: 'pipe'
        }).toString();
    } catch (err) {
        assert.fail('validate.js failed:\n' + err.stdout.toString() + err.stderr.toString());
    }
    assert.match(out, /Validation passed/);

    // No PHP/Perl/Python or secrets may survive into dist.
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                assert.ok(
                    !['.php', '.pl', '.pm', '.cgi', '.py'].includes(ext),
                    `blocked extension in dist: ${path.relative(ROOT, full)}`
                );
                if (['.js', '.html', '.json'].includes(ext)) {
                    const text = fs.readFileSync(full, 'utf8');
                    assert.ok(!/(kobool_2004|amazonaws|BEGIN PRIVATE|rds\.amazonaws|mysql\s*[:=]\s*['"])/i.test(text),
                        `possible secret in dist: ${path.relative(ROOT, full)}`);
                    assert.ok(!/sharethis|st_share|paypal\.com|PayPalForm|SubmitPayPal/i.test(text),
                        `deprecated integration marker in dist: ${path.relative(ROOT, full)}`);
                }
            }
        }
    };
    walk(path.join(ROOT, 'dist'));
});

test('LANGS exports both supported languages', () => {
    assert.deepStrictEqual(LANGS, ['ar', 'en']);
});

test('mem-ui: guest menu renders without a successful logout round-trip', () => {
    // The side menu used to be revealed only by the logout response, so an
    // unreachable API (offline, CORS, mixed content on https) left both menus
    // hidden. The guest UI must be reachable locally.
    const src = fs.readFileSync(path.join(ROOT, 'v3', 'modules', 'mem-ui.js'), 'utf8');

    const refresh = src.slice(src.indexOf('refreshHeader:'), src.indexOf('renderLogin:'));
    assert.match(refresh, /this\.renderLogin\(\)/, 'refreshHeader must render the guest menu locally');
    assert.ok(!/this\.logout\(\)/.test(refresh), 'refreshHeader must not depend on the logout request');

    const logout = src.slice(src.indexOf('logout:'), src.indexOf('login:function'));
    assert.match(logout, /onerror\s*:\s*endSession/, 'logout must clear the session when the request fails');

    const renderBox = src.slice(src.indexOf('renderBox:'), src.indexOf('logout:'));
    assert.match(renderBox, /_SH\("GuestMenu"\)/, 'renderBox must reveal the guest menu for anonymous users');
});
