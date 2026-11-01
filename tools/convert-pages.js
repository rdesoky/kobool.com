'use strict';

/**
 * Convert v2/v3 PHP page fragments into static HTML.
 *
 *   node tools/convert-pages.js --app=v3 [--write]
 *   node tools/convert-pages.js --app=v2 --src-dir=v2 --out-dir=v2 [--write]
 *
 * Handles the mechanical majority of the conversion:
 *   - strips the PHP prologue (includes, DetectLang, header calls)
 *   - <?=S("key")?> as the only child of an element -> data-string on that element
 *   - <?=S("key")?> inside an attribute value      -> data-string-attr
 *   - <?=S("key")?> in mixed content               -> <span data-string="...">
 *   - "---" . S("key") . "---"                     -> data-string-template
 *   - <?if($lang=="ar"){?> ... <?}?>               -> reported for manual handling
 *   - remaining <?php ... ?>                       -> removed and reported
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
    const args = { app: 'v3', write: false, source: null, srcDir: null, outDir: null };
    for (const arg of argv.slice(2)) {
        if (arg.startsWith('--app=')) args.app = arg.slice(6);
        else if (arg === '--write') args.write = true;
        else if (arg.startsWith('--source=')) args.source = arg.slice(9);
        else if (arg.startsWith('--src-dir=')) args.srcDir = arg.slice(10);
        else if (arg.startsWith('--out-dir=')) args.outDir = arg.slice(10);
    }
    return args;
}

const S_CALL = String.raw`S\(\s*(['"])([^'"]+)\1\s*(?:,\s*(['"])([^'"]+)\3\s*)?\)`;
const S_TAG = String.raw`<\?=\s*` + S_CALL + String.raw`\s*\?>`;
const PHP_TAG = String.raw`<\?=[\s\S]*?\?>`;

function stringRef(key, source) {
    return source ? `${source}:${key}` : `str:${key}`;
}

/** Parse a single `<?=S("key")?>` / `<?=S("key","src")?>` tag. */
function parseStringTag(tag) {
    const m = tag.match(new RegExp('^' + S_TAG + '$'));
    if (!m) return null;
    return { key: m[2], source: m[4] };
}

const PHP_STRING = String.raw`'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"`;

/**
 * Parse the body of a `<?= ... ?>` echo into a template.
 *
 * Supports string literals and S() calls joined with `.`, which is how the
 * legacy pages build labels such as `"---" . S("any_status") . "---"`.
 * Returns null when the expression uses anything else.
 */
function parseEcho(expr) {
    const refs = [];
    let template = '';
    let index = 0;
    let expectOperand = true;

    while (index < expr.length) {
        const rest = expr.slice(index);
        const ws = rest.match(/^\s+/);
        if (ws) { index += ws[0].length; continue; }

        if (expectOperand) {
            const call = rest.match(new RegExp('^' + S_CALL));
            if (call) {
                refs.push(stringRef(call[2], call[4]));
                template += '{s}';
                index += call[0].length;
                expectOperand = false;
                continue;
            }
            const lit = rest.match(new RegExp('^' + PHP_STRING));
            if (lit) {
                const raw = lit[1] !== undefined ? lit[1] : lit[2];
                template += raw.replace(/\\(.)/g, '$1');
                index += lit[0].length;
                expectOperand = false;
                continue;
            }
            return null;
        }

        if (rest[0] === '.') {
            index += 1;
            expectOperand = true;
            continue;
        }
        return null;
    }

    if (expectOperand || !refs.length) return null;
    return { refs, template };
}

/**
 * Render a `<?= ... ?>` tag.
 * Returns { refs, template } where template is null for a bare single string,
 * or null when the expression is not a supported string echo.
 */
function renderEchoTag(tag) {
    const body = tag.replace(/^<\?=/, '').replace(/\?>$/, '');
    const parsed = parseEcho(body);
    if (!parsed) return null;
    if (parsed.refs.length === 1 && parsed.template === '{s}') {
        return { refs: parsed.refs, template: null };
    }
    return { refs: parsed.refs, template: parsed.template };
}

/** Build the data-* attributes for a rendered echo. */
function echoAttrs(rendered) {
    const list = rendered.refs.join('|');
    if (rendered.template === null) {
        return `data-string="${list}"`;
    }
    return `data-string="${list}" data-string-template="${rendered.template.replace(/"/g, '&quot;')}"`;
}

/**
 * Walk attribute values in `html`, skipping over PHP tags so quotes inside
 * `<?=S("key")?>` do not terminate the value early.
 * `fn(attr, quote, value)` returns the replacement text for the whole
 * `attr=value` pair, or null to leave it untouched.
 */
function replaceAttrValues(html, fn) {
    let out = '';
    let i = 0;
    const attrStart = /([\w:-]+)=(["'])/g;

    while (i < html.length) {
        attrStart.lastIndex = i;
        const m = attrStart.exec(html);
        if (!m) {
            out += html.slice(i);
            break;
        }
        // Only treat this as an attribute when it sits inside a tag.
        const lt = html.lastIndexOf('<', m.index);
        const gt = html.lastIndexOf('>', m.index);
        if (lt === -1 || lt < gt) {
            out += html.slice(i, m.index + m[0].length);
            i = m.index + m[0].length;
            continue;
        }

        const quote = m[2];
        let j = m.index + m[0].length;
        let value = '';
        let closed = false;
        while (j < html.length) {
            if (html.startsWith('<?', j)) {
                const end = html.indexOf('?>', j);
                if (end === -1) break;
                value += html.slice(j, end + 2);
                j = end + 2;
                continue;
            }
            if (html[j] === quote) { closed = true; break; }
            value += html[j];
            j += 1;
        }
        if (!closed) {
            out += html.slice(i);
            break;
        }

        out += html.slice(i, m.index);
        const replacement = fn(m[1], quote, value);
        out += replacement === null ? m[0] + value + quote : replacement;
        i = j + 1;
    }
    return out;
}

function convert(source) {
    const notes = [];
    let html = source;

    // 1. Strip the PHP prologue (everything up to the first closing tag).
    html = html.replace(/^\s*<\?(?:php)?[\s\S]*?\?>\s*/, '');

    // 2. Attribute values containing string echoes.
    //    A value that is exactly one call becomes data-string + data-string-attr.
    //    A value with surrounding literal text keeps the literal text and records
    //    the original shape in data-string-template ("{s}" per substitution).
    html = replaceAttrValues(html, (attr, quote, value) => {
        if (value.indexOf('<?=') === -1) return null;

        const refs = [];
        let template = '';
        let failed = false;
        let last = 0;
        const tagRe = new RegExp(PHP_TAG, 'g');
        let tagMatch;
        while ((tagMatch = tagRe.exec(value)) !== null) {
            template += value.slice(last, tagMatch.index);
            last = tagMatch.index + tagMatch[0].length;
            const rendered = renderEchoTag(tagMatch[0]);
            if (!rendered) { failed = true; break; }
            rendered.refs.forEach((ref) => refs.push(ref));
            template += rendered.template === null ? '{s}' : rendered.template;
        }
        if (failed || !refs.length) return null;
        template += value.slice(last);

        const list = refs.join('|');
        if (refs.length === 1 && template === '{s}') {
            return `${attr}="" data-string="${list}" data-string-attr="${attr}"`;
        }
        const literal = template.replace(/\{s\}/g, '');
        const escaped = template.replace(/"/g, '&quot;');
        return `${attr}=${quote}${literal}${quote} data-string="${list}"` +
            ` data-string-attr="${attr}" data-string-template="${escaped}"`;
    });

    // 3. Element whose entire content is a single string echo.
    html = html.replace(
        new RegExp(String.raw`(<([a-zA-Z][\w-]*)((?:\s[^>]*)?)>)\s*(` + PHP_TAG + String.raw`)\s*(</\2>)`, 'g'),
        (m, open, tag, attrs, phpTag, close) => {
            if (/\bdata-string=/.test(attrs)) return m;
            const rendered = renderEchoTag(phpTag);
            if (!rendered) return m;
            return `${open.replace(/\s*>$/, '')} ${echoAttrs(rendered)}>${close}`;
        }
    );

    // 4. Remaining string echoes in mixed content.
    html = html.replace(new RegExp(PHP_TAG, 'g'), (tag) => {
        const rendered = renderEchoTag(tag);
        if (!rendered) return tag;
        return `<span ${echoAttrs(rendered)}></span>`;
    });

    // 5. Language conditionals.
    html = html.replace(/<\?if\(\s*\$lang\s*==\s*["']ar["']\s*\)\s*\{\s*\?>/g, '<!--LANG:ar-->');
    html = html.replace(/<\?if\(\s*\$lang\s*==\s*["']en["']\s*\)\s*\{\s*\?>/g, '<!--LANG:en-->');
    html = html.replace(/<\?if\([^)]*\)\s*\{\s*\?>/g, '<!--COND-->');
    html = html.replace(/<\?\s*\}\s*\?>/g, '<!--/COND-->');
    html = html.replace(/<\?else\s*\{\s*\?>/g, '<!--ELSE-->');

    // 6. Any remaining PHP.
    const leftover = html.match(/<\?(?:php|=)?[\s\S]*?\?>/g);
    if (leftover) {
        notes.push(`${leftover.length} unconverted PHP block(s) removed`);
        html = html.replace(/<\?(?:php|=)?[\s\S]*?\?>/g, '');
    }

    if (/<!--COND-->|<!--ELSE-->|<!--\/COND-->/.test(html)) {
        notes.push('conditional blocks need manual data-show-if conversion');
    }
    if (/<!--LANG:(ar|en)-->/.test(html)) {
        notes.push('language conditional needs manual data-show-if conversion');
    }

    // 7. Tidy: collapse the blank lines left behind by removed PHP.
    html = html.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');

    return { html: html.trim() + '\n', notes };
}

// Pages that must not be published (payment flows, admin-only screens).
const EXCLUDED = new Set(['welcome.php', 'paypal.php', 'admin.php', 'settings.php']);

function convertApp(options) {
    const app = options.app;
    const sourceRoot = options.source || path.join(ROOT, '..', 'kobool');
    const srcDir = options.srcDir
        ? path.resolve(ROOT, options.srcDir)
        : path.join(sourceRoot, app, 'pages');
    const outDir = options.outDir
        ? path.resolve(ROOT, options.outDir)
        : path.join(ROOT, app, 'pages');
    const results = [];

    if (!fs.existsSync(srcDir)) {
        throw new Error(`Source pages not found: ${srcDir}`);
    }
    fs.mkdirSync(outDir, { recursive: true });

    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.php')) continue;
        if (EXCLUDED.has(entry.name)) {
            results.push({ file: entry.name, skipped: true, notes: ['excluded by plan'] });
            continue;
        }

        const src = fs.readFileSync(path.join(srcDir, entry.name), 'utf8');
        const { html, notes } = convert(src);
        const outName = entry.name.replace(/\.php$/, '.html');

        if (options.write) {
            fs.writeFileSync(path.join(outDir, outName), html, 'utf8');
        }
        results.push({ file: entry.name, out: outName, notes });
    }

    return results;
}

if (require.main === module) {
    const args = parseArgs(process.argv);
    const results = convertApp(args);
    for (const r of results) {
        if (r.skipped) {
            console.log(`SKIP  ${r.file} (${r.notes.join('; ')})`);
        } else {
            console.log(`OK    ${r.file} -> ${r.out}${r.notes.length ? '  [' + r.notes.join('; ') + ']' : ''}`);
        }
    }
    if (!args.write) {
        console.log('\nDry run. Re-run with --write to emit files.');
    }
}

module.exports = { convert, convertApp, parseArgs };
