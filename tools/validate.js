'use strict';

/**
 * Validate dist/ before publishing.
 *
 *   node tools/validate.js [--env=dev|staging|prod]
 *
 * Fails (exit 1) on:
 *   - server-side or secret-bearing files
 *   - deprecated ShareThis / PayPal markers
 *   - localhost URLs in staging/production builds (the intentional host-detection
 *     literals in shared/config.js are exempt)
 *   - a CNAME in a subpath (project-site) build
 *   - unresolved local href/src references
 *   - missing data-string keys
 *   - JS syntax errors
 *
 * The API base is scheme-relative (//dev.kobool.com/cgi-bin/), so it inherits
 * the page's own scheme. An explicit http:// base is warned about: the site is
 * served over https, so the browser would block it as mixed active content.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const FORBIDDEN_EXTENSIONS = new Set(['.php', '.pl', '.pm', '.cgi', '.py', '.bat', '.ps1', '.sh', '.exe', '.sql', '.pem', '.key']);
const FORBIDDEN_NAMES = new Set(['lib.php', 'Thumbs.db', 'desktop.ini', '.DS_Store']);

const DEPRECATED_MARKERS = [
    { pattern: /sharethis/i, label: 'ShareThis' },
    { pattern: /stLight/, label: 'ShareThis stLight' },
    { pattern: /st_share/, label: 'ShareThis st_share' },
    { pattern: /paypal\.com/i, label: 'paypal.com' },
    { pattern: /PayPalForm/, label: 'PayPalForm' },
    { pattern: /SubmitPayPal/, label: 'SubmitPayPal' }
];

const SECRET_PATTERNS = [
    { pattern: /kobool_2004/, label: 'production DB password' },
    { pattern: /rds\.amazonaws\.com/i, label: 'RDS host' },
    { pattern: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/, label: 'private key' },
    { pattern: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' }
];

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.xml', '.svg', '.txt', '.md']);

function walk(dir, out) {
    out = out || [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (entry.isFile()) out.push(full);
    }
    return out;
}

function rel(file) {
    return path.relative(DIST, file).split(path.sep).join('/');
}

function parseArgs(argv) {
    const args = { env: 'dev', base: '' };
    for (const arg of argv.slice(2)) {
        if (arg.startsWith('--env=')) args.env = arg.slice(6);
        else if (arg.startsWith('--base=')) args.base = arg.slice(7);
    }
    args.base = args.base.replace(/\/+$/, '');
    if (args.base && !args.base.startsWith('/')) args.base = '/' + args.base;
    return args;
}

function validate(options) {
    const env = options.env || 'dev';
    const base = options.base || '';
    const distDir = options.dist || DIST;
    const errors = [];
    const warnings = [];

    if (!fs.existsSync(distDir)) {
        return { errors: ['dist/ does not exist; run npm run build first'], warnings };
    }

    const files = walk(distDir);

    // 1. Forbidden files
    for (const file of files) {
        const name = path.basename(file);
        const ext = path.extname(name).toLowerCase();
        if (FORBIDDEN_EXTENSIONS.has(ext)) {
            errors.push(`Forbidden file type in dist/: ${rel(file)}`);
        }
        if (FORBIDDEN_NAMES.has(name)) {
            errors.push(`Forbidden file in dist/: ${rel(file)}`);
        }
    }

    // 2. Content checks
    const stringKeys = new Map(); // "lang:source" -> Set(keys)
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!TEXT_EXTENSIONS.has(ext)) continue;

        const content = fs.readFileSync(file, 'utf8');

        for (const marker of DEPRECATED_MARKERS) {
            if (marker.pattern.test(content)) {
                errors.push(`Deprecated ${marker.label} found in ${rel(file)}`);
            }
        }

        for (const secret of SECRET_PATTERNS) {
            if (secret.pattern.test(content)) {
                errors.push(`Secret (${secret.label}) found in ${rel(file)}`);
            }
        }

        if (env === 'prod' || env === 'staging') {
            // shared/config.js intentionally checks for localhost and
            // 127.0.0.1 to route local previews through the same-origin
            // /cgi-bin/ proxy; those literals are exempt from this rule.
            const relPath = path.relative(distDir, file).split(path.sep).join('/');
            if (relPath !== 'shared/config.js' && /localhost|127\.0\.0\.1/.test(content)) {
                errors.push(`Localhost reference in ${env} build: ${rel(file)}`);
            }
        }

        // Collect string bundle keys for data-string validation.
        const bundleMatch = rel(file).match(/^(v2|v3)\/text\/(ar|en)\/([^/]+)\.json$/);
        if (bundleMatch) {
            try {
                const data = JSON.parse(content);
                stringKeys.set(`${bundleMatch[2]}:${bundleMatch[3]}`, new Set(Object.keys(data)));
            } catch (err) {
                errors.push(`Invalid JSON in ${rel(file)}: ${err.message}`);
            }
        }
    }

    // 3. data-string keys resolve
    for (const file of files) {
        if (path.extname(file).toLowerCase() !== '.html') continue;
        const content = fs.readFileSync(file, 'utf8');
        const re = /data-string="([^"]+)"/g;
        let match;
        while ((match = re.exec(content)) !== null) {
            const value = match[1];
            const idx = value.indexOf(':');
            const source = idx === -1 ? 'str' : value.slice(0, idx);
            const key = idx === -1 ? value : value.slice(idx + 1);
            const found = ['ar', 'en'].some((lang) => {
                const set = stringKeys.get(`${lang}:${source}`);
                return set && set.has(key);
            });
            if (!found) {
                errors.push(`Missing string key "${value}" referenced in ${rel(file)}`);
            }
        }
    }

    // 3b. Shared fragments are expanded at build time. A directive that
    // survives means the page shipped with a hole where the fragment should be.
    for (const file of files) {
        if (path.extname(file).toLowerCase() !== '.html') continue;
        const content = fs.readFileSync(file, 'utf8');
        if (/\bdata-fragment="[^"]*"/.test(content)) {
            errors.push(`Unexpanded data-fragment in ${rel(file)}: run npm run build`);
        }
    }

    // 4. Local link/asset resolution
    for (const file of files) {
        if (path.extname(file).toLowerCase() !== '.html') continue;
        const content = fs.readFileSync(file, 'utf8');
        const re = /(?:href|src)="([^"]+)"/g;
        let match;
        while ((match = re.exec(content)) !== null) {
            const ref = match[1];
            if (!ref || ref.startsWith('#') || ref.startsWith('http') || ref.startsWith('//') ||
                ref.startsWith('data:') || ref.startsWith('mailto:') || ref.startsWith('javascript:')) {
                continue;
            }
            // Server endpoints and client-side template placeholders are not
            // static assets, so they cannot be resolved at build time.
            if (ref.startsWith('/cgi-bin/') || ref.indexOf('{{') !== -1 || ref.indexOf('(?') !== -1) {
                continue;
            }
            let clean = ref.split('?')[0].split('#')[0];
            if (!clean) continue;
            // A --base build prefixes root-absolute URLs with the subpath;
            // strip it so the check still resolves against dist/.
            if (base && clean.startsWith(base + '/')) {
                clean = clean.slice(base.length);
            }
            const target = clean.startsWith('/')
                ? path.join(distDir, clean)
                : path.join(path.dirname(file), clean);
            if (!fs.existsSync(target)) {
                warnings.push(`Unresolved local reference "${ref}" in ${rel(file)}`);
            }
        }
    }

    // 5. The site is served over https (staging.kobool.com redirects http ->
    // https), so an http:// API base would be blocked as mixed active content.
    // The base must be scheme-relative (//host/cgi-bin/) or https://.
    if (env === 'prod' || env === 'staging') {
        const configFile = path.join(distDir, 'shared', 'config.js');
        if (fs.existsSync(configFile)) {
            const configContent = fs.readFileSync(configFile, 'utf8');
            const m = configContent.match(/apiBase\s*:\s*"(http:\/\/[^"]*)"/);
            if (m) {
                warnings.push(
                    `API base "${m[1]}" pins http://, but the site is served over https; ` +
                    'the browser blocks it as mixed active content. Use a scheme-relative ' +
                    'base (//host/cgi-bin/) so the page scheme is inherited.'
                );
            }
        }

        // 5a. The site origin serves static files only, so a root-absolute
        // /cgi-bin/ URL in a page fragment 404s. The build rewrites these to
        // the environment's API base; anything left is a missed endpoint.
        //
        // Form actions are excluded because the picture uploader no longer
        // carries a hardcoded action: it uploads via XHR to
        // APP_CONFIG.apiBase at runtime, so no static URL to rewrite or check.
        for (const file of files) {
            if (path.extname(file).toLowerCase() !== '.html') continue;
            const content = fs.readFileSync(file, 'utf8');
            const re = /\b(?:href|src)="(\/cgi-bin\/[^"]*)"/g;
            let match;
            while ((match = re.exec(content)) !== null) {
                errors.push(
                    `Root-absolute API URL "${match[1]}" in ${rel(file)}: the site origin ` +
                    'serves static files only, so this request 404s. Build it from ' +
                    'APP_CONFIG.apiBase instead.'
                );
            }
        }
    }

    // 5b. A subpath build targets a GitHub Pages project site
    // (<user>.github.io/<repo>/), which must not claim a custom domain. A CNAME
    // in the artifact makes Pages try to provision a TLS certificate for a host
    // that has no HTTPS; that fails and leaves the site stuck on "certificate
    // does not exist yet". Build with --no-cname for project sites.
    if (base) {
        const cnameFile = path.join(distDir, 'CNAME');
        if (fs.existsSync(cnameFile)) {
            const cname = fs.readFileSync(cnameFile, 'utf8').trim();
            errors.push(
                `CNAME "${cname}" in a subpath build: a GitHub Pages project site is served from ` +
                `${base}/ and must not claim a custom domain. Rebuild with --no-cname.`
            );
        }
    }

    // 6. JS syntax
    for (const file of files) {
        if (path.extname(file).toLowerCase() !== '.js') continue;
        const code = fs.readFileSync(file, 'utf8');
        try {
            new vm.Script(code, { filename: file });
        } catch (err) {
            errors.push(`JS syntax error in ${rel(file)}: ${err.message}`);
        }
    }

    return { errors, warnings };
}

if (require.main === module) {
    const args = parseArgs(process.argv);
    const { errors, warnings } = validate(args);

    for (const warning of warnings) {
        console.warn('WARN  ' + warning);
    }
    for (const error of errors) {
        console.error('ERROR ' + error);
    }

    if (errors.length) {
        console.error(`\nValidation failed with ${errors.length} error(s).`);
        process.exit(1);
    }
    console.log(`Validation passed (${warnings.length} warning(s)).`);
}

module.exports = { validate, parseArgs };
