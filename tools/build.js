'use strict';

/**
 * Build dist/ from the static source tree.
 *
 *   node tools/build.js [--env=dev|staging|prod] [--source=<private repo root>]
 *                       [--base=/subpath]
 *
 * Steps:
 *   1. clean dist/
 *   2. copy allowed static files (never PHP/Perl/Python/secrets)
 *   3. compile string XML -> JSON
 *   4. write environment-specific config.js
 *   5. minify JS/CSS/HTML
 *   6. write CNAME for the selected environment
 *
 * --base rewrites root-absolute URLs to a subpath so the build can be previewed
 * on a GitHub Pages project site (https://<user>.github.io/<repo>/). Production
 * and staging use the default empty base, because they are served from a domain
 * root.
 */

const fs = require('fs');
const path = require('path');
const { compileStrings } = require('./compile-strings');
const { compileData } = require('./compile-data');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// dev uses the same-origin prefix, which tools/serve.js proxies to the API
// host. staging and prod call the CORS-enabled API host directly.
const ENVIRONMENTS = {
    dev: { apiBase: '/cgi-bin/', cname: null },
    staging: { apiBase: 'https://api.kobool.com/cgi-bin/', cname: 'staging.kobool.com' },
    prod: { apiBase: 'https://api.kobool.com/cgi-bin/', cname: 'www.kobool.com' }
};

// Never copied into dist/, regardless of where they appear.
// .xml is excluded because string sources are compiled to JSON; shipping the
// raw XML would duplicate every string and leak unreferenced content.
const BLOCKED_EXTENSIONS = new Set([
    '.php', '.pl', '.pm', '.cgi', '.py', '.pyc', '.lnk', '.bat', '.ps1', '.sh',
    '.exe', '.dll', '.so', '.db', '.sql', '.log', '.env', '.pem', '.key', '.xml'
]);

const BLOCKED_DIRS = new Set([
    'node_modules', 'dist', '.git', '.github', '.kilo', 'tests', 'tools',
    'cgi-bin', 'func', 'KRest', 'conf', 'data', 'database', 'logs', 'help',
    'kman', 'flask', 'unused', 'back', 'tmail', '.venv', '.history'
]);

const BLOCKED_NAMES = new Set(['Thumbs.db', 'desktop.ini', '.DS_Store', 'lib.php']);

function parseArgs(argv) {
    const args = { env: 'dev', source: null, base: '' };
    for (const arg of argv.slice(2)) {
        if (arg.startsWith('--env=')) args.env = arg.slice(6);
        else if (arg.startsWith('--source=')) args.source = arg.slice(9);
        else if (arg.startsWith('--base=')) args.base = arg.slice(7);
    }
    if (!ENVIRONMENTS[args.env]) {
        throw new Error(`Unknown environment "${args.env}". Use dev, staging or prod.`);
    }
    // Normalize to "" or "/sub/path" with no trailing slash.
    args.base = args.base.replace(/\/+$/, '');
    if (args.base && !args.base.startsWith('/')) args.base = '/' + args.base;
    return args;
}

// Top-level directories that are served from the site root. Restricting the
// rewrite to these keeps it from touching unrelated strings that happen to
// start with a slash.
const BASE_ROOTS = ['v2', 'v3', 'shared', 'images'];

/**
 * Rewrite root-absolute URLs to a subpath.
 *
 * Only real URL positions are rewritten: `href="/x"`, `src="/x"`,
 * `action="/x"`, `url(/x)`, and JS string literals that begin with one of the
 * known top-level directories. Protocol-relative (`//host`) and absolute URLs
 * are left alone. Used for GitHub Pages project-site previews.
 */
function rewriteBase(dir, base) {
    if (!base) return 0;
    const TEXT = new Set(['.html', '.js', '.css', '.json']);
    const roots = BASE_ROOTS.join('|');
    const patterns = [
        // href="/v3/..."  src='/v2/...'  action="/shared/..."
        new RegExp(`(\\b(?:href|src|action)=["'])/(?=(?:${roots})/)`, 'g'),
        // url(/images/...)
        new RegExp(`(url\\()/(?=(?:${roots})/)`, 'g'),
        // "/v3/..." inside JS string literals
        new RegExp(`(["'])/(?=(?:${roots})/)`, 'g')
    ];
    let changed = 0;

    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            if (!TEXT.has(path.extname(entry.name).toLowerCase())) continue;

            const before = fs.readFileSync(full, 'utf8');
            let after = before;
            for (const pattern of patterns) {
                after = after.replace(pattern, (match, lead) => lead + base + '/');
            }
            if (after !== before) {
                fs.writeFileSync(full, after, 'utf8');
                changed++;
            }
        }
    };
    walk(dir);
    return changed;
}

function cleanDist() {
    fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });
}

function isBlocked(relPath, name) {
    if (BLOCKED_NAMES.has(name)) return true;
    const ext = path.extname(name).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) return true;
    // Compiled legacy string files, e.g. home.xml.js
    if (/\.xml\.js$/i.test(name)) return true;
    const parts = relPath.split(/[\\/]/);
    return parts.some((part) => BLOCKED_DIRS.has(part));
}

function copyTree(srcDir, destDir, relBase) {
    if (!fs.existsSync(srcDir)) return 0;
    let count = 0;
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
        if (isBlocked(rel, entry.name)) continue;

        const src = path.join(srcDir, entry.name);
        const dest = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            count += copyTree(src, dest, rel);
        } else if (entry.isFile()) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(src, dest);
            count++;
        }
    }
    return count;
}

function writeConfig(env) {
    const settings = ENVIRONMENTS[env];
    const source = fs.readFileSync(path.join(ROOT, 'shared', 'config.js'), 'utf8');
    const replaced = source.replace(
        /apiBase:\s*'[^']*'/,
        `apiBase: '${settings.apiBase}'`
    );
    fs.mkdirSync(path.join(DIST, 'shared'), { recursive: true });
    fs.writeFileSync(path.join(DIST, 'shared', 'config.js'), replaced, 'utf8');
}

function writeCname(env) {
    const settings = ENVIRONMENTS[env];
    if (settings.cname) {
        fs.writeFileSync(path.join(DIST, 'CNAME'), settings.cname + '\n', 'utf8');
    }
}

async function minify() {
    let esbuild;
    try {
        esbuild = require('esbuild');
    } catch (err) {
        console.warn('esbuild not installed; skipping JS/CSS minification');
        return;
    }

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === '.js') {
                    const code = fs.readFileSync(full, 'utf8');
                    try {
                        const out = esbuild.transformSync(code, { loader: 'js', minify: true });
                        fs.writeFileSync(full, out.code, 'utf8');
                    } catch (err) {
                        // Leave the file unminified; validate.js reports the syntax error.
                        console.warn(`Skipped minify (parse error): ${path.relative(DIST, full)}`);
                    }
                } else if (ext === '.css') {
                    const code = fs.readFileSync(full, 'utf8');
                    try {
                        const out = esbuild.transformSync(code, { loader: 'css', minify: true });
                        fs.writeFileSync(full, out.code, 'utf8');
                    } catch (err) {
                        console.warn(`Skipped minify (parse error): ${path.relative(DIST, full)}`);
                    }
                }
            }
        }
    };
    walk(DIST);
}

async function minifyHtml() {
    let minifier;
    try {
        minifier = require('html-minifier-terser');
    } catch (err) {
        console.warn('html-minifier-terser not installed; skipping HTML minification');
        return;
    }

    const walk = async (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                const html = fs.readFileSync(full, 'utf8');
                const out = await minifier.minify(html, {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    removeComments: true,
                    minifyCSS: false,
                    minifyJS: false,
                    keepClosingSlash: true
                });
                fs.writeFileSync(full, out, 'utf8');
            }
        }
    };
    await walk(DIST);
}

async function build(options) {
    const env = options.env || 'dev';
    const sourceRoot = options.source || path.join(ROOT, '..', 'kobool');

    console.log(`Building dist/ for env=${env}`);
    cleanDist();

    // Copy the static source tree (v2/, v3/, shared/, images/).
    let copied = 0;
    for (const dir of ['v2', 'v3', 'shared', 'images']) {
        copied += copyTree(path.join(ROOT, dir), path.join(DIST, dir), dir);
    }
    // Root-level entry points and static files.
    for (const name of ['index.html', '404.html', 'robots.txt', 'favicon.ico']) {
        const src = path.join(ROOT, name);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(DIST, name));
            copied++;
        }
    }
    console.log(`Copied ${copied} static files`);

    // Compile string bundles. The XML sources live in this repo (v2/text,
    // v3/text) so the published strings are reviewable and editable here;
    // --source only supplies the shared option/country data.
    const stringRoot = fs.existsSync(path.join(ROOT, 'v3', 'text'))
        ? ROOT
        : sourceRoot;
    if (fs.existsSync(path.join(stringRoot, 'v3', 'text'))) {
        const report = compileStrings({ sourceRoot: stringRoot, outRoot: DIST });
        console.log(`Compiled ${report.length} string bundles`);
    } else {
        console.warn(`String sources not found under ${stringRoot}; skipping compile`);
    }

    // Compile shared option/country data straight into dist/.
    try {
        const dataReport = compileData({
            source: stringRoot,
            outDir: path.join(DIST, 'shared', 'data')
        });
        console.log(`Compiled ${dataReport.length} data files`);
    } catch (err) {
        console.warn(`Data compile skipped: ${err.message}`);
    }

    writeConfig(env);
    writeCname(env);

    // Rewrite before minifying so the minifier sees the final URLs.
    const rewritten = rewriteBase(DIST, options.base || '');
    if (rewritten) {
        console.log(`Rewrote root-absolute URLs to base "${options.base}" in ${rewritten} files`);
    }

    await minify();
    await minifyHtml();

    console.log('Build complete');
}

if (require.main === module) {
    build(parseArgs(process.argv)).catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}

module.exports = { build, parseArgs, rewriteBase, ENVIRONMENTS, isBlocked };
