'use strict';

/**
 * Compile v2/v3 string XML resources into per-source JSON bundles.
 *
 * Source layout (in the private reference repo):
 *   v2/text/<lang>/<source>.xml
 *   v3/text/<lang>/<source>.xml
 *
 * Output layout (in dist/):
 *   <app>/text/<lang>/<source>.json
 *
 * Each JSON file is an object keyed by the XML element path, e.g.
 *   { "a.logout": "خروج", "pg_title.home": "صفحة البداية" }
 * which is what the client-side string loader consumes.
 */

const fs = require('fs');
const path = require('path');
const { parseXml } = require('./xml');

const LANGS = ['ar', 'en'];

/**
 * Flatten a parsed XML tree into dotted keys.
 *
 * Mirrors the legacy tools/xml2php converter, which renames any element that
 * carries a `value` attribute to `v<value>`:
 *
 *   <select_gender><option value="0">رجل</option></select_gender>
 *     -> { "select_gender.v0": "رجل" }
 *
 * The implicit `t` attribute that legacy S() appends is dropped, so
 * S("select_gender.v0","profile") maps to the key "select_gender.v0".
 */
function flattenNode(node, prefix, out) {
    const value = node.attrs && node.attrs.value;
    const name = value !== undefined ? `v${value}` : node.name;
    const key = prefix ? `${prefix}.${name}` : name;

    if (node.children.length === 0) {
        out[key] = node.text;
        return;
    }
    for (const child of node.children) {
        flattenNode(child, key, out);
    }
}

function flatten(tree, prefix, out) {
    if (tree && Array.isArray(tree.children)) {
        for (const child of tree.children) {
            flattenNode(child, prefix || '', out);
        }
        return out;
    }
    // Plain-object fallback (used by tests and by compile-data).
    if (tree === null || tree === undefined) return out;
    if (typeof tree === 'string') {
        out[prefix] = tree;
        return out;
    }
    if (Array.isArray(tree)) {
        tree.forEach((item, index) => flatten(item, `${prefix}.${index}`, out));
        return out;
    }
    for (const key of Object.keys(tree)) {
        flatten(tree[key], prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
}

function sortKeys(obj) {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = obj[key];
    }
    return sorted;
}

function compileSourceFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const tree = parseXml(source);
    const flat = {};
    flatten(tree, '', flat);
    return sortKeys(flat);
}

function listXmlSources(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.xml'))
        .map((entry) => entry.name.slice(0, -'.xml'.length))
        .sort();
}

/**
 * @param {object} options
 * @param {string} options.sourceRoot  private repo root (contains v2/ and v3/)
 * @param {string} options.outRoot     dist root
 * @param {string[]} [options.apps]    defaults to ['v2','v3']
 * @returns {{app:string,lang:string,source:string,keys:number}[]}
 */
function compileStrings(options) {
    const sourceRoot = options.sourceRoot;
    const outRoot = options.outRoot;
    const apps = options.apps || ['v2', 'v3'];
    const report = [];

    for (const app of apps) {
        for (const lang of LANGS) {
            const srcDir = path.join(sourceRoot, app, 'text', lang);
            const sources = listXmlSources(srcDir);
            if (sources.length === 0) {
                continue;
            }
            const outDir = path.join(outRoot, app, 'text', lang);
            fs.mkdirSync(outDir, { recursive: true });

            for (const source of sources) {
                const filePath = path.join(srcDir, `${source}.xml`);
                let compiled;
                try {
                    compiled = compileSourceFile(filePath);
                } catch (err) {
                    throw new Error(`Failed to compile ${filePath}: ${err.message}`);
                }
                fs.writeFileSync(
                    path.join(outDir, `${source}.json`),
                    JSON.stringify(compiled, null, 0),
                    'utf8'
                );
                report.push({ app, lang, source, keys: Object.keys(compiled).length });
            }
        }
    }

    return report;
}

module.exports = { compileStrings, compileSourceFile, listXmlSources, flatten, LANGS };
